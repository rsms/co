import { Stmt, Type, Expr, FunExpr } from "./ast_nodes"
import { ByteStr } from './bytestr'

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
  decl  :Stmt      // Statement that introduced the entity
  value :Expr|null // value. e.g. "(IntLit 3)" in "(VarDecl (Ident x) (IntLit 3))"
  type  :Type|null
  data  :any

  writes :int = 0  // Tracks stores
  nreads :int = 0  // Tracks loads
    // writes and reads does NOT include the definition/declaration itself.

  // TODO: consider removing value and only using decl.
  // Ents really only define one entity.

  constructor(
    name  :ByteStr,
    s     :Stmt,
    value :Expr|null,
    type  :Type|null = null,
    data  :any = null,
  ) {
    this.name = name
    this.decl = s
    this.value = value
    this.type = (
      type ||
      ( (s.isFieldDecl() || s.isVarDecl() || s.isTypeDecl()) && s.type ) ||
      ( value && value.type ) ||
      null
    )
    this.data = data
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
    return this.decl._scope
  }
}

// TODO: track TypeVars in scope

export class Scope {
  fun :FunExpr | null = null // when set, scope if function scope

  constructor(
  public outer :Scope | null,
  public decls :Map<ByteStr,Ent> | null = null,
  public isFunScope :bool = false, // if the scope is that of a function
  ) {}

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

  // declare registers a name in this scope.
  // If the name is already registered, null is returned.
  //
  declare(name: ByteStr, s :Stmt, x: Expr|null) :Ent|null {
    const ent = new Ent(name, s, x)
    return this.declareEnt(ent) ? ent : null
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
      if (s.fun) {
        return s
      }
      s = s.outer
    }
    return null
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

// used by intrinsics
export const nilScope = new Scope(null) // TODO: subclass NilScope with noop methods
