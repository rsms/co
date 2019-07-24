import { Num } from './num'
import { numconv } from './numconv'
import { Int64, SInt64, UInt64 } from './int64'
import { token } from './token'
import { debuglog as dlog } from './util'
import {
  Storage, IntType, NumType, t_u32,
  Ent, Expr, NumLit, Ident, Operation,
} from "./ast"


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
  if (x.isNumLit()) {
    return x.value
  }

  if (x.isIdent()) {
    let ent = x.ent!
    assert(ent, 'unresolved identifier')
    assert(ent.value, 'unresolved identifier value')
    if (ent.value && (ent.isConstant() || ent.nreads == 1)) {
      // Note: ent is either constant (never written to)
      // or we are the only ones reading it.
      return numEval(ent.value)
    }

  } else if (x.isOperation()) {
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
  assert(x.type, 'unresolved type')

  if (!x.type!.isNumType()) {
    // not a numeric operation
    return null
  }

  let t = x.type

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
    if (!(x.y.type instanceof IntType) || !t.isIntType()) {
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


export function numEvalOpBitSh(t :IntType, a :Num, b :Num, op :token.SHL|token.SHR) :Num|null {
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
    assert(t.isI32() || t.isI16() || t.isI8())
    if (op == token.SHL) {
      return a << nbits
    }
    assert(op == token.SHR)
    return (
      t.isSIntType() ? a >> nbits :  // sign-extending
                       a >>> nbits  // zero-replicating
    )
  }

  assert(t.isI64())
  assert(a instanceof SInt64 || a instanceof UInt64)
  if (op == token.SHL) {
    return (a as Int64).shl(nbits) // <<
  }
  assert(op == token.SHR)
  return (a as Int64).shr(nbits) // >>
}


export function numEvalOpBin(t :NumType, a :Num, b :Num, op :token) :Num|null {
  if (t.isI32()) {
    assert(t.isIntType())
    assert(typeof a == 'number')
    assert(typeof b == 'number')
    if (t.isSIntType()) {
      return numEvalOpBinS32(a as int, b as int, op)
    }
    assert(a >= 0)
    assert(b >= 0)
    return numEvalOpBinU32(a as int, b as int, op)
  }

  if (t.isI64()) {
    assert(t.isIntType())
    if (t.isSIntType()) {
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
  if (t.isI32()) {
    assert(typeof n == 'number')
    assert(t.isIntType())
    if (t.isSIntType()) {
      return numEvalOpUnaryS32(n as int, op)
    }
    return numEvalOpUnaryU32(n as int, op)
  }

  if (t.isI64()) {
    assert(typeof n == 'object')
    assert(n instanceof UInt64 || n instanceof SInt64)
    assert(t.isIntType())
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
