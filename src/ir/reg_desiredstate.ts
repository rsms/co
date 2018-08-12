import { UInt64 } from '../int64'
import { ID } from './ssa'
import { Reg, RegSet, emptyRegSet, noReg, fmtRegSet } from './reg'

interface DesiredStateEntry {
  // (pre-regalloc) value
  id :ID

  // Registers it would like to be in, in priority order.
  // Unused slots are filled with noReg.
  regs :[Reg,Reg,Reg,Reg]
}

// DesiredState represents desired register assignments.
//
export class DesiredState {
  // Desired assignments will be small, so we just use a list
  // of valueID+registers entries.
  entries :DesiredStateEntry[] = []

  // Registers that other values want to be in.  This value will
  // contain at least the union of the regs fields of entries, but
  // may contain additional entries for values that were once in
  // this data structure but are no longer.
  avoid :RegSet = emptyRegSet


  constructor(copyOther? :DesiredState) {
    if (copyOther) {
      this.copy(copyOther)
    }
  }


  toString() {
    let s = '{'
    s += this.entries.map(e =>
      `v${e.id}[` + e.regs.filter(r =>
        r != noReg
      ).map(r => `r${r}`).join(' ') + ']'
    ).join(', ')
    s += `}`
    if (!this.avoid.isZero()) {
      s += `avoid=${fmtRegSet(this.avoid)}`
    }
    return s
  }


  clear() {
    this.entries.length = 0
    // this.entries = []
    // this.entries.splice(0, this.entries.length)
    this.avoid = emptyRegSet
  }

  // get returns a list of desired registers for value vid
  //
  get(vid :ID) :[Reg,Reg,Reg,Reg] {
    for (let e of this.entries) {
      if (e.id == vid) {
        return e.regs
      }
    }
    return [noReg, noReg, noReg, noReg]
  }

  // add records that we'd like value vid to be in register r
  //
  add(vid :ID, r :Reg) {
    const d = this
    // d.avoid |= RegSet(1) << r
    d.avoid = d.avoid.or(UInt64.ONE.shl(r))
    for (let e of d.entries) {
      if (e.id != vid) {
        continue
      }
      if (e.regs[0] == r) {
        // Already known and highest priority
        return
      }
      for (let j = 1; j < e.regs.length; j++) {
        if (e.regs[j] == r) {
          // Move from lower priority to top priority
          // copy(e.regs[1:], e.regs[:j]) // copy: dst -> src
          e.regs.copyWithin(1, 0, j)
          e.regs[0] = r
          return
        }
      }
      // copy(e.regs[1:], e.regs[:])
      e.regs.copyWithin(1, 0)
      e.regs[0] = r
      return
    }
    // d.entries = append(d.entries, desiredStateEntry{vid, [r, noReg, noReg, noReg]})
    d.entries.push({ id: vid, regs: [r, noReg, noReg, noReg] })
  }

  addList(vid :ID, regs :[Reg,Reg,Reg,Reg]) {
    // regs is in priority order, so iterate in reverse order.
    for (let i = regs.length - 1; i >= 0; i--) {
      let r = regs[i]
      if (r != noReg) {
        this.add(vid, r)
      }
    }
  }

  // clobber erases any desired registers in the set m.
  clobber(m :RegSet) {
    let d = this
    for (let i = 0; i < d.entries.length; ) {
      let e = d.entries[i]
      let j = 0
      for (let r of e.regs) {
        //                (m >> r) & 1 == 0
        if (r != noReg && m.shr(r).and(UInt64.ONE).isZero()) {
          e.regs[j] = r
          j++
        }
      }
      if (j == 0) {
        // No more desired registers for this value.
        d.entries[i] = d.entries[d.entries.length-1]
        // d.entries = d.entries[:d.entries.length-1]
        d.entries.splice(d.entries.length-1, 1)
        continue
      }
      for (; j < e.regs.length; j++) {
        e.regs[j] = noReg
      }
      i++
    }
    // d.avoid &^= m
    // d.avoid = d.avoid & ~m
    d.avoid = d.avoid.and(m.not())
  }

  // copy copies a desired state from another desiredState x
  copy(x :DesiredState) {
    this.entries.splice(0, this.entries.length, ...x.entries)
    this.avoid = x.avoid
  }

  // remove removes the desired registers for vid and returns them.
  remove(vid :ID) :[Reg,Reg,Reg,Reg] {
    for (let e of this.entries) {
      if (e.id == vid) {
        let regs = e.regs
        let z = this.entries.length - 1
        e = this.entries[z]
        // this.entries = this.entries.slice(0, this.entries.length-1)
        this.entries.splice(z, 1)
        return regs
      }
    }
    return [noReg, noReg, noReg, noReg]
  }

  // merge merges another desired state x into this
  //
  merge(x :DesiredState) {
    this.avoid = this.avoid.or(x.avoid)
    // There should only be a few desired registers, so linear insert is ok.
    for (let e of x.entries) {
      this.addList(e.id, e.regs)
    }
  }

}
