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

  if (x.op !== y.op) {
    // different types -- need to convert
    dlog(`TODO convert types ${Op[x.op]}/${Op[y.op]}`)
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


function eval_op2(op :Op, t :BasicType, x :number, y :number) :number {
  //
  // FIXME TODO use bigint or something like that so we can actually
  // control the result. With this naïve JS-number-based implementation, we
  // can easily end up producing numbers larger than int32 or even int64,
  // which obviously is wrong.
  //
  // Test case 1:
  //   a, b u32 = 0xFFFFFFFF, 2
  //   c u32 = a + b
  //   // c should be 1
  //
  // Test case 2:
  //   a, b i32 = 0x7FFFFFFF, 1
  //   c i32 = a + b
  //   // c should be -2147483648 (-0x80000000)
  //
  switch (op) {
  case Op.i32Add: return x + y
  case Op.i32Sub: return x - y
  case Op.i32Mul: return (
    (t as IntType).signed ?
    toi32(Math.round(x * y)) :
    tou32(Math.round(x * y))
  )
  case Op.i32Div_s: return toi32(Math.round(x / y))
  case Op.i32Div_u: return tou32(Math.round(x / y))
  case Op.i32Rem_s: return toi32(Math.round(x % y))
  case Op.i32Rem_u: return tou32(Math.round(x % y))
  case Op.i32And: return (
    (t as IntType).signed ?
    toi32(Math.round(x & y)) :
    tou32(Math.round(x & y))
  )
  case Op.i32Or: return (
    (t as IntType).signed ?
    toi32(Math.round(x | y)) :
    tou32(Math.round(x | y))
  )
  case Op.i32Xor: return (
    (t as IntType).signed ?
    toi32(Math.round(x ^ y)) :
    tou32(Math.round(x ^ y))
  )
  case Op.i32Shl: return (
    (t as IntType).signed ?
    toi32(Math.round(x << y)) :
    tou32(Math.round(x << y))
  )
  case Op.i32Eq:   return x == y ? 1 : 0
  case Op.i32Ne:   return x != y ? 1 : 0
  case Op.i32Lt_s:
  case Op.i32Lt_u: return x <  y ? 1 : 0
  case Op.i32Le_s:
  case Op.i32Le_u: return x <= y ? 1 : 0
  case Op.i32Gt_s:
  case Op.i32Gt_u: return x >  y ? 1 : 0
  case Op.i32Ge_s:
  case Op.i32Ge_u: return x >= y ? 1 : 0
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


function toi32(n :number) {
  return n < 0 ? Math.ceil(n) : Math.floor(n)
}

function tou32(n :number) {
  n = toi32(n)
  return n - Math.floor(n / 0x100000000) * 0x100000000
}
