import { Pos, NoPos, SrcFile } from './pos'
import { ByteStr } from './bytestr'
import { token, tokstr } from './token'
import * as utf8 from './utf8'
import { Num } from './num'
import { numconv } from './numconv'
import { Int64 } from './int64'
import {
  Type,
  NativeType,
  NumType,
  IntType,
  FloatType,
  RestType,
  StrType,
  ListType,
  TupleType,
} from './types'
import * as types from './types'

// ——————————————————————————————————————————————————————————————————
// AST type hierarchy
//
//  Group
//  Comment
//  Node
//    Package
//    File
//    Field
//    Stmt
//      //NoOpStmt
//      Decl
//        MultiDecl
//        ImportDecl
//        VarDecl
//        TypeDecl
//      ReturnStmt
//      Expr
//        Block
//        Ident
//        IfExpr
//        LiteralExpr
//        FunExpr
//        Assignment
//        ...
//

// Node visitor
export type Visitor = (n :Node, visitChildren :()=>void) => void
export type FieldValue = any // including null, Type, Ident, etc.

// internal
type NodeVisitor = (n:Node|null)=>void
type FieldVisitor = (name:string, v :FieldValue)=>void


export interface Encoder {
  startNode(n :Node) :void
  endNode() :void
  nullNode() :void
  writeField(name :string, v :FieldValue): void
}

export interface Decoder {
  // field access that throws
  num(name :string) :Num
  num32(name :string) :number
  int32(name :string) :int
  bool(name :string) :bool
  str(name :string) :string
  byteStr(name :string) :ByteStr
  bytes(name :string) :Uint8Array
  type(name :string) :Type
  ident(name :string) :Ident
  enumVal<T>(name :string, e :Record<string,any>) :T

  // field access that never throws
  maybeNum(name :string) :Num|null
  maybeNum32(name :string) :number|null
  maybeInt32(name :string) :int|null
  maybeBool(name :string) :bool|null
  maybeStr(name :string) :string|null
  maybeByteStr(name :string) :ByteStr|null
  maybeBytes(name :string) :Uint8Array|null
  maybeType(name :string) :Type|null
  maybeIdent(name :string) :Ident|null
  maybeEnumVal<T>(name :string, e :Record<string,any>) :T|null

  // field access for arrays/lists
  int32Array(name :string) :int[]
  num32Array(name :string) :number[]
  boolArray(name :string) :bool[]
  identArray(name :string) :Ident[]

  // children
  child<T extends Node=Node>() :T
  childOfType<T extends Node=Node>(ctor:{new(...args:any[]):T}): T
  children<T extends Node=Node>() :T[]
  childrenOfType<T extends Node=Node>(ctor:{new(...args:any[]):T}): T[]
  childrenOfTypes<T extends Node=Node>(...ctor:{new(...args:any[]):T}[]): T[]

  // maybe children
  maybeChild<T extends Node=Node>() :T|null
  maybeChildOfType<T extends Node=Node>(ctor:{new(...args:any[]):T}): T|null
  maybeChildren<T extends Node=Node>() :T[]|null
  maybeChildrenOfType<T extends Node=Node>(ctor:{new(...args:any[]):T}): T[]|null
  maybeChildrenOfTypes<T extends Node=Node>(...ctor:{new(...args:any[]):T}[]): T[]|null
}

// interface NodeConstructor {
//   new(): Node
// }


function createNode<
  T extends Node = Node
>(ctor: { new (...args: any[]): T; }, ...args: any[]): T {
  return new ctor(...args)
}


// Node is the basic type that forms a concrete AST
//
export class Node {
  pos   :Pos    // position in SrcFile. NoPos=unknown
  scope :Scope  // name scope
  // comments? :Comment[]

  constructor(pos :Pos, scope :Scope) {
    this.pos = pos
    this.scope = scope
  }

  toString() :string {
    return this.constructor.name
  }

  // visit calls v for the tree this node represents.
  //
  // v can invoke the visitChildren argument passed to it, to cause children
  // of the currently-visited node to be visited. This allows the caller to
  // maintain a stack if needed, as well controlling which nodes are visited.
  //
  visit(v :Visitor) {
    let visit = (n :Node) =>
      v(n, () => n.visitChildren(visit))
    visit(this)
  }

