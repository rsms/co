import { debuglog as dlog, asciistr } from './util'
import { ByteStr, asciiByteStr } from './bytestr'
import { Pos, SrcFile } from './pos'
import { token } from './token'
import { DiagKind, DiagHandler } from './diag'
import * as ast from './ast'
import { irrepr } from './ir-repr'


const byteStr__ = asciiByteStr("_")
const byteStr_anonfun = asciiByteStr('anonfun')


export class Id {
  constructor(
  public type :ast.Type,
  public name :ByteStr,
  ){}

  toString() :string {
    return this.name.toString()
  }
}


export class Const {
  constructor(
  public type  :ast.BasicType,
  public value :Uint8Array,
  ){}

  toString() {
    return asciistr(this.value)
  }
}


export type Value = Id | Const
  // TODO: consider generating only Ids with intermediate load and stores
  // of constants.

// tac represents a three-address-code statement
//
// TODO: consider linking TACs as a linked-list instead of placing them
// into an array of the block. May make optimizations easier.
//
export class Tac {
  constructor(
  public dst :Id|null, // positive branch when Block
  public op  :token,    // i.e. + - * / % etc. ILLEGAL = not used
  public x   :Value,
  public y   :Value|null,
  ){}
}

// BlockKind denotes what specific kind a block is
//
//     kind       control (x)    successors     notes
//     ---------- -------------- -------------- --------
//     Plain      (nil)          [next]         e.g. "goto"
//     If         boolean        [then, else]
//     Ret        memory         []
//
export enum BlockKind {
  Invalid = 0,
  Plain,
  If,
  Ret,
}

export class Block {
  id       :int
  kind     :BlockKind = BlockKind.Invalid // The kind of block
  succs    :Block[]|null  // Subsequent blocks, if any; depends on kind
  preds    :Block[] = []  // Predecessors
  control  :Value|null = null
    // A value that determines how the block is exited. Its value depends
    // on the kind of the block. For instance, a BlockKind.If has a boolean
    // control value and BlockKind.Exit has a memory control value.
  code     :Tac[] = []    // three-address code

  constructor(kind :BlockKind, id :int) {
    this.kind = kind
    this.id = id
  }

  addTAC(dst :Id|null, op :token, x :Value, y :Value|null) {
    this.code.push(new Tac(dst, op, x, y))
  }

  toString() :string {
    return 'b' + this.id
  }
}

// Edge represents a CFG edge.
// Example edges for b branching to either c or d.
// (c and d have other predecessors.)
//   b.Succs = [{c,3}, {d,1}]
//   c.Preds = [?, ?, ?, {b,0}]
//   d.Preds = [?, {b,1}, ?]
// These indexes allow us to edit the CFG in constant time.
// In addition, it informs phi ops in degenerate cases like:
// b:
//    if k then c else c
// c:
//    v = Phi(x, y)
// Then the indexes tell you whether x is chosen from
// the if or else branch from b.
//   b.Succs = [{c,0},{c,1}]
//   c.Preds = [{b,0},{b,1}]
// means x is chosen if k is true.
// class Edge {
//   constructor(
//   // block edge goes to (in a Succs list) or from (in a Preds list)
//   public b :Block,
//   // index of reverse edge.  Invariant:
//   //   e := x.Succs[idx]
//   //   e.b.Preds[e.i] = Edge(x,idx)
//   // and similarly for predecessors.
//   public i :int,
//   ){}
// }

// function
export class Fun {
  blocks  :Block[]  // blocks in generation order
  params  :Id[]     // parameters
  restype :ast.Type // result type
  name    :ByteStr
  // nextbid :int = 0  // block id counter

  constructor(params :Id[], restype :ast.Type, name :ByteStr) {
    this.blocks = [new Block(BlockKind.Plain, 0)]
    this.params = params
    this.restype = restype
    this.name = name
  }

  newBlock(k :BlockKind) :Block {
    let b = new Block(k, this.blocks.length)
    this.blocks.push(b)
    return b
  }

  toString() {
    return this.name.toString()
  }
}

