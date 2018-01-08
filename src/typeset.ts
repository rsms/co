import { Type } from './ast'

// TypeSet provides interning of types based on equality on a per-constructor
// basis.
//
export class TypeSet {
  types = new Map<Object,Set<Type>>() // type constructor => type instance

  intern(t :Type) :Type {
    let s = this.types.get(t.constructor)
    if (s) {
      for (let i of s) {
        if (i.equals(t)) {
          return i
        }
      }
      s.add(t)
    } else {
      this.types.set(t.constructor, new Set<Type>([t]))
    }
    return t
  }
}
