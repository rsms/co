// generated from arch/arch_covm.rewrite -- do not edit.
import { Value } from "./ssa"
import { ValueRewriter } from "./arch_info"
import { ops } from "./ops"
import * as types from "../types"
import nmath from "../nummath"

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

function rw_CovmADD64(v :Value) :bool {
  // match: (CovmADD64 (ConstI64 [x]) (ConstI64 [y]))
  // sub:   (ConstI64 [x + y])
  while (true) {
    let v_0 = v.args[0]!;
    if (v_0.op != ops.ConstI64) { break }
    let x = v_0.auxInt
    let v_1 = v.args[1]!;
    if (v_1.op != ops.ConstI64) { break }
    let y = v_1.auxInt
    v.reset(ops.ConstI64)
    v.auxInt = nmath.add(x, y)
    return true
  }
  return false
}

function rw_CovmADD32(v :Value) :bool {
  // match: (CovmADD32 (ConstI32 [x]) (ConstI32 [y]))
  // sub:   (ConstI32 [x + y])
  while (true) {
    let v_0 = v.args[0]!;
    if (v_0.op != ops.ConstI32) { break }
    let x = v_0.auxInt
    let v_1 = v.args[1]!;
    if (v_1.op != ops.ConstI32) { break }
    let y = v_1.auxInt
    v.reset(ops.ConstI32)
    v.auxInt = nmath.add(x, y)
    return true
  }
  return false
}

const rw = new Array<ValueRewriter>(8)
rw[ops.NilCheck] = rw_NilCheck
rw[ops.MulI32] = rw_MulI32
rw[ops.AddI32] = rw_AddI32
rw[ops.AddI16] = rw_AddI32
rw[ops.AddI8] = rw_AddI32
rw[ops.AddI64] = rw_AddI64
rw[ops.CovmADD64] = rw_CovmADD64
rw[ops.CovmADD32] = rw_CovmADD32

export function rewriteValue(v :Value) :bool {
  let f = rw[v.op]
  return f ? f(v) : false
}
