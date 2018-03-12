import { BasicType, IntType } from './ast'
import { Block, Value, Op } from './ir'
import { debuglog as dlog } from './util'

export function optcf_op1(b :Block, op :Op, x :Value) :Value|null {
  // TODO implement unary operations
  return null
}


export function optcf_op2(b :Block, op :Op, x :Value, y :Value) :Value|null {
  if (
    Op.const_begin >= x.op || x.op >= Op.const_end ||
    Op.const_begin >= y.op || y.op >= Op.const_end
  ) {
    // one or both operands not constant
    return null
  }

  let t = x.type

  if (x.type !== y.type) {
    // different types -- need to convert
    // TODO: we should make sure this can't happen by doing any conversions
    // as straight-line code before operations.
    dlog(`TODO convert types ${Op[x.op]}/${Op[y.op]} (${x.type}/${y.type})`)
    return null
  }
  
  // dlog(
  //   `eval: ${Op[op]} ${x.aux} ${y.aux} ` +
  //   ` (${x} <${Op[x.op]}>, ${y} <${Op[y.op]}>)`
  // )

  assert(typeof x.aux == 'number', 'const (x) without number aux')
  assert(typeof y.aux == 'number', 'const (y) without number aux')

  // attempt to evaluate the operation
  let r = eval_op2(op, t, x.aux as number, y.aux as number)
  if (isNaN(r)) {
    // unsupported operation
    return null
  }

  return b.f.constVal(t, r)
}


// function eval_op1(op :Op, t :BasicType, x :number) :number {
//   switch (op) {
//   case Op.i32Clz: return Math.clz32(x)
//   }
//   return NaN
// }


function eval_op2(op :Op, t :BasicType, x :number, y :number) :number {
  //
  // FIXME TODO use bigint or something for 64-bit integers.
  //
  // JS tricks for 32-bit integers:
  //   i32: n | 0
  //   u32: n >>> 0
  // Example:
  //   add_i32 (a :i32, b :i32) :i32 => (a + b) | 0
  //   add_u32 (a :u32, b :u32) :u32 => (a + b) >>> 0
  //
  switch (op) {

  // addition and subtraction
  case Op.i32Add: return (t as IntType).signed ?
    x + y | 0 :
    x + y >>> 0
  case Op.i32Sub: return (t as IntType).signed ?
    x - y | 0 :
    x - y >>> 0

  // multiplication and division
  case Op.i32Mul:   return (t as IntType).signed ?
    Math.imul(x, y) :
    Math.imul(x, y) >>> 0
  case Op.i32Div_s: return x / y | 0
  case Op.i32Div_u: return x / y >>> 0
  case Op.i32Rem_s: return x % y | 0
  case Op.i32Rem_u: return x % y >>> 0

  // bitwise operations are automatically cast to int32 by JS
  case Op.i32And:   return x & y
  case Op.i32Or:    return x | y
  case Op.i32Xor:   return x ^ y
  case Op.i32Shl:   return x << y
  case Op.i32Shr_u: return x >>> y
  case Op.i32Shr_s: return x >> y

  // comparison
  case Op.i32Eq:   return x == y ? 1 : 0
  case Op.i32Ne:   return x != y ? 1 : 0
  case Op.i32Lt_s: return x <  y ? 1 : 0
  case Op.i32Lt_u: return x >>> 0 < y >>> 0 ? 1 : 0
  case Op.i32Le_s: return x <= y ? 1 : 0
  case Op.i32Le_u: return x >>> 0 <= y >>> 0 ? 1 : 0
  case Op.i32Gt_s: return x >  y ? 1 : 0
  case Op.i32Gt_u: return x >>> 0 > y >>> 0 ? 1 : 0
  case Op.i32Ge_s: return x >= y ? 1 : 0
  case Op.i32Ge_u: return x >>> 0 >= y >>> 0 ? 1 : 0

  default: {
    dlog(`TODO implement op ${Op[op]}`)
  }
  } // switch (op)

  // for float and i64, we need to check for MAX_SAFE_INTEGER overflow:
  // if (r > Number.MAX_SAFE_INTEGER) {
  //   dlog(`deopt: evaluated result larger than `)
  //   return null
  // }
  return NaN
}


// function toi32(n :number) {
//   return n < 0 ? Math.ceil(n) : Math.floor(n)
// }

// function tou32(n :number) {
//   n = toi32(n)
//   return n - Math.floor(n / 0x100000000) * 0x100000000
// }