// package
export class Pkg {
  nI32 :int = 0         // number of 32-bit integer globals
  nI64 :int = 0         // number of 64-bit integer globals
  nF32 :int = 0         // number of 32-bit floating-point globals
  nF64 :int = 0         // number of 64-bit floating-point globals
  data :Uint8Array      // data  TODO wrap into some simple linear allocator
  funs :Fun[] = []      // functions
  init :Fun|null = null // init functions (merged into one)
}


const oneBuf = new Uint8Array([0x31])

const constOne = new Map<ast.BasicType, Const>([
  [ast.u_t_uint, new Const(ast.u_t_uint, oneBuf)],
  [ast.u_t_int,  new Const(ast.u_t_int, oneBuf)],
  [ast.u_t_i8,   new Const(ast.u_t_i8, oneBuf)],
  [ast.u_t_i16,  new Const(ast.u_t_i16, oneBuf)],
  [ast.u_t_i32,  new Const(ast.u_t_i32, oneBuf)],
  [ast.u_t_i64,  new Const(ast.u_t_i64, oneBuf)],
  [ast.u_t_u8,   new Const(ast.u_t_u8, oneBuf)],
  [ast.u_t_u16,  new Const(ast.u_t_u16, oneBuf)],
  [ast.u_t_u32,  new Const(ast.u_t_u32, oneBuf)],
  [ast.u_t_u64,  new Const(ast.u_t_u64, oneBuf)],
  [ast.u_t_f32,  new Const(ast.u_t_f32, oneBuf)],
  [ast.u_t_f64,  new Const(ast.u_t_f64, oneBuf)],
])


export class IRBuilder {
  pkg   :Pkg
  sfile :SrcFile|null = null
  diagh :DiagHandler|null = null
  b     :Block       // current block
  f     :Fun         // current function

  init(diagh :DiagHandler|null = null) {
    const r = this
    r.pkg = new Pkg()
    r.sfile = null
    r.diagh = diagh
  }

  // startBlock sets the current block we're generating code in
  //
  startBlock(b :Block) {
    const r = this
    assert(r.b == null, "starting block without ending block")
    r.b = b
    // r.vars = new Map<ast.Node,SSAValue>() // map[*Node]*ssa.Value{}
  }

  // endBlock marks the end of generating code for the current block.
  // Returns the (former) current block. Returns null if there is no current
  // block, i.e. if no code flows to the current execution point.
  //
  endBlock() :Block {
    const r = this
    let b = r.b
    assert(b != null, "no current block")
    // for len(r.defvars) <= int(b.ID) {
    //   r.defvars = append(r.defvars, nil)
    // }
    // r.defvars[b.ID] = r.vars
    ;(r as any).b = null
    // r.vars = null
    return b
  }

  startFun(f :Fun) {
    const r = this
    assert(r.f == null, "starting function with existing function")
    r.f = f
  }

  endFun() {
    const r = this
    assert(r.f, "ending function without a current function")
    ;(r as any).f = null
  }

  // ------------------------------------------------------------
  // primary interface to builder

