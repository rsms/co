import { Int64, SInt64, UInt64 } from './int64'
import { token } from './token'
import { debuglog as dlog } from './util'
import {
  Ent,
  Expr,
  NumLit,
  Ident,
  Operation,
} from './ast'
import {
  Mem,
  IntType,
  NumType,

  t_u8, t_i8, t_u16, t_i16, t_u32, t_i32, t_u64, t_i64,
  t_uint, t_int,
  //t_usize, t_isize,
  t_f32, t_f64,
} from './types'

export type Num = number | Int64

const _Int64_UINT32_MAX = UInt64.fromInt32(0xffffffff)
const _Int64_SINT32_MAX = SInt64.fromInt32(0x7fffffff)
const _Int64_SINT32_MIN = SInt64.fromInt32(-0x80000000)

const _Int32_UINT16_MAX = 0xffff >>> 0
const _Int32_SINT16_MAX = 0x7fff | 0
const _Int32_SINT16_MIN = -0x8000 | 0
const _Int64_UINT16_MAX = UInt64.fromInt32(_Int32_UINT16_MAX)
const _Int64_SINT16_MAX = SInt64.fromInt32(_Int32_SINT16_MAX)
const _Int64_SINT16_MIN = SInt64.fromInt32(_Int32_SINT16_MIN)

const _Int32_UINT8_MAX = 0xff >>> 0
const _Int32_SINT8_MAX = 0x7f | 0
const _Int32_SINT8_MIN = -0x80 | 0
const _Int64_UINT8_MAX = UInt64.fromInt32(_Int32_UINT8_MAX)
const _Int64_SINT8_MAX = SInt64.fromInt32(_Int32_SINT8_MAX)
const _Int64_SINT8_MIN = SInt64.fromInt32(_Int32_SINT8_MIN)


// numIsZero return true if the number is zero
//
export function numIsZero(v :Num) :bool {
  return (typeof v == 'number') ? v == 0 : v.isZero()
}

// numIsZero return true if the number is zero
//
export function isNum(v :any) :v is Num {
  return (
    typeof v == 'number' ||
    v instanceof SInt64 ||
    v instanceof UInt64
  )
}