  // encode serializes a tree
  //
  encode(a :Encoder) {
    let visit = (n :Node|null) => {
      if (n) {
        a.startNode(n)
        n.visitFields(a.writeField.bind(a))
        n.visitChildren(visit)
        a.endNode()
      } else {
        a.nullNode()
      }
    }
    visit(this)
  }

  // visitChildren is an internal function that subclasses extend to visit
  // their children.
  // A "child" is something that is not a direct property of the node.
  // E.g. for VarDecl, its values are visited but not its identifiers.
  //
  protected visitChildren(_ :NodeVisitor) {
    // subclass may extend
  }

  // visitFields should calls v for all properties of the receiver which
  // - are formal properties crucial for encoding the recevier, and
  // - are not visited in visitChildren
  //
  protected visitFields(v :FieldVisitor) {
    v("pos", this.pos)
    // subclass may extend
  }

  // restore is called on a completely empty object with the prototype of
  // the receiver. This function must restore this object to a functional
  // state. Note that the constructor has NOT been called nor will it be.
  //
  restore(d :Decoder) {
    // subclass may extend
    this.scope = nilScope
    this.pos = d.maybeInt32("pos") || NoPos
  }
}


// Package represents one package
//
export class Package extends Node {
  name  :string
  files :File[] = []

  constructor(name :string, scope :Scope) {
    super(NoPos, scope)
    this.name = name
  }

  toString() {
    return `Package(${this.name})`
  }

  visitChildren(v :NodeVisitor) {
    this.files.forEach(v)
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("name", this.name)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.name = d.str("name")
    this.files = d.childrenOfType(File)
  }
}


// File corresponds to a source file
//
export class File extends Node {
  sfile      :SrcFile
  imports    :ImportDecl[] | null  // imports in this file
  decls      :(Decl|FunExpr)[]     // top-level declarations
  unresolved :Set<Ident> | null    // unresolved references

  constructor(
    sfile :SrcFile,
    scope :Scope,
    imports :ImportDecl[]|null,
    decls :(Decl|FunExpr)[],
    unresolved :Set<Ident>|null,
  ) {
    super(NoPos, scope)
    this.sfile = sfile
    this.imports = imports
    this.decls = decls
    this.unresolved = unresolved
  }

  toString() :string {
    return (
      `File("${this.sfile.name}"; ${this.decls.length} decls` +
      ( this.imports ? `; ${this.imports.length} imports)` : '' )
    )
  }

  visitChildren(v :NodeVisitor) {
    if (this.imports) { this.imports.forEach(v) }
    this.decls.forEach(v)
    if (this.unresolved) { this.unresolved.forEach(v) }
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("sfile.name", this.sfile.name)
    v("sfile.base", this.sfile.base)
    v("sfile.size", this.sfile.size)
    v("sfile.lines", this.sfile.lines)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.imports = d.childrenOfType(ImportDecl)
    this.decls = d.childrenOfTypes(Decl,FunExpr)
    this.unresolved = new Set(d.childrenOfType(Ident))
    this.sfile = new SrcFile(
      d.str("sfile.name"),
      d.int32("sfile.base"),
      d.int32("sfile.size"),
      d.int32Array("sfile.lines"),
    )
  }
}


// Ident Type
//       Type
export class Field extends Node {
  type :TypeExpr
  name :Ident|null  // null means anonymous field/parameter

  constructor(pos :Pos, scope :Scope, type :TypeExpr, name :Ident|null) {
    super(pos, scope)
    this.type = type
    this.name = name
  }

  visitChildren(v :NodeVisitor) {
    v(this.type)
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("name", this.name)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.type = d.childOfType(TypeExpr)
    this.name = d.maybeIdent("name")
  }
}


let nextgid = 0

export class Group {
  id :int
  constructor(id? :int) {
    this.id = id === undefined ? nextgid++ : id
  }
}


export class Comment {
  constructor(
    public pos   :Pos,
    public value :Uint8Array,
  ) {}
}


