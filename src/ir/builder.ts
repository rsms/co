import { ByteStr, asciiByteStr } from '../bytestr'
import { Pos, SrcFile } from '../pos'
import { token, tokstr } from '../token'
import { DiagKind, DiagHandler } from '../diag'
import { Num } from '../num'
import { debuglog as dlog } from '../util'
import * as ast from '../ast'
import * as types from '../types'
import {
  Mem,
  Type,
  BasicType,
  NumType,
  IntType,
  FunType,

  t_nil,
  t_bool,
} from '../types'
import { optdce } from './opt_dce'
import { optcf_op1, optcf_op2 } from './opt_cf'


import { ops, Op } from './op'
import { Aux, Value, Block, BlockKind, Fun, Pkg } from './ssa'
import { RegAlloc } from './regalloc'
import { opselect1, opselect2 } from './opselect'


const bitypes = ast.builtInTypes


export enum IRBuilderFlags {
  Default  = 0,
  Optimize = 1 << 0,  // apply early inline optimizations
  Comments = 1 << 1,  // include comments in some values, for formatting
}


// IRBuilder produces SSA IR for functions, taking AST as the input.
//
// The "inline"/"single-pass" Phi placement heuristic is based on the paper
// "Simple and Efficient Construction of Static Single Assignment Form"
// https://pp.info.uni-karlsruhe.de/uploads/publikationen/braun13cc.pdf
//
export class IRBuilder {
  pkg      :Pkg
  sfile    :SrcFile|null = null
  diagh    :DiagHandler|null = null
  regalloc :RegAlloc|null = null
  b        :Block       // current block
  f        :Fun         // current function
  flags    :IRBuilderFlags = IRBuilderFlags.Default
  
  vars :Map<ByteStr,Value>
    // variable assignments in the current block (map from variable symbol
    // to ssa value)

  defvars :(Map<ByteStr,Value>|null)[]
    // all defined variables at the end of each block. Indexed by block id.
    // null indicates there are no variables in that block.

  incompletePhis :Map<Block,Map<ByteStr,Value>>|null
    // tracks pending, incomplete phis that are completed by sealBlock for
    // blocks that are sealed after they have started. This happens when preds
    // are not known at the time a block starts, but is known and registered
    // before the block ends.

  init(diagh :DiagHandler|null = null,
       intsize: int = 4,
       addrsize: int = 4,
       regalloc :RegAlloc|null = null,
       flags :IRBuilderFlags = IRBuilderFlags.Default
  ) {
    const r = this
    r.pkg = new Pkg()
    r.sfile = null
    r.diagh = diagh
    r.regalloc = regalloc
    r.vars = new Map<ByteStr,Value>()
    r.defvars = []
    r.incompletePhis = null
    r.flags = flags
    // select integer types
    const [intt_s, intt_u] = types.intTypes(intsize)
    const [sizet_s, sizet_u] = types.intTypes(addrsize)

    this.concreteType = (t :Type) :BasicType => {
      switch (t) {
      case types.t_int:   return intt_s
      case types.t_uint:  return intt_u
      case types.t_isize: return sizet_s
      case types.t_usize: return sizet_u
      default:
        assert(t instanceof BasicType, `${t} is not a BasicType`)
        return t as BasicType
      }
    }
  }

  // addTopLevel is the primary interface to builder
  //
  addTopLevel(sfile :SrcFile, d :ast.Decl|ast.FunExpr) :Fun|null {
    // Note: d must not contain unresolved references (including types).
    // If there are unresolved references, behavior is undefined.
    //
    const r = this
    r.sfile = sfile

    if (d instanceof ast.MultiDecl) {
      for (let d2 of d.decls) {
        r.addTopLevel(sfile, d2)
      }
    } else if (d instanceof ast.VarDecl) {
      r.global(d)
    } else if (d instanceof ast.FunExpr) {
      if (d.isInit) {
        // Sanity checks (parser has already checked these things)
        assert(d.sig.params.length == 0, 'init fun with parameters')
        assert(d.sig.result === bitypes.nil, 'init fun with result')
        assert(d.body, 'missing body')
        r.initCode(d.body as ast.Expr)
      } else if (d.body) {
        // regular function with an implementation (d.body)
        return r.fun(d)
      } else {
        dlog(`skipping pure function declaration ${d}`)
      }
    } else if (d instanceof ast.ImportDecl) {
      dlog(`TODO ImportDecl`)
    } else if (d instanceof ast.TypeDecl) {
      dlog(`TODO TypeDecl`)
    }
    return null // TODO: return other top-level things
  }

