import { ByteStr, asciiByteStr } from '../bytestr'
import { Num } from '../num'
import { debuglog as dlog } from '../util'
import { Op, ops } from './op'
import {
  BasicType,
  NumType,
  FunType,

  t_bool,
  t_u8,
  t_i8,
  t_u16,
  t_i16,
  t_u32,
  t_i32,
  t_u64,
  t_i64,
  t_f32,
  t_f64,
} from '../types'


const byteStr_main = asciiByteStr("main")
const byteStr_anonfun = asciiByteStr("anonfun")


// Aux is an auxiliary value of Value
//
export type Aux = ByteStr | Uint8Array | Num


// Value is a three-address-code operation
//
export class Value {
  id      :int   // unique identifier
  op      :Op    // operation that computes this value
  type    :BasicType
  b       :Block // containing block
  aux     :Aux|null // auxiliary info for this value. Type depends on op & type
  args    :Value[]|null = null // arguments of this value
  comment :string = '' // human readable short comment for IR formatting
  prevv   :Value|null = null // previous value (list link)
  nextv   :Value|null = null // next value (list link)

  uses  :int = 0  // use count. Each appearance in args or b.control counts once
  users :Value[] = []

  constructor(id :int, op :Op, type :BasicType, b :Block, aux :Aux|null) {
    this.id = id
    this.op = op
    this.type = type
    this.b = b
    this.aux = aux
    assert(type instanceof BasicType)
    assert(type.mem > 0, `ir.Value assigned abstract type ${type}`)
  }

  toString() {
    return 'v' + this.id
  }

  appendArg(v :Value) {
    // Note: Only used for Phi values. Assertion here to make sure we are
    // intenational about use.
    assert(this.op === ops.Phi, "appendArg on non-phi value")
    assert(v !== this, `using self as arg to self`)
    if (!this.args) {
      this.args = [v]
    } else {
      this.args.push(v)
    }
    v.uses++
    v.users.push(this)
  }

  // replaceBy replaces all uses of this value with v
  //
  replaceBy(v :Value) {
    assert(v !== this, 'trying to replace V with V')

    for (let user of this.users) {
      assert(user !== v,
        `TODO user==v (v=${v} this=${this}) -- CYCLIC USE!`)

      if (user.args) for (let i = 0; i < user.args.length; i++) {
        if (user.args[i] === this) {
          dlog(`replace ${this} in user ${user} with ${v}`)
          user.args[i] = v
          v.users.push(user)
          v.uses++
          this.uses--
        }
      }
    }

    // Remove self.
    // Note that we don't decrement this.uses since the definition
    // site doesn't count toward "uses".
    this.b.removeValue(this)

    // Note: "uses" does not count for the value's ref to its block, so
    // we don't decrement this.uses here.
    if (DEBUG) { ;(this as any).b = null }
  }

  // remove removes this value from its block
  // returns its previous sibling, if any
  //
  remove() :Value|null {
    return this.b.removeValue(this)
  }
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

// Block represents a basic block
//
export class Block {
  id       :int
  kind     :BlockKind = BlockKind.Invalid // The kind of block
  parent   :Block|null = null    // Logical parent
  next     :Block|null = null    // Logical successor (code generation order)
  succs    :Block[]|null = null  // Successor/subsequent blocks (CFG)
  preds    :Block[]|null = null  // Predecessors (CFG)
  control  :Value|null = null
    // A value that determines how the block is exited. Its value depends
    // on the kind of the block. For instance, a BlockKind.If has a boolean
    // control value and BlockKind.Exit has a memory control value.

  f        :Fun // containing function

  // three-address code values
  vhead    :Value|null = null  // first value (linked list)
  vtail    :Value|null = null  // last value (linked list)

  sealed   :bool = false
    // true if no further predecessors will be added
  comment  :string = '' // human readable short comment for IR formatting

  constructor(kind :BlockKind, id :int, f :Fun) {
    this.kind = kind
    this.id = id
    this.f = f
  }

  // pushValue adds v to the end of the block
  //
  pushValue(v :Value) {
    if (this.vtail) {
      this.vtail.nextv = v
      v.prevv = this.vtail
    } else {
      this.vhead = v
    }
    this.vtail = v
  }

  // pushValueFront adds v to the top of the block
  //
  pushValueFront(v :Value) {
    if (this.vhead) {
      this.vhead.prevv = v
      v.nextv = this.vhead
    } else {
      this.vtail = v
    }
    this.vhead = v
  }

  // removeValue removes v from this block.
  // returns the previous sibling, if any.
  //
  removeValue(v :Value) :Value|null {
    dlog(`${this} ${v}`)
    
    let prevv = v.prevv
    let nextv = v.nextv
    if (prevv) {
      prevv.nextv = nextv
    } else {
      this.vhead = nextv
    }
    if (nextv) {
      nextv.prevv = prevv
    } else {
      this.vtail = prevv
    }

    if (DEBUG) {
      v.prevv = null
      v.nextv = null
    }

    return prevv
  }

