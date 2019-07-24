import { Type } from "./ast"

// TypeSet provides interning of types based on equality on a per-constructor
// basis.
//
export class TypeSet {
  types = new Map<Object,Set<Type>>() // type constructor => type instance

  intern<T extends Type>(t :T) :T {
    let s = this.types.get(t.constructor)
    if (s) {
      for (let i of s) {
        if (i.equals(t)) {
          assert(i instanceof t.constructor)
          return i as T
        }
      }
      s.add(t)
    } else {
      this.types.set(t.constructor, new Set<Type>([t]))
    }
    return t
  }
}