// ——————————————————————————————————————————————————————————————————
// Scope

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
  decl  :Node
  value :Expr|null
  data  :any
  type  :Type|null

  writes :int = 0  // Tracks stores
  nreads :int = 0  // Tracks loads
    // writes and reads does NOT include the definition/declaration itself.

  constructor(
    name  :ByteStr,
    decl  :Node,
    value :Expr|null,
    type  :Type|null = null,
    data  :any = null,
  ) {
    if (!type) {
      // assign by best effort
      type = (

        ( decl &&
          ( decl instanceof Field || decl instanceof VarDecl ) &&
          decl.type &&
          decl.type.type ) ||

        ( value &&
          value.type &&
          value.type ) ||

        null
      )
    }
    this.name = name
    this.decl = decl
    this.value = value
    this.data = data
    this.type = type
  }

  // getTypeExpr returns the Expr which type should represent this
  // Ent's type.
  //
  // This is used by the parser and type resolver only when .type=null
  //
  getTypeExpr() :Expr | null {
    return (
      ( this.decl && (
        this.decl instanceof Field ||
        this.decl instanceof VarDecl
      ) && this.decl.type) ||

      this.value
    )
  }

  isConstant() :bool {
    return this.writes == 0
  }

  get scope() :Scope {
    return this.decl.scope
  }
}


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
export const nilScope = new Scope(null)


// ——————————————————————————————————————————————————————————————————
// Statements
//
// There are two kinds of statements:
// - declaration statements and
// - expression statements.
//
export class Stmt extends Node {}

// // no operation / blank / filler
// export class NoOpStmt extends Stmt {}


export class ReturnStmt extends Stmt {
  constructor(pos :Pos, scope :Scope,
  public result :Expr, // t_nil means no explicit return values
  public type :Type | null,  // effective type. null until resolved.
  ) {
    super(pos, scope)
  }

  visitChildren(v :NodeVisitor) {
    v(this.result)
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("type", this.type)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.result = d.child<Expr>()
    this.type = d.type("type")
  }
}


// "for" init ; cond ; incr { body }
export class ForStmt extends Stmt {
  init :Stmt|null
  cond :Expr|null // condition for executing the body. null=unconditional
  incr :Stmt|null
  body :Expr

  constructor(pos :Pos, scope :Scope, init :Stmt|null, cond :Expr|null, incr :Stmt|null, body :Expr) {
    super(pos, scope)
    this.init = init
    this.cond = cond
    this.incr = incr
    this.body = body
  }

  visitChildren(v :NodeVisitor) {
    v(this.init)
    v(this.cond)
    v(this.incr)
    v(this.body)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.init = d.maybeChild<Stmt>()
    this.cond = d.maybeChild<Expr>()
    this.incr = d.maybeChild<Stmt>()
    this.body = d.child<Expr>()
  }
}


// "while" cond { body }
export class WhileStmt extends ForStmt {
  constructor(pos :Pos, scope :Scope, cond :Expr|null, body :Expr) {
    super(pos, scope, null, cond, null, body)
  }
}


// // "for" assignment "in" expr { body }
// export class ForInStmt extends Stmt {
//   init :Stmt|null
//   cond :Expr|null // condition for executing the body. null=unconditional
//   incr :Stmt|null
//   body :Expr
//   constructor(pos :Pos, scope :Scope, init :Stmt|null, cond :Expr|null, incr :Stmt|null, body :Expr) {
//     super(pos, scope)
//     this.cond = cond
//     this.body = body
//   }
// }


// BranchStmt = BreakStmt | ContStmt
// BreakStmt  = "break" label?
// ContStmt   = "continue" label?
//
export class BranchStmt extends Stmt {
  tok   :token // BREAK | CONTINUE
  label :Ident|null = null

  constructor(pos :Pos, scope :Scope, tok :token) {
    super(pos, scope)
    this.tok = tok
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("tok", this.tok)
    v("label", this.label)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.tok = d.enumVal("tok", token)
    this.label = d.ident("label")
  }
}


// ——————————————————————————————————————————————————————————————————
// Declarations

export class Decl extends Stmt {}


export class MultiDecl extends Decl {
  // MultiDecl represents a collection of declarations that were parsed from
  // a multi-declaration site. E.g. "type (a int; b f32)"