  // startBlock sets the current block we're generating code in
  //
  startBlock(b :Block) {
    const r = this
    assert(r.b == null, "starting block without ending block")
    r.b = b
  }

  // startSealedBlock is a convenience for sealBlock followed by startBlock
  //
  startSealedBlock(b :Block) {
    this.sealBlock(b)
    this.startBlock(b)
  }

  // sealBlock sets b.sealed=true, indicating that no further predecessors
  // will be added (no changes to b.preds)
  //
  sealBlock(b :Block) {
    const s = this
    assert(!b.sealed, `block ${b} already sealed`)
    dlog(`${b}`)
    if (s.incompletePhis) {
      let entries = s.incompletePhis.get(b)
      if (entries) {
        for (let [name, phi] of entries) {
          dlog(`complete pending phi ${phi} (${name})`)
          s.addPhiOperands(name, phi)
        }
        s.incompletePhis.delete(b)
      }
    }
    b.sealed = true
  }

  // endBlock marks the end of generating code for the current block.
  // Returns the (former) current block. Returns null if there is no current
  // block, i.e. if no code flows to the current execution point.
  // The block sealed if not already sealed.
  //
  endBlock() :Block {
    const r = this
    let b = r.b
    assert(b != null, "no current block")

    // move block-local vars to long-term definition data
    // first we fill any holes in defvars
    while (r.defvars.length <= b.id) {
      r.defvars.push(null)
    }
    r.defvars[b.id] = r.vars

    // reset block-local vars
    r.vars = new Map<ByteStr,Value>()

    if (DEBUG) {
      // make sure we crash if we try to use b before a new block is started
      ;(r as any).b = null
    }

    // [optimization] change last value to TailCall when block returns
    // and last value is Call
    if (b.kind == BlockKind.Ret && b.vtail && b.vtail.op == ops.Call) {
      b.vtail.op = ops.TailCall
    }

    return b
  }

  startFun(f :Fun) {
    const s = this
    assert(s.f == null, "starting function with existing function")
    s.f = f
  }

  endFun() {
    const s = this
    assert(s.f, "ending function without a current function")
    if (s.flags & IRBuilderFlags.Optimize) {
      // perform early dead-code elimination
      optdce(s.f)
    }
    if (s.regalloc) {
      // perform register allocation
      s.regalloc.visitFun(s.f)
    }
    if (DEBUG) {
      ;(s as any).f = null
    }
  }

  // concreteType normalizes abstract types to concrete types.
  // E.g. concreteType(int) -> i32  (if int->i32 exists in typemap)
  //
  concreteType(t :Type) :BasicType {
    // Note: This functin is replaced by the constructor
    return t_nil
  }

  // nilValue returns a placeholder value.
  // This is meant to be used only during development and should be removed
  // when the IR builder is complete.
  //
  nilValue() :Value {
    assert(this.b, "no current block")
    return this.b.newValue0(ops.Unknown, t_nil)
  }

  global(_ :ast.VarDecl) {
    dlog(`TODO`)
  }

  initCode(_body :ast.Expr) {
    // const r = this
    // const f = r.pkg.init || (r.pkg.init = new Fun([], t_nil, 'init'))
    // r.block(f, null, body, 'init')
    // console.log(`\n-----------------------\n${f}`)
  }

