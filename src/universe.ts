import { ByteStr, strings } from './bytestr'
import { asciibuf } from './util'
import { TypeSet } from './typeset'
import { NoPos } from "./pos"
import { Expr, Type, TypeDecl, Scope, Ent, Ident, types, values } from "./ast"

// inspired by go/src/cmd/compile/internal/gc/universe.go

export class Universe {
  readonly typeSet :TypeSet
  readonly scope   :Scope

  constructor(typeSet :TypeSet) {
    this.typeSet = typeSet
    this.scope = new Scope(null)

    // build scope
    const decls = new Map<ByteStr,Ent>()

    let g = {}

    // export all built-in types
    for (let name of Object.keys(types)) {
      const t = (types as {[name:string]:Type})[name]
      assert(t.isType())
      const namebuf = strings.get(asciibuf(name))
      // declare t as namebuf of type t.type
      let ident = new Ident(NoPos, this.scope, namebuf)
      // let d = new TypeDecl(NoPos, this.scope, ident, t, g)
      // decls.set(namebuf, new Ent(namebuf, d, null, t))
      decls.set(namebuf, new Ent(namebuf, t, null, t))
    }

    // export all built-in values (true, false, nil, etc)
    for (let name of Object.keys(values)) {
      const v = (values as {[name:string]:Expr})[name]
      assert(v.isExpr())
      const namebuf = strings.get(asciibuf(name))
      // define v as namebuf with value v of type v.type
      decls.set(namebuf, new Ent(namebuf, v, v, v.type))
    }

    this.scope.decls = decls
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