  decls :Decl[]

  constructor(pos :Pos, scope :Scope, decls :Decl[]) {
    super(pos, scope)
    this.decls = decls
  }

  visitChildren(v :NodeVisitor) {
    this.decls.forEach(v)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.decls = d.childrenOfType(Decl)
  }
}


export class ImportDecl extends Decl {
  path       :StringLit
  localIdent :Ident|null

  constructor(pos :Pos, scope :Scope, path :StringLit, localIdent :Ident|null) {
    super(pos, scope)
    this.path = path
    this.localIdent = localIdent
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("localIdent", this.localIdent)
  }

  visitChildren(v :NodeVisitor) {
    v(this.path)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.path = d.childOfType(StringLit)
    this.localIdent = d.ident("localIdent")
  }
}


export class VarDecl extends Decl {
  idents  :Ident[]
  group   :Group|null    // null means not part of a group
  type    :TypeExpr|null // null means no type
  values  :Expr[]|null   // null means no values

  constructor(
    pos :Pos,
    scope :Scope,
    idents :Ident[],
    group :Group|null,
    type :TypeExpr|null = null,
    values :Expr[]|null = null
  ) {
    super(pos, scope)
    this.idents = idents
    this.group = group
    this.type = type
    this.values = values
  }

  visitChildren(v :NodeVisitor) {
    v(this.type)
    if (this.values) { this.values.forEach(v) }
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("idents", this.idents)
    if (this.group) { v("group", this.group.id) }
  }

  restore(d :Decoder) {
    super.restore(d)
    this.type = d.maybeChild<TypeExpr>()
    this.values = d.maybeChildrenOfType(Expr)
    this.idents = d.identArray("idents")
    let gid = d.maybeInt32("group")
    this.group = gid !== null ? new Group(gid) : null
  }
}


export class TypeDecl extends Decl {
  // Ident Type

  ident  :Ident
  alias  :bool
  type   :TypeExpr
  group  :Group|null  // nil = not part of a group

  constructor(
    pos :Pos,
    scope :Scope,
    ident :Ident,
    alias :bool,
    type :TypeExpr,
    group :Group|null,
  ) {
    super(pos, scope)
    this.ident = ident
    this.alias = alias
    this.type = type
    this.group = group
  }

  visitChildren(v :NodeVisitor) {
    v(this.type)
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("ident", this.ident)
    v("alias", this.alias)
    if (this.group) { v("group", this.group.id) }
  }

  restore(d :Decoder) {
    super.restore(d)
    this.ident = d.ident("ident")
    this.alias = d.bool("alias")
    this.type = d.child<TypeExpr>()
    this.alias = d.bool("alias")
    let gid = d.maybeInt32("group")
    this.group = gid !== null ? new Group(gid) : null
  }
}


// ——————————————————————————————————————————————————————————————————
// Expressions

export class Expr extends Stmt {
  type :Type|null = null  // effective type of expression. null until resolved.

  isIdent() :this is Ident {
    return this instanceof Ident
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("type", this.type)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.type = d.maybeType("type")
  }
}

// BadExpr is a placeholder for an expression that failed to parse correctly
// and where we can't provide a better node.
//
export class BadExpr extends Expr {}


// TypeExpr simply represents a type
//
export class TypeExpr extends Expr {
  type :Type

  constructor(pos :Pos, scope :Scope, type :Type) {
    super(pos, scope)
    this.type = type
  }

  toString() {
    return `(type ${this.type})`
  }
}


// BadTypeExpr is a placeholder for a type expression that failed to parse
// correctly and where we can't provide a better node.
//
export class BadTypeExpr extends TypeExpr {
  constructor(pos :Pos, scope :Scope) {
    super(pos, scope, types.t_nil)
  }
}


// "..." TypeExpr
// TODO: get rid of this and just use TypeExpr with RestType
//
export class RestTypeExpr extends TypeExpr {
  type :RestType
  expr :TypeExpr

  constructor(pos :Pos, scope :Scope, expr :TypeExpr, type :RestType) {
    super(pos, scope, type)
    this.expr = expr
  }

  visitChildren(v :NodeVisitor) {
    v(this.expr)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.expr = d.child<TypeExpr>()
  }
}