  fun(x :ast.FunExpr) :Fun {
    const r = this
    assert(x.body, `unresolved function ${x}`)
    assert(x.type, "unresolved function type")

    let funtype = x.type as FunType
    let f = new Fun(
      funtype,
      x.name ? x.name.value : null,
      x.sig.params.length
    )
    let entryb = f.entryb

    // initialize locals
    for (let i = 0; i < x.sig.params.length; i++) {
      let p = x.sig.params[i]
      if (p.name && !p.name.value.isUnderscore()) {
        let t = r.concreteType(funtype.args[i])
        let name = p.name.value
        let v = entryb.newValue0(ops.Arg, t, i)
        if (r.flags & IRBuilderFlags.Comments) {
          v.comment = name.toString()
        }
        r.vars.set(name, v)
      }
    }

    r.startFun(f)
    r.startSealedBlock(entryb)

    let bodyval = r.block(x.body as ast.Expr)

    if (r.b as any) {
      // end last block if not already ended
      r.b.kind = BlockKind.Ret
      if (!(x.body instanceof ast.Block)) {
        // body is a single expression -- control value is that expression
        // assert(!(x.body instanceof ast.ReturnStmt),
        //   "'return' as function expression body should have called "+
        //   "ret() to close block")
        r.b.control = bodyval
      }
      // when body is a block and it didn't end, it was empty and thus
      // the return type is nil (no control value.)
      r.endBlock()
    }

    assert((r as any).b == null, "function exit block not ended")
    assert(f.tailb.kind == BlockKind.Ret,
      "last block in function is not BlockKind.Ret")
    r.endFun()

    r.pkg.funs.set(f.name, f)
    return f
  }


  block(x :ast.Expr) :Value|null {
    const r = this
    if (x instanceof ast.Block) {
      let end = x.list.length
      let lasti = end - 1
      for (let i = 0; i != end; ++i) {
        if (!r.b) {
          dlog('block ended early')
          // block ended early (i.e. from "return")
          r.diag('warn', `unreachable code`, x.list[i].pos)
          break
        }
        r.stmt(x.list[i], i == lasti)
      }
      return null
    } else {
      return r.expr(x)
      // r.stmt(x, /*isLast=*/true)
    }
  }


  // stmt adds one or more TAC to block b in function f from statement s
  //
  stmt(s :ast.Stmt, isLast :bool = false) {
    const r = this

    if (s instanceof ast.IfExpr) {
      r.if_(s)

    } else if (s instanceof ast.ReturnStmt) {
      r.ret(r.expr(s.result))

    } else if (s instanceof ast.WhileStmt) {
      r.while_(s)

    } else if (s instanceof ast.Expr) {
      if (!isLast && s instanceof ast.Ident) {
        r.diag('warn', `unused expression`, s.pos)
      } else {
        r.expr(s)
      }

    } else if (s instanceof ast.VarDecl) {
      if (s.values) {
        // explicit value; e.g. "x = 3"
        for (let i = 0; i < s.idents.length; i++) {
          let id = s.idents[i]
          let v = r.expr(s.values[i])
          assert(!r.vars.has(id.value), `redeclaration of var ${id.value}`)
          r.vars.set(id.value, v)
        }
      } else {
        // default value; e.g. "x i32"  =>  "x = 0"
        assert(s.type, 'var decl without type or values')
        let t = (s.type as ast.Expr).type as BasicType
        assert(t, 'unresolved type')
        assert(t instanceof BasicType, 'non-basic type not yet supported')
        let v = r.f.constVal(t, 0)
        for (let id of s.idents) {
          assert(!r.vars.has(id.value), `redeclaration of var ${id.value}`)
          r.vars.set(id.value, v)
        }
      }

    } else {
      dlog(`TODO: handle ${s.constructor.name}`)
    }
  }


  ret(val :Value|null) {
    const r = this
    let b = r.endBlock()
    b.kind = BlockKind.Ret
    b.control = val
  }


