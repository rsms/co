import { ByteStr, asciiByteStr } from './bytestr'
import { Pos, SrcFile } from './pos'
import { token } from './token'
import { DiagKind, DiagHandler } from './diag'
import * as ast from './ast'
import { t_nil, t_bool } from './types'
import * as types from './types'
import { FunType, BasicType, NumType, IntType, MemType } from './ast'
import { optdce } from './ir-opt-dce'
import { optcf_op1, optcf_op2 } from './ir-opt-cf'
import { debuglog as dlog } from './util'
import { Num } from './num'
import { op } from './ir-op'

// const dlog = function(..._ :any[]){} // silence dlog

const byteStr_main = asciiByteStr("main")
const byteStr_anonfun = asciiByteStr('anonfun')

// operators
export enum Op {
  // special
  None = 0, // nothing (invalid)
  // FwdRef,   // forward reference (SSA)
  Copy,
  Phi,
  Arg,         // function parameter argument (inside callee)
  CallArg,     // push a parameter for a function call
  Call,        // call a function
  TailCall,    // call a function as tail

  // constants
  const_begin,
  i32Const, // load an integer as i32
  i64Const, // load an integer as i64
  f32Const, // load a number as f32
  f64Const, // load a number as f64
  const_end,

  // register access
  RegLoad,   // load memory location into register
  RegStore,  // store register value into memory

  // stack
  SP, // stack pointer
    // The SP pseudo-register is a virtual stack pointer used to refer
    // to frame-local variables and the arguments being prepared for
    // function calls. It points to the top of the local stack frame,
    // so references should use negative offsets in the range
    // [−framesize, 0): x-8(SP), y-4(SP), and so on.
  SB, // static base pointer
    // SB is a pseudo-register that holds the "static-base" pointer,
    // i.e. the address of the beginning of the program address space.

  // memory load
  i32Load,     // load 4 bytes as i32
  i32load8_s,  // load 1 byte and sign-extend i8 to i32
  i32load8_u,  // load 1 byte and zero-extend i8 to i32
  i32load16_s, // load 2 bytes and sign-extend i16 to i32
  i32load16_u, // load 2 bytes and zero-extend i16 to i32
  i64Load,     // load 8 bytes as i64
  i64load8_s,  // load 1 byte and sign-extend i8 to i64
  i64load8_u,  // load 1 byte and zero-extend i8 to i64
  i64load16_s, // load 2 bytes and sign-extend i16 to i64
  i64load16_u, // load 2 bytes and zero-extend i16 to i64
  i64load32_s, // load 4 bytes and sign-extend i32 to i64
  i64load32_u, // load 4 bytes and zero-extend i32 to i64
  f32Load,     // load 4 bytes as f32
  f64Load,     // load 8 bytes as f64

  // memory store
  i32Store,    // store 4 bytes (no conversion)
  i32Store8,   // wrap i32 to i8 and store 1 byte
  i32Store16,  // wrap i32 to i16 and store 2 bytes
  i64Store,    // store 8 bytes (no conversion)
  i64Store8,   // wrap i64 to i8 and store 1 byte
  i64Store16,  // wrap i64 to i16 and store 2 bytes
  i64Store32,  // wrap i64 to i32 and store 4 bytes
  f32Store,    // store 4 bytes (no conversion)
  f64Store,    // store 8 bytes (no conversion)