export class Ident extends Expr {
  ent   :Ent|null = null // what this name references
  value :ByteStr         // interned in ByteStrSet
  // ver :int = 0        // SSA-like version

  constructor(pos :Pos, scope :Scope, value :ByteStr) {
    super(pos, scope)
    this.value = value
  }

  toString() { return String(this.value) }

  incrWrite() {
    assert(this.ent != null)
    let ent = this.ent as Ent
    ent.writes++
    // this.ver = ent.writes
  }

  // ref registers a reference to this ent from an identifier
  //
  refEnt(ent :Ent) {
    assert(this !== ent.decl, "ref declaration")
    ent.nreads++
    this.ent = ent
    // this.ver = ent.writes
  }

  // ref unregisters a reference to this ent from an identifier
  //
  unrefEnt() {
    assert(this.ent, "null ent")
    const ent = this.ent as Ent
    ent.nreads--
    this.ent = null
    // this.ver = 0
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("value", this.value)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.value = d.byteStr("value")
  }
}


export class Block extends Expr {
  list :Stmt[]

  constructor(pos :Pos, scope :Scope, list :Stmt[]) {
    super(pos, scope)
    this.list = list
  }

  visitChildren(v :NodeVisitor) {
    this.list.forEach(v)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.list = d.children<Stmt>()
  }
}

export class IfExpr extends Expr {
  cond :Expr
  then :Expr
  els_ :Expr|null

  constructor(pos :Pos, scope :Scope, cond :Expr, then :Expr, els_ :Expr|null) {
    super(pos, scope)
    this.cond = cond
    this.then = then
    this.els_ = els_
  }

  visitChildren(v :NodeVisitor) {
    v(this.cond)
    v(this.then)
    if (this.els_) { v(this.els_) }
  }

  restore(d :Decoder) {
    super.restore(d)
    this.cond = d.child<Expr>()
    this.then = d.child<Expr>()
    this.els_ = d.maybeChild<Expr>()
  }
}


export class CollectionExpr extends Expr {
  entries :Expr[]

  visitChildren(v :NodeVisitor) {
    this.entries.forEach(v)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.entries = d.children<Expr>()
  }
}


export class TupleExpr extends CollectionExpr {
  // TupleExpr = "(" Expr ("," Expr)+ ")"
  // e.g. (1, true, "three")

  type :TupleType|null

  constructor(pos :Pos, scope :Scope, entries :Expr[], type :TupleType|null) {
    super(pos, scope)
    this.entries = entries
    this.type = type
  }

  toString() {
    return `(${this.entries.join(", ")})`
  }
}


export class ListExpr extends CollectionExpr {
  // ListExpr = "[" ExprList [("," | ";")] "]"
  // e.g. [1, 2, x]

  type :ListType|null

  constructor(pos :Pos, scope :Scope, entries :Expr[], type :ListType|null) {
    super(pos, scope)
    this.type = type
    this.entries = entries
  }

  toString() :string {
    return `[${this.entries.join(", ")}]`
  }
}


export class SelectorExpr extends Expr {
  // Selector = Expr "." ( Ident | Selector )

  lhs :Expr
  rhs :Expr  // Ident or SelectorExpr

  constructor(pos :Pos, scope :Scope, lhs :Expr, rhs :Expr) {
    super(pos, scope)
    this.lhs = lhs
    this.rhs = rhs
  }

  toString() {
    return `${this.lhs}.${this.rhs}`
  }

  visitChildren(v :NodeVisitor) {
    v(this.lhs)
    v(this.rhs)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.lhs = d.child<Expr>()
    this.rhs = d.child<Expr>()
  }
}


export class IndexExpr extends Expr {
  // IndexExpr = Expr "[" Expr "]"
  // e.g. foo[1]

  operand :Expr
  index   :Expr

  indexnum :Num = -1  // used by resolver
    // index value
    // >=0 : resolved
    //  -1 : invalid or unresolved

  constructor(pos :Pos, scope :Scope, operand :Expr, index :Expr) {
    super(pos, scope)
    this.operand = operand
    this.index = index
  }

  toString() :string {
    return `${this.operand}[${this.index}]`
  }