  while_(n: ast.WhileStmt) {
    const s = this

    // end "entry" block (whatever block comes before "while")
    let entryb = s.endBlock()
    assert(entryb.kind == BlockKind.Plain)
    // create "if" block, for testing the while condition
    let ifb = s.f.newBlock(BlockKind.If)
    entryb.succs = [ifb] // entry -> if
    ifb.preds = [entryb] // if <- entry[, then]
    // start "if" block
    s.startBlock(ifb) // note: not sealed
    let control = s.expr(n.cond) // condition for looping
    // TODO: inspect control and if constant, short-circuit branching.
    // end "if" block and assign condition
    ifb = s.endBlock()
    ifb.control = control

    // create "then" block, to be visited on each loop iteration
    let thenb = s.f.newBlock(BlockKind.Plain)
    thenb.preds = [ifb]
    // start "then" block (seal as well; preds are complete)
    s.startSealedBlock(thenb)
    s.block(n.body) // body (note: ignore return value)
    // end "then" block
    thenb = s.endBlock()
    thenb.succs = [ifb] // thenb -> ifb

    // complete & seal "if" block late, since it depends on "then" block
    ifb.preds = [entryb, thenb] // if <- entry, then
    s.sealBlock(ifb) // "if" block sealed here

    // create "next" block, for whatever comes after the "while"
    let nextb = s.f.newBlock(BlockKind.Plain)
    nextb.preds = [ifb] // next <- if, then
    ifb.succs = [thenb, nextb] // if -> next, then
    // start "next" block and return
    s.startSealedBlock(nextb)

    if (s.flags & IRBuilderFlags.Comments) {
      ifb.comment = 'while'
      thenb.comment = 'then'
      nextb.comment = 'endwhile'
    }
  }


  // if_ reads an if expression.
  // Returns a new empty block that's the block after the if.
  //
  if_(s :ast.IfExpr) {
    //
    // if..end has the following semantics:
    //
    //   if cond b1 b2
    //   b1:
    //     <then-block>
    //   goto b2
    //   b2:
    //     <continuation-block>
    //
    // if..else..end has the following semantics:
    //
    //   if cond b1 b2
    //   b1:
    //     <then-block>
    //   goto b3
    //   b2:
    //     <else-block>
    //   goto b3
    //   b3:
    //     <continuation-block>
    // 
    const r = this

    // generate control condition
    let control = r.expr(s.cond)

    // end predecessor block (leading up to and including "if")
    let ifb = r.endBlock()
    ifb.kind = BlockKind.If
    ifb.control = control

    // create blocks for then and else branches
    let thenb = r.f.newBlock(BlockKind.Plain)
    let elseb = r.f.newBlock(BlockKind.Plain)
    ifb.succs = [thenb, elseb] // if -> then, else

    // create "then" block
    thenb.preds = [ifb] // then <- if
    r.startSealedBlock(thenb)
    r.block(s.then)
    thenb = r.endBlock()

    if (s.els_) {
      // if cond then A else B end

      // allocate "cont" block
      let contb = r.f.newBlock(BlockKind.Plain)

      // create "else" block
      elseb.preds = [ifb] // else <- if
      r.startSealedBlock(elseb)
      r.block(s.els_)
      elseb = r.endBlock()
      elseb.succs = [contb]

      thenb.succs = [contb] // then -> cont
      contb.preds = [thenb, elseb] // cont <- then, else
      r.startSealedBlock(contb)

      if (r.flags & IRBuilderFlags.Comments) {
        thenb.comment = 'then'
        elseb.comment = 'else'
        contb.comment = 'endif'
      }
    } else {
      // if cond then A end
      thenb.succs = [elseb] // then -> else
      elseb.preds = [ifb, thenb] // else <- if, then
      elseb.succs = null
      r.startSealedBlock(elseb)

      if (r.flags & IRBuilderFlags.Comments) {
        thenb.comment = 'then'
        elseb.comment = 'endif'
      }
    }
  }


