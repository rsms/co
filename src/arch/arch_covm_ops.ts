//
// co vm operators
//
import {
  ArchDescr,
  t, // types
  OpDescription,
  ZeroWidth,
  Constant,
  Commutative,
  ResultInArg0,
  ResultNotInArgs,
  Rematerializeable,
  ClobberFlags,
  Call,
  NilCheck,
  FaultOnNilArg0,
  FaultOnNilArg1,
  UsesScratch,
  HasSideEffects,
  Generic,
} from './describe'
import { regInfo, regBuilder } from "../ir/reg"

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

const buildReg = regBuilder(regNames)

// general-purpose registers (RegSet)
const gp = buildReg(`R0 R1 R2 R3 R4 R5 R6 R7 R8 R9 R10 R11 R12 R13 R14 R15`)

// floating-point registers (RegSet)
const fp = buildReg(`F0 F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 F13 F14 F15`)


// Convenient register sets.
// RegInfo(inputs :RegSet[], outputs :RegSet[])
const gpsp  = gp.or(buildReg("SP"))  // gp + SP
// const gpspsb = gpsp.or(buildReg("SB")) // gp + SP + SB
// const gpg   = gp.or(buildReg("g"))   // gp + g
// const gpspg = gpg.or(buildReg("SP")) // gp + SP + g

// The "registers", which are actually variables, can get clobbered
// if we're switching coroutines, because it unwinds the stack. [go-wasm]
// const callerSave = gp.or(fp).or(buildReg("g")) // gp | fp | g

// Common reginfo.
// Naming schema is <regs> <num-inputs> <num-outputs> [<out-regs>].
// Note: <out-regs> is only included when it's not named in <regs>.
const gp01 = regInfo([], [gp])
const gp10 = regInfo([gp], [])
const gp21 = regInfo([gpsp, gpsp], [gp])
const gp11 = regInfo([gpsp], [gp])

// operators
const ops :OpDescription[] = [

  ["MOV32const", Rematerializeable, t.u32, { reg: gp01, aux: "Int32" }],

  ["ADD32", 2, Commutative, t.u32, { reg: gp21 }], // arg0 + arg1
  ["ADD32const", 1, Commutative, t.u32, { reg: gp11, aux: "Int32" }], // arg0 + aux
  ["ADD64", 2, Commutative, t.u64, { reg: gp21 }], // arg0 + arg1

  ["MUL32", 2, Commutative, t.u32, { reg: gp21 }], // arg0 + arg1

  ["ZeroLarge", 2, { reg: gp10, aux: "Int64" }],  // large zeroing. arg0=start, arg1=mem, auxInt=len/8, returns mem

  ["LowNilCheck", 2, NilCheck, FaultOnNilArg0, { reg: gp10 }], // panic if arg0 is nil. arg1=mem.

]

export default {
  arch: "covm",

  ops,

  addrSize: 4,
  regSize:  4,
  intSize:  4,

  registers: regNames.map((name, num) => ({ num, name })),

  hasGReg: regNames.includes("g"),
  gpRegMask: gp,
  fpRegMask: fp,
} as ArchDescr