// numconv coverts a number to a type.
//
// Conversion always succeeds but might be lossy;
// returns [Num,true] when lossless, [Num,false] when conversion was lossy.
//
export function numconv(v :Num, t :NumType) :[Num,bool] {  // -> v2, lossless
  let lossless :bool = false

  // TODO FIXME if the type is arch dependent, assume 32-bit
  if (t === t_int) {
    t = t_i32
  } else if (t === t_uint) {
    t = t_u32
  }

  if (t === t_i64) {
    // ? -> i64
    if (typeof v == 'number') {
      if (v === (v | 0) || v === v >>> 0) {
        // i32|u32 -> i64
        lossless = true
        v = SInt64.fromFloat64(v)
      } else {
        // f32|f64 -> i64
        let n :SInt64|null
        if (Math.ceil(v) == v && (n = SInt64.maybeFromFloat64(v))) {
          lossless = true
          v = n
        } else {
          v = SInt64.fromFloat64(v)
        }
      }
    } else {
      // u64|i64 -> i64
      lossless = v.lte(SInt64.MAX)
      v = v.toSigned()
    }

  } else if (t === t_u64) {
    // ? -> u64
    if (typeof v == 'number') {
      if (v === v >>> 0) {
        // +i32|u32 -> u64
        lossless = true
        v = SInt64.fromInt32(v)
      } else {
        // -i32|f32|f64 -> u64
        let n :UInt64|null
        if (Math.ceil(v) == v && (n = UInt64.maybeFromFloat64(v))) {
          lossless = true
          v = n
        } else {
          v = UInt64.fromFloat64(v)
        }
      }
    } else {
      // u64|i64 -> i64
      lossless = v.isPos()
      v = v.toUnsigned()
    }

  } else if (t === t_i32) {
    // ? -> i32
    if (typeof v == 'number') {
      let v2 = v | 0
      lossless = v === v2
      v = v2
    } else {
      // u64|i64 -> i32
      lossless = v.gte(_Int64_SINT32_MIN) && v.lte(_Int64_SINT32_MAX)
      v = v.toInt32()
    }

  } else if (t === t_u32) {
    // ? -> u32
    if (typeof v == 'number') {
      let v2 = v >>> 0
      lossless = v === v2
      v = v2
    } else {
      // u64|i64 -> u32
      lossless = v.gte(UInt64.ZERO) && v.lte(_Int64_UINT32_MAX)
      v = v.toUInt32()
    }

  } else if (t === t_i16) {
    // ? -> i16
    if (typeof v == 'number') {
      let v2 = v | 0
      lossless = v === v2 && v >= _Int32_SINT16_MIN && v <= _Int32_SINT16_MAX
      v = v2
    } else {
      // u64|i64 -> i16
      lossless = v.gte(_Int64_SINT16_MIN) && v.lte(_Int64_SINT16_MAX)
      v = v.toInt32()
      assert(v >= _Int32_SINT16_MIN && v <= _Int32_SINT16_MAX)
    }

  } else if (t === t_u16) {
    // ? -> u16
    if (typeof v == 'number') {
      let v2 = v >>> 0
      lossless = v === v2 && v >= 0 && v <= _Int32_UINT16_MAX
      v = v2
    } else {
      // u64|i64 -> u16
      lossless = v.gte(UInt64.ZERO) && v.lte(_Int64_UINT16_MAX)
      v = v.toInt32()
      assert(v >= 0 && v <= _Int32_UINT16_MAX)
    }

  } else if (t === t_i8) {
    // ? -> i8
    if (typeof v == 'number') {
      let v2 = v | 0
      lossless = v === v2 && v >= _Int32_SINT8_MIN && v <= _Int32_SINT8_MAX
      v = v2
    } else {
      // u64|i64 -> i8
      lossless = v.gte(_Int64_SINT8_MIN) && v.lte(_Int64_SINT8_MAX)
      v = v.toInt32()
      assert(v >= _Int32_SINT8_MIN && v <= _Int32_SINT8_MAX)
    }

  } else if (t === t_u8) {
    // ? -> u8
    if (typeof v == 'number') {
      let v2 = v >>> 0
      lossless = v === v2 && v >= 0 && v <= _Int32_UINT8_MAX
      v = v2
    } else {
      // u64|i64 -> u8
      lossless = v.gte(UInt64.ZERO) && v.lte(_Int64_UINT8_MAX)
      v = v.toInt32()
      assert(v >= 0 && v <= _Int32_UINT8_MAX)
    }

  } else if (t === t_f64) {
    // ? -> f64
    lossless = true
    if (typeof v != 'number') {
      v = v.toFloat64()
    }

  } else if (t === t_f32) {
    // ? -> f32
    lossless = true
    if (typeof v != 'number') {
      v = v.toFloat64()
    }

  } else {
    assert(false, `unexpected destination type ${t}`)
  }

  return [v, lossless]
}


// evalConstU32 evaluates a constant expression yielding a u32
// returns
//  >= 0 on success
//    -1 on lossy conversion
//    -2 if x is not a number
//
export function numEvalU32(x :Expr) :int {
  let n = numEval(x)
  if (n === null) {
    return -2
  }

  let [i, lossless] = numconv(n, t_u32)
  assert(typeof i == 'number')
  assert(i >= 0, 'negative value of u32')

  return lossless ? i as int : -1
}


// numEval evaulates a constant expression yielding a number.
// returns null if the expression either yields a non-number or some
// components are unresolved or not constant.
//
export function numEval(x :Expr) :Num|null {
  if (x instanceof NumLit) {
    return x.value
  }

  if (x instanceof Ident) {
    let ent = x.ent as Ent
    assert(ent, 'unresolved identifier')
    assert(ent.value, 'unresolved identifier value')
    if (ent.value && (ent.isConstant() || ent.nreads == 1)) {
      // Note: ent is either constant (never written to)
      // or we are the only ones reading it.
      return numEval(ent.value)
    }

  } else if (x instanceof Operation) {
    return numEvalOp(x)

  } else {
    dlog(`TODO handle ${x.constructor.name} ${x}`)
  }

  return null
}


