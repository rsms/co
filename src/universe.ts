import { ByteStr, ByteStrSet } from './bytestr'
import { asciibuf } from './util'
import { TypeSet } from './typeset'
import { Scope, Ent, IntrinsicVal, Type } from './ast'
import { basicTypes, t_nil, t_bool } from './types'

// "built-in" or predefined values
const intrinsicValues = [
  new IntrinsicVal('true', t_bool),
  new IntrinsicVal('false', t_bool),
  new IntrinsicVal('nil', t_nil),
]


export class Universe {
  readonly strSet  :ByteStrSet
  readonly typeSet :TypeSet
  readonly scope   :Scope

  constructor(strSet :ByteStrSet, typeSet :TypeSet) {
    this.strSet = strSet
    this.typeSet = typeSet

    // build scope
    const decls = new Map<ByteStr,Ent>()

    // export all basic types
    for (let [name, t] of basicTypes) {
      let n = strSet.emplace(asciibuf(name))
      decls.set(n, new Ent(n, t, t))
    }

    // export all intrinsic values (true, false, nil, etc)
    for (let v of intrinsicValues) {
      let n = strSet.emplace(asciibuf(v.name))
      decls.set(n, new Ent(n, v, v))
    }

    this.scope = new Scope(null, decls)
  }

  // internType potentially returns an equivalent type (t1.equals(t2) == true)
  // if previously seen. Otherwise it registers t for future calls to this
  // function and returns t as-is. Populates typeSet.
  //
  // The trade-offs are as follows:
  //
  //  [-] slower to parse files with many different types because of
  //      intern-miss overhead.
  //
  //  [+] faster to parse files with few types that are used many times
  //      (common case), since type equality testing is cheap for correct code.
  //
  //  [+] uses less memory (fewer resident Type instances).
  //
  internType<T extends Type>(t :T) :T {
    return this.typeSet.intern(t)
  }

}