  // integer operators (i=size type, i32=i32 type, etc)
  i32Add,    // +  sign-agnostic addition
  i32Sub,    // -  sign-agnostic subtraction
  i32Mul,    // *  sign-agnostic multiplication (lower 32-bits)
  i32Div_s,  // /  signed division (result is truncated toward zero)
  i32Div_u,  // /  unsigned division (result is floored)
  i32Rem_s,  // %  signed remainder (result has the sign of the dividend)
  i32Rem_u,  // %  unsigned remainder
  i32Neg,   // -N negation
  i32And,    // &  sign-agnostic bitwise and
  i32Or,     // |  sign-agnostic bitwise inclusive or
  i32Xor,    // ^  sign-agnostic bitwise exclusive or
  i32Shl,    // << sign-agnostic shift left
  i32Shr_u,  // >>> zero-replicating (logical) shift right
  i32Shr_s,  // >> sign-replicating (arithmetic) shift right
  i32Rotl,   //    sign-agnostic rotate left
  i32Rotr,   //    sign-agnostic rotate right
  i32Eq,     // == sign-agnostic compare equal
  i32Ne,     // != sign-agnostic compare unequal
  i32Lt_s,   // <  signed less than
  i32Lt_u,   // <  unsigned less than
  i32Le_s,   // <= signed less than or equal
  i32Le_u,   // <= unsigned less than or equal
  i32Gt_s,   // >  signed greater than
  i32Gt_u,   // >  unsigned greater than
  i32Ge_s,   // >= signed greater than or equal
  i32Ge_u,   // >= unsigned greater than or equal
  i32Clz,    //    sign-agnostic count leading zero bits
             //    (All zero bits are considered leading if the value is zero)
  i32Ctz,    //    sign-agnostic count trailing zero bits
             //    (All zero bits are considered trailing if the value is zero)
  i32Popcnt, //    sign-agnostic count number of one bits
  i32Eqz,    // == compare equal to zero

  // same operations listed above are defined for 64-bit integers
  i64Add, i64Sub, i64Mul, i64Div_s, i64Div_u, i64Rem_s, i64Rem_u, i64Neg,
  i64And, i64Or, i64Xor, i64Shl, i64Shr_u, i64Shr_s, i64Rotl, i64Rotr,
  i64Eq, i64Ne, i64Lt_s, i64Lt_u, i64Le_s, i64Le_u, i64Gt_s, i64Gt_u,
  i64Ge_s, i64Ge_u, i64Clz, i64Ctz, i64Popcnt, i64Eqz,

  // floating-point operators
  f32Add,   // +  addition
  f32Sub,   // -  subtraction
  f32Mul,   // *  multiplication
  f32Div,   // /  division
  f32Abs,   //    absolute value
  f32Neg,   // -N negation
  f32Cps,   //    copysign
  f32Ceil,  //    ceiling operator
  f32Floor, //    floor operator
  f32Trunc, //    round to nearest integer towards zero
  f32Near,  //    round to nearest integer, ties to even
  f32Eq,    // == compare ordered and equal
  f32Ne,    // != compare unordered or unequal
  f32Lt,    // <  compare ordered and less than
  f32Le,    // <= compare ordered and less than or equal
  f32Gt,    // >  compare ordered and greater than
  f32Ge,    // >= compare ordered and greater than or equal
  f32Sqrt,  //    square root
  f32Min,   //    minimum (binary operator); if either operand is NaN, ret NaN
  f32Max,   //    maximum (binary operator); if either operand is NaN, ret NaN

  // same operations listed above are defined for 64-bit floats
  f64Add, f64Sub, f64Mul, f64Div, f64Abs, f64Neg, f64Cps, f64Ceil, f64Floor,
  f64Trunc, f64Near, f64Eq, f64Ne, f64Lt, f64Le, f64Gt, f64Ge, f64Sqrt, f64Min,
  f64Max,

  // conversion
  i32Wrap_i64,      // wrap a 64-bit int to a 32-bit int
  i32Trunc_s_f32,   // truncate a 32-bit float to a signed 32-bit int
  i32Trunc_s_f64,   // truncate a 64-bit float to a signed 32-bit int
  i32Trunc_u_f32,   // truncate a 32-bit float to an unsigned 32-bit int
  i32Trunc_u_f64,   // truncate a 64-bit float to an unsigned 32-bit int
  i32Rein_f32,      // reinterpret the bits of a 32-bit float as a 32-bit int
  
