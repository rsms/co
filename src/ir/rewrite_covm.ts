// generated from arch/arch_covm.rewrite -- do not edit.
import { Value } from "./ssa"
import { ValueRewriter } from "./arch_info"
import { ops } from "./ops"
import { types, PrimType } from "../ast"
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

function rw_Call(v :Value) :bool {
  // match: Call
  // sub:   CovmCALL
  v.op = ops.CovmCALL
  return true
}

function rw_OffPtr(v :Value) :bool {
  // match: (OffPtr [off] ptr)
  // sub:   (CovmADD32const [off] ptr)
  let off = v.auxInt
  let ptr = v.args[0]!;
  v.reset(ops.CovmADD32const)
  v.auxInt = off
  v.addArg(ptr)
  return true
}

function rw_Load(v :Value) :bool {
  // match: (Load <t> ptr mem)
  // cond:  t.isI32() || t.isPtr()
  // sub:   (CovmLoad32 ptr mem)
  while (true) {
    let t = v.type
    let ptr = v.args[0]!;
    let mem = v.args[1]!;
    if (!(t.isI32() || t.isPtr())) { break }
    v.reset(ops.CovmLoad32)
    v.addArg(ptr)
    v.addArg(mem)
    return true
  }
  return false
}

function rw_Store(v :Value) :bool {
  // match: (Store {t} ptr val mem)
  // cond:  t instanceof PrimType && t.isI32()
  // sub:   (CovmStore32 ptr val mem)
  while (true) {
    let t = v.aux
    let ptr = v.args[0]!;
    let val = v.args[1]!;
    let mem = v.args[2]!;
    if (!(t instanceof PrimType && t.isI32())) { break }
    v.reset(ops.CovmStore32)
    v.addArg(ptr)
    v.addArg(val)
    v.addArg(mem)
    return true
  }
  return false
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

function rw_CovmLoad32(v :Value) :bool {
  // match: (CovmLoad32 [off1] {sym} (CovmADD32const [off2] ptr) mem)
  // cond:  isI32(off1+off2)
  // sub:   (CovmLoad32 [off1+off2] {sym} ptr mem)
  while (true) {
    let off1 = v.auxInt
    let sym = v.aux
    let v_0 = v.args[0]!;
    if (v_0.op != ops.CovmADD32const) { break }
    let off2 = v_0.auxInt
    let ptr = v_0.args[0]!;
    let mem = v.args[1]!;
    if (!(nmath.isI32(nmath.add(off1, off2)))) { break }
    v.reset(ops.CovmLoad32)
    v.auxInt = nmath.add(off1, off2)
    v.aux = sym
    v.addArg(ptr)
    v.addArg(mem)
    return true
  }
  return false
}

function rw_CovmStore32(v :Value) :bool {
  // match: (CovmStore32 [off1] {sym} (CovmADD32const [off2] ptr) val mem)
  // cond:  isI32(off1+off2)
  // sub:   (CovmStore32 [off1+off2] {sym} ptr val mem)
  while (true) {
    let off1 = v.auxInt
    let sym = v.aux
    let v_0 = v.args[0]!;
    if (v_0.op != ops.CovmADD32const) { break }
    let off2 = v_0.auxInt
    let ptr = v_0.args[0]!;
    let val = v.args[1]!;
    let mem = v.args[2]!;
    if (!(nmath.isI32(nmath.add(off1, off2)))) { break }
    v.reset(ops.CovmStore32)
    v.auxInt = nmath.add(off1, off2)
    v.aux = sym
    v.addArg(ptr)
    v.addArg(val)
    v.addArg(mem)
    return true
  }
  return false
}

const rw = new Array<ValueRewriter>(14)
rw[ops.NilCheck] = rw_NilCheck
rw[ops.MulI32] = rw_MulI32
rw[ops.AddI32] = rw_AddI32
rw[ops.AddI16] = rw_AddI32
rw[ops.AddI8] = rw_AddI32
rw[ops.AddI64] = rw_AddI64
rw[ops.Call] = rw_Call
rw[ops.OffPtr] = rw_OffPtr
rw[ops.Load] = rw_Load
rw[ops.Store] = rw_Store
rw[ops.CovmADD64] = rw_CovmADD64
rw[ops.CovmADD32] = rw_CovmADD32
rw[ops.CovmLoad32] = rw_CovmLoad32
rw[ops.CovmStore32] = rw_CovmStore32

export function rewriteValue(v :Value) :bool {
  let f = rw[v.op]
  return f ? f(v) : false
}
