import { Type } from '../ast'

// A LocalSlot is a location in the stack frame, which identifies and stores
// part or all of a PPARAM, PPARAMOUT, or PAUTO ONAME node.
// It can represent a whole variable, part of a larger stack slot, or part of a
// variable that has been decomposed into multiple stack slots.
// As an example, a string could have the following configurations:
//
//           stack layout              LocalSlots
//
// Optimizations are disabled. s is on the stack and represented in its entirety.
// [ ------- s string ---- ] { N: s, Type: string, Off: 0 }
//
// s was not decomposed, but the SSA operates on its parts individually, so
// there is a LocalSlot for each of its fields that points into the single stack slot.
// [ ------- s string ---- ] { N: s, Type: *uint8, Off: 0 }, {N: s, Type: int, Off: 8}
//
// s was decomposed. Each of its fields is in its own stack slot and has its own LocalSLot.
// [ ptr *uint8 ] [ len int] { N: ptr, Type: *uint8, Off: 0, SplitOf: parent, SplitOffset: 0},
//                           { N: len, Type: int, Off: 0, SplitOf: parent, SplitOffset: 8}
//                           parent = &{N: s, Type: string}
//
export class LocalSlot {
  n    :any   // an ONAME *gc.Node representing a stack location.
  type :Type  // type of slot
  offs :int   // offset of slot in N

  // splitOf     :LocalSlot|null  // slot is a decomposition of splitOf
  // splitOffset :int             // .. at this offset.

  constructor(n :any, type :Type, offs :int) {
    this.n = n
    this.type = type
    this.offs = offs
  }

  _key :string

  key() :string {
    // HACK to derive a unique key of the state of this object
    if (!this._key) {
      this._key = `${this.n}(${this.offs})`
    }
    return this._key
  }

  toString() :string {
    if (this.offs == 0) {
      return `${this.n}[${this.type}]`
    }
    return `${this.n}+${this.offs}[${this.type}]`
  }
}
