//
// 64-bit integer math
//
// Based on Google Closure Library's goog/math/long.js
// and long.js https://github.com/dcodeIO/long.js
//
// Google Closure Library is licensed as follows:
//   Copyright 2009 The Closure Library Authors. All Rights Reserved.
//   Apache License, Version 2.0 (the "License"); you may not use this file
//   except in compliance with the License.
//   You may obtain a copy of the License at
//   https://github.com/google/closure-library/blob/master/LICENSE
//
// long.js is licensed as follows:
//   Apache License, Version 2.0 (the "License"); you may not use this file
//   except in compliance with the License.
//   You may obtain a copy of the License at
//   https://github.com/dcodeIO/long.js/blob/master/LICENSE
//
//
import { strtou } from './strtou'

export interface Int64 {
  eq(x :Int64) :bool   // this == x
  neq(x :Int64) :bool  // this != x
  eqz() :bool          // this == 0
  cmp(x :Int64) :int   // this <> x  ->  -1 | 0 | 1
  lt(x :Int64) :bool   // this < x
  lte(x :Int64) :bool  // this <= x
  gt(x :Int64) :bool   // this > x
  gte(x :Int64) :bool  // this >= x

  readonly isSigned :bool
  isNeg() :bool  // true if negative (always false for UInt64)
  isPos() :bool  // true if positive (always true for UInt64)
  isOdd() :bool  // true if odd number
  isZero() :bool // true if zero

  neg() :Int64 // -N negation

  not() :Int64             // ~N bitwise not
  mod(x :Int64) :Int64     // this % x
  and(x :Int64) :Int64     // this & x
  or(x :Int64) :Int64      // this | x
  xor(x :Int64) :Int64     // this ^ x
  shl(nbits :int) :Int64   // 
  shr_s(nbits :int) :Int64 // sign-replicating/arithmetic shift right
  shr_u(nbits :int) :Int64 // zero-replicating/logical shift right
  shr(nbits :int) :Int64 // shr_s for SInt64, shr_u for UInt64

  add(x :Int64) :Int64 // this + x
  sub(x :Int64) :Int64 // this - x
  mul(x :Int64) :Int64 // this * x
  div(x :Int64) :Int64 // this / x

  popcnt() :int  // count number of set bits

  toSigned() :SInt64
  toUnsigned() :UInt64
  toInt32() :int
  toUInt32() :int
  toFloat64() :number
  toBytesLE() :Uint8Array
  toBytesBE() :Uint8Array
  toString(radix? :int) :string // radix defaults to 10

  _low :int
  _high :int
}

export interface Int64Cons {
  readonly MIN  :Int64
  readonly MAX  :Int64
  readonly ZERO :Int64  // 0
  readonly ONE  :Int64  // 1

  fromInt32(v :int) :Int64
  fromFloat64(v :number) :Int64
  maybeFromFloat64(v :number) :Int64|null
  fromStr(str :string, radix :int) :Int64
  fromByteStr(b :ArrayLike<byte>, radix :int) :Int64
  fromByteStr0(b :ArrayLike<byte>, radix :int, start :int, end :int) :Int64
  fromBytesLE(b :ArrayLike<byte>) :Int64
  fromBytesBE(b :ArrayLike<byte>) :Int64
}

// ===========================================================================

// WebAssembly routines for envs that support it
interface Uint64Wasm {
  mul(alo :int, ahi :int, mlo: int, mhi :int) :int  // returns lower
  div_u(alo :int, ahi :int, dlo: int, dhi :int) :int  // returns lower
  div_s(alo :int, ahi :int, dlo: int, dhi :int) :int  // returns lower
  rem_u(alo :int, ahi :int, dlo: int, dhi :int) :int  // returns lower
  rem_s(alo :int, ahi :int, dlo: int, dhi :int) :int  // returns lower
  popcnt(lo :int, hi :int) :int
  get_high() :int
}