  // insertValueBefore inserts newval before refval.
  // Returns newvval
  //
  insertValueBefore(refval :Value, newval :Value) :Value {
    assert(refval.b === this)
    assert(newval.b === this)
    newval.prevv = refval.prevv
    newval.nextv = refval
    refval.prevv = newval
    if (newval.prevv) {
      newval.prevv.nextv = newval
    } else {
      this.vhead = newval
    }
    return newval
  }

  newPhi(t :BasicType) :Value {
    let v = this.f.newValue(ops.Phi, t, this, null)
    this.pushValue(v)
    return v
  }

  // newValue0 return a value with no args
  newValue0(op :Op, t :BasicType, aux :Aux|null = null) :Value {
    let v = this.f.newValue(op, t, this, aux)
    this.pushValue(v)
    return v
  }

  // newValue1 returns a new value in the block with one argument
  newValue1(op :Op, t :BasicType, arg0 :Value, aux :Aux|null = null) :Value {
    let v = this.f.newValue(op, t, this, aux)
    v.args = [arg0]
    arg0.uses++ ; arg0.users.push(v)
    this.pushValue(v)
    return v
  }

  // newValue2 returns a new value in the block with two arguments and zero
  // aux values.
  newValue2(
    op :Op,
    t :BasicType,
    arg0 :Value,
    arg1 :Value,
    aux :Aux|null = null,
  ) :Value {
    let v = this.f.newValue(op, t, this, aux)
    v.args = [arg0, arg1]
    arg0.uses++ ; arg0.users.push(v)
    arg1.uses++ ; arg1.users.push(v)
    this.pushValue(v)
    return v
  }

  toString() :string {
    return 'b' + this.id
  }
}


export class Fun {
  entryb :Block    // entry block
  tailb  :Block    // exit block (current block during construction)
  type   :FunType
  name   :ByteStr
  nargs  :int      // number of arguments

  bid    :int = 0  // block ID allocator
  vid    :int = 0  // value ID allocator

  consts_ :Map<Num,Value[]>|null = null
    // constants cache, keyed by constant value; users must check value's
    // Op and Type

  consts :Map<Op,Map<Num,Value>> | null = null
  // [
  //   [ops.ConstBool, ]
  // ]

  constructor(type :FunType, name :ByteStr|null, nargs :int) {
    this.entryb = new Block(BlockKind.Plain, 0, this)
    this.tailb = this.entryb
    this.type = type
    this.name = name || byteStr_anonfun
    this.nargs = nargs
  }

  newBlock(k :BlockKind) :Block {
    assert(this.bid < 0xFFFFFFFF, "too many block IDs generated")
    let b = new Block(k, ++this.bid, this)
    this.tailb.next = b
    b.parent = this.tailb
    this.tailb = b
    return b
  }

  newValue(op :Op, t :BasicType, b :Block, aux :Aux|null) :Value {
    assert(this.vid < 0xFFFFFFFF, "too many value IDs generated")
    // TODO we could use a free list and return values when they die
    return new Value(++this.vid, op, op.type || t, b, aux)
  }


  // constVal returns a constant Value representing c for type t
  //
  constVal(t :NumType, c :Num) :Value {
    let f = this

    // Select operation based on type
    let op :Op = ops.Invalid
    switch (t) {
      case t_bool:            op = ops.ConstBool; break
      case t_u8:  case t_i8:  op = ops.ConstI8; break
      case t_u16: case t_i16: op = ops.ConstI16; break
      case t_u32: case t_i32: op = ops.ConstI32; break
      case t_u64: case t_i64: op = ops.ConstI64; break
      case t_f32:             op = ops.ConstF32; break
      case t_f64:             op = ops.ConstF64; break
      default:
        assert(false, `invalid constant type ${t}`)
        break
    }

    let vv :Value[]|undefined

    if (!f.consts) {
      f.consts = new Map<Op,Map<Num,Value>>()
    }

    let nvmap = f.consts.get(op)
    if (!nvmap) {
      nvmap = new Map<Num,Value>()
    }

    let v = nvmap.get(c)
    if (!v) {
      // create new const value in function's entry block
      v = f.entryb.newValue0(op, t, c)
      nvmap.set(c, v) // put into cache
    }

    return v as Value
  }


  toString() {
    return this.name.toString()
  }
}


// Pkg represents a package with functions and data
//
export class Pkg {
  // data :Uint8Array   // data  TODO wrap into some simple linear allocator
  funs = new Map<ByteStr,Fun>()   // functions mapped by name
  init :Fun|null = null // init functions (merged into one)

  // mainFun returns the main function of the package, if any
  //
  mainFun() :Fun|null {
    for (let fn of this.funs.values()) {
      if (byteStr_main.equals(fn.name)) {
        return fn
      }
    }
    return null
  }
}
