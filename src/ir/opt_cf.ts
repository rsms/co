//
// constant-folding optimizations
//
import { numconv } from '../numconv'
import { Op } from './op'
import { opinfo } from "./ops"
import { Value, Block } from './ssa'
import { consteval1, consteval2 } from './consteval'


export function optcf_op1(b :Block, op :Op, x :Value) :Value|null {
  if (opinfo[x.op].constant) {
    let val = consteval1(op, x.type, x.auxInt)
    if (val !== null) {
      return b.f.constVal(x.type, val)
    }
  }
  return null
}


export function optcf_op2(b :Block, op :Op, x :Value, y :Value) :Value|null {
  if (!opinfo[x.op].constant || !opinfo[y.op].constant) {
    // one or both operands not constant
    return null
  }

  let xval = x.auxInt
  let yval = y.auxInt

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



