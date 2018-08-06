import { UInt64 } from '../int64'

// A Register is a machine register, like AX.
// They are numbered densely from 0 (for each architecture).
export interface Register {
  num    :int // dense numbering
  name   :string
  // objNum :int // arch-specific register number
}


export type Reg = int // uint8
export type RegSet = UInt64  // each bit corresponds to a register

export const emptyRegSet = UInt64.ZERO


export function fmtRegSet(m :RegSet) :string {
  let s = "[" + m.toString(2) + "]"
  for (let r :Reg = 0 >>> 0; !m.isZero(); r++) {
    if (m.shr(r & 1).isZero()) { // m >> r&1 == 0
      continue
    }
    m = m.and(UInt64.ONE.shl(r)) // m &^= RegSet(1) << r
    if (s != "") {
      s += " "
    }
    s += `r${r}`
  }
  return s
}
