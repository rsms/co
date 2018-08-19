//
// constant-folding optimizations
//
import { Num, numconv, isNum } from '../num'
import { Op } from './op'
import { Value, Block } from './ssa'
import { consteval1, consteval2 } from './consteval'


export function optcf_op1(b :Block, op :Op, x :Value) :Value|null {
  if (x.op.constant) {
    assert(isNum(x.aux))
    let val = consteval1(op, x.type, x.aux as Num)
    if (val !== null) {
      return b.f.constVal(x.type, val)
    }
  }
  return null
}


export function optcf_op2(b :Block, op :Op, x :Value, y :Value) :Value|null {
  if (!x.op.constant || !y.op.constant) {
    // one or both operands not constant
    return null
  }

  assert(isNum(x.aux))
  assert(isNum(y.aux))

  let xval = x.aux as Num
  let yval = y.aux as Num

  if (x.type !== y.type) {
    // different types
    let lossless :bool
    ;[yval, lossless] = numconv(yval, x.type)
    if (!lossless) {
      // lossy conversion
      return null
    }
  }

  // attempt to evaluate the operation
  let val = consteval2(op, x.type, xval, yval)

  if (val !== null) {
    return b.f.constVal(x.type, val)
  }

  // unsupported operation
  return null
}