var wasm :Uint64Wasm
try {
  wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
    //!<wasmdata src="int64.wast">
    0,97,115,109,1,0,0,0,1,19,3,96,0,1,127,96,2,127,127,1,127,96,4,127,127,
    127,127,1,127,3,8,7,0,1,2,2,2,2,2,6,6,1,127,1,65,0,11,7,59,7,8,103,101,
    116,95,104,105,103,104,0,0,3,109,117,108,0,2,5,100,105,118,95,115,0,3,5,
    100,105,118,95,117,0,4,5,114,101,109,95,115,0,5,5,114,101,109,95,117,0,6,
    6,112,111,112,99,110,116,0,1,10,218,1,7,4,0,35,0,11,16,1,1,126,32,0,173,
    32,1,173,66,32,134,132,123,167,11,38,1,1,126,32,0,173,32,1,173,66,32,134,
    132,32,2,173,32,3,173,66,32,134,132,126,33,4,32,4,66,32,135,167,36,0,32,4,
    167,11,38,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,
    134,132,127,33,4,32,4,66,32,135,167,36,0,32,4,167,11,38,1,1,126,32,0,173,
    32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,132,128,33,4,32,4,66,
    32,135,167,36,0,32,4,167,11,38,1,1,126,32,0,173,32,1,173,66,32,134,132,32,
    2,173,32,3,173,66,32,134,132,129,33,4,32,4,66,32,135,167,36,0,32,4,167,11,
    38,1,1,126,32,0,173,32,1,173,66,32,134,132,32,2,173,32,3,173,66,32,134,
    132,130,33,4,32,4,66,32,135,167,36,0,32,4,167,11
    //!</wasmdata>
  ])), {}).exports as any as Uint64Wasm
} catch (_) {
  // no wasm support
  wasm = null as any as Uint64Wasm
}

const _TWO_PWR_16_DBL = 1 << 16
const _TWO_PWR_32_DBL = _TWO_PWR_16_DBL * _TWO_PWR_16_DBL
const _TWO_PWR_64_DBL = _TWO_PWR_32_DBL * _TWO_PWR_32_DBL
const _TWO_PWR_63_DBL = _TWO_PWR_64_DBL / 2

type _Int64Cons = typeof SInt64 | typeof UInt64

class Int64Base {
  _low :int
  _high :int

  constructor(low :int, high :int) {
    this._low = low | 0    // force into 32 signed bits
    this._high = high | 0  // force into 32 signed bits
  }

  eq(x :Int64) :bool {
    if (
      this.constructor !== x.constructor && // mixing signed/unsigned
      this._high >>> 31 == 1 &&
      x._high >>> 31 == 1
    ) {
      return false
    }
    return (this._high == x._high) && (this._low == x._low)
  }

  neq(x :Int64) :bool {
    return (this._high != x._high) || (this._low != x._low)
  }

  eqz() :bool {
    return this._high == 0 && this._low == 0
  }

  lt(x :Int64) :bool {
    return (this as any as Int64).cmp(x) < 0
  }

  lte(x :Int64) :bool {
    return (this as any as Int64).cmp(x) <= 0
  }

  gt(x :Int64) :bool {
    return (this as any as Int64).cmp(x) > 0
  }

  gte(x :Int64) :bool {
    return (this as any as Int64).cmp(x) >= 0
  }

  not() :Int64 { // ~N bitwise not
    return new (<_Int64Cons>this.constructor)(~this._low, ~this._high)
  }

  mod(x :Int64) :Int64 { // this % x
    return (this as any as Int64).sub((this as any as Int64).div(x).mul(x))
  }

  and(x :Int64) :Int64 { // this & x
    return new (<_Int64Cons>this.constructor)(
      this._low & x._low,
      this._high & x._high
    )
  }

  or(x :Int64) :Int64 { // this | x
    return new (<_Int64Cons>this.constructor)(
      this._low | x._low,
      this._high | x._high
    )
  }

  xor(x :Int64) :Int64 { // this ^ x
    return new (<_Int64Cons>this.constructor)(
      this._low ^ x._low,
      this._high ^ x._high
    )
  }

  // shl returns an Int64 with bits shifted to the left by nbits
  //
  shl(nbits :int) :Int64 {
    nbits &= 63
    if (nbits == 0) {
      return this as any as Int64
    }
    let low = this._low
    if (nbits < 32) {
      return new (<_Int64Cons>this.constructor)(
        low << nbits,
        (this._high << nbits) | (low >>> (32 - nbits))
      )
    }
    return new (<_Int64Cons>this.constructor)(0, low << (nbits - 32))
  }

  // shr_s returns an Int64 with bits shifted to the right by nbits.
  // The new leading bits match the current sign bit.
  //
  shr_s(nbits :int) :Int64 {
    nbits &= 63
    if (nbits == 0) {
      return this as any as Int64
    }
    let high = this._high
    if (nbits < 32) {
      return new (<_Int64Cons>this.constructor)(
        (this._low >>> nbits) | (high << (32 - nbits)),
        high >> nbits
      )
    }
    return new (<_Int64Cons>this.constructor)(
      high >> (nbits - 32),
      high >= 0 ? 0 : -1
    )
  }

