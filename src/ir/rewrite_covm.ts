// generated from arch/arch_covm.rewrite -- do not edit.
import { Value } from "./ssa"
import { ValueRewriter } from "./arch_info"
import { ops } from "./ops"
import * as types from "../types"

function rw_NilCheck(v :Value) :bool {
  // match: NilCheck
  // sub:   CovmLowNilCheck
  v.op = ops.CovmLowNilCheck
  return true
}

function rw_MulI32(v :Value) :bool {
  // match: MulI32
  // sub:   CovmMUL32
  v.op = ops.CovmMUL32
  return true
}

function rw_AddI32(v :Value) :bool {
  // match: (AddI(32|16|8) x y)
  // sub:   (CovmADD32 x y)
  let x = v.args[0]!;
  let y = v.args[1]!;
  v.reset(ops.CovmADD32)
  v.addArg(x)
  v.addArg(y)
  return true
}

function rw_AddI64(v :Value) :bool {
  // match: AddI64
  // sub:   CovmADD64
  v.op = ops.CovmADD64
  return true
}

const rw = new Array<ValueRewriter>(6)
rw[ops.NilCheck] = rw_NilCheck
rw[ops.MulI32] = rw_MulI32
rw[ops.AddI32] = rw_AddI32
rw[ops.AddI16] = rw_AddI32
rw[ops.AddI8] = rw_AddI32
rw[ops.AddI64] = rw_AddI64

export function rewriteValue(v :Value) :bool {
  let f = rw[v.op]
  return f ? f(v) : false
}