  // assign does left = right.
  // Right has already been evaluated to ssa, left has not.
  assign(left :ast.Expr, right :Value) :Value {
    const s = this

    assert(left instanceof ast.Ident, `${left.constructor.name} not supported`)
    let name = (left as ast.Ident).value

    // s.addNamedValue(left, right)
    // let t = rhs.type as BasicType
    // assert(t instanceof BasicType, "not a basic type")
    // let op = storeop(t)
    // v = r.b.newValue1(op, t, src, dst)
    // return right

    // // Issue a "copy" to indicate "store to variable"
    // let v = s.b.newValue1(ops.Copy, right.type, right)
    // if (s.flags & IRBuilderFlags.Comments) {
    //   v.comment = name.toString()
    // }
    // s.writeVariable(name, v)
    // return v
    // //
    // // TODO: when we implement register allocation and stack allocation,
    // // we can remove the "Copy" op and just do the following to track the
    // // assignment:
    // //

    // instead of issuing an intermediate "store", simply associate variable
    // name with the value on the right-hand side.
    s.writeVariable(name, right)
    return right
  }


  // process an assignment node
  assignment(s :ast.Assignment) :Value {
    const r = this

    if (s.op == token.INC || s.op == token.DEC) {
      // e.g. "x++"  =>  "x = x + 1"
      assert(s.lhs.length == 1)
      assert(s.rhs.length == 0)
      let lhs = s.lhs[0]

      // let t = r.concreteType(lhs.type)
      let x = r.expr(lhs)
      let y = r.f.constVal(x.type, 1)

      // generate "x = x op 1"
      let tok = s.op == token.INC ? token.ADD : token.SUB
      let op = opselect2(tok, x.type, y.type)
      let v = r.b.newValue2(op, x.type, x, y)
      return r.assign(lhs, v)
    }

    if (s.op != token.ASSIGN) {
      assert(
        // i.e. not "op="
        s.op < token.assignop_beg || s.op > token.assignop_end,
        `invalid assignment operation ${token[s.op]}`
      )
      // "x += 4", "x *= 2", etc  =>  "x = x + 4", "x = x * 2", etc.
      assert(s.lhs.length == 1)
      assert(s.rhs.length == 1)

      let lhs = s.lhs[0]
      // let t = r.concreteType(lhs.type)
      let x = r.expr(lhs)
      let y = r.expr(s.rhs[0])
      let op = opselect2(s.op, x.type, y.type)
      let v = r.b.newValue2(op, x.type, x, y)
      return r.assign(lhs, v)
    }

    // if we get here, we're dealing with a regular assignment, e.g. "x = y"

    // break up "x, y = a, b" assignments into simple "x = a", "y = b"
    //
    let z = s.lhs.length
    let preloadRhs :(Value|undefined)[]|null = null  // "holey" array

    if (z > 1) {
      // potentially rewrite RHS with preloads and temps when an identifier
      // appears on both the left and right side.
      //
      // e.g. "x, y, z = y, x, 2" causes x and y to be preloaded into
      // temporaries:
      //   t0 = load x
      //   t1 = load y
      //   store t1 x
      //   store t0 y
      //   z = 2
      //
      let leftnames = new Map<ByteStr,int>() // name => position
      for (let i = 0; i < z; i++) {
        let x = s.lhs[i]
        if (x instanceof ast.Ident) {
          leftnames.set(x.value, i)
        }
      }
      for (let i = 0; i < z; i++) {
        let x = s.rhs[i]
        if (x instanceof ast.Ident) {
          let Li = leftnames.get(x.value)
          if (Li == i) {
            // e.g. "x, y = x, 2"
            r.diag('warn', `${x} assigned to itself`, x.pos)
          } else if (Li !== undefined) {
            // appears on the left -- preload
            if (!preloadRhs) {
              preloadRhs = new Array<Value|undefined>(s.rhs.length)
            }
            preloadRhs[i] = r.expr(x)
          }
        }
      }
    }

    let v :Value|null = null

    for (let i = 0; i < z; i++) {
      let left = s.lhs[i]
      let k :Value|undefined
      if (preloadRhs && (k = preloadRhs[i])) {
        v = k
      } else {
        v = r.expr(s.rhs[i])
      }
      v = r.assign(left, v)
    }

    return v as Value
  }