  // shr_u returns an Int64 with its bits logically
  // shifted to the right by nbits.
  //
  shr_u(nbits :int) :Int64 {
    nbits &= 63;
    if (nbits === 0) {
      return this as any as Int64
    }
    let high = this._high
    if (nbits < 32) {
        return new (<_Int64Cons>this.constructor)(
          (this._low >>> nbits) | (high << (32 - nbits)),
          high >>> nbits
        )
    }
    if (nbits === 32) {
      return new (<_Int64Cons>this.constructor)(high, 0)
    }
    return new (<_Int64Cons>this.constructor)(high >>> (nbits - 32), 0)
  }

  add(x :Int64) :Int64 { // this + x
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks
    let a48 = this._high >>> 16
      , a32 = this._high & 0xFFFF
      , a16 = this._low >>> 16
      , a00 = this._low & 0xFFFF
      , b48 = x._high >>> 16
      , b32 = x._high & 0xFFFF
      , b16 = x._low >>> 16
      , b00 = x._low & 0xFFFF
      , c48 = 0
      , c32 = 0
      , c16 = 0
      , c00 = 0
    ;
    c00 += a00 + b00
    c16 += c00 >>> 16
    c00 &= 0xFFFF
    c16 += a16 + b16
    c32 += c16 >>> 16
    c16 &= 0xFFFF
    c32 += a32 + b32
    c48 += c32 >>> 16
    c32 &= 0xFFFF
    c48 += a48 + b48
    c48 &= 0xFFFF;
    return new (<_Int64Cons>this.constructor)(
      (c16 << 16) | c00,
      (c48 << 16) | c32
    )
  }

  sub(x :Int64) :Int64 {
    return this.add(x.neg())
  }

