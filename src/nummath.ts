import { Num } from "./num"
import { Int64, SInt64, UInt64 } from "./int64"

export default {


  // binary operators

  add(x :Num, y :Num) :Num {  // +
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x + y }
      x = SInt64.fromInt32(x)
    }
    return x.add(y as Int64)
  },

  sub(x :Num, y :Num) :Num {  // -
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x - y }
      x = SInt64.fromInt32(x)
    }
    return x.sub(y as Int64)
  },

  mul(x :Num, y :Num) :Num {  // *
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x * y }
      x = SInt64.fromInt32(x)
    }
    return x.mul(y as Int64)
  },

  div(x :Num, y :Num) :Num {  // /
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x / y }
      x = SInt64.fromInt32(x)
    }
    return x.div(y as Int64)
  },

  mod(x :Num, y :Num) :Num {  // %
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x % y }
      x = SInt64.fromInt32(x)
    }
    return x.mod(y as Int64)
  },

  band(x :Num, y :Num) :Num {  // &
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x & y }
      x = SInt64.fromInt32(x)
    }
    return x.and(y as Int64)
  },

  bor(x :Num, y :Num) :Num {  // |
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x | y }
      x = SInt64.fromInt32(x)
    }
    return x.or(y as Int64)
  },

  xor(x :Num, y :Num) :Num {  // ^
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x ^ y }
      x = SInt64.fromInt32(x)
    }
    return x.xor(y as Int64)
  },

  // exp(x :Num, y :Num) :Num {  // **
  //   if (typeof x == 'number') {
  //     if (typeof y == 'number') { return x ** y }
  //     x = SInt64.fromInt32(x)
  //   }
  //   return x.exp(y as Int64) // unsupported
  // },

  lshift(x :Num, y :Num) :Num {  // <<
    if (typeof y != 'number') { y = y.toUInt32() }
    if (typeof x == 'number') { return x << y }
    return x.shl(y)
  },

  rshift(x :Num, y :Num) :Num {  // >>
    if (typeof y != 'number') { y = y.toUInt32() }
    if (typeof x == 'number') { return x >> y }
    return x.shr(y)
  },

  rshiftz(x :Num, y :Num) :Num {  // >>>
    if (typeof y != 'number') { y = y.toUInt32() }
    if (typeof x == 'number') { return x >>> y }
    return x.shr_u(y)
  },

  lt(x :any, y :any) :bool {  // <
    let yIsI64 = y instanceof SInt64 || y instanceof UInt64
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x < y }
      if (yIsI64) {
        x = SInt64.fromInt32(x)
      }
    }
    if ((x instanceof SInt64 || x instanceof UInt64) && yIsI64) {
      return x.lt(y)
    }
    return x < y
  },

  gt(x :any, y :any) :bool {  // >
    let yIsI64 = y instanceof SInt64 || y instanceof UInt64
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x > y }
      if (yIsI64) {
        x = SInt64.fromInt32(x)
      }
    }
    if ((x instanceof SInt64 || x instanceof UInt64) && yIsI64) {
      return x.gt(y)
    }
    return x > y
  },

  lte(x :any, y :any) :bool {  // <=
    let yIsI64 = y instanceof SInt64 || y instanceof UInt64
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x <= y }
      if (yIsI64) {
        x = SInt64.fromInt32(x)
      }
    }
    if ((x instanceof SInt64 || x instanceof UInt64) && yIsI64) {
      return x.lte(y)
    }
    return x <= y
  },

  gte(x :any, y :any) :bool {  // >=
    let yIsI64 = y instanceof SInt64 || y instanceof UInt64
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x >= y }
      if (yIsI64) {
        x = SInt64.fromInt32(x)
      }
    }
    if ((x instanceof SInt64 || x instanceof UInt64) && yIsI64) {
      return x.gte(y)
    }
    return x >= y
  },

  neq(x :any, y :any) :bool {  // !=, !==
    let yIsI64 = y instanceof SInt64 || y instanceof UInt64
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x != y }
      if (yIsI64) {
        x = SInt64.fromInt32(x)
      }
    }
    if ((x instanceof SInt64 || x instanceof UInt64) && yIsI64) {
      return x.neq(y)
    }
    return x !== y
  },

  eq(x :any, y :any) :bool {  // ==, ===
    let yIsI64 = y instanceof SInt64 || y instanceof UInt64
    if (typeof x == 'number') {
      if (typeof y == 'number') { return x == y }
      if (yIsI64) {
        x = SInt64.fromInt32(x)
      }
    }
    if ((x instanceof SInt64 || x instanceof UInt64) && yIsI64) {
      return x.eq(y)
    }
    return x === y
  },


  // unary prefix operators

  incr(x :Num) :Num { // ++
    if (typeof x == 'number') { return ++x }
    return x.add(UInt64.ONE)
  },

  decr(x :Num) :Num { // --
    if (typeof x == 'number') { return --x }
    return x.sub(UInt64.ONE)
  },

  neg(x :Num) :Num { // -
    if (typeof x == 'number') { return -x }
    return x.neg()
  },

  bnot(x :Num) :Num { // ~
    if (typeof x == 'number') { return ~x }
    return x.not()
  },

  not(x :Num) :bool { // !
    if (typeof x == 'number') { return !x }
    return x.isZero()
  },


}
