//
// constant-folding optimizations
//
import { BasicType, IntType } from '../types'
import { Num, numconv } from '../num'
import { Op, ops } from './op'
import { Value, Block } from './ssa'
import { consteval2 } from './consteval'


export function optcf_op1(_b :Block, _op :Op, _x :Value) :Value|null {
  // TODO implement unary operations
  return null
}


export function optcf_op2(b :Block, op :Op, x :Value, y :Value) :Value|null {
  if (!x.op.constant || !y.op.constant) {
    // one or both operands not constant
    return null
  }

  let xval = x.aux as Num
  let yval = y.aux as Num

  if (x.type !== y.type) {
    // different types
    yval = numconv(yval, x.type)[0]
    // TODO: warn here if not lossless?
  }

  // attempt to evaluate the operation
  let val = consteval2(op, x.type, xval, yval)

  if (val !== null) {
    return b.f.constVal(x.type, val)
  }

  // unsupported operation
  return null
}



