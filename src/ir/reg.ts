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
export const noReg :Reg = 255


export interface RegInfoEntry {
  idx  :int    // index in Args array
  regs :RegSet // allowed input registers
}

export interface RegInfo {
  // inputs and outputs are ordered in register allocation order
  readonly inputs   :RegInfoEntry[]  // allowed input registers
  readonly outputs  :RegInfoEntry[]  // allowed output registers
  readonly clobbers :RegSet
}

export function regInfo(
  inputs   :RegSet[],
  outputs  :RegSet[],
  clobbers :RegSet = emptyRegSet
) :RegInfo {
  return {
    inputs: inputs.map((regs, idx) => ({ idx, regs })),
    outputs: outputs.map((regs, idx) => ({ idx, regs })),
    clobbers: clobbers,
  }
}

export const nilRegInfo = regInfo([], [], emptyRegSet)


export function fmtRegSet(m :RegSet) :string {
  let s = '{'
  for (let r :Reg = 0 >>> 0; !m.isZero(); r++) {
    if (m.shr(r & 1).isZero()) { // m >> r&1 == 0
      continue
    }
    // m &^= RegSet(1) << r
    // m = m &^ (RegSet(1) << r)
    // m = m & ~(RegSet(1) << r)
    m = m.and(UInt64.ONE.shl(r).not())
    s += ` r${r}`
  }
  return s == '{' ? '{}' : s + ' }'
}


// regBuilder returns a function that can build RegSet from a string
// of whitespace-separated register names.
//
export function regBuilder(names :string[]) :(s:string)=>RegSet {
  const num = new Map<string,int>(
    names.map((k, i) => [k, i]) as [string,int][]
  )
  return function(s :string): RegSet {
    let m = emptyRegSet
    for (let r of s.trim().split(/\s+/)) {
      let n = num.get(r)
      if (n !== undefined) {
        // m |= regMask(1) << uint(n)
        m = m.or(UInt64.ONE.shl(n))
        continue
      }
      panic("register " + r + " not found")
    }
    return m
  }
}