// numEvalOp evaluates a constant operation.
// returns null on failure.
//
export function numEvalOp(x :Operation) :Num|null {
  let t = x.type as NumType
  assert(t, 'unresolved type')

  if (!(t instanceof NumType)) {
    // not a numeric operation
    return null
  }

  let xn = numEval(x.x)
  if (xn === null) {
    return null
  }

  if (!x.y) {
    // unary operation
    assert(x.x.type === t, 'unexpected operand type')
    return numEvalOpUnary(t, xn, x.op)
  }

  // else: binary operation

  let yn = numEval(x.y)
  if (yn === null) {
    return null
  }

  let lossless :bool = false

  if (x.x.type !== t) {
    // cast x to typeof x
    ;[xn, lossless] = numconv(xn, t)
    if (!lossless) {
      return null
    }
  }

  if (x.op == token.SHL || x.op == token.SHR) {
    // special case for bit shifts which takes an unsigned in as 2nd operand
    // y must be unsigned int
    let yt = x.y.type as IntType
    if (!(yt instanceof IntType) || !(t instanceof IntType)) {
      // floating point operand for bit shift is invalid
      return null
    }
    return numEvalOpBitSh(t, xn, yn, x.op)

  } else if (x.y.type !== t) {
    // cast y to typeof x
    ;[yn, lossless] = numconv(yn, t)
    if (!lossless) {
      return null
    }
  }

  return numEvalOpBin(t, xn, yn, x.op)
}


export function numEvalOpBitSh(
  t :IntType,
  a :Num,
  b :Num,
  op :token.SHL|token.SHR
) :Num|null {
  let nbits = 0
  if (typeof b == 'number' && b >= 0) {
    nbits = b >>> 0
  } else {
    // convert b to u32
    let lossless :bool = false
    ;[nbits, lossless] = numconv(b, t_u32) as [int,bool]
    if (!lossless) {
      return null
    }
  }

  if (typeof a == 'number') {
    assert(t.mem == Mem.i32 || t.mem == Mem.i16 || t.mem == Mem.i8)
    if (op == token.SHL) {
      return a << nbits
    }
    assert(op == token.SHR)
    return (
      t.isSignedInt ? a >> nbits :  // sign-extending
      a >>> nbits  // zero-replicating
    )
  }

  assert(t.mem == Mem.i64)
  assert(a instanceof SInt64 || a instanceof UInt64)
  if (op == token.SHL) {
    return (a as Int64).shl(nbits) // <<
  }
  assert(op == token.SHR)
  return (a as Int64).shr(nbits) // >>
}


export function numEvalOpBin(
  t :NumType,
  a :Num,
  b :Num,
  op :token
) :Num|null {
  if (t.mem == Mem.i32) {
    assert(t instanceof IntType)
    assert(typeof a == 'number')
    assert(typeof b == 'number')
    if (t.isSignedInt) {
      return numEvalOpBinS32(a as int, b as int, op)
    }
    assert(a >= 0)
    assert(b >= 0)
    return numEvalOpBinU32(a as int, b as int, op)
  }

  if (t.mem == Mem.i64) {
    assert(t instanceof IntType)
    if (t.isSignedInt) {
      assert(a instanceof SInt64)
      assert(b instanceof SInt64)
    } else {
      assert(a instanceof UInt64)
      assert(b instanceof UInt64)
    }
    return numEvalOpBinI64(a as Int64, b as Int64, op)
  }

  assert(typeof a == 'number')
  assert(typeof b == 'number')
  return numEvalOpBinFloat(a as number, b as number, op)
}


// Binary numeric operators
//
// Op       Avail.  Src  Note
//
// ADD      i, f    +
// SUB      i, f    -
// MUL      i, f    *
// QUO      i, f    /
// REM      i       %
// OR       i       |
// XOR      i       ^
// AND      i       &
// AND_NOT  i       &^   equiv to `x & (^y)` (note: unary ^ = "NOT")
// SHL      i       <<
// SHR      i       >>   arithmetic when signed, logical when unsigned
//

export function numEvalOpBinS32(a :int, b :int, op :token) :Num|null {
  switch (op) {
  case token.ADD:     return a + b | 0 // +
  case token.SUB:     return a - b | 0 // -
  case token.MUL:     return Math.imul(a, b) // *
  case token.QUO:     return a / b | 0 // /
  case token.REM:     return a % b | 0 // %
  case token.OR:      return a | b  // |
  case token.XOR:     return a ^ b // ^
  case token.AND:     return a & b // &
  case token.AND_NOT: return a & ~b // &^
  case token.SHL:     return a << b // <<
  case token.SHR:     return a >> b // >> sign-extending
  default:
    assert(false, `unexpected ${token[op]}`)
    return null
  }
}

