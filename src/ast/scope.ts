import { ByteStr } from '../bytestr'
import { Node, Stmt, Type, Template, Expr, FunExpr } from "./nodes"

// An Ent describes a named language entity such as a package,
// constant, type, variable, function (incl. methods), or label.
//
// VARIABLES
//
//   decl
//    | value
//    ↓   ↓
//    x = 0 ; x¹ = 3 ; print(x²)
//            ↑              ↑
//         writes++       reads.add(x²)
//
//
// FUNCTIONS
//
//    fun a() { ... };  a¹()
//    ~~~~~~~~~~~~~~~   ↑
//           ↑       reads.add(a¹)
//      decl==value
//
//
export class Ent {
  name  :ByteStr
  value :Stmt
  type  :Type|null

  writes :int = 0  // Tracks stores
  nreads :int = 0  // Tracks loads
    // writes and reads does NOT include the definition/declaration itself.

  // TODO: consider removing value and only using decl.
  // Ents really only define one entity.

  constructor(
    name  :ByteStr,
    value :Stmt,
    type  :Type|null,
  ) {
    this.name = name
    this.value = value
    if (type) {
      this.type = type
    } else if (value.isType()) {
      this.type = value
    } else if (value.isFieldDecl() || value.isVarDecl() || value.isTypeDecl()) {
      this.type = value.type
    } else {
      this.type = (value as any).type || null
    }
  }

  // // getTypeExpr returns the Expr which type should represent this
  // // Ent's type.
  // //
  // // This is used by the parser and type resolver only when .type=null
  // //
  // getTypeExpr() :Expr | null {
  //   // FIXME?
  //   return this.value
  // }

  isConstant() :bool {
    return this.writes == 0
  }

  get scope() :Scope {
    return this.value._scope
  }

  toString() :string {
    return `(Ent ${this.name} ${this.value}${this.type ? " " + this.type : ""})`
  }
}

// TODO: track TypeVars in scope

export class Scope {
  outer   :Scope|null                   // parent/puter scope
  context :Node|null = null             // node owning the scope. null for universe
  decls   :Map<ByteStr,Ent>|null = null // declarations in this scope

  constructor(outer :Scope|null) {
    this.outer = outer
  }

  // lookup a declaration in this scope and any outer scopes
  //
  lookup(s :ByteStr) :Ent | null {
    const d = this.decls && this.decls.get(s)
    return d ? d : this.outer ? this.outer.lookup(s) : null
  }

  // lookupImm looks up a declaration only in this scope
  //
  lookupImm(s :ByteStr) :Ent | null {
    const d = this.decls && this.decls.get(s)
    return d || null
  }

  // declareEnt returns true if ent was declared, and false it's already
  // declared.
  //
  declareEnt(ent :Ent) :bool {
    // Note: name is interned by value in the same space as all other names in
    // this scope, meaning we can safely use the object identity of name.
    if (!this.decls) {
      this.decls = new Map<ByteStr,Ent>([[ent.name, ent]])
      return true
    }
    if (this.decls.has(ent.name)) {
      return false
    }
    this.decls.set(ent.name, ent)
    return true
  }

  // redeclareEnt returns the previously declared entity, if any.
  //
  redeclareEnt(ent :Ent) :Ent|null {
    // Note: name is interned by value in the same space as all other names in
    // this scope, meaning we can safely use the entity identity of name.
    if (!this.decls) {
      this.decls = new Map<ByteStr,Ent>([[ent.name, ent]])
      return null
    }
    const prevent = this.decls.get(ent.name)
    if (prevent === ent) {
      return null
    }
    this.decls.set(ent.name, ent)
    return prevent || null
  }

  // get closest function scope (could be this scope)
  funScope() :Scope|null {
    let s :Scope|null = this
    while (s) {
      if (s.context instanceof FunExpr) {
        return s
      }
      s = s.outer
    }
    return null
  }

  // templateScope returns the nearest scope which context is a template
  //
  templateScope() :Scope|null {
    let s :Scope|null = this
    while (s) {
      if (s.context instanceof Template) {
        return s
      }
      s = s.outer
    }
    return null
  }

  // filter returns a copy of the scope with ents passing the filter.
  //
  filter(f :(name :ByteStr, ent :Ent)=>bool) :Scope {
    let scope = new Scope(this.outer)
    if (this.decls) {
      scope.decls = new Map<ByteStr,Ent>()
      for (let [name, ent] of this.decls) {
        if (f(name, ent)) {
          scope.decls.set(name, ent)
        }
      }
    }
    return scope
  }

  // copy returns a shallow copy of the scope.
  //
  // The returned copy references the same Ents, but has its own
  // declaration mappings, allowing modification of mapping without
  // affecting the source of the copy.
  //
  copy(filter? :(name :ByteStr, ent :Ent)=>bool) :Scope {
    let scope = new Scope(this.outer)
    if (this.decls) {
      scope.decls = new Map<ByteStr,Ent>(this.decls)
    }
    return scope
  }

  level() {
    let level = 0, s :Scope|null = this
    while ((s = s.outer)) {
      level++
    }
    return level
  }

  toString() {
    const names = this.decls ? Array.from(this.decls.keys()) : []
    return `Scope(level ${this.level()} names (${names.join(', ')}))`
  }
}

class NilScope extends Scope {
  constructor() { super(null) }
  lookup(s :ByteStr) :Ent | null { return null }
  lookupImm(s :ByteStr) :Ent | null { return null }
  declare(name: ByteStr, s :Stmt, x: Expr|null) :Ent|null { return null }
  declareEnt(ent :Ent) :bool { return false }
}

// used by intrinsics
export const nilScope = new NilScope()