  expr(s :ast.Expr) :Value {
    const r = this
    
    assert(s.type, `type not resolved for ${s}`)

    if (s instanceof ast.NumLit) {
      const t = r.concreteType(s.type)
      return r.f.constVal(t, s.value)
    }

    if (s instanceof ast.Ident) {
      const t = r.concreteType(s.type as Type)
      return r.readVariable(s.value, t, null)
    }

    if (s instanceof ast.Assignment) {
      return r.assignment(s)
    }

    if (s instanceof ast.Operation) {

      // "x op y" => "tmp = x op y" -> tmp
      if (s.op == token.OROR || s.op == token.ANDAND) {
        return r.opAndAnd(s)
      }

      const t = r.concreteType(s.type as Type)

      let left = r.expr(s.x)
      if (s.y) {
        // Basic binary operation
        let right = r.expr(s.y)
        let op = opselect2(s.op, left.type, right.type)

        if (r.flags & IRBuilderFlags.Optimize) {
          // attempt to evaluate constant expression
          let v = optcf_op2(r.b, op, left, right)
          if (v) {
            return v
          }
        }

        return r.b.newValue2(op, t, left, right)
      }

      // Basic unary operation
      let op = opselect1(s.op, left.type)

      if (r.flags & IRBuilderFlags.Optimize) {
        // attempt to evaluate constant expression
        let v = optcf_op1(r.b, op, left)
        if (v) {
          return v
        }
      }

      return r.b.newValue1(op, t, left)
    }

    if (s instanceof ast.CallExpr) {
      return r.funcall(s)
    }

    dlog(`TODO: handle ${s.constructor.name}`)
    return r.nilValue()
  }


  opAndAnd(n :ast.Operation) :Value {
    // high-level "&&" or "||" operation, lowered to branching.
    //
    // We implement "||" and "&&" via a temporary var and "if" branch.
    // E.g. source code
    //    x && y
    // is converted to
    //    t = x
    //    if t {
    //      t = y
    //    }
    // and t is unsed in place.
    // OROR is converted in a similar manner:
    //    x || y
    // is converted to
    //    t = x
    //    if !t {
    //      t = y
    //    }
    //
    // Reference of Go AST -> IR for OROR and ANDAND:
    //   https://github.com/golang/go/blob/
    //   10d096fec2fe8f3e88f847fd0ac17c0601bf6442/src/cmd/compile/internal/
    //   gc/ssa.go#L1957
    //
    // -------------------------------------------------------------------
    // Note on WASM:
    // WebAssembly provides a "select" operator with these semantics:
    //   t1 = A<T>
    //   t2 = B<T>
    //   select C<i32> t1 t2 => D<T>
    // Where if C is not zero, value of A is used, otherwise value of B is
    // used, resulting in D. A and B must be of the same type and both A
    // and B are evaluated prior to the operator (not short-circuiting.)
    // This would make sense to use only for special cases where both A
    // and B are constants.
    // In order to target this operator in WASM, we need a higher-level
    // construct to represent ANDAND and OROR. After this (current)
    // if-construction, it won't be easy to later "revert" to ANDAND and
    // OROR.
    // Idea 1: Include target information when generating IR and only
    //         unroll into "if" branches if the target doesn't support
    //         something like WASM's "select".
    // Idea 2: Perform this step later 
    //
    // However, for now, since it's a possibly-small RoI optimization
    // opportunity, we're ignoring this.
    // -------------------------------------------------------------------
    //
    const s = this
    assert(n.y != null)

    let tmpname = asciiByteStr('tmp') // TODO: use `s` (just need a ref)

    let left = s.expr(n.x)
    s.writeVariable(tmpname, left)

    let t = left.type

    let rightb = s.f.newBlock(BlockKind.Plain)  // y
    let contb = s.f.newBlock(BlockKind.Plain) // t

    // end entry "if" block
    let ifb = s.endBlock()
    ifb.kind = BlockKind.If
    ifb.control = left

    if (n.op == token.OROR) {
      // flip branches; equivalent to "ifFalse"/"ifz"
      ifb.succs = [contb, rightb] // if -> contb, rightb
    } else {
      assert(n.op == token.ANDAND)
      ifb.succs = [rightb, contb] // if -> rightb, contb
    }

    // gen "right" block
    rightb.preds = [ifb] // rightb <- if
    s.startSealedBlock(rightb)
    let right = s.expr(n.y as ast.Expr)

    // TODO: do we really need a "copy" here? Can't we just do this instead
    //   s.writeVariable(tmpname, right)
    // and then navigate the resulting Phi when lowering to target code?
    //
    let tmpv = s.b.newValue1(ops.Copy, right.type, right)
    s.writeVariable(tmpname, tmpv)

    rightb = s.endBlock()
    rightb.succs = [contb] // rightb -> contb

    assert(t.equals(right.type), "operands have different types")

    // start continuation block
    contb.preds = [ifb, rightb] // contb <- ifb, rightb
    s.startSealedBlock(contb)

    return s.readVariable(tmpname, t_bool, null)
  }