  i64Extend_s_i32,  // extend a signed 32-bit int to a 64-bit int
  i64Extend_u_i32,  // extend an unsigned 32-bit int to a 64-bit int
  i64Trunc_s_f32,   // truncate a 32-bit float to a signed 64-bit int
  i64Trunc_s_f64,   // truncate a 64-bit float to a signed 64-bit int
  i64Trunc_u_f32,   // truncate a 32-bit float to an unsigned 64-bit int
  i64Trunc_u_f64,   // truncate a 64-bit float to an unsigned 64-bit int
  i64Rein_f64,      // reinterpret the bits of a 64-bit float as a 64-bit int
  
  f32Demote_f64,    // demote a 64-bit float to a 32-bit float
  f32Convert_s_i32, // convert a signed 32-bit int to a 32-bit float
  f32Convert_s_i64, // convert a signed 64-bit int to a 32-bit float
  f32Convert_u_i32, // convert an unsigned 32-bit int to a 32-bit float
  f32Convert_u_i64, // convert an unsigned 64-bit int to a 32-bit float
  f32Rein_i32,      // reinterpret the bits of a 32-bit int as a 32-bit float
  
  f64Promote_f32,   // promote a 32-bit float to a 64-bit float
  f64Convert_s_i32, // convert a signed 32-bit int to a 64-bit float
  f64Convert_s_i64, // convert a signed 64-bit int to a 64-bit float
  f64Convert_u_i32, // convert an unsigned 32-bit int to a 64-bit float
  f64Convert_u_i64, // convert an unsigned 64-bit int to a 64-bit float
  f64Rein_i64,      // reinterpret the bits of a 64-bit int as a 64-bit float

  // misc
  Trap,             // aka "unreachable". Trap/crash
}

// const tokenToOp = new Map<token,Op>([
//   // [token.LSS, ], // <
// ])

