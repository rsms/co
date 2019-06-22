import { debuglog as dlog } from '../util'
import { RegInfo, Op, ops } from '../ir/op'
import { regBuilder } from '../ir/reg'
import { Value, Block } from '../ir/ssa'
import { ValueRewriter } from '../ir/config'
import { ArchInfo } from './arch'
import * as T from '../types'


// Note: registers not used in regalloc are not included in this list,
// so that regmask stays within int64
// Be careful when hand coding regmasks.
const regNames = [
  "R0",
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
  "R9",
  "R10",
  "R11",
  "R12",
  "R13",
  "R14",
  "R15",

  "F0",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
  "F13",
  "F14",
  "F15",

  "SP",
  "g",

  // pseudo-registers
  "SB",
]

export const buildReg = regBuilder(regNames)

// general-purpose registers
const gp = buildReg(`R0 R1 R2 R3 R4 R5 R6 R7 R8 R9 R10 R11 R12 R13 R14 R15`)

// floating-point registers
const fp = buildReg(`F0 F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 F13 F14 F15`)


// Convenient register sets.
// RegInfo(inputs :RegSet[], outputs :RegSet[])

const gpsp  = gp.or(buildReg("SP"))  // gp + SP
const gpspsb = gpsp.or(buildReg("SB")) // gp + SP + SB
// const gpg   = gp.or(buildReg("g"))   // gp + g
// const gpspg = gpg.or(buildReg("SP")) // gp + SP + g
// The "registers", which are actually variables, can get clobbered
// if we're switching coroutines, because it unwinds the stack.
const callerSave = gp.or(fp).or(buildReg("g")) // gp | fp | g

// Common reginfo.
// Naming schema is <regs> <num-inputs> <num-outputs> [<out-regs>].
// Note: <out-regs> is only included when it's not named in <regs>.
const gp01 = new RegInfo([], [gp])
const gp10 = new RegInfo([gp], [])
const gp21 = new RegInfo([gpsp, gpsp], [gp])
const gp11 = new RegInfo([gpsp], [gp])

// --------------------------------------------------
// HERE BE DRAGONS
//
// Setup Op.reg on all ops in op.ops for covm.
// FIXME: remove this when we have a complete set of aops for covm.
//
for (let name in ops as {[name:string]:Op}) {
  let op = (ops as {[name:string]:Op})[name]
  if (!op.zeroWidth && !op.call) {
    // assign allowed input and output registers
    let regs = gp // gpRegMask  // XXX FIXME this is specific to the covm arch
    // TODO: add reg info to ops above. For instance, ConvI64toF32 accepts
    // inputs in gp regs, and outputs in fp regs.
    if (op.argLen > 0) {
      op.reg.inputs = []
      for (let i = 0; i < op.argLen; i++) {
        op.reg.inputs[i] = { idx: i, regs }
      }
    }
    op.reg.outputs = [ { idx: 0, regs } ]

    // if (name == "AddI32") {
    //   op.reg.inputs = [ { idx: 0, regs: covm_buildReg("R4") } ]
    // }
  }
}
// --------------------------------------------------


// operators
function op(name :string, argLen :int, props? :Partial<Op>) :Op {
  return new Op(name, argLen, props)
}
const aops :{ [name:string] : Op } = {

  MOVWconst: op("MOVWconst", 0, {
    reg: gp01,
    aux: T.t_u32,
    type: T.t_u32,
    rematerializeable: true,
  }),

  // arg0 + arg1
  ADDW: op("ADDW", 2, { reg: gp21, type: T.t_u32, commutative: true }),

  // arg0 + aux
  ADDWconst: op("ADDWconst", 1, {
    reg: gp11,
    type: T.t_u32,
    aux: T.t_u32,
    commutative: true,
  }),

  // panic if arg0 is nil.  arg1=mem.
  LowNilCheck: op("LowNilCheck", 2, {
    reg: gp10,
    nilCheck: true,
    faultOnNilArg0: true,
  }),

}

// value-lowering functions
//
// TODO: generate these from rules instead of manually defining them.
//
const valueLoweringFuns = new Map<Op,ValueRewriter>([

  [ ops.NilCheck, (v :Value) :bool => {
    // match: (NilCheck ptr mem)
    // cond:
    // result: (LowNilCheck ptr mem)
    v.op = aops.LowNilCheck
    // let [ptr, mem] = v.args
    // v.reset(aops.LowNilCheck)
    // v.addArg(ptr)
    // v.addArg(mem)
    return true
  } ],

  [ ops.ConstI32, (v :Value) :bool => {
    // match: (ConstI32 [val])
    // cond:
    // result: (MOVWconst [val])
    let val = v.aux
    v.reset(aops.MOVWconst)
    v.aux = val
    return true
  } ],

  [ ops.AddI32, (v :Value) :bool => {
    // match: (AddI32 x y)
    // cond:
    // result: (ADDW x y)
    let [x, y] = v.args
    v.reset(aops.ADDW)
    v.addArg(x)
    v.addArg(y)
    return true
  } ],



  [ aops.ADDW, (v :Value) :bool => {
    // Based on rewriteValueMIPS_OpMIPSADD_0

    // match: (ADD x (MOVWconst [c]))
    // cond:
    // result: (ADDWconst [c] x)
    while (true) {
      let x = v.args[0]
      let v_1 = v.args[1]
      if (v_1.op !== aops.MOVWconst) { break } // nomatch
      let c = v_1.aux
      v.reset(aops.ADDWconst)
      v.aux = c
      v.addArg(x)
      dlog(`rewrite ${v} (ADD x (MOVWconst [c])) -> (ADDWconst [c] x)`)
      return true
    }

    return false
  } ],

])

function lowerValueCovm(v :Value) :bool {
  let lf = valueLoweringFuns.get(v.op)
  return lf ? lf(v) : false
}


function lowerBlockCovm(_ :Block) :bool {
  return false
}


// Exported arch info
export default new ArchInfo("covm", {
  addrSize:   4,
  ops:        Object.values(aops),
  regNames:   regNames,
  gpRegMask:  gp,
  fpRegMask:  fp,
  lowerBlock: lowerBlockCovm,
  lowerValue: lowerValueCovm,
})
