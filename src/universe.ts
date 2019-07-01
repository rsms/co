import { ByteStr, strings } from './bytestr'
import { asciibuf } from './util'
import { TypeSet } from './typeset'
import { Expr, TypeExpr, Scope, Ent, builtInTypes, builtInValues } from './ast'
import { Type } from './types'

// inspired by go/src/cmd/compile/internal/gc/universe.go

export class Universe {
  readonly typeSet :TypeSet
  readonly scope   :Scope

  constructor(typeSet :TypeSet) {
    this.typeSet = typeSet

    // build scope
    const decls = new Map<ByteStr,Ent>()

    // export all built-in types
    for (let name of Object.keys(builtInTypes)) {
      const t = (builtInTypes as {[name:string]:TypeExpr})[name]
      assert(t instanceof TypeExpr)
      const namebuf = strings.get(asciibuf(name))
      // declare t as namebuf of type t.type
      decls.set(namebuf, new Ent(namebuf, t, null, t.type))
    }

    // export all built-in values (true, false, nil, etc)
    for (let name of Object.keys(builtInValues)) {
      const v = (builtInValues as {[name:string]:Expr})[name]
      assert(v instanceof Expr)
      const namebuf = strings.get(asciibuf(name))
      // define v as namebuf with value v of type v.type
      decls.set(namebuf, new Ent(namebuf, v, v, v.type))
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