  addTopLevel(sfile :SrcFile, d :ast.Decl|ast.FunExpr) {
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
      r.addVarDecl(d)
    } else if (d instanceof ast.FunExpr) {
      if (d.isInit) {
        // Sanity checks (parser has already checked these things)
        assert(d.sig.params.length == 0, 'init fun with parameters')
        assert(d.sig.result === ast.u_t_nil, 'init fun with result')
        assert(d.body, 'missing body')
        r.addInitCode(d.body as ast.Expr)
      } else {
        r.addFun(d)
      }
    } else if (d instanceof ast.ImportDecl) {
      dlog(`TODO ImportDecl`)
    } else if (d instanceof ast.TypeDecl) {
      dlog(`TODO TypeDecl`)
    }
  }

  addVarDecl(v :ast.VarDecl) {
    dlog(`TODO`)
  }

  addInitCode(body :ast.Expr) {
    // const r = this
    // const f = r.pkg.init || (r.pkg.init = new Fun([], ast.u_t_nil, 'init'))
    // r.block(f, null, body, 'init')
    // console.log(`\n-----------------------\n${f}`)
  }

  addFun(x :ast.FunExpr) {
    const r = this
    assert(x.body, `unresolved function ${x}`)
    assert(x.type, "unresolved function type")
    
    // map parameters to Ids
    let params :Id[] = x.sig.params.map(field => {
      assert(field.type.type, "unresolved type")
      return new Id(
        field.type.type as ast.Type,
        field.name ? field.name.value : byteStr__,
      )
    })

    let funtype = x.type as ast.FunType

    let f = new Fun(
      params,
      funtype.result,
      x.name ? x.name.value : byteStr_anonfun,
    )

    r.startFun(f)
    r.startBlock(f.blocks[0])
    r.block(x.body as ast.Expr)
    assert((r as any).b == null, "function exit block not ended")
    r.endFun()

    r.pkg.funs.push(f)
    console.log(`\n-----------------------\n`)
    irrepr(f)
  }


  block(x :ast.Expr) {
    const r = this
    if (x instanceof ast.Block) {
      let end = x.list.length
      let lasti = end - 1
      for (let i = 0; i != end; ++i) {
        if (!r.b) {
          // block ended early (i.e. from "return")
          r.diag('warn', `unreachable code`, x.list[i].pos)
          break
        }
        r.stmt(x.list[i], i == lasti)
      }
    } else {
      r.stmt(x as ast.Expr, /*isLast=*/true)
    }
  }


  // stmt adds one or more TAC to block b in function f from statement s
  //
  stmt(s :ast.Stmt, isLast :bool = false) {
    const r = this
    // dlog(`>> ${s.constructor.name}`)

    if (s instanceof ast.Operation) {
      if (s.y) {
        // binary operation
        if (!isLast) {
          // binary operation is useless without destination -- skip
          r.diag('warn', `unused operation`, s.x.pos)
        }
      } else {
        // unary operation
        let x = r.expr(s.x)
        assert(x instanceof Id, `unary op on non-var ${x}`)
        let v = x as Id
        r.b.addTAC(v, s.op, x, null)
      }

    } else if (s instanceof ast.IfExpr) {
      r.if_(s)

    } else if (s instanceof ast.ReturnExpr) {
      r.ret(r.expr(s.result))

    } else if (s instanceof ast.Ident) {
      if (!isLast) {
        r.diag('warn', `unused expression`, s.pos)
      }
      r.expr(s)

    } else if (s instanceof ast.Expr) {
      r.expr(s)

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

    // end "if" block
    let ifb = r.endBlock()
    ifb.kind = BlockKind.If
    ifb.control = control

    // create blocks for then and else branches
    let thenb = r.f.newBlock(BlockKind.Plain)
    let elseb = r.f.newBlock(BlockKind.Plain)
    ifb.succs = [thenb, elseb] // if -> then, else

    // create "then" block
    thenb.preds = [ifb] // then <- if
    r.startBlock(thenb)
    r.block(s.then)
    thenb = r.endBlock()

    if (s.els_) {
      // if cond then A else B end

      // allocate "cont" block
      let contb = r.f.newBlock(BlockKind.Plain)

      // create "else" block
      elseb.preds = [ifb] // else <- if
      r.startBlock(elseb)
      r.block(s.els_)
      elseb = r.endBlock()
      elseb.succs = [contb]

      thenb.succs = [contb] // then -> cont
      contb.preds = [thenb, elseb] // cont <- then, else
      r.startBlock(contb)
    } else {
      // if cond then A end
      thenb.succs = [elseb] // then -> else
      elseb.preds = [ifb, thenb] // else <- if, then
      elseb.succs = null
      r.startBlock(elseb)
    }
  }


  assignment(s :ast.Assignment) :Id {
    const r = this

    if (s.op == token.INC || s.op == token.DEC) {
      // e.g. "x++"  =>  "x = x + 1"
      assert(s.lhs.length == 1)
      assert(s.rhs.length == 0)
      let lhs = s.lhs[0]

      // get constant "1" of the same type as lhs
      assert(lhs.type instanceof ast.BasicType, `${lhs.type} is not BasicType`)
      let one = constOne.get(lhs.type as ast.BasicType) as Const
      assert(one)

      // unroll operand
      let x = r.expr(lhs)
      assert(x instanceof Id) // TODO: handle field and index

      // generate "x = x op 1"
      let op = s.op == token.INC ? token.ADD : token.SUB
      r.b.addTAC(x as Id, op, x, one)

      return x as Id
    }

    if (s.op > token.assignop_beg && s.op < token.assignop_end) {
      // "x += 4", "x *= 2", etc  =>  "x = x + 4", "x = x * 2", etc.
      assert(s.lhs.length == 1)
      assert(s.rhs.length == 1)

      let x = r.expr(s.lhs[0])
      assert(x instanceof Id) // TODO: handle field and index

      // convert op= to op; e.g. "+=" => "+"
      let op :token
      switch (s.op) {
        case token.ADD_ASSIGN: op = token.ADD; break  // +
        case token.SUB_ASSIGN: op = token.SUB; break  // -
        case token.MUL_ASSIGN: op = token.MUL; break  // *
        case token.QUO_ASSIGN: op = token.QUO; break  // /
        case token.REM_ASSIGN: op = token.REM; break  // %
        case token.AND_ASSIGN: op = token.AND; break  // &
        case token.OR_ASSIGN:  op = token.OR;  break  // |
        case token.XOR_ASSIGN: op = token.XOR; break  // ^
        case token.SHL_ASSIGN: op = token.SHL; break  // <<
        case token.SHR_ASSIGN: op = token.SHR; break  // >>
        case token.AND_NOT_ASSIGN: op = token.AND_NOT; break // &^
        default:
          op = token.ILLEGAL
          assert(false, "unexpected token")
          break
      }

      let y = r.expr(s.rhs[0])
      r.b.addTAC(x as Id, op, x, y)

      return x as Id
    }

    // if we get here, we're dealing with a regular assignment, e.g. "x = y"

    // break up "x, y = a, b" assignments into simple "x = a", "y = b"
    //
    let z = s.lhs.length
    let preloadRhs :(Id|undefined)[]|null = null  // "holey" array

    if (z > 1) {
      // potentially rewrite RHS with preloads and temps when an identifier
      // appears on both the left and right side.
      //
      // e.g. "x, y, z = y, x, 2" causes x and y to be preloaded into
      // temporaries:
      //   t0 = x
      //   t1 = y
      //   x = t1
      //   y = t0
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
            // appears on the left
            if (!preloadRhs) {
              preloadRhs = new Array<Id|undefined>(s.rhs.length)
            }
            let dst = r.temp(x.type as ast.Type)
            let val = r.expr(x)
            r.b.addTAC(dst, token.ASSIGN, val, null)
            preloadRhs[i] = dst
          }
        }
      }
    }

    let sym :Id|null = null

    for (let i = 0; i < z; i++) {
      let dst = r.expr(s.lhs[i]) as Id
      assert(dst instanceof Id) // TODO support field and index

      let x :Value
      let y :Value|null = null
      let op :token = token.ASSIGN
      let k :Id|undefined

      if (preloadRhs && (k = preloadRhs[i])) {
        x = k
      } else {
        let rhs = s.rhs[i]
        if (
          rhs instanceof ast.Operation &&
          rhs.op != token.OROR &&
          rhs.op != token.ANDAND
          // TODO: check for other operations that need intermediates
        ) {
          // basic operation
          op = rhs.op
          x = r.expr(rhs.x)
          y = rhs.y ? r.expr(rhs.y) : null
        } else {
          // higher-level operation
          // unroll
          x = r.expr(rhs)
        }
      }

      r.b.addTAC(dst as Id, op, x, y)
      sym = dst
    }

    return sym as Id
  }


  expr(s :ast.Expr) :Value {
    const r = this
    // dlog(`>> ${s.constructor.name}`)

    assert(s.type, `type not resolved for ${s}`)
      // [?] may legitimately need to resolve

    if (s instanceof ast.BasicLit) {
      if (s.op != token.ILLEGAL) {
        dlog(`TODO handle BasicLit.op`)
      }
      return new Const(s.type as ast.BasicType, s.value)

    }

    if (s instanceof ast.Ident) {
      return new Id(s.type as ast.Type, s.value)
    }

    if (s instanceof ast.Assignment) {
      return r.assignment(s)
    }

    if (s instanceof ast.Operation) {
      // "x op y" => "tmp = x op y" -> tmp
      let x = r.expr(s.x)
      let t0 = r.temp(s.type as ast.Type)

      if (s.op == token.OROR || s.op == token.ANDAND) {
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
        // However, for now, since it's a possibly small-RoI optimization
        // opportunity, we're ignoring this.
        // -------------------------------------------------------------------
        //
        assert(s.y != null)

        let right = r.f.newBlock(BlockKind.Plain)  // y
        let result = r.f.newBlock(BlockKind.Plain) // t

        r.b.addTAC(t0, token.ASSIGN, x, null)

        // end entry "if" block
        let ifb = r.endBlock()
        ifb.kind = BlockKind.If
        ifb.control = t0

        if (s.op == token.OROR) {
          // flip branches; equivalent to "ifFalse"/"ifz"
          ifb.succs = [result, right] // if -> result, right
        } else {
          ifb.succs = [right, result] // if -> right, result
        }

        // gen "right" block
        right.preds = [ifb] // right <- if
        r.startBlock(right)
        let y = r.expr(s.y as ast.Expr)
        right.addTAC(t0, token.ASSIGN, y, null)
        right = r.endBlock()
        right.succs = [result] // right -> result

        // start continuation block
        result.preds = [ifb, right] // result <- ifb, right
        r.startBlock(result)

      } else {
        // Basic operation
        let y = s.y ? r.expr(s.y) : null
        r.b.addTAC(t0, s.op, x, y)
      }

      // return sym that identifies the value of the expression
      return t0
    }

    dlog(`TODO: handle ${s.constructor.name}`)
    // unroll to temporary storage
    // let t = r.temp(s.type as ast.Type)
    // r.tac(f, b, s, t)
    // return t
    return r.temp(s.type as ast.Type)
  }


  // generate temporary id
  temp(t :ast.Type) :Id {
    return new Id(t, asciiByteStr('%' + this._tempid++))
  }
  private _tempid = 0


  // store(f :Fun, b :Block, s :ast.Stmt, id :ast.Ident) {
  // }

  // ------------------------------------------------------------
  // SSA support functions

  /*writeVariable(variable, block, value) {
    const b = this
    currentDef[variable][block] = value
  }
  
  readVariable(variable, block) {
    const b = this
    if (currentDef[variable] contains block) {
      // local value numbering
      return currentDef[variable][block]
    }
    // global value numbering
    return b.readVariableRecursive(variable, block)
  }

  readVariableRecursive(variable, block) {
    const b = this
    if (block not in sealedBlocks) {
      // Incomplete CFG
      val = new Phi(block)
      incompletePhis[block][variable] = val
    } else if (|block.preds| == 1) {
      // Optimize the common case of one predecessor: No phi needed
      val = b.readVariable(variable, block.preds[0])
    } else {
      // Break potential cycles with operandless phi
      val = new Phi(block)
      b.writeVariable(variable, block, val)
      val = b.addPhiOperands(variable, val)
    }
    b.writeVariable(variable, block, val)
    return val
  }

  addPhiOperands(variable, phi) {
    const b = this
    // Determine operands from predecessors
    for (let pred of phi.block.preds) {
      phi.appendOperand(b.readVariable(variable, pred))
      return b.tryRemoveTrivialPhi(phi)
    }
  }

  tryRemoveTrivialPhi(phi) {
    const b = this
    let same = null
    for (let op of phi.operands) {
      if (op == same || op == phi) {
        continue // Unique value or self−reference
      }
      if (same != null) {
        return phi // The phi merges at least two values: not trivial
      }
      same = op
    }
    if (same == null) {
      same = new Undef() // The phi is unreachable or in the start block
    }
    users = phi.users.remove(phi) // Remember all users except the phi itself
    phi.replaceBy(same) // Reroute all uses of phi to same and remove phi
    // Try to recursively remove all phi users, which might have become trivial
    for (let use of users) {
      if (use is-a Phi) {
        b.tryRemoveTrivialPhi(use)
      }
    }
    return same
  }*/


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