  funcall(x :ast.CallExpr) :Value {
    const s = this

    if (x.hasDots) {
      dlog(`TODO: handle call with hasDots`)
    }

    // first unroll argument values
    let argvals :Value[] = []
    for (let arg of x.args) {
      argvals.push(s.expr(arg))
    }

    // push params
    if (
      s.flags & IRBuilderFlags.Comments &&
      x.fun instanceof ast.Ident &&
      x.fun.ent
    ) {
      // include comment with name of parameter, when available
      let fx = x.fun.ent.decl as ast.FunExpr
      let funstr = x.fun.toString() + '/'
      for (let i = 0; i < argvals.length; i++) {
        let v = argvals[i]
        let v2 = s.b.newValue1(ops.CallArg, v.type, v)
        let param = fx.sig.params[i]
        if (param.name) {
          v2.comment = funstr + param.name.toString()
        }
      }
    } else {
      for (let v of argvals) {
        s.b.newValue1(ops.CallArg, v.type, v)
      }
    }

    // TODO: handle any function by
    // let fv = s.expr(x.fun)
    // and implementing function resolution somehow in readGlobal et al.

    assert(x.fun instanceof ast.Ident, "non-id callee not yet supported")
    let funid = x.fun as ast.Ident
    assert(funid.ent, "unresolved callee")

    let ft = funid.type as FunType
    assert(ft, "unresolved function type")


    let rt = ft.result as BasicType
    assert(ft.result instanceof BasicType,
      `non-basic type ${ft.result.constructor.name} not yet supported`)
    return s.b.newValue0(ops.Call, rt, funid.value)
  }


  readVariable(name :ByteStr, t :BasicType, b :Block|null) :Value {
    const s = this

    if (!b || b === s.b) {
      let v = s.vars.get(name)
      if (v) {
        return v
      }
      b = s.b
    } else {
      let m = s.defvars[b.id]
      if (m) {
        let v = m.get(name)
        if (v) {
          return v
        }
      }
    }

    // global value numbering
    return s.readVariableRecursive(name, t, b)
  }


  readGlobal(name :ByteStr) :Value {
    const s = this
    dlog(`TODO readGlobal ${name}`)
    return s.nilValue() // FIXME
  }


  writeVariable(name :ByteStr, v :Value, b? :Block) {
    const s = this
    dlog(`${b || s.b} ${name} = ${v.op} ${v}`)
    if (!b || b === s.b) {
      s.vars.set(name, v)
    } else {
      while (s.defvars.length <= b.id) {
        // fill any holes
        s.defvars.push(null)
      }
      let m = s.defvars[b.id]
      if (m) {
        m.set(name, v)
      } else {
        s.defvars[b.id] = new Map<ByteStr,Value>([[name, v]])
      }
    }
  }

