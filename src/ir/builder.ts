import { ByteStr, asciiByteStr } from '../bytestr'
import { Pos, SrcFile } from '../pos'
import { token } from '../token'
import { DiagKind, DiagHandler } from '../diag'
import * as ast from '../ast'
import { Type, PrimType, FunType, UIntType, types as T, intTypes, t_nil } from "../ast"
import { optcf_op1, optcf_op2 } from './opt_cf'
import { ops, opinfo } from "./ops"
import { Value, Block, BlockKind, Fun, Pkg, BranchPrediction, nilValue } from './ssa'
import { opselect1, opselect2, opselectConv } from './opselect'
import { Config } from './config'
import { LocalSlot } from './localslot'


// debug logging
// import { printir } from './repr'
import { debuglog as dlog } from '../util'
// const dlog = function(..._ :any[]){} // silence dlog

// const dlogPhi = dlog
const dlogPhi = function(..._ :any[]){} // silence

// const dlogVar = dlog
const dlogVar = function(..._ :any[]){}


const bitypes = ast.types


export enum IRBuilderFlags {
  Default  = 0,
  Comments = 1 << 1,  // include comments in some values, for formatting
}


class TmpName extends ByteStr {}


// IRBuilder produces SSA IR for functions, taking AST as the input.
//
// The "inline"/"single-pass" Phi placement heuristic is based on the paper
// "Simple and Efficient Construction of Static Single Assignment Form"
// https://pp.info.uni-karlsruhe.de/uploads/publikationen/braun13cc.pdf
//
export class IRBuilder {
  config   :Config

  pkg      :Pkg
  sfile    :SrcFile|null = null
  diagh    :DiagHandler|null = null
  b        :Block       // current block
  f        :Fun         // current function
  flags    :IRBuilderFlags = IRBuilderFlags.Default
  addrtype :UIntType

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

  breakTo :Block|null = null
    // Nearest block. For unlabeled "break".

  startmem :Value  // initial function memory  (InitMem)
  sp       :Value  // current function's SP (stack pointer)
  sb       :Value  // current function's SB (static base pointer)

  stacktop :Value  // current top of stack