  mul(x :Int64) :Int64 {
    let n = this as any as Int64,
        I = <_Int64Cons>n.constructor

    if (n.eqz() || x.eqz()) {
      return I.ZERO
    }

    if (n.eq(I.MIN)) {
      return x.isOdd() ? I.MIN : I.ZERO
    }

    if (x.eq(I.MIN)) {
      return n.isOdd() ? I.MIN : I.ZERO
    }

    if (n.isNeg()) {
      if (x.isNeg()) {
        return n.neg().mul(x.neg())
      }
      return n.neg().mul(x).neg()
    }

    if (x.isNeg()) {
      return n.mul(x.neg()).neg()
    }

    // If both longs are small, use float multiplication
    if (n.lt(S64_TWO_PWR_24) && x.lt(S64_TWO_PWR_24)) {
      return SInt64.fromFloat64(n.toFloat64() * x.toFloat64())
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    let a48 = n._high >>> 16
      , a32 = n._high & 0xFFFF
      , a16 = n._low >>> 16
      , a00 = n._low & 0xFFFF
      , b48 = x._high >>> 16
      , b32 = x._high & 0xFFFF
      , b16 = x._low >>> 16
      , b00 = x._low & 0xFFFF
      , c48 = 0
      , c32 = 0
      , c16 = 0
      , c00 = 0
    ;
    c00 += a00 * b00
    c16 += c00 >>> 16
    c00 &= 0xFFFF
    c16 += a16 * b00
    c32 += c16 >>> 16
    c16 &= 0xFFFF
    c16 += a00 * b16
    c32 += c16 >>> 16
    c16 &= 0xFFFF
    c32 += a32 * b00
    c48 += c32 >>> 16
    c32 &= 0xFFFF
    c32 += a16 * b16
    c48 += c32 >>> 16
    c32 &= 0xFFFF
    c32 += a00 * b32
    c48 += c32 >>> 16
    c32 &= 0xFFFF
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48
    c48 &= 0xFFFF

    return new I((c16 << 16) | c00, (c48 << 16) | c32)
  }

  popcnt() :int {
    return popcnt32(this._low) + popcnt32(this._high)
  }

  isOdd() :bool {
    return (this._low & 1) == 1
  }

  isZero() :bool {
    return this._low == 0 && this._high == 0
  }

  // toUInt32 returns the lower part as a 32-bit unsigned value
  //
  toUInt32() {
    return (this._low >= 0) ? this._low : _TWO_PWR_32_DBL + this._low
  }

  // toBytesLE encodes this integer in little-endian byte order
  //
  toBytesLE() :Uint8Array {
    let b = new Uint8Array(8)
      , i = 0
    b[i]   = this._low        & 0xff
    b[++i] = this._low >>>  8 & 0xff
    b[++i] = this._low >>> 16 & 0xff
    b[++i] = this._low >>> 24
    b[++i] = this._high        & 0xff
    b[++i] = this._high >>>  8 & 0xff
    b[++i] = this._high >>> 16 & 0xff
    b[++i] = this._high >>> 24
    return b
  }

  // toBytesLE encodes this integer in big-endian byte order
  //
  toBytesBE() :Uint8Array {
    let b = new Uint8Array(8)
      , i = 0
    b[i]   = this._high >>> 24
    b[++i] = this._high >>> 16 & 0xff
    b[++i] = this._high >>>  8 & 0xff
    b[++i] = this._high        & 0xff
    b[++i] = this._low >>> 24
    b[++i] = this._low >>> 16 & 0xff
    b[++i] = this._low >>>  8 & 0xff
    b[++i] = this._low        & 0xff
    return b
  }
}


// popcnt32 returns the number of set bits in n
//
function popcnt32(n :int) :int {
  n = n - ((n >> 1) & 0x55555555)
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
  return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}


function fromStr(
  I :Int64Cons,
  zero :Int64,
  str :string,
  radix :int,
) :Int64 {
  if (str.length == 0) {
    throw new Error('empty string')
  }

  if (!radix) {
    radix = 10
  } else if (radix < 2 || 36 < radix) {
    throw new Error('radix out of range')
  }

  if (str.charCodeAt(0) == 0x2D) { // -
    return fromStr(I, zero, str.substr(1), radix).neg()
  }

  // Do several (8) digits each time through the loop, so as to
  // minimize the calls to the very expensive emulated div.
  let radixToPower = UInt64.fromFloat64(Math.pow(radix, 8))
  let result = zero

  for (let i = 0; i < str.length; i += 8) {
    let size = Math.min(8, str.length - i)
    let value = parseInt(str.substring(i, i + size), radix)
    if (size < 8) {
      let power = I.fromFloat64(Math.pow(radix, size))
      result = result.mul(power).add(I.fromFloat64(value))
    } else {
      result = result.mul(radixToPower)
      result = result.add(I.fromFloat64(value))
    }
  }

  return result
}


// fromByteStr0 interprets a literal number from a byte array.
// The bytes must only contain ASCII digits (no "-" or whitespace.)
//
function fromByteStr0(
  I :Int64Cons,
  zero :Int64,
  buf :ArrayLike<byte>,
  radix :int,
  start :int,
  end :int,
) :Int64 {
  // Do several (8) digits each time through the loop, so as to
  // minimize the calls to the very expensive emulated div.
  let radixToPower = I.fromFloat64(Math.pow(radix, 8))
  let result = zero

  for (let i = start; i < end; i += 8) {
    let size = Math.min(8, end - i)
    let value = strtou(buf, radix, i, i + size)
    if (size < 8) {
      let power = I.fromFloat64(Math.pow(radix, size))
      result = result.mul(power).add(I.fromFloat64(value))
    } else {
      result = result.mul(radixToPower)
      result = result.add(I.fromFloat64(value))
    }
  }

  return result
}

// fromBytes returns an Int64 representing the given ASCII string
// in the byte array buf, interpreted in radix.
// If the first byte is "-" (0x2D "hyphen"), then the number is interpreted
// as being negative.
//
function fromByteStr(
  I :Int64Cons,
  zero :Int64,
  buf :ArrayLike<byte>,
  radix :int,
 ) :Int64 {
  if (buf.length == 0) {
    throw new Error('empty byte array')
  }
  if (!radix) {
    radix = 10
  } else if (radix < 2 || 36 < radix) {
    throw new Error('radix out of range')
  }
  if (buf[0] == 0x2D) { // -
    return fromByteStr0(I, zero, buf, radix, 1, buf.length).neg()
  }
  return fromByteStr0(I, zero, buf, radix, 0, buf.length)
}


function toString(n :Int64, radix? :int) :string {
  if (!radix) {
    radix = 10
  } else if (radix < 2 || 36 < radix) {
    throw new Error('radix out of range')
  }

  if (n.eqz()) {
    return '0'
  }

  // Do several (6) digits each time through the loop, so as to
  // minimize the calls to the very expensive emulated div.
  let radixToPower = UInt64.fromFloat64(Math.pow(radix, 6))
  let rem = n
  let result = ''

  while (true) {
    // The right shifting fixes negative values in the case when
    // intval >= 2^31; for more details see
    // https://github.com/google/closure-library/pull/498
    let remDiv = rem.div(radixToPower)
      , intval = rem.sub(remDiv.mul(radixToPower)).toInt32() >>> 0
      , digits = intval.toString(radix)
    rem = remDiv
    if (rem.eqz()) {
      return digits + result
    }
    while (digits.length < 6) {
      digits = '0' + digits
    }
    result = '' + digits + result
  }
}


// ===========================================================================

export class SInt64 extends Int64Base implements Int64 {
  static readonly MIN    :SInt64  // -9223372036854775808
  static readonly MAX    :SInt64  // 9223372036854775807
  static readonly ZERO   :SInt64  // 0
  static readonly ONE    :SInt64  // 1
  static readonly ONENEG :SInt64  // -1