  visitChildren(v :NodeVisitor) {
    v(this.operand)
    v(this.index)
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("cindex", this.indexnum)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.operand = d.child<Expr>()
    this.index = d.child<Expr>()
    this.indexnum = d.int32("cindex")
  }
}


export class SliceExpr extends Expr {
  // SliceExpr = Expr "[" Expr? ":" Expr? "]"
  // e.g. foo[1:4]

  operand :Expr
  start   :Expr|null
  end     :Expr|null

  // constants used by resolver
  startnum :Num = -1
  endnum   :Num = -1
    // >=0 : resolved
    //  -1 : invalid or unresolved

  constructor(pos :Pos, scope :Scope, operand :Expr, start :Expr|null, end :Expr|null) {
    super(pos, scope)
    this.operand = operand
    this.start = start
    this.end = end
  }

  toString() :string {
    return `${this.operand}[${this.start || ''}:${this.end || ''}]`
  }

  visitChildren(v :NodeVisitor) {
    v(this.operand)
    v(this.start)
    if (this.end) { v(this.end) }
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("cstart", this.startnum)
    v("cend", this.endnum)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.operand = d.child<Expr>()
    this.start = d.maybeChild<Expr>()
    this.end = d.maybeChild<Expr>()
    this.startnum = d.int32("cstart")
    this.endnum = d.int32("cend")
  }
}


export class LiteralExpr extends Expr {
  value :Int64|number|Uint8Array

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("value", this.value)
  }

  // Note: restore is implemented by subclasses
}


export class NumLit extends LiteralExpr {
  value :Int64 | number
  type  :NumType

  constructor(pos :Pos, scope :Scope, value: Int64 | number, type :NumType) {
    super(pos, scope)
    this.value = value
    this.type = type
  }

  // convertToType coverts the value of the literal to the provided basic type.
  // Returns true if the conversion was lossless.
  //
  convertToType(t :NumType) :bool {
    let [v, lossless] = numconv(this.value, t)
    this.type = t
    this.value = v
    return lossless
  }

  restore(d :Decoder) {
    super.restore(d)
    this.value = d.num("value")
  }
}


export class IntLit extends NumLit {
  kind  :token.INT | token.INT_BIN | token.INT_OCT | token.INT_HEX
  type  :IntType  // type is always known

  constructor(pos :Pos, scope :Scope,
    value :Int64 | number,
    type  :IntType,
    kind  :token.INT | token.INT_BIN | token.INT_OCT | token.INT_HEX,
  ) {
    super(pos, scope, value, type)
    this.kind = kind
  }

  base() :int {
    switch (this.kind) {
      case token.INT_HEX: return 16
      case token.INT_OCT: return 8
      case token.INT_BIN: return 2
      default:            return 10
    }
  }

  toString() :string {
    switch (this.kind) {
      case token.INT_HEX: return '0x' + this.value.toString(16)
      case token.INT_OCT: return '0o' + this.value.toString(8)
      case token.INT_BIN: return '0b' + this.value.toString(2)
      default:            return this.value.toString(10)
    }
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("base", this.base())
  }

  restore(d :Decoder) {
    super.restore(d)
    let base = d.int32("base")
    this.kind = (
      base == 16 ? token.INT_HEX :
      base == 8  ? token.INT_OCT :
      base == 2  ? token.INT_BIN :
                   token.INT
    )
  }
}


export class CharLit extends NumLit {
  value :int
  type  :typeof types.t_char

  constructor(pos :Pos, scope :Scope, value :number) {
    super(pos, scope, value, types.t_char)
  }

  toString() :string {
    // TODO: clever printing of safe chars, \u and \U sequences, etc.
    return '0x' + this.value.toString(16)
  }
}


export class FloatLit extends NumLit {
  value :number
  type  :FloatType

  constructor(pos :Pos, scope :Scope, value :number, type :FloatType) {
    super(pos, scope, value, type)
  }

  toString() :string {
    return this.value.toString()
  }
}


export class StringLit extends LiteralExpr {
  type  :StrType
  value :Uint8Array

  constructor(pos :Pos, scope :Scope, value :Uint8Array, type :StrType) {
    super(pos, scope)
    this.value = value
    this.type = type
  }

  toString() :string {
    return JSON.stringify(utf8.decodeToString(this.value))
  }

  restore(d :Decoder) {
    super.restore(d)
    this.value = d.bytes("value")
  }
}


export class Assignment extends Expr {
  // e.g. "x = y", "x++"

  op    :token   // ILLEGAL means no operation
  lhs   :Expr[]
  rhs   :Expr[]  // empty == lhs++ or lhs--
  decls :bool[]  // index => bool: new declaration?

  constructor(pos :Pos, scope :Scope, op :token, lhs :Expr[], rhs :Expr[], decls :bool[]) {
    super(pos, scope)
    this.op = op
    this.lhs = lhs
    this.rhs = rhs
    this.decls = decls
  }

  toString() :string {
    return `${this.lhs.join(', ')} ${tokstr(this.op)} ${this.rhs.join(', ')}`
  }

  visitChildren(v :NodeVisitor) {
    this.lhs.forEach(v)
    this.rhs.forEach(v)
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("op", token[this.op])
    v("decls", this.lhs.map((_, i) => !!this.decls[i]))
  }

  restore(d :Decoder) {
    super.restore(d)
    this.op = d.enumVal("op", token)
    this.decls = d.boolArray("decls")
    this.rhs = d.children<Expr>()
    if (this.rhs.length == 1) {
      this.lhs = this.rhs
      this.rhs = []
    } else {
      assert(this.rhs.length % 2 == 0, `uneven number of children ${this.rhs.length}`)
      this.lhs = this.rhs.splice(0, this.rhs.length / 2)
    }
  }
}


export class Operation extends Expr {
  // e.g. "x + y"
  constructor(pos :Pos, scope :Scope,
  public op :token, // [token.operator_beg .. token.operator_end]
  public x  :Expr,
  public y  :Expr|null = null, // nil means unary expression
  ) {
    super(pos, scope)
  }

  toString() {
    return `(${token[this.op]} ${this.x}${this.y ? ' ' + this.y : ''})`
  }

  visitChildren(v :NodeVisitor) {
    v(this.x)
    if (this.y) { v(this.y) }
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("op", token[this.op])
  }

  restore(d :Decoder) {
    super.restore(d)
    this.op = d.enumVal("op", token)
    this.x = d.childOfType(Expr)
    this.y = d.maybeChildOfType(Expr)
  }
}


export class CallExpr extends Expr {
  // Fun(ArgList[0], ArgList[1], ...)

  receiver :Expr
  args     :Expr[]
  hasRest  :bool  // last argument is followed by ...

  constructor(pos :Pos, scope :Scope, receiver :Expr, args :Expr[], hasRest :bool) {
    super(pos, scope)
    this.receiver = receiver
    this.args = args
    this.hasRest = hasRest
  }

  visitChildren(v :NodeVisitor) {
    v(this.receiver)
    this.args.forEach(v)
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("hasRest", this.hasRest)
  }
}


// export class TypeCallExpr extends Expr {
//   // Type(parameter...)

//   args    :Expr[]
//   hasRest :bool   // last argument is followed by ...

//   constructor(pos :Pos, scope :Scope, type :Type, args :Expr[], hasRest :bool) {
//     super(pos, scope)
//     this.type = type
//     this.args = args
//     this.hasRest = hasRest
//   }

//   visitChildren(v :NodeVisitor) {
//     this.args.forEach(v)
//   }

//   visitFields(v :FieldVisitor) {
//     super.visitFields(v)
//     v("hasRest", this.hasRest)
//   }
// }


// export class ParenExpr extends Expr {
//   // (X)
//   constructor(pos :Pos, scope :Scope,
//   public x :Expr,
//   ) {
//     super(pos, scope)
//   }
// }


export class FunExpr extends Expr {
  name   :Ident|null       // null = anonymous func expression
  isInit :bool             // true for special "init" funs at file level
  sig    :FunSig
  body   :Expr|null = null // null = forward declaration
  // nlocali32 :int = 0
  // nlocali64 :int = 0
  // nlocalf32 :int = 0
  // nlocalf64 :int = 0