  init(config :Config,
       diagh :DiagHandler|null = null,
       flags :IRBuilderFlags = IRBuilderFlags.Default
  ) {
    const r = this
    r.config = config
    r.pkg = new Pkg()
    r.sfile = null
    r.diagh = diagh
    r.vars = new Map<ByteStr,Value>()
    r.defvars = []
    r.incompletePhis = null
    r.flags = flags
    r.sp = nilValue

    // // select integer types
    const [intt_s, intt_u] = intTypes(config.intSize)
    r.addrtype = intTypes(config.addrSize)[1]

    this.concreteType = (t :Type) :PrimType => {
      switch (t) {
      case T.int:     return intt_s
      case T.uint:    return intt_u
      case T.uintptr: return r.addrtype
      default:
        assert(t.isPrimType(), `${t} is not a PrimType`)
        return t as PrimType
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
        assert(d.sig.result === t_nil, 'init fun with result')
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
          dlogPhi(`complete pending phi ${phi} (${name})`)
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
    // while (r.defvars.length <= b.id) {
    //   r.defvars.push(null)
    // }
    r.defvars[b.id] = r.vars

    // reset block-local vars
    r.vars = new Map<ByteStr,Value>()

    if (DEBUG) {
      // make sure we crash if we try to use b before a new block is started
      ;(r as any).b = null
    }

    // [optimization] change last value to TailCall when block returns
    // and last value is Call
    if (
      b.kind == BlockKind.Ret &&
      b.values.length &&
      b.values[b.values.length-1].op == ops.Call
    ) {
      b.values[b.values.length-1].op = ops.TailCall
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

    if (DEBUG) {
      let dloglines :string[] = []
      for (let name of s.f.namedValues.keys()) {
        let e = s.f.namedValues.get(name)
        let line = `  ${name}\t=> `
        if (e && e.values.length) {
          line += Array.from(new Set(e.values)).join(', ')
        } else {
          line += '-'
        }
        dloglines.push(line)
      }
      dlog(`s.f.namedValues:\n` + dloglines.join("\n") + "\n")
    }

    // TODO: run passes on s.f here

    // if (s.config.optimize) {
    //   // perform early dead-code elimination
    //   optdce(s.f)
    // }
    // if (s.regalloc) {
    //   // perform register allocation
    //   s.regalloc.regallocFun(s.f)
    // }

    if (DEBUG) {
      ;(s as any).f = null
    }
  }

  // concreteType normalizes abstract types to concrete types.
  // E.g. concreteType(int) -> i32  (if int->i32 exists in typemap)
  //
  concreteType(t :Type) :PrimType {
    // Note: This function is replaced by the constructor
    assert(t.isPrimType())
    return t as PrimType
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
      r.config,
      funtype,
      x.name ? x.name.value : null,
      x.sig.params.length
    )

    // Add initial memory state, SP and SB to top of entry block
    r.startmem = f.entry.newValue0(ops.InitMem, T.mem)
    r.sp = f.entry.newValue0(ops.SP, r.addrtype)
    r.sb = f.entry.newValue0(ops.SB, r.addrtype)

    // stack starts at startmem
    r.stacktop = r.startmem

    // initialize arguments
    for (let i = 0; i < x.sig.params.length; i++) {
      let p = x.sig.params[i]
      if (p.name && !p.name.value.isUnderscore()) {
        let t = r.concreteType(funtype.args[i])
        let name = p.name.value
        let v = f.entry.newValue0(ops.Arg, t, i, name)
        r.vars.set(name, v)
      }
    }

    r.startFun(f)
    r.startSealedBlock(f.entry)

    let bodyval = r.block(x.body as ast.Expr)

    // printir(f); dlog(`r.b = ${r.b}`); process.exit(0)  // XXX

    if (r.b as any) {
      // end last block if not already ended
      r.b.kind = BlockKind.Ret
      if (!(x.body instanceof ast.Block)) {
        // body is a single expression -- control value is that expression
        // assert(!(x.body instanceof ast.ReturnStmt),
        //   "'return' as function expression body should have called "+
        //   "ret() to close block")
        r.b.setControl(bodyval)
      }
      // when body is a block and it didn't end, it was empty and thus
      // the return type is nil (no control value.)
      r.endBlock()
    }

    assert((r as any).b == null,
      "function exit block not ended")

    assert(
      f.blocks[f.blocks.length-1].kind == BlockKind.Ret,
      `last block ${f.blocks[f.blocks.length-1]} in function ` +
      `is not BlockKind.Ret ` +
      `(instead it is ${BlockKind[f.blocks[f.blocks.length-1].kind]})`
    )
    // assert(f.tailb.kind == BlockKind.Ret,
    //   "last block in function is not BlockKind.Ret")

    r.endFun()
    r.pkg.funs.set(f.name, f)

    // zero out function state in debug mode, to cause errors on access
    if (DEBUG) {
      ;(r as any).startmem = null
      ;(r as any).sp       = null
      ;(r as any).sb       = null
    }

    return f
  }


  // block generates values from an AST block.
  // It's the caller's responsibility to create and manage IR blocks.
  //
  block(x :ast.Expr) :Value|null {
    const r = this
    if (x instanceof ast.Block) {
      return r.stmtList(x.list) // returns last expr, or null
    }
    return r.expr(x)
  }


  // stmt adds one or more TAC to block b in function f from statement s
  //
  stmt(s :ast.Stmt) :Value|null {
    const r = this

    if (s instanceof ast.IfExpr) {
      r.if_(s)

    } else if (s instanceof ast.ReturnStmt) {
      r.ret(r.expr(s.result))

    } else if (s instanceof ast.ForStmt) { // includes WhileStmt
      r.for_(s)

    } else if (s instanceof ast.Expr) {
      return r.expr(s)

    } else if (s instanceof ast.VarDecl) {
      if (s.values) {
        // explicit value; e.g. "x = 3"
        for (let i = 0; i < s.idents.length; i++) {
          let id = s.idents[i]
          let v = r.expr(s.values[i])
          r.varDef(id.value, v)
        }
      } else {
        // default value; e.g. "x i32"  =>  "x = 0"
        assert(s.type, 'var decl without type or values')
        let t = (s.type as ast.Expr).type as PrimType
        assert(t, 'unresolved type')
        assert(t.isPrimType(), 'non-basic type not yet supported')
        let v = r.f.constVal(t, 0)  // nil
        for (let id of s.idents) {
          r.varDef(id.value, v)
        }
      }
    // } else if (s instanceof ast.InlineMark) {
    //   s.newValue1I(ssa.OpInlMark, t.TypeVoid, n.Xoffset, s.mem())
    } else {
      dlog(`TODO: handle ${s.constructor.name}`)
    }
    return null
  }


  varDef(name :ByteStr, init :Value) :Value {
    const s = this
    let v = s.b.newValue1(ops.VarDef, init.type, init, 0, name)
    assert(!s.vars.has(name), `redeclaration of var ${name}`)
    s.vars.set(name, v)
    return v
  }


  stmtList(v :ast.Stmt[]) :Value|null {
    const s = this
    let i = 0
    if (v.length > 0) while (true) {
      assert(s.b)
      let x = s.stmt(v[i++])
      if (i == v.length) {
        return x
      }
    }
    return null
  }


  ret(val :Value|null) {
    const s = this
    let b = s.endBlock()
    b.kind = BlockKind.Ret
    b.setControl(val)
  }


  // for_ builds a conditional loop.
  //
  // The current block is first ended as a simple "cont" and a new block
  // is created for the loop condition, which when true branches to
  // the loop body, and after the loop when false.
  //
  // Example:
  //   x = 5
  //   while x > 0 {
  //     x--
  //   }
  // Becomes:
  //   b0:
  //     v0 = ConstI32 [5]  // x
  //     v1 = ConstI32 [0]
  //     v2 = ConstI32 [1]
  //   cont -> b1
  //   b1: <- b0  // while
  //     v3 = Phi v1 v5
  //     v4 = GreaterS32 v1 v2
  //   if v4 -> b2, b3
  //   b2: <- b1  // then
  //     v5 = SubI32 v3 v2  // x = x - 1
  //   cont -> b1
  //   b3:  // end while
  //   ret
  //
  //
  for_(n: ast.ForStmt) {
    // Note: WhileStmt is a ForStmt without init or incr
    const s = this

    // initializing code (may be none)
    if (n.init) {
      s.stmt(n.init)
    }

    let bCond = s.f.newBlock(BlockKind.Plain)
    let bBody = s.f.newBlock(BlockKind.Plain)
    let bIncr = s.f.newBlockNoAdd(BlockKind.Plain)
    let bEnd  = s.f.newBlockNoAdd(BlockKind.Plain)

    bBody.pos = n.pos

    // end "entry" block (whatever block comes before "while")
    let bEntry = s.endBlock()
    dlog(`for ${n} endBlock() => ${bEntry}`)
    assert(bEntry.sealed)
    // if (!bEntry.sealed) {
    //   s.sealBlock(bEntry) // all preds of bEntry are known
    // }

    // connect entry -> condition
    bEntry.addEdgeTo(bCond)

    // condition
    s.startBlock(bCond)
    let unconditional = true
    if (n.cond) {
      unconditional = false
      let cond = s.expr(n.cond) // condition for looping
      if (s.config.optimize && opinfo[cond.op].constant) {
        // constant condition
        if (cond.auxIsZero()) {
          // while loop never taken
          // convert condition block to continuation block and seal it
          bCond.kind = BlockKind.Plain
          s.sealBlock(bCond)  // no more preds
          s.f.removeBlock(bBody)
          s.f.freeBlock(bIncr)
          s.f.freeBlock(bEnd)
          return
        } else {
          // loop unconditionally
          unconditional = true
          // TODO: produce error if there is no break or labeled continue
          // inside the body.
        }
      }
      if (!unconditional) {
        let b = s.endBlock()
        b.kind = BlockKind.If
        b.setControl(cond)
        b.likely = BranchPrediction.Likely
        b.addEdgeTo(bBody) // yes
        b.addEdgeTo(bEnd) // no
      }
    }
    if (unconditional) {
      let b = s.endBlock()
      b.kind = BlockKind.Plain
      b.addEdgeTo(bBody) // yes (unconditional)
    }

    // break/continue
    let prevBreak = s.breakTo
    s.breakTo = bEnd
    // TODO: continue
    // TODO: labels

    // body
    s.startSealedBlock(bBody) // all preds of bBody are known
    s.block(n.body) // note: intentionally ignore return value

    // break/continue
    s.breakTo = prevBreak

    // end body
    let bodyEnd = s.endBlock()
    if (bodyEnd.values.length == 0 && bodyEnd.sealed) {
      // short-circuit empty body
      //
      // Example where b2->b3->b2 is short-circuited to b2->b2:
      //   b2: <— b1, b3
      //     ...
      //   if v1 —> b4, b3
      //   b3: <— b2
      //   cont —> b2
      //   b4: <— b2
      //     ...
      //
      // After short-circuit:
      //   b2: <— b1, b2
      //     ...
      //   if v1 —> b4, b2
      //   b4: <— b2
      //     ...
      //
      assert(bodyEnd.preds.length == 1)
      let pred0 = bodyEnd.preds[0]!
      assert(pred0.succs.length > 0)
      let idx = pred0.succs.indexOf(bodyEnd)
      assert(
        idx != -1,
        `${bodyEnd}.preds contains ${pred0}, ` +
        `but ${pred0}.succs doesn't contain ${bodyEnd}`
      )
      pred0.succs.splice(idx)
      s.f.removeBlock(bodyEnd)
      bodyEnd = pred0
    }

    // incr?
    if (n.incr) {
      bodyEnd.addEdgeTo(bIncr)
      s.f.blocks.push(bIncr)
      s.startSealedBlock(bIncr)
      s.stmt(n.incr)
      let b = s.endBlock()
      b.addEdgeTo(bCond)
    } else {
      bodyEnd.addEdgeTo(bCond)
      s.f.freeBlock(bIncr)
    }

    // seal cond block
    s.sealBlock(bCond) // all preds of bCond are known

    // start continuation block
    s.f.blocks.push(bEnd)
    s.startSealedBlock(bEnd)
    dlog(`bEnd ${bEnd}`)

    // add comments
    if (s.flags & IRBuilderFlags.Comments) {
      let prefix = n instanceof ast.WhileStmt ? "while" : "for"
      bCond.comment = `${prefix}.b${bCond.id}.cond`
      bIncr.comment = `${prefix}.b${bCond.id}.incr`
      bBody.comment = `${prefix}.b${bCond.id}.body`
      bEnd.comment  = `${prefix}.b${bCond.id}.end`
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

    // potentially inline or eliminate branches when control is constant
    if (r.config.optimize && opinfo[control.op].constant) {
      if (control.auxIsZero()) {
        // "else" branch always taken
        if (s.els_) {
          r.block(s.els_)
        }
        // else: no else branch -- entire if-expression is eliminated
      } else {
        // "then" branch always taken
        r.block(s.then)
      }
      return
    }

    // end predecessor block (leading up to and including "if")
    let ifb = r.endBlock()
    ifb.kind = BlockKind.If
    ifb.setControl(control)

    // create blocks for then and else branches
    let thenb = r.f.newBlock(BlockKind.Plain)
    let elsebidx = r.f.blocks.length
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
      let contbidx = r.f.blocks.length
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

      // move ending block to end
      r.f.moveBlockToEnd(contbidx)
      // r.f.blocks.copyWithin(contbidx, contbidx+1)
      // r.f.blocks[r.f.blocks.length-1] = contb

      if (r.flags & IRBuilderFlags.Comments) {
        thenb.comment = 'then'
        elseb.comment = 'else'
        contb.comment = 'endif'
      }
    } else {
      // if cond then A end
      thenb.succs = [elseb] // then -> else
      elseb.preds = [ifb, thenb] // else <- if, then
      elseb.succs = []
      r.startSealedBlock(elseb)

      // move ending block to end
      r.f.blocks.copyWithin(elsebidx, elsebidx+1)
      r.f.blocks[r.f.blocks.length-1] = elseb

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

    if (name.isEmpty) { // "_"
      return right
    }

    // // copy right -> left
    // let v = s.b.newValue1(ops.Copy, right.type, right)
    // if (s.flags & IRBuilderFlags.Comments) {
    //   v.addComment(name.toString())
    // }
    // s.writeVariable(name, v)
    // return v

    // instead of issuing an intermediate "copy", simply associate variable
    // name with the value on the right-hand side.
    s.writeVariable(name, right)

    if (s.flags & IRBuilderFlags.Comments) {
      right.addComment(name.toString())
    }

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
        if (x.isIdent()) {
          leftnames.set(x.value, i)
        }
      }
      for (let i = 0; i < z; i++) {
        let x = s.rhs[i]
        if (x.isIdent()) {
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
      if (s.decls[i]) {
        // declares a new variable
        assert(left.isIdent())
        assert(!(left as ast.Ident).value.isEmpty, `AST contains vardef "_"`)
        v = r.varDef((left as ast.Ident).value, v)
      } else {
        // write to existing variable
        v = r.assign(left, v)
      }
    }

    // last value represents the assignment expression
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

        if (r.config.optimize) {
          // attempt to evaluate constant expression
          let v = optcf_op2(r.b, op, left, right)
          if (v) {
            // if (r.b !== v.b) {
            //   // place a Copy when the definition is in a different block
            //   // to maintain CFG integrity.
            //   v = r.copy(v)
            // }
            return v
          }
        }

        return r.b.newValue2(op, t, left, right)
      }

      // Basic unary operation
      let op = opselect1(s.op, left.type)

      if (r.config.optimize) {
        // attempt to evaluate constant expression
        let v = optcf_op1(r.b, op, left)
        if (v) {
          // if (r.b !== v.b) {
          //   // place a Copy when the definition is in a different block
          //   // to maintain CFG integrity.
          //   v = r.copy(v)
          // }
          return v
        }
      }

      return r.b.newValue1(op, t, left)
    }

    if (s instanceof ast.CallExpr) {
      return r.funcall(s)
    }

    if (s instanceof ast.TypeConvExpr) {
      return r.conv(s)
    }

    dlog(`TODO: handle ${s.constructor.name}`)
    return r.nilValue()
  }


  conv(s :ast.TypeConvExpr) :Value {
    const r = this
    let t = s.type as PrimType
    assert(t.isPrimType())
    let x = r.expr(s.expr)
    let op = opselectConv(x.type, t)
    return r.b.newValue1(op, t, x)
  }


  copy(v :Value) :Value {
    return this.b.newValue1(ops.Copy, v.type, v)
  }


  tmpNames :TmpName[] = []
  tmpNameBytes :Uint8Array|null = null
  tmpNameHash :int = 0

  allocTmpName() :TmpName {
    let n = this.tmpNames.pop()
    if (!n) {
      if (this.tmpNameBytes) {
        n = new TmpName(this.tmpNameHash, this.tmpNameBytes)
      } else {
        n = asciiByteStr('tmp')
        this.tmpNameBytes = n.bytes
        this.tmpNameHash = n.hash
      }
    }
    return n
  }


  freeTmpName(n :TmpName) {
    this.tmpNames.push(n)
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

    let tmpname = s.allocTmpName()

    let left = s.expr(n.x)
    s.writeVariable(tmpname, left)

    let t = left.type

    let rightb = s.f.newBlock(BlockKind.Plain)  // y
    let contb = s.f.newBlock(BlockKind.Plain) // t

    // end entry "if" block
    let ifb = s.endBlock()
    ifb.kind = BlockKind.If
    ifb.setControl(left)

    if (n.op == token.OROR) {
      // flip branches; equivalent to "ifFalse"/"ifz"
      // contb.likely = BranchPrediction.Likely
      // rightb.likely = BranchPrediction.Unlikely
      ifb.succs = [contb, rightb] // if -> contb, rightb
    } else {
      assert(n.op == token.ANDAND)
      // rightb.likely = BranchPrediction.Likely
      // contb.likely = BranchPrediction.Unlikely
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
    // let tmpv = s.b.newValue1(ops.Copy, right.type, right)
    // s.writeVariable(tmpname, tmpv)
    s.writeVariable(tmpname, right)

    rightb = s.endBlock()
    rightb.succs = [contb] // rightb -> contb

    assert(t.equals(right.type),
      `operands have different types: ${t} <> ${right.type}`)

    // start continuation block
    contb.preds = [ifb, rightb] // contb <- ifb, rightb
    s.startSealedBlock(contb)

    let v = s.readVariable(tmpname, T.bool, null)

    // remove tmpname
    s.removeVariable(ifb, tmpname)
    s.freeTmpName(tmpname)

    return v
  }


  spoffs = 0  // stack pointer offset

  stackPush(v :Value) {
    const s = this
    assert(v.type.isPrimType())

    // compute address (SP + stack offset)
    let addr = s.b.newValue1(ops.OffPtr, T.mem, s.sp, s.spoffs)

    // Store v to addr. arg2=mem, aux=type
    s.stacktop = s.b.newValue3(ops.Store, T.mem, addr, v, s.stacktop, 0, v.type)

    // increment offset to stack pointer
    s.spoffs += v.type.storageSize()
  }

  stackPop(t :PrimType) :Value {
    const s = this
    assert(t.storageSize() <= s.addrtype.storageSize())

    // compute address (SP + stack offset)
    let addr = s.b.newValue1(ops.OffPtr, T.mem, s.sp, s.spoffs)

    // load return value at spoffs of type rt
    s.stacktop = s.b.newValue2(ops.Load, t, addr, s.stacktop)

    // decrement offset to stack pointer
    s.spoffs -= t.storageSize()

    return s.stacktop
  }


  funcall(x :ast.CallExpr) :Value {
    // See https://rsms.me/co/doc/stack/
    const s = this

    if (x.hasRest) {
      dlog(`TODO: handle call with hasRest`)
    }

    // TODO: handle any function by
    // let fv = s.expr(x.receiver)
    // and implementing function resolution somehow in readGlobal et al.

    assert(x.receiver instanceof ast.Ident, "non-id callee not yet supported")
    let funid = x.receiver as ast.Ident
    assert(funid.ent, "unresolved callee")

    let ft = funid.type as FunType
    assert(ft, "unresolved function type")

    // TODO: support other types like strings etc
    assert(ft.result.isPrimType(),
      `non-basic type ${ft.result.constructor.name} not yet supported`)

    // first unroll argument values in order (LTR)
    let argvals :Value[] = []
    for (let arg of x.args) {
      argvals.push(s.expr(arg))
    }

    // let stacksize = ft.argWidth() // includes receiver, args, and results

    // push params on stack
    for (let i = argvals.length; i > 0;) {
      let arg = argvals[--i]
      s.stackPush(arg)
    }

    // generate call op
    s.stacktop = s.b.newValue1(ops.Call, T.mem, s.stacktop, x.args.length, funid.value)

    // load return value off of the stack
    return s.stackPop(s.concreteType(ft.result as PrimType)) // == s.stacktop
  }


  readVariable(name :ByteStr, t :PrimType, b :Block|null) :Value {
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


  removeVariable(b :Block, name :ByteStr) :bool {
    if (b === this.b) {
      return this.vars.delete(name)
    }
    let m = this.defvars[b.id]
    return m ? m.delete(name) : false
  }


  readGlobal(name :ByteStr) :Value {
    const s = this
    dlog(`TODO readGlobal ${name}`)
    return s.nilValue() // FIXME
  }


  writeVariable(name :ByteStr, v :Value, b? :Block) {
    const s = this
    dlogVar(`${b || s.b} ${name} = ${v.op} ${v}`)
    if (!b || b === s.b) {
      s.vars.set(name, v)
    } else {
      let m = s.defvars[b.id]
      if (m) {
        m.set(name, v)
      } else {
        s.defvars[b.id] = new Map<ByteStr,Value>([[name, v]])
      }
    }

    if (!(name instanceof TmpName)) {
      // TODO: find a better and more efficient way to map a LocalSlot
      // in a map structure. For now, we use a string representation of its
      // internal state.
      let local = new LocalSlot(name, v.type, 0)
      let e = s.f.namedValues.get(local.key())
      if (e) {
        e.values.push(v)
      } else {
        s.f.namedValues.set(local.key(), { local, values: [v] })
      }
    }
  }

  addIncompletePhi(phi :Value, name :ByteStr, b :Block) {
    const s = this
    dlogPhi(`${b} ${phi} var=${name}`)
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


  readVariableRecursive(name :ByteStr, t :PrimType, b :Block) :Value {
    const s = this
    let val :Value

    if (!b.sealed) {
      // incomplete CFG
      dlogPhi(`${b} ${name} not yet sealed`)
      val = b.newPhi(t)
      s.addIncompletePhi(val, name, b)

    } else if (b.preds.length == 1) {
      dlogPhi(`${b} ${name} common case: single predecessor ${b.preds[0]}`)
      // Optimize the common case of one predecessor: No phi needed
      val = s.readVariable(name, t, b.preds[0])
      dlogPhi(`found ${name} : ${val}`)

    } else if (b.preds.length == 0) {
      dlogPhi(`${b} ${name} uncommon case: outside of function`)
      // entry block
      val = s.readGlobal(name)
      // TODO: consider just returning the value here instead of falling
      // through and causing writeVariable.

    } else {
      dlogPhi(`${b} ${name} uncommon case: multiple predecessors`)
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
    assert(phi.b.preds.length > 0, 'phi in block without predecessors')
    // Determine operands from predecessors
    dlogPhi(`${name} phi=${phi}`)
    for (let pred of phi.b.preds) {
      dlogPhi(`  ${pred}`)
      let v = s.readVariable(name, phi.type, pred)
      if (v !== phi) {
        dlogPhi(`  ${pred} ${v}<${v.op}>`)
        phi.addArg(v)
      }
    }
    return phi
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