  // fromInt32 create a SInt64 representing the 32-bit signed integer v
  //
  static fromInt32(v :int) :SInt64 {
    let iv = v | 0  // convert to i32
    assert(Math.round(v) === v, 'value should be a 32-bit integer')
    if (-128 <= iv && iv < 128) {
      let s = _SInt64_cache.get(iv)
      if (!s) {
        s = new SInt64(iv, iv < 0 ? -1 : 0)
        _SInt64_cache.set(iv, s)
      }
      return s
    }
    return new SInt64(iv, iv < 0 ? -1 : 0)
  }

  // fromFloat64 returns a SInt64 representing the given number v which
  // can be any JS number. NaN results in zero, Infinity to SInt64.MAX and
  // -Infinity SInt64.MIN
  //
  static fromFloat64(v :number) :SInt64 {
    if (isNaN(v)) {
      return S64_ZERO
    }
    if (v <= -_TWO_PWR_63_DBL) {
      return S64_MIN
    }
    if (v + 1 >= _TWO_PWR_63_DBL) {
      return S64_MAX
    }
    if (v < 0) {
      return this.fromFloat64(-v).neg()
    }
    return new SInt64((v % _TWO_PWR_32_DBL) | 0, (v / _TWO_PWR_32_DBL) | 0)
  }

  // maybeFromFloat64 is like fromFloat64, but returns null if v can not be
  // losslessly represented (i.e. if v < SInt64.MIN, v > SInt64.MAX, or nan.)
  //
  static maybeFromFloat64(v :number) :SInt64|null {
    if (isNaN(v) || v < -_TWO_PWR_63_DBL || v + 1 > _TWO_PWR_63_DBL) {
      return null
    }
    if (v == -_TWO_PWR_63_DBL) {
      return S64_MIN
    }
    if (v + 1 == _TWO_PWR_63_DBL) {
      return S64_MAX
    }
    if (v < 0) {
      v = -v
      if (v + 1 >= _TWO_PWR_63_DBL) {
        return null
      }
      return (
        new SInt64((v % _TWO_PWR_32_DBL) | 0, (v / _TWO_PWR_32_DBL) | 0)
      ).neg()
    }
    return new SInt64((v % _TWO_PWR_32_DBL) | 0, (v / _TWO_PWR_32_DBL) | 0)
  }

  // fromStr returns a SInt64 representing of the given string,
  // interpreted in radix.
  //
  static fromStr(str :string, radix :int) :SInt64 {
    return fromStr(this, S64_ZERO, str, radix)
  }

  // fromBytesUnchecked interprets a number from a byte array.
  // The bytes must only contain digits (no "-" or whitespace.)
  //
  static fromByteStr0(
    buf :ArrayLike<byte>,
    radix :int,
    start :int,
    end :int,
  ) :SInt64 {
    return fromByteStr0(this, S64_ZERO, buf, radix, start, end)
  }

  // fromBytes returns an Int64 representing the given ASCII string
  // in the byte array buf, interpreted in radix.
  // If the first byte is "-" (0x2D "hyphen"), then the number is interpreted
  // as being negative.
  //
  static fromByteStr(buf :ArrayLike<byte>, radix :int) :SInt64 {
    return fromByteStr(this, S64_ZERO, buf, radix)
  }

  // fromBytesLE interprets 8 bytes in little-endian byte order
  //
  static fromBytesLE(b :ArrayLike<byte>) :Int64 {
    return new (<_Int64Cons>this)(
      b[0]       |
      b[1] <<  8 |
      b[2] << 16 |
      b[3] << 24,
      b[4]       |
      b[5] <<  8 |
      b[6] << 16 |
      b[7] << 24
    )
  }

  // fromBytesBE interprets 8 bytes in big-endian byte order
  //
  static fromBytesBE(b :ArrayLike<byte>) :Int64 {
    return new (<_Int64Cons>this)(
      b[4] << 24 |
      b[5] << 16 |
      b[6] <<  8 |
      b[7],
      b[0] << 24 |
      b[1] << 16 |
      b[2] <<  8 |
      b[3]
    )
  }

  readonly isSigned :bool = true

  isNeg() :bool {
    return this._high < 0
  }

  isPos() :bool {
    return this._high >= 0
  }

  cmp(x :Int64) :int { // this <> x  ->  -1 | 0 | 1
    if (this.eq(x)) {
      return 0
    }
    let thisNeg = this.isNeg()
    let xNeg = x.isNeg()
    if (thisNeg && !xNeg) {
      return -1
    }
    if (!thisNeg && xNeg) {
      return 1
    }
    // at this point the sign bits are the same
    return this.sub(x).isNeg() ? -1 : 1
  }