// getop returns the IR operator for the corresponding token operator and type
//
function getop(tok :token, t :BasicType) :Op {
  switch (tok) {
  case token.EQL: switch (t.memtype) { // ==
    //case MemType.Size: return Op.iEq
    case MemType.i32:  return Op.i32Eq
    case MemType.i64:  return Op.i64Eq
    case MemType.f32:  return Op.f32Eq
    case MemType.f64:  return Op.f64Eq
  }; break
  case token.NEQ: switch (t.memtype) { // !=
    //case MemType.Size: return Op.iNe
    case MemType.i32:  return Op.i32Ne
    case MemType.i64:  return Op.i64Ne
    case MemType.f32:  return Op.f32Ne
    case MemType.f64:  return Op.f64Ne
  }; break
  case token.LSS: switch (t.memtype) { // <
    //case MemType.Size: return (t as IntType).signed ? Op.iLt_s : Op.iLt_u
    case MemType.i32:  return (t as IntType).signed ? Op.i32Lt_s : Op.i32Lt_u
    case MemType.i64:  return (t as IntType).signed ? Op.i64Lt_s : Op.i64Lt_u
    case MemType.f32:  return Op.f32Lt
    case MemType.f64:  return Op.f64Lt
  }; break
  case token.LEQ: switch (t.memtype) { // <=
    //case MemType.Size: return (t as IntType).signed ? Op.iLe_s : Op.iLe_u
    case MemType.i32:  return (t as IntType).signed ? Op.i32Le_s : Op.i32Le_u
    case MemType.i64:  return (t as IntType).signed ? Op.i64Le_s : Op.i64Le_u
    case MemType.f32:  return Op.f32Le
    case MemType.f64:  return Op.f64Le
  }; break
  case token.GTR: switch (t.memtype) { // >
    //case MemType.Size: return (t as IntType).signed ? Op.iGt_s : Op.iGt_u
    case MemType.i32:  return (t as IntType).signed ? Op.i32Gt_s : Op.i32Gt_u
    case MemType.i64:  return (t as IntType).signed ? Op.i64Gt_s : Op.i64Gt_u
    case MemType.f32:  return Op.f32Gt
    case MemType.f64:  return Op.f64Gt
  }; break
  case token.GEQ: switch (t.memtype) { // >=
    //case MemType.Size: return (t as IntType).signed ? Op.iGe_s : Op.iGe_u
    case MemType.i32:  return (t as IntType).signed ? Op.i32Ge_s : Op.i32Ge_u
    case MemType.i64:  return (t as IntType).signed ? Op.i64Ge_s : Op.i64Ge_u
    case MemType.f32:  return Op.f32Ge
    case MemType.f64:  return Op.f64Ge
  }; break
  case token.ADD: switch (t.memtype) { // +
    //case MemType.Size: return Op.iAdd
    case MemType.i32:  return Op.i32Add
    case MemType.i64:  return Op.i64Add
    case MemType.f32:  return Op.f32Add
    case MemType.f64:  return Op.f64Add
  }; break
  case token.SUB: switch (t.memtype) { // -
    //case MemType.Size: return Op.iSub
    case MemType.i32:  return Op.i32Sub
    case MemType.i64:  return Op.i64Sub
    case MemType.f32:  return Op.f32Sub
    case MemType.f64:  return Op.f64Sub
  }; break
  case token.MUL: switch (t.memtype) { // *
    //case MemType.Size: return Op.iMul
    case MemType.i32:  return Op.i32Mul
    case MemType.i64:  return Op.i64Mul
    case MemType.f32:  return Op.f32Mul
    case MemType.f64:  return Op.f64Mul
  }; break
  case token.QUO: switch (t.memtype) { // /
    //case MemType.Size: return (t as IntType).signed ? Op.iDiv_s : Op.iDiv_u
    case MemType.i32:  return (t as IntType).signed ? Op.i32Div_s : Op.i32Div_u
    case MemType.i64:  return (t as IntType).signed ? Op.i64Div_s : Op.i64Div_u
    case MemType.f32:  return Op.f32Div
    case MemType.f64:  return Op.f64Div
  }; break
  // The remaining operators are only available for integers
  case token.REM: switch (t.memtype) { // %
    //case MemType.Size: return (t as IntType).signed ? Op.iRem_s : Op.iRem_u
    case MemType.i32:  return (t as IntType).signed ? Op.i32Rem_s : Op.i32Rem_u
    case MemType.i64:  return (t as IntType).signed ? Op.i64Rem_s : Op.i64Rem_u
  }; break
  case token.OR: switch (t.memtype) { // |
    //case MemType.Size: return Op.iOr
    case MemType.i32:  return Op.i32Or
    case MemType.i64:  return Op.i64Or
  }; break
  case token.XOR: switch (t.memtype) { // ^
    //case MemType.Size: return Op.iXor
    case MemType.i32:  return Op.i32Xor
    case MemType.i64:  return Op.i64Xor
  }; break
  case token.AND: switch (t.memtype) { // &
    //case MemType.Size: return Op.iAnd
    case MemType.i32:  return Op.i32And
    case MemType.i64:  return Op.i64And
  }; break
  case token.SHL: switch (t.memtype) { // <<
    //case MemType.Size: return Op.iShl
    case MemType.i32:  return Op.i32Shl
    case MemType.i64:  return Op.i64Shl
  }; break
  case token.SHR: switch (t.memtype) { // >>
    //case MemType.Size: return (t as IntType).signed ? Op.iShr_s : Op.iShr_u
    case MemType.i32:  return (t as IntType).signed ? Op.i32Shr_s : Op.i32Shr_u
    case MemType.i64:  return (t as IntType).signed ? Op.i64Shr_s : Op.i64Shr_u
  }; break
  case token.AND_NOT: // &^  TODO implement (need to generalize/unroll)
    assert(false, 'AND_NOT "&^" not yet supported')
    return Op.None
  default:
    // unknown operator token
    assert(false, `unexpected operator token ${token[tok]}`)
    return Op.None
  }

  assert(t.memtype !== MemType.None, 'operand with MemType.None')

  // fallthrough from unhandled (but known) operator token
  assert(false, `invalid operation ${tok} ${t}`)
  return Op.None
}


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

  uses :int = 0  // use count. Each appearance in args or b.control counts once
  users :Value[] = []

  constructor(id :int, op :Op, type :BasicType, b :Block, aux :Aux|null) {
    this.id = id
    this.op = op
    this.type = type
    this.b = b
    this.aux = aux
    assert(type instanceof BasicType)
    assert(type.size > 0, `ir.Value assigned abstract type ${type}`)
  }

  toString() {
    return 'v' + this.id
  }

  appendArg(v :Value) {
    // Note: Only used for Phi values. Assertion here to make sure we are
    // intenational about use.
    assert(this.op == Op.Phi, "appendArg on non-phi value")
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
    let v = this.f.newValue(Op.Phi, t, this, null)
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
  consts :Map<Num,Value[]>|null = null
    // constants cache, keyed by constant value; users must check value's
    // Op and Type

  constructor(type :FunType, name :ByteStr, nargs :int) {
    this.entryb = new Block(BlockKind.Plain, 0, this)
    this.tailb = this.entryb
    this.type = type
    this.name = name
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
    return new Value(++this.vid, op, t, b, aux)
  }

  // constVal returns a constant value for c
  //
  // Limitation: c must be smaller than Number.MAX_SAFE_INTEGER
  //
  constVal(t :NumType, c :Num) :Value {
    let f = this
    let vv :Value[]|undefined

    // Select operation based on type
    let op :Op = Op.None
    switch (t.memtype) {
      case MemType.i32: op = Op.i32Const; break
      case MemType.i64: op = Op.i64Const; break
      case MemType.f32: op = Op.f32Const; break
      case MemType.f64: op = Op.f64Const; break
    }
    assert(op != Op.None)

    if (!f.consts) {
      f.consts = new Map<Num,Value[]>()
    } else {
      vv = f.consts.get(c)
      if (vv) for (let v of vv) {
        if (v.op == op && v.type.equals(t)) {
          assert(v.aux === c, `cached const ${v} should have aux ${c}`)
          return v
        }
      }
    }

    // create new const value in function's entry block
    let v = f.entryb.newValue0(op, t, c)

    // put into cache
    if (!vv) {
      f.consts.set(c, [v])
    } else {
      vv.push(v)
    }
    return v
  }

  toString() {
    return this.name.toString()
  }
}


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


