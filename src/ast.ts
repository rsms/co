import { Pos, SrcFile } from './pos'
import { ByteStr } from './bytestr'
import { token } from './token'

let nextgid = 0; export class Group { id = nextgid++ } // DEBUG
// export class Group {}

export class Comment {
  constructor(
    public pos   :Pos,
    public value :Uint8Array,
  ) {}
}

export class Node {
  constructor(
    public pos   :Pos,
    public scope :Scope,
    // public comments? :Comment[],
  ) {}
}

// Ident Type
//       Type
export class Field extends Node {
  constructor(pos :Pos, scope :Scope,
  public type  :Expr,
  public ident :Ident|null,
    // nil means anonymous field/parameter (structs/parameters),
    // or embedded interface (interfaces)
  ) {
    super(pos, scope)
  }
}

// ——————————————————————————————————————————————————————————————————
// Scope

// An Ent describes a named language entity such as a package,
// constant, type, variable, function (incl. methods), or label.
//
export class Ent {
  nstores :int = 0  // tracks number of Nth stores. 0 == constant

  constructor(
    public name  :ByteStr,
    public decl  :Node,
    public value :Expr|null,
    public data  :any = null,
  ) {}

  get scope() :Scope {
    return this.decl.scope
  }
}

export class Scope {
  fun :FunDecl | null = null // when set, scope if function scope

  constructor(
  public outer :Scope | null,
  public decls :Map<ByteStr,Ent> | null = null,
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
  declare(name: ByteStr, decl :Node, x: Expr|null) :Ent|null {
    const ent = new Ent(name, decl, x)
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
    return `Scope(level: ${this.level()}, names: (${names.join(', ')}))`
  }
}

// used by intrinsics
const nilScope = new Scope(null)


// ——————————————————————————————————————————————————————————————————
// Declarations

export class Decl extends Node {}

export class ImportDecl extends Decl {
  constructor(pos :Pos, scope :Scope,
  public path       :StringLit,
  public localIdent :Ident|null,
  ) {
    super(pos, scope)
  }
}

// export class ConstDecl extends Decl {
//   constructor(pos :Pos, scope :Scope,
//   public idents  :Ident[],
//   public type    :Expr|null,
//     // null means auto type (values might have mixed types)
//   public values  :Expr[],
//   ) {
//     super(pos, scope)
//   }
// }

export class VarDecl extends Decl {
  constructor(pos :Pos, scope :Scope,
  public idents  :Ident[],
  public group   :Group|null,         // null means not part of a group
  public type    :Expr|null = null,   // null means no type
  public values  :Expr[]|null = null, // null means no values
  ) {
    super(pos, scope)
  }
}

export class TypeDecl extends Decl {
  // Ident Type
  constructor(pos :Pos, scope :Scope,
  public ident  :Ident,
  public alias  :bool,
  public type   :Expr,
  public group  :Group|null, // nil = not part of a group
  ) {
    super(pos, scope)
  }
}


// ----------------------------------------------------------------------------
// Statements

export class Stmt extends Node {}

export class BlockStmt extends Stmt {
  constructor(pos :Pos, scope :Scope,
  public list  :Stmt[],
  ) {
    super(pos, scope)
  }
}

// An instance of SimpleStmt represents noop (no operation)
export class SimpleStmt extends Stmt {}

export class ExprStmt extends SimpleStmt {
  constructor(pos :Pos, scope :Scope,
  public expr :Expr,
  ) {
    super(pos, scope)
  }
}

export class ReturnStmt extends Stmt {
  constructor(pos :Pos, scope :Scope,
  public result :Expr|null, // null means no explicit return values
  ) {
    super(pos, scope)
  }
}

export class AssignStmt extends SimpleStmt {
  constructor(pos :Pos, scope :Scope,
  public op  :token, // ILLEGAL means no operation
  public lhs :Expr[],
    // Rhs == ImplicitOne means Lhs++ (Op == Add) or Lhs-- (Op == Sub)
  public rhs :Expr[],
  ) {
    super(pos, scope)
  }
}

export class DeclStmt extends SimpleStmt {
  constructor(pos :Pos, scope :Scope,
  public decls :Decl[],
  ) {
    super(pos, scope)
  }
}


// ——————————————————————————————————————————————————————————————————
// Expressions

export class Expr extends Node {
  type :Expr|null = null
}

// Placeholder for an expression that failed to parse
// correctly and where we can't provide a better node.
export class BadExpr extends Expr {}

export class TupleExpr extends Expr {
  // TupleExpr = "(" Expr ("," Expr)+ ")"
  constructor(pos :Pos, scope :Scope,
  public exprs :Expr[],
  ) {
    super(pos, scope)
  }
}

export class SelectorExpr extends Expr {
  // Selector = Expr "." ( Ident | Selector )
  constructor(pos :Pos, scope :Scope,
    public lhs :Expr,
    public rhs :Expr, // Ident or SelectorExpr
  ) {
    super(pos, scope)
  }