  neg() :SInt64 { // -N negation
    return this.eq(S64_MIN) ? S64_MIN : this.not().add(S64_ONE)
  }

  div(x :Int64) :SInt64 {
    if (x.eqz()) {
      throw new Error('division by zero')
    }

    if (this.eqz()) {
      return S64_ZERO
    }

    if (this.eq(S64_MIN)) {
      if (x.eq(S64_ONE) || x.eq(S64_NEGONE)) {
        return S64_MIN  // recall that -MIN_VALUE == MIN_VALUE
      }
      if (x.eq(S64_MIN)) {
        return S64_ONE
      }
      // At this point, we have |x| >= 2, so |this/x| < |MIN_VALUE|.
      let halfThis = this.shr_s(1)
      let approx = halfThis.div(x).shl(1)
      if (approx.eq(S64_ZERO)) {
        return x.isNeg() ? S64_ONE : S64_NEGONE
      }
      let rem = this.sub(x.mul(approx))
      let result = approx.add(rem.div(x))
      return result
    }

    if (x.eq(S64_MIN)) {
      return S64_ZERO
    }

    if (this.isNeg()) {
      return x.isNeg() ?
        this.neg().div(x.neg()) :
        this.neg().div(x).neg()
    }
    if (x.isNeg()) {
      return this.div(x.neg()).neg()
    }

    // Repeat the following until the remainder is less than x:  find a
    // floating-point that approximates remainder / x *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical
    // that the approximate value is less than or equal to the real value so
    // that the remainder never becomes negative.
    let res = S64_ZERO
    let rem :SInt64 = this
    while (rem.gte(x)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      let approx = Math.max(1, Math.floor(rem.toFloat64() / x.toFloat64()))

      // We will tweak the approximate result by changing it in the 48-th digit
      // or the smallest non-fractional digit, whichever is larger.
      let log2 = Math.ceil(Math.log(approx) / Math.LN2)
      let delta = log2 <= 48 ? 1 : Math.pow(2, log2 - 48)

      // Decrease the approximation until it is smaller than the remainder.
      // Note that if it is too large, the product overflows and is negative.
      let approxRes = SInt64.fromFloat64(approx)
      let approxRem = approxRes.mul(x)
      while (approxRem.isNeg() || approxRem.gt(rem)) {
        approx -= delta
        approxRes = SInt64.fromFloat64(approx)
        approxRem = approxRes.mul(x)
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.eqz()) {
        approxRes = S64_ONE
      }

      res = res.add(approxRes)
      rem = rem.sub(approxRem)
    }
    return res
  }

  shr(nbits :int) :Int64 {
    return this.shr_s(nbits)
  }

  toSigned() {
    return this
  }
  
  toUnsigned() {
    return new UInt64(this._low, this._high)
  }

  // toInt32 assumes this is a 32-bit integer and returns the lower part
  //
  toInt32() {
    return this._low
  }

  // toFloat64 returns the closest floating-point representation to this value
  //
  toFloat64() {
    return this._high * _TWO_PWR_32_DBL + (this._low >>> 0)
    // return this._high * _TWO_PWR_32_DBL + this.toUInt32()
  }

  toString(radix? :int) :string {
    if (this.isNeg()) {
      if (!radix) { radix = 10 }
      if (this.eq(S64_MIN)) {
        // We need to change the value before it can be negated, so we
        // remove the bottom-most digit in this base and then recurse to do
        // the rest.
        let radixLong = SInt64.fromFloat64(radix)
        let div = this.div(radixLong)
        let rem = div.mul(radixLong).sub(this)
        return div.toString(radix) + rem.toInt32().toString(radix)
      }
      return '-' + toString(this.neg(), radix)
    }
    return toString(this, radix)
  }
}

// ===========================================================================

export class UInt64 extends Int64Base {
  static readonly MIN  :UInt64  //
  static readonly MAX  :UInt64  // 
  static readonly ZERO :UInt64  // 0
  static readonly ONE  :UInt64  // 1

  // fromInt32 create a UInt64 representing the 32-bit integer v.
  // if v is negative, overflow rules apply.
  //
  static fromInt32(v :int) :UInt64 {
    let u = v >>> 0
    assert(Math.round(v) === v, 'value should be a 32-bit integer')
    if (0 <= v && v < 256) {
      let s = _UInt64_cache.get(u)
      if (!s) {
        _UInt64_cache.set(u, s = new UInt64(u, 0))
      }
      return s
    }
    return new UInt64(u | 0, v < 0 ? -1 : 0)
  }

