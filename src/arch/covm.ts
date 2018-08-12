import { Op } from '../ir/op'
import { RegSet, emptyRegSet, regBuilder } from '../ir/reg'
import { UInt64 } from '../int64'
import { ArchInfo } from './arch'

// Note: registers not used in regalloc are not included in this list,
// so that regmask stays within int64
// Be careful when hand coding regmasks.
const regNames = [
  "R0", // constant 0
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
  "R16",
  "R17",
  "R18",
  "R19",
  "R20",
  "R21",
  "R22",
  //REGTMP
  "R24",
  "R25",
  // R26 reserved by kernel
  // R27 reserved by kernel
  "R28",
  "R29",
  "SP",  // aka R30
  "g",   // aka R31

  "F0",
  "F2",
  "F4",
  "F6",
  "F8",
  "F10",
  "F12",
  "F14",
  "F16",
  "F18",
  "F20",
  "F22",
  "F24",
  "F26",
  "F28",
  "F30",

  // pseudo-registers
  "SB",
]

export const buildReg = regBuilder(regNames)

// general-purpose registers
const gp = buildReg(`
  R1  R2  R3  R4  R5  R6  R7  R8  R9  R10 R11 R12 R13 R14 R15 R16
  R17 R18 R19 R20 R21 R22     R24 R25         R28 R29
`)

// floating-point registers
const fp = buildReg(`
  F0 F2 F4 F6 F8 F10 F12 F14 F16 F18 F20 F22 F24 F26 F28 F30
`)

const ops :Op[] = []

export default new ArchInfo("covm", {
  addrSize:  4,
  ops:       ops,
  regNames:  regNames,
  gpRegMask: gp,
  fpRegMask: fp,
})