  toString() {
    return `${this.lhs}.${this.rhs}`
  }
}

export class Ident extends Expr {
  ent :Ent|null = null // what this name references
  constructor(pos :Pos, scope :Scope,
    public value  :ByteStr, // interned in ByteStrSet
  ) {
    super(pos, scope)
  }

  toString() { return String(this.value) }
}

export class RestExpr extends Expr {
  // ...expr
  constructor(pos :Pos, scope :Scope,
    public expr :Expr,
  ) {
    super(pos, scope)
  }
}

export class LiteralExpr extends Expr {}

export class BasicLit extends LiteralExpr {
  constructor(pos :Pos, scope :Scope,
    public tok   :token,
    public value :Uint8Array,
  ) {
    super(pos, scope)
  }
}

export class StringLit extends LiteralExpr {
  constructor(pos :Pos, scope :Scope,
    public value :Uint8Array
  ) {
    super(pos, scope)
  }
}

export class Operation extends Expr {
  constructor(pos :Pos, scope :Scope,
  public op :token,
  public x  :Expr,
  public y  :Expr|null = null, // nil means unary expression
  ) {
    super(pos, scope)
  }
}

export class CallExpr extends Expr {
  // Fun(ArgList[0], ArgList[1], ...)
  constructor(pos :Pos, scope :Scope,
  public fun     :Expr,
  public argList :Expr[],
  public hasDots :bool,  // last argument is followed by ...
  ) {
    super(pos, scope)
  }
}

export class ParenExpr extends Expr {
  // (X)
  constructor(pos :Pos, scope :Scope,
  public x :Expr,
  ) {
    super(pos, scope)
  }
}

export class FunDecl extends Expr {
  // func Ident? Signature { Body }
  // func Ident? Signature
  
  body :Stmt|null = null // nil = forward declaration

  constructor(pos :Pos, scope :Scope,
    public name   :Ident|null, // nil = anonymous func expression
    public sig    :FunSig,
    public isInit :bool = false, // true for special "init" funs at file level
  ) {
    super(pos, scope)
    scope.fun = this  // Mark the scope as being a "function scope"
  }
}

export class FunSig extends Node {
  constructor(pos :Pos, scope :Scope,
  public params  :Field[],
  public result  :Expr,
  ) {
    super(pos, scope)
  }
}


export class IntrinsicVal extends Expr {
  constructor(
    public name :string,
    public type :Type,
  ) {
    super(0, nilScope)
  }
}


export class TypeConversionExpr extends Expr {
  constructor(pos :Pos, scope :Scope,
    public expr :Expr,
    public type :Type,
  ) {
    super(pos, scope)
  }
}


// ——————————————————————————————————————————————————————————————————
// Types

export class Type extends Expr {
  ent :Ent|null = null
  constructor(pos :Pos, scope :Scope) {
    super(pos, scope)
    this.type = this
  }
}

export class UnresolvedType extends Type {
  constructor(pos :Pos, scope :Scope,
    public expr :Expr,
  ) {
    super(pos, scope)
  }
}

export class RestType extends Type {
  // ...type
  constructor(pos :Pos, scope :Scope,
    public type :Type,
  ) {
    super(pos, scope)
    this.type = type
  }
}

export class IntrinsicType extends Type {
  constructor(
    public bitsize :int,
    public name    :string, // only used for debugging and printing
  ) {
    super(0, nilScope)
  }
}

export class ConstStringType extends IntrinsicType {
  constructor(
    public bitsize :int,
    public length :int,
  ) {
    super(bitsize, 'str')
  }
}

export class TupleType extends Type {
  // TupleType = "(" Type ("," Type)+ ")"
  constructor(pos :Pos, scope :Scope,
  public types :Type[],
  ) {
    super(pos, scope)
  }
}

export class FunType extends Type {
  // FunType = ( Type | TupleType ) "->" Type
  constructor(pos :Pos, scope :Scope,
  public inputs :Type[],
  public output :Type,
  ) {
    super(pos, scope)
  }
}


// ——————————————————————————————————————————————————————————————————
// File

// A File corresponds to a source file
//
export class File {
  constructor(
    public sfile      :SrcFile,
    public scope      :Scope,
    public imports    :ImportDecl[] | null, // imports in this file
    public decls      :Decl[],              // top-level declarations
    public unresolved :Set<Ident>,          // unresolved identifiers
  ) {}
}

export class Package {
  constructor(
    public name :string,
    public scope :Scope,
    // public imports
    // public exports
  ) {}

  toString() {
    return `Package(${this.name})`
  }
}