export function numEvalOpBinU32(a :int, b :int, op :token) :Num|null {
  switch (op) {
  case token.ADD:     return a + b >>> 0 // +
  case token.SUB:     return a - b >>> 0 // -
  case token.MUL:     return Math.imul(a, b) >>> 0 // *
  case token.QUO:     return a / b >>> 0 // /
  case token.REM:     return a % b >>> 0 // %
  case token.OR:      return a | b  // |
  case token.XOR:     return a ^ b // ^
  case token.AND:     return a & b // &
  case token.AND_NOT: return a & ~b // &^
  case token.SHL:     return a << b // <<
  case token.SHR:     return a >>> b // >> zero-replicating
  default:
    assert(false, `unexpected ${token[op]}`)
    return null
  }
}

export function numEvalOpBinI64(a :Int64, b :Int64, op :token) :Num|null {
  switch (op) {
  case token.ADD:     return a.add(b) // +
  case token.SUB:     return a.sub(b) // -
  case token.MUL:     return a.mul(b) // *
  case token.QUO:     return a.div(b) // /
  case token.REM:     return a.mod(b) // %
  case token.OR:      return a.or(b)  // |
  case token.XOR:     return a.xor(b) // ^
  case token.AND:     return a.and(b) // &
  case token.AND_NOT: return a.and(b.not()) // &^
  case token.SHL:     return a.shl(b.toUInt32()) // <<
  case token.SHR:     return a.shr(b.toUInt32()) // >>
  default:
    assert(false, `unexpected ${token[op]}`)
    return null
  }
}

export function numEvalOpBinFloat(a :number, b :number, op :token) :Num|null {
  switch (op) {
  case token.ADD:     return a + b // +
  case token.SUB:     return a - b // -
  case token.MUL:     return a * b // *
  case token.QUO:     return a / b // /
  default:
    assert(false, `unexpected ${token[op]}`)
    return null
  }
}


export function numEvalOpUnary(t :NumType, n :Num, op :token) :Num|null {
  if (t.mem == Mem.i32) {
    assert(typeof n == 'number')
    assert(t instanceof IntType)
    if (t.isSignedInt) {
      return numEvalOpUnaryS32(n as int, op)
    }
    return numEvalOpUnaryU32(n as int, op)
  }

  if (t.mem == Mem.i64) {
    assert(typeof n == 'object')
    assert(n instanceof UInt64 || n instanceof SInt64)
    assert(t instanceof IntType)
    return numEvalOpUnaryI64(n as Int64, op)
  }

  assert(typeof n == 'number')
  return numEvalOpUnaryFloat(n as number, op)
}

// Unary operator definitions:
// Op   Example   Definition  Notes
// ADD  +x        0 + x
// SUB  -x        0 - x
// XOR  ^x        m ^ x       aka NOT, C equiv: `~x`
//                  where m = "all bits set to 1" for unsigned x
//                  and   m = -1 for signed x
//

export function numEvalOpUnaryS32(n :int, op :token) :Num|null {
  switch (op) {
  case token.ADD: return n
  case token.SUB: return 0 - n | 0
  case token.XOR: return ~n  // "NOT" (alt impl: `-1 ^ n | 0`)
  case token.NOT: return null // logical, not numeric
  default:
    assert(false, `unexpected ${token[op]}`)
    return null
  }
}

export function numEvalOpUnaryU32(n :int, op :token) :Num|null {
  switch (op) {
  case token.ADD: return n
  case token.SUB: return 0 - n >>> 0
  case token.XOR: return ~n  // "NOT" (alt impl: `0xffffffff ^ n >>> 0`)
  case token.NOT: return null // logical, not numeric
  default:
    assert(false, `unexpected ${token[op]}`)
    return null
  }
}

export function numEvalOpUnaryI64(n :Int64, op :token) :Num|null {
  switch (op) {
  case token.ADD: return n
  case token.SUB: return n.neg()
  case token.XOR: return n.not()
  case token.NOT: return null // logical, not numeric
  default:
    assert(false, `unexpected ${token[op]}`)
    return null
  }
}

export function numEvalOpUnaryFloat(n :number, op :token) :Num|null {
  switch (op) {
  case token.ADD: return n
  case token.SUB: return 0 - n
  default:
    assert(false, `unexpected ${token[op]}`)
    return null
  }
}