  // fromFloat64 returns a UInt64 representing the given number v which
  // can be any JS number.
  // NaN and -Infinity results in zero, Infinity results in UInt64.MAX.
  //
  static fromFloat64(v :number) :UInt64 {
    if (v <= 0 || isNaN(v)) {
      return U64_ZERO
    }
    if (v >= _TWO_PWR_64_DBL) {
      return U64_MAX
    }
    return new UInt64(v % _TWO_PWR_32_DBL, v / _TWO_PWR_32_DBL)
  }

  // maybeFromFloat64 is like fromFloat64, but returns null if v can not be
  // losslessly represented (i.e. if v < UInt64.MIN, v > UInt64.MAX, or nan.)
  //
  static maybeFromFloat64(v :number) :UInt64|null {
    if (v < 0 || v > _TWO_PWR_64_DBL || isNaN(v)) {
      return null
    }
    if (v == 0) {
      return U64_ZERO
    }
    if (v == _TWO_PWR_64_DBL) {
      return U64_MAX
    }
    return new UInt64(v % _TWO_PWR_32_DBL, v / _TWO_PWR_32_DBL)
  }

  // fromStr returns a UInt64 representing of the given string,
  // interpreted in radix.
  //
  static fromStr(str :string, radix :int) :SInt64 {
    return fromStr(this, U64_ZERO, str, radix)
  }

  // fromBytesUnchecked interprets a number from a byte array.
  // The bytes must only contain digits (no "-" or whitespace.)
  //
  static fromByteStr0(
    buf :ArrayLike<byte>,
    radix :int,
    start :int,
    end :int,
  ) :UInt64 {
    return fromByteStr0(this, U64_ZERO, buf, radix, start, end)
  }

  // fromBytes returns an Int64 representing the given ASCII string
  // in the byte array buf, interpreted in radix.
  // If the first byte is "-" (0x2D "hyphen"), then the number is interpreted
  // as being negative, and is subject to the overflow rules of UInt64.
  //
  static fromByteStr(buf :ArrayLike<byte>, radix :int) :UInt64 {
    return fromByteStr(this, U64_ZERO, buf, radix)
  }

  // These are replaced later with common implementations
  static fromBytesLE(_ :ArrayLike<byte>) :Int64 { return U64_ZERO }
  static fromBytesBE(_ :ArrayLike<byte>) :Int64 { return U64_ZERO }

  readonly isSigned :bool = false
  isNeg() :bool { return false }
  isPos() :bool { return true }

  cmp(x :Int64) :int { // this <> x  ->  -1 | 0 | 1
    if (this.eq(x)) {
      return 0
    }
    if (x.isNeg()) {
      return 1
    }
    // at this point the sign bits are the same.
    // both are positive if at least one is unsigned (`this` is unsigned)
    return (
      (x._high >>> 0) > (this._high >>> 0) ||
      ( x._high === this._high && (x._low >>> 0) > (this._low >>> 0) )
      ? -1 : 1
    )
  }

  neg() :UInt64 {
    return this.not().add(S64_ONE)
  }

  div(x :Int64) :UInt64 {
    if (x.eqz()) {
      throw new Error('division by zero')
    }
    if (this.eqz()) {
      // e.g. 0 / 3 = 0
      return U64_ZERO
    }

    if (x.constructor !== UInt64) {
      x = x.toUnsigned()
    }

    if (x.gt(this)) {
      // e.g. 4 / 5 = 0
      return U64_ZERO
    }

    if (x.gt(this.shr_u(1))) {
      // 15 >>> 1 = 7 ; with divisor = 8 ; true
      return U64_ONE
    }

    // Repeat the following until the remainder is less than x:  find a
    // floating-point that approximates remainder / x *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical
    // that the approximate value is less than or equal to the real value so
    // that the remainder never becomes negative.
    let res = U64_ZERO
    let rem :UInt64 = this
    while (rem.gte(x)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      let approx = Math.max(1, Math.floor(rem.toFloat64() / x.toFloat64()))

      // We will tweak the approximate result by changing it in the 48-th digit
      // or the smallest non-fractional digit, whichever is larger.
      let log2 = Math.ceil(Math.log(approx) / Math.LN2)
      let delta = log2 <= 48 ? 1 : Math.pow(2, log2 - 48)

      // Decrease the approximation until it is smaller than the remainder.
      // Note that if it is too large, the product overflows and is negative.
      let approxRes = SInt64.fromFloat64(approx)
      let approxRem = approxRes.mul(x)
      while (approxRem.isNeg() || approxRem.gt(rem)) {
        approx -= delta
        approxRes = UInt64.fromFloat64(approx)
        approxRem = approxRes.mul(x)
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.eqz()) {
        approxRes = S64_ONE
      }

      res = res.add(approxRes)
      rem = rem.sub(approxRem)
    }
    return res
  }