  addIncompletePhi(phi :Value, name :ByteStr, b :Block) {
    const s = this
    dlog(`${b} ${phi} var=${name}`)
    let names = s.incompletePhis ? s.incompletePhis.get(b) : null
    if (!names) {
      names = new Map<ByteStr,Value>()
      if (!s.incompletePhis) {
        s.incompletePhis = new Map<Block,Map<ByteStr,Value>>()
      }
      s.incompletePhis.set(b, names)
    }
    names.set(name, phi)
  }


  readVariableRecursive(name :ByteStr, t :BasicType, b :Block) :Value {
    const s = this
    let val :Value

    if (!b.sealed) {
      // incomplete CFG
      dlog(`${b} ${name} not yet sealed`)
      val = b.newPhi(t)
      s.addIncompletePhi(val, name, b)

    } else if (b.preds && b.preds.length == 1) {
      dlog(`${b} ${name} common case: single predecessor ${b.preds[0]}`)
      // Optimize the common case of one predecessor: No phi needed
      val = s.readVariable(name, t, b.preds[0])
      dlog(`found ${name} : ${val}`)

    } else if (!b.preds || b.preds.length == 0) {
      dlog(`${b} ${name} uncommon case: outside of function`)
      // entry block
      val = s.readGlobal(name)
      // TODO: consider just returning the value here instead of falling
      // through and causing writeVariable.

    } else {
      dlog(`${b} ${name} uncommon case: multiple predecessors`)
      // Break potential cycles with operandless phi
      val = b.newPhi(t)
      s.writeVariable(name, val, b)
      val = s.addPhiOperands(name, val)
    }
    s.writeVariable(name, val, b)
    return val
  }


  addPhiOperands(name :ByteStr, phi :Value) :Value {
    const s = this
    assert(phi.op === ops.Phi)
    assert(phi.b.preds, 'phi in block without predecessors')
    // Determine operands from predecessors
    dlog(`${name} phi=${phi}`)
    for (let pred of phi.b.preds as Block[]) {
      dlog(`  ${pred}`)
      let v = s.readVariable(name, phi.type, pred)
      if (v !== phi) {
        dlog(`  ${pred} ${v}<${v.op}>`)
        phi.appendArg(v)
      }
    }
    return s.tryRemoveTrivialPhi(phi)
  }


  tryRemoveTrivialPhi(phi :Value) :Value {
    const s = this
    assert(phi.op === ops.Phi)
    let same :Value|null = null
    dlog(`${phi.b} ${phi}`)

    assert(phi.args != null, "phi without operands")
    for (let operand of phi.args as Value[]) {
      if (operand === same || operand === phi) {
        continue // Unique value or self−reference
      }
      if (same != null) {
        dlog(`${phi.b} ${phi} not trivial (keep)`)
        return phi // The phi merges at least two values: not trivial
      }
      same = operand
    }

    dlog(`${phi.b} ${phi} is trivial (remove)`)

    if (same == null) {
      dlog(`${phi.b} ${phi} unreachable or in the start block`)
      same = new Value(0, ops.Invalid, t_nil, phi.b, null) // dummy FIXME
      // same = new Undef() // The phi is unreachable or in the start block
    }

    let users = phi.users;  // Remember all users
    dlog(`${phi.b} replace ${phi} with ${same} (aux = ${same.aux})`)
    phi.replaceBy(same) // Reroute all uses of phi to same and remove phi
    assert(phi.uses == 0, `still used even after Value.replaceBy`)

    // Try to recursively remove all phi users, which might have become trivial
    for (let user of users) {
      if (user.op === ops.Phi && user !== phi) {
        s.tryRemoveTrivialPhi(user)
      }
    }

    return same
  }


  // diag reports a diagnostic message, or an error if k is ERROR
  //
  diag(k :DiagKind, msg :string, pos :Pos) {
    const r = this
    assert(k != "error", "unexpected DiagKind 'error'")
    if (r.diagh) {
      assert(r.sfile)
      r.diagh((r.sfile as SrcFile).position(pos), msg, k)
    }
  }

}