export interface RegAlloc {
  visitFun(f :Fun) : void
}


export enum IRFlags {
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
  flags    :IRFlags = IRFlags.Default
  typemap  :Map<BasicType,BasicType> // remapped types
  
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
       flags :IRFlags=IRFlags.Default
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
    // populate typemap
    r.typemap = new Map<BasicType,BasicType>([
      [types.t_int, intt_s],
      [types.t_uint, intt_u],
      [types.t_isize, sizet_s],
      [types.t_usize, sizet_u],
    ])
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
    if (b.kind == BlockKind.Ret && b.vtail && b.vtail.op == Op.Call) {
      b.vtail.op = Op.TailCall
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
    if (s.flags & IRFlags.Optimize) {
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

  // normtype normalizes abstract types to concrete types.
  // E.g. normtype(int) -> i32  (if int->i32 exists in typemap)
  //
  normtype(t :BasicType) :BasicType {
    assert(t instanceof BasicType, `${t} is not a BasicType`)
    return this.typemap.get(t) || t
  }

  // nilValue returns a placeholder value.
  // This is meant to be used only during development and should be removed
  // when the IR builder is complete.
  //
  nilValue() :Value {
    assert(this.b, "no current block")
    return this.b.newValue0(Op.None, t_nil)
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
      x.name ? x.name.value : byteStr_anonfun,
      x.sig.params.length
    )
    let entryb = f.entryb

    // initialize locals
    for (let i = 0; i < x.sig.params.length; i++) {
      let p = x.sig.params[i]
      if (p.name && !p.name.value.isUnderscore()) {
        let t = r.normtype(funtype.inputs[i] as BasicType)
        let name = p.name.value
        let v = entryb.newValue0(Op.Arg, t, i)
        if (r.flags & IRFlags.Comments) {
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

    if (s.flags & IRFlags.Comments) {
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

      if (r.flags & IRFlags.Comments) {
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

      if (r.flags & IRFlags.Comments) {
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
    // let v = s.b.newValue1(Op.Copy, right.type, right)
    // if (s.flags & IRFlags.Comments) {
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

      let t = r.normtype(lhs.type as BasicType)
      let x = r.expr(lhs)
      let y = r.f.constVal(t, 1)

      // generate "x = x op 1"
      let op = getop(s.op == token.INC ? token.ADD : token.SUB, t)
      let v = r.b.newValue2(op, t, x, y)
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
      let t = r.normtype(lhs.type as BasicType)
      assert(t instanceof BasicType, "increment operation on complex type")

      let op = getop(s.op, t)
      let x = r.expr(lhs)
      let y = r.expr(s.rhs[0])
      let v = r.b.newValue2(op, t, x, y)
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
    const t = r.normtype(s.type as BasicType)

    if (s instanceof ast.NumLit) {
      return r.f.constVal(t, s.value)
    }

    if (s instanceof ast.Ident) {
      return r.readVariable(s.value, t, null)
    }

    if (s instanceof ast.Assignment) {
      return r.assignment(s)
    }

    if (s instanceof ast.Operation) {
      // "x op y" => "tmp = x op y" -> tmp
      if (s.op == token.OROR || s.op == token.ANDAND) {
        return r.opAndAnd(s)
      } else {
        // Basic operation
        let left = r.expr(s.x)
        let op = getop(s.op, t)
        if (s.y) {
          // Basic binary operation
          let right = r.expr(s.y)

          if (r.flags & IRFlags.Optimize) {
            // attempt to evaluate constant expression
            let v = optcf_op2(r.b, op, left, right)
            if (v) {
              return v
            }
          }

          return r.b.newValue2(op, t, left, right)
        } else {
          // Basic unary operation

          if (r.flags & IRFlags.Optimize) {
            // attempt to evaluate constant expression
            let v = optcf_op1(r.b, op, left)
            if (v) {
              return v
            }
          }

          return r.b.newValue1(op, t, left)
        }
      }
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
    let tmpv = s.b.newValue1(Op.Copy, right.type, right)
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
      s.flags & IRFlags.Comments &&
      x.fun instanceof ast.Ident &&
      x.fun.ent
    ) {
      // include comment with name of parameter, when available
      let fx = x.fun.ent.decl as ast.FunExpr
      let funstr = x.fun.toString() + '/'
      for (let i = 0; i < argvals.length; i++) {
        let v = argvals[i]
        let v2 = s.b.newValue1(Op.CallArg, v.type, v)
        let param = fx.sig.params[i]
        if (param.name) {
          v2.comment = funstr + param.name.toString()
        }
      }
    } else {
      for (let v of argvals) {
        s.b.newValue1(Op.CallArg, v.type, v)
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
    return s.b.newValue0(Op.Call, rt, funid.value)
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
    dlog(`${b || s.b} ${name} = ${Op[v.op]} ${v}`)
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
    assert(phi.op == Op.Phi)
    assert(phi.b.preds, 'phi in block without predecessors')
    // Determine operands from predecessors
    dlog(`${name} phi=${phi}`)
    for (let pred of phi.b.preds as Block[]) {
      dlog(`  ${pred}`)
      let v = s.readVariable(name, phi.type, pred)
      if (v !== phi) {
        dlog(`  ${pred} ${v}<${Op[v.op]}>`)
        phi.appendArg(v)
      }
    }
    return s.tryRemoveTrivialPhi(phi)
  }


  tryRemoveTrivialPhi(phi :Value) :Value {
    const s = this
    assert(phi.op == Op.Phi)
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
      same = new Value(0, Op.None, t_nil, phi.b, null) // dummy FIXME
      // same = new Undef() // The phi is unreachable or in the start block
    }

    let users = phi.users  // Remember all users
    dlog(`${phi.b} replace ${phi} with ${same} (aux = ${same.aux})`)
    phi.replaceBy(same) // Reroute all uses of phi to same and remove phi
    assert(phi.uses == 0, `still used even after Value.replaceBy`)

    // Try to recursively remove all phi users, which might have become trivial
    for (let user of users) {
      if (user.op == Op.Phi && user !== phi) {
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