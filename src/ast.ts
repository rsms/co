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
  public type  :Expr|null,  // null type means "auto"
  public ident :Ident|null,
    // nil means anonymous field/parameter (structs/parameters),
    // or embedded interface (interfaces)
  ) {
    super(pos, scope)
  }
}

// ——————————————————————————————————————————————————————————————————
// Scope

// An Object describes a named language entity such as a package,
// constant, type, variable, function (incl. methods), or label.
//
// The Data fields contains object-specific data:
//
//  Kind    Data type         Data value
//  Pkg     *Scope            package scope
//  Con     int               iota for the respective declaration
//
// type Object struct {
//   Kind ObjKind
//   Name string      // declared name
//   Decl interface{} // corresponding Field, XxxSpec, FuncDecl, LabeledStmt,
//                    // AssignStmt, Scope; or nil
//   Data interface{} // object-specific data; or nil
//   Type interface{} // placeholder for type information; may be nil
// }

// An Object describes a named language entity such as a package,
// constant, type, variable, function (incl. methods), or label.
//
export class Obj {
  constructor(
    public name  :ByteStr,
    public decl  :Node,
    public value :Expr|null,
    public data  :any = null,
  ) {}
}

export interface UnresolvedAssign {
  ident :Ident
  expr  :Expr
}

export class Scope {
  // unresolvedAssigns :Map<ByteStr,Set<UnresolvedAssign>> | null = null

  constructor(
  public outer      :Scope | null,
  public decls      :Map<ByteStr,Obj> | null = null,
  ) {}

  // lookup a declaration in this scope and any outer scopes
  //
  lookup(s :ByteStr) :Obj | null {
    const d = this.decls && this.decls.get(s)
    return d ? d : this.outer ? this.outer.lookup(s) : null
  }

  // lookupImm looks up a declaration only in this scope
  //
  lookupImm(s :ByteStr) :Obj | null {
    const d = this.decls && this.decls.get(s)
    return d || null
  }

  // declare registers a name in this scope.
  // If the name is already registered, null is returned.
  //
  declare(name: ByteStr, decl :Node, x: Expr|null) :Obj | null {
    return this.declareObj(new Obj(name, decl, x))
  }

  declareObj(obj :Obj) :Obj | null {
    // Note: name is interned by value in the same space as all other names in
    // this scope, meaning we can safely use the object identity of name.
    if (!this.decls) {
      this.decls = new Map<ByteStr,Obj>([[obj.name, obj]])
    } else if (this.decls.has(obj.name)) {
      return null
    }
    this.decls.set(obj.name, obj)
    return obj
  }

  // addUnresolvedAssign(ident :Ident, expr :Expr) {
  //   const u :UnresolvedAssign = { ident, expr }
  //   if (!this.unresolvedAssigns) {
  //     this.unresolvedAssigns = new Map<ByteStr,Set<UnresolvedAssign>>([
  //       [ident.value, new Set<UnresolvedAssign>([u])]
  //     ])
  //   } else {
  //     let s = this.unresolvedAssigns.get(ident.value)
  //     if (s) {
  //       s.add(u)
  //     } else {
  //       this.unresolvedAssigns.set(
  //         ident.value,
  //         new Set<UnresolvedAssign>([u])
  //       )
  //     }
  //   }
  // }

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

export class ConstDecl extends Decl {
  constructor(pos :Pos, scope :Scope,
  public idents  :Ident[],
  public type    :Expr|null,  // null means auto type
  public values  :Expr[],
  ) {
    super(pos, scope)
  }
}

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

export class Expr extends Node {}

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
}

export class Ident extends Expr {
  obj :Obj|null = null // what this name references
  constructor(pos :Pos, scope :Scope,
    public value  :ByteStr, // interned in ByteStrSet
  ) {
    super(pos, scope)
  }

  toString() { return String(this.value) }
}

export class BasicLit extends Expr {
  constructor(pos :Pos, scope :Scope,
    public tok   :token,
    public value :Uint8Array,
  ) {
    super(pos, scope)
  }
}

export class StringLit extends Expr {
  constructor(pos :Pos, scope :Scope,
    public value :Uint8Array
  ) {
    super(pos, scope)
  }
}

export class DotsType extends Expr {
  // ...type
  constructor(pos :Pos, scope :Scope,
  public type :Expr|null,
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
  constructor(pos :Pos, scope :Scope,
    public name :Ident|null = null, // nil = anonymous func expression
    public sig  :FunSig,
    public body :Stmt|null = null, // nil = forward declaration
  ) {
    super(pos, scope)
  }
}

export class FunSig extends Node {
  constructor(pos :Pos, scope :Scope,
  public params  :Field[],
  public result  :Expr|null,
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