  shr(nbits :int) :Int64 {
    return this.shr_u(nbits)
  }

  toSigned() {
    return new SInt64(this._low, this._high)
  }

  toUnsigned() {
    return this
  }

  toInt32() {
    return this._low >>> 0
  }

  toFloat64() {
    return ((this._high >>> 0) * _TWO_PWR_32_DBL) + (this._low >>> 0)
  }

  toString(radix? :int) :string {
    return toString(this, radix)
  }
}

UInt64.fromBytesLE = SInt64.fromBytesLE
UInt64.fromBytesBE = SInt64.fromBytesBE

// ===========================================================================

// use wasm support if present
if (wasm != null) {
  if (DEBUG) {
    // in debug builds, include the fallback implementations
    // as undocumented properties so that we can tests them

    let SInt64x = SInt64.prototype as any
    let UInt64x = UInt64.prototype as any

    SInt64x._js_mul = SInt64.prototype.mul
    SInt64x._js_div = SInt64.prototype.div
    UInt64x._js_div = UInt64.prototype.div
    SInt64x._js_mod = SInt64.prototype.mod
    UInt64x._js_mod = UInt64.prototype.mod
    SInt64x._js_popcnt = Int64Base.prototype.popcnt
  }

  SInt64.prototype.mul = function mul(m :Int64) :SInt64 {
    let low = wasm.mul(this._low, this._high, m._low, m._high)
    return new SInt64(low, wasm.get_high())
  }

  UInt64.prototype.mul = function mul(m :Int64) :UInt64 {
    let low = wasm.mul(this._low, this._high, m._low, m._high)
    return new UInt64(low, wasm.get_high())
  }

  SInt64.prototype.div = function div(d :Int64) :SInt64 {
    // guard against signed division overflow: the largest
    // negative number / -1 would be 1 larger than the largest
    // positive number, due to two's complement.
    if (this._high === -0x80000000 && d._low === -1 && d._high === -1) {
      // be consistent with non-wasm code path
      return this
    }
    let low = wasm.div_s(this._low, this._high, d._low, d._high)
    return new SInt64(low, wasm.get_high())
  }

  UInt64.prototype.div = function div(d :Int64) :UInt64 {
    let low = wasm.div_u(this._low, this._high, d._low, d._high)
    return new UInt64(low, wasm.get_high())
  }

  SInt64.prototype.mod = function mod(d :Int64) :SInt64 {
    let low = wasm.rem_s(this._low, this._high, d._low, d._high)
    return new SInt64(low, wasm.get_high())
  }

  UInt64.prototype.mod = function mod(d :Int64) :UInt64 {
    let low = wasm.rem_u(this._low, this._high, d._low, d._high)
    return new UInt64(low, wasm.get_high())
  }

  Int64Base.prototype.popcnt = function popcnt() :int {
    return wasm.popcnt(this._low, this._high)
  }
}

SInt64.prototype.shr = Int64Base.prototype.shr_s
UInt64.prototype.shr = Int64Base.prototype.shr_u

const S64_TWO_PWR_24 = new SInt64((1 << 24) | 0, 0)

const S64_MAX    = new SInt64(0xFFFFFFFF | 0, 0x7FFFFFFF | 0)
const S64_MIN    = new SInt64(0, 0x80000000 | 0)
const S64_ZERO   = new SInt64(0 | 0, 0)
const S64_ONE    = new SInt64(1 | 0, 0)
const S64_NEGONE = new SInt64(-1 | 0, -1)

const U64_MAX  = new UInt64(0xFFFFFFFF | 0, 0xFFFFFFFF | 0)
const U64_ZERO = new UInt64(0 | 0, 0)
const U64_ONE  = new UInt64(1 | 0, 0)

;(SInt64 as any).MIN = S64_MIN
;(SInt64 as any).MAX = S64_MAX
;(SInt64 as any).ZERO = S64_ZERO
;(SInt64 as any).ONE = S64_ONE
;(SInt64 as any).ONENEG = S64_NEGONE

;(UInt64 as any).MIN = U64_ZERO
;(UInt64 as any).MAX = U64_MAX
;(UInt64 as any).ZERO = U64_ZERO
;(UInt64 as any).ONE = U64_ONE

let _SInt64_cache = new Map<int,SInt64>([
  [-1, S64_NEGONE],
  [0, S64_ZERO],
  [1, S64_ONE],
])

let _UInt64_cache = new Map<int,UInt64>([
  [0, U64_ZERO],
  [1, U64_ONE],
])