  constructor(pos :Pos, scope :Scope, name :Ident|null, sig :FunSig, isInit :bool = false) {
    super(pos, scope)
    scope.fun = this  // Mark the scope as being a "function scope"
    this.name = name
    this.isInit = isInit
    this.sig = sig
  }

  visitChildren(v :NodeVisitor) {
    // v(this.name)
    v(this.sig)
    if (this.body) { v(this.body) }
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("name", this.name)
    v("isInit", this.isInit)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.name = d.maybeIdent("name")
    this.isInit = d.bool("isInit")
    this.sig = d.child<FunSig>()
    this.body = d.maybeChild<Expr>()
  }
}


export class FunSig extends Node {
  params :Field[]
  result :TypeExpr|null  // null = auto

  constructor(pos :Pos, scope :Scope, params :Field[], result :TypeExpr|null) {
    super(pos, scope)
    this.params = params
    this.result = result
  }

  visitChildren(v :NodeVisitor) {
    v(this.result)
    this.params.forEach(v)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.result = d.maybeChild<TypeExpr>()
    this.params = d.children<Field>()
  }
}


export class TypeConvExpr extends Expr {
  expr :Expr

  constructor(pos :Pos, scope :Scope, expr :Expr, type :Type) {
    super(pos, scope)
    this.type = type
    this.expr = expr
  }

  visitChildren(v :NodeVisitor) {
    v(this.expr)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.expr = d.child<Expr>()
  }
}


// NativeTypeExpr represents basic/bottom types
//
export class NativeTypeExpr extends TypeExpr {
  type :NativeType
  constructor(type :NativeType) {
    super(0, nilScope, type)
  }
}


// Atom is a value that identifies itself
//
// i.e. true, false, nil
//
export class Atom extends Expr {
  name :string

  constructor(name :string, type :Type) {
    super(0, nilScope)
    this.name = name
    this.type = type
  }

  toString() {
    return this.name
  }

  visitFields(v :FieldVisitor) {
    super.visitFields(v)
    v("name", this.name)
  }

  restore(d :Decoder) {
    super.restore(d)
    this.name = d.str("name")
  }
}


// built-in, predefined types
export const builtInTypes = {
  "nil":     new NativeTypeExpr(types.t_nil),
  "bool":    new NativeTypeExpr(types.t_bool),
  "u8":      new NativeTypeExpr(types.t_u8),
  "i8":      new NativeTypeExpr(types.t_i8),
  "u16":     new NativeTypeExpr(types.t_u16),
  "i16":     new NativeTypeExpr(types.t_i16),
  "u32":     new NativeTypeExpr(types.t_u32),
  "i32":     new NativeTypeExpr(types.t_i32),
  "u64":     new NativeTypeExpr(types.t_u64),
  "i64":     new NativeTypeExpr(types.t_i64),
  "uint":    new NativeTypeExpr(types.t_uint),
  "int":     new NativeTypeExpr(types.t_int),
  "uintptr": new NativeTypeExpr(types.t_uintptr),
  "f32":     new NativeTypeExpr(types.t_f32),
  "f64":     new NativeTypeExpr(types.t_f64),

  "byte":    new NativeTypeExpr(types.t_byte),
  "char":    new NativeTypeExpr(types.t_char),

  "str":     new NativeTypeExpr(types.t_str),

  "list":    new NativeTypeExpr(types.t_list),
  "tuple":   new NativeTypeExpr(types.t_tuple),
}


const typeToBuiltInTypes = new Map<Type,TypeExpr>()
for (let k in builtInTypes) {
  let x = (builtInTypes as any)[k] as TypeExpr
  typeToBuiltInTypes.set(x.type, x)
}

// getTypeExpr returns an interned TypeExpr for t if one exists,
// or creates a new TypeExpr that references t.
//
export function GetTypeExpr(t :Type) :TypeExpr {
  let x = typeToBuiltInTypes.get(t)
  return x || new TypeExpr(0, nilScope, t)
}


// built-in, predefined values
export const builtInValues = {
  true:  new Atom("true",  types.t_bool),
  false: new Atom("false", types.t_bool),
  nil:   new Atom("nil",   types.t_nil),
}
