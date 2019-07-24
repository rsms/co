import { Num } from '../num'
import { Int64 } from '../int64'
import { PrimType } from '../ast'
import { Op } from './op'
import { ops, fmtop } from "./ops"


// consteval2 evaluates the operation op with x and y of result type t
//
export function consteval2(op :Op, t :PrimType, x :Num, y :Num) :Num|null {
  // work around typescript
  const xn = x as number
  const yn = y as number
  const xo = x as Int64
  const yo = y as Int64

  assert(t.storageSize() > 0, `attempt to eval zero-size type ${t}`)

  switch (op) {

  // x + y
  case ops.AddI8:
  case ops.AddI16:
  case ops.AddI32:
    return t.isSIntType() ? (xn + yn | 0) : (xn + yn >>> 0)
   case ops.AddI64:
    return xo.add(yo)
  case ops.AddF32:
  case ops.AddF64:
    return (xn as int) + (yn as int)

  // x - y
  case ops.SubI8:
  case ops.SubI16:
  case ops.SubI32:
    return t.isSIntType() ? (xn - yn | 0) : (xn - yn >>> 0)
  case ops.SubI64:
    return xo.sub(yo)
  case ops.SubF32:
  case ops.SubF64:
    return xn - yn

  // x * y
  case ops.MulI8:
  case ops.MulI16:
  case ops.MulI32:
    return t.isSIntType() ? Math.imul(xn, yn) : (Math.imul(xn, yn) >>> 0)
  case ops.MulI64:
    return xo.mul(yo)
  case ops.MulF32:
  case ops.MulF64:
    return xn * yn

  // x / y
  case ops.DivS8:
  case ops.DivS16:
  case ops.DivS32:
    return xn / yn | 0
  case ops.DivU8:
  case ops.DivU16:
  case ops.DivU32:
    return xn / yn >>> 0
  case ops.DivS64:
  case ops.DivU64:
    return xo.div(yo)
  case ops.DivF32:
  case ops.DivF64:
    return xn / yn

  // x % y
  case ops.RemS8:
  case ops.RemS16:
  case ops.RemS32:
    return xn % yn | 0
  case ops.RemU8:
  case ops.RemU16:
  case ops.RemU32:
    return xn % yn >>> 0
  case ops.RemI64:
  case ops.RemU64:
    return xo.mod(yo)

  // x & y
  case ops.AndI8:
  case ops.AndI16:
  case ops.AndI32:
    return xn & yn
  case ops.AndI64:
    return xo.and(yo)

  // x | y
  case ops.OrI8:
  case ops.OrI16:
  case ops.OrI32:
    return xn | yn
  case ops.OrI64:
    return xo.or(yo)

  // x ^ y
  case ops.XorI8:
  case ops.XorI16:
  case ops.XorI32:
    return xn ^ yn
  case ops.XorI64:
    return xo.xor(yo)

  // x << y
  case ops.ShLI8x8:
  case ops.ShLI8x16:
  case ops.ShLI8x32:
  case ops.ShLI16x8:
  case ops.ShLI16x16:
  case ops.ShLI16x32:
  case ops.ShLI32x8:
  case ops.ShLI32x16:
  case ops.ShLI32x32:
    return xn << yn
  case ops.ShLI8x64:
  case ops.ShLI16x64:
  case ops.ShLI32x64:
    return xn << yo.toUInt32()
  case ops.ShLI64x8:
  case ops.ShLI64x16:
  case ops.ShLI64x32:
  case ops.ShLI64x64:
    return xo.shl(yo.toUInt32())

  // x >> y ; sign-replicating (arithmetic) shift right
  case ops.ShRS8x8:
  case ops.ShRS8x16:
  case ops.ShRS8x32:
  case ops.ShRS16x8:
  case ops.ShRS16x16:
  case ops.ShRS16x32:
  case ops.ShRS32x8:
  case ops.ShRS32x16:
  case ops.ShRS32x32:
    return xn >> yn
  case ops.ShRS8x64:
  case ops.ShRS16x64:
  case ops.ShRS32x64:
    return xn >> yo.toUInt32()
  case ops.ShRS64x8:
  case ops.ShRS64x16:
  case ops.ShRS64x32:
  case ops.ShRS64x64:
    return xo.shr(yo.toUInt32())

  // x >> y (aka >>>) ; zero-replicating (logical) shift right
  case ops.ShRU8x8:
  case ops.ShRU8x16:
  case ops.ShRU8x32:
  case ops.ShRU16x8:
  case ops.ShRU16x16:
  case ops.ShRU16x32:
  case ops.ShRU32x8:
  case ops.ShRU32x16:
  case ops.ShRU32x32:
    return xn >>> yn
  case ops.ShRU8x64:
  case ops.ShRU16x64:
  case ops.ShRU32x64:
    return xn >>> yo.toUInt32()
  case ops.ShRU64x8:
  case ops.ShRU64x16:
  case ops.ShRU64x32:
  case ops.ShRU64x64:
    return xo.shr(yo.toUInt32())

  // x == y
  case ops.EqI8:
  case ops.EqI16:
  case ops.EqI32:
  case ops.EqF32:
  case ops.EqF64:
    return xn === yn ? 1 : 0
  case ops.EqI64:
    return xo.eq(yo) ? 1 : 0

  // x != y
  case ops.NeqI8:
  case ops.NeqI16:
  case ops.NeqI32:
  case ops.NeqF32:
  case ops.NeqF64:
    return xn !== yn ? 1 : 0
  case ops.NeqI64:
    return xo.neq(yo) ? 1 : 0

  // x < y
  case ops.LessS8:
  case ops.LessU8:
  case ops.LessS16:
  case ops.LessU16:
  case ops.LessS32:
  case ops.LessU32:
  case ops.LessF32:
  case ops.LessF64:
    return xn < yn ? 1 : 0
  case ops.LessS64:
  case ops.LessU64:
    return xo.lt(yo) ? 1 : 0

  // x <= y
  case ops.LeqS8:
  case ops.LeqU8:
  case ops.LeqS16:
  case ops.LeqU16:
  case ops.LeqS32:
  case ops.LeqU32:
  case ops.LeqF32:
  case ops.LeqF64:
    return xn <= yn ? 1 : 0
  case ops.LeqS64:
  case ops.LeqU64:
    return xo.lte(yo) ? 1 : 0

  // x > y
  case ops.GreaterS8:
  case ops.GreaterU8:
  case ops.GreaterS16:
  case ops.GreaterU16:
  case ops.GreaterS32:
  case ops.GreaterU32:
  case ops.GreaterF32:
  case ops.GreaterF64:
    return xn > yn ? 1 : 0
  case ops.GreaterS64:
  case ops.GreaterU64:
    return xo.gt(yo) ? 1 : 0

  // x >= y
  case ops.GeqS8:
  case ops.GeqU8:
  case ops.GeqS16:
  case ops.GeqU16:
  case ops.GeqS32:
  case ops.GeqU32:
  case ops.GeqF32:
  case ops.GeqF64:
    return xn >= yn ? 1 : 0
  case ops.GeqS64:
  case ops.GeqU64:
    return xo.gte(yo) ? 1 : 0

  // min(x, y)
  case ops.MinF32:
  case ops.MinF64:
    return Math.min(xn, yn)

  // min(x, y)
  case ops.MaxF32:
  case ops.MaxF64:
    return Math.max(xn, yn)

  } // switch

  // Note:
  //  AND_NOT "x &^ y"
  //   x & ~y
  //   xo.and(yo.not())
  //
  assert(false, `unexpected ${fmtop(op)}`)
  return null
}


// consteval1 evaluates the operation op with x of result type t
//
export function consteval1(_op :Op, _t :PrimType, _x :Num) :Num|null {
  // TODO: implementation
  return null
}


// function f_to_i32(n :number) {
//   return n < 0 ? Math.ceil(n) : Math.floor(n)
// }

// function f_to_u32(n :number) {
//   n = toi32(n)
//   return n - Math.floor(n / 0x100000000) * 0x100000000
// }

// function eval_op1(op :Op, t :PrimType, x :number) :number {
//   switch (op) {
//   case Op.i32Clz: return Math.clz32(x)
//   }
//   return NaN
// }

// // popcnt32 returns the number of set bits in n
// //
// function popcnt32(n :int) :int {
//   n = n - ((n >> 1) & 0x55555555)
//   n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
//   return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
// }
//
// function popcnt32(n) {
//   let c = 0
//   for (; n; c++) {
//     n &= n - 1  // clear the least significant bit set
//   }
//   return c
// }
