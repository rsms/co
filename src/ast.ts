import { Pos, SrcFile } from './pos'
import { ByteStr } from './bytestr'
import { token, tokstr } from './token'
import * as utf8 from './utf8'
import { Num, numconv } from './num'
import { Int64 } from './int64'
import {
  Type,
  NativeType,
  NumType,
  IntType,
  FloatType,
  RestType,
  StrType,
} from './types'
import * as types from './types'

// ——————————————————————————————————————————————————————————————————
// AST type hierarchy
//
//  Group
//  Comment
//  Node
//    Field
//    Stmt
//      NoOpStmt
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

let nextgid = 0
export class Group { id = nextgid++ } // nextgid only for DEBUG

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

  toString() :string {
    return this.constructor.name
  }
}

// Ident Type
//       Type
export class Field extends Node {
  constructor(pos :Pos, scope :Scope,
  public type :TypeExpr,
  public name :Ident|null,
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
const nilScope = new Scope(null)


// File corresponds to a source file
//
export class File {
  constructor(
    public sfile      :SrcFile,
    public scope      :Scope,
    public imports    :ImportDecl[] | null,  // imports in this file
    public decls      :(Decl|FunExpr)[],     // top-level declarations
    public unresolved :Set<Ident> | null,    // unresolved references
  ) {}

  toString() :string {
    return (
      `File("${this.sfile.name}"; ${this.decls.length} decls` +
      ( this.imports ? `; ${this.imports.length} imports)` : '' )
    )
  }
}

export class Package {
  files :File[] = []

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


// ——————————————————————————————————————————————————————————————————
// Statements
//
// There are two kinds of statements:
// - declaration statements and
// - expression statements.
//
export class Stmt extends Node {}

// no operation / blank / filler
export class NoOpStmt extends Stmt {}


export class ReturnStmt extends Stmt {
  constructor(pos :Pos, scope :Scope,
  public result :Expr, // t_nil means no explicit return values
  public type :Type | null,  // effective type. null until resolved.
  ) {
    super(pos, scope)
  }
}


export class WhileStmt extends Stmt {
  constructor(pos :Pos, scope :Scope,
  public cond :Expr, // condition for executing the body
  public body :Expr,
  ) {
    super(pos, scope)
  }
}


// ——————————————————————————————————————————————————————————————————
// Declarations

export class Decl extends Stmt {}

export class MultiDecl extends Decl {
  // MultiDecl represents a collection of declarations that were parsed from
  // a multi-declaration site. E.g. "type (a int; b f32)"
  constructor(pos :Pos, scope :Scope,
  public decls :Decl[],
  ) {
    super(pos, scope)
  }
}

export class ImportDecl extends Decl {
  constructor(pos :Pos, scope :Scope,
  public path       :StringLit,
  public localIdent :Ident|null,
  ) {
    super(pos, scope)
  }
}

export class VarDecl extends Decl {
  constructor(pos :Pos, scope :Scope,
  public idents  :Ident[],
  public group   :Group|null,           // null means not part of a group
  public type    :TypeExpr|null = null, // null means no type
  public values  :Expr[]|null = null,   // null means no values
  ) {
    super(pos, scope)
  }
}

export class TypeDecl extends Decl {
  // Ident Type
  constructor(pos :Pos, scope :Scope,
  public ident  :Ident,
  public alias  :bool,
  public type   :TypeExpr,
  public group  :Group|null, // nil = not part of a group
  ) {
    super(pos, scope)
  }
}


// ——————————————————————————————————————————————————————————————————
// Expressions

export class Expr extends Stmt {
  type :Type|null = null  // effective type of expression. null until resolved.

  isIdent() :this is Ident {
    return this instanceof Ident
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
//
export class RestTypeExpr extends TypeExpr {
  type :RestType
  expr :TypeExpr

  constructor(pos :Pos, scope :Scope, expr :TypeExpr, type :RestType) {
    super(pos, scope, type)
    this.expr = expr
  }
}


export class Ident extends Expr {
  ent :Ent|null = null // what this name references

  constructor(pos :Pos, scope :Scope,
    public value :ByteStr, // interned in ByteStrSet
    public ver :int = 0,   // SSA-like version
  ) {
    super(pos, scope)
  }

  toString() { return String(this.value) }

  incrWrite() {
    assert(this.ent != null)
    let ent = this.ent as Ent
    ent.writes++
    this.ver = ent.writes
  }

  // ref registers a reference to this ent from an identifier
  //
  refEnt(ent :Ent) {
    assert(this !== ent.decl, "ref declaration")
    ent.nreads++
    this.ent = ent
    this.ver = ent.writes
  }

  // ref unregisters a reference to this ent from an identifier
  //
  unrefEnt() {
    assert(this.ent, "null ent")
    const ent = this.ent as Ent
    ent.nreads--
    this.ent = null
    this.ver = 0
  }
}


export class Block extends Expr {
  constructor(pos :Pos, scope :Scope,
  public list :Stmt[],
  ) {
    super(pos, scope)
  }
}

export class IfExpr extends Expr {
  constructor(pos :Pos, scope :Scope,
  public cond :Expr,
  public then :Expr,
  public els_ :Expr|null,
  ) {
    super(pos, scope)
  }
}


export class TupleExpr extends Expr {
  // TupleExpr = "(" Expr ("," Expr)+ ")"
  constructor(pos :Pos, scope :Scope,
  public exprs :Expr[],
  ) {
    super(pos, scope)
  }

  toString() {
    return `(${this.exprs.map(x => x.toString()).join(', ')})`
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


export class IndexExpr extends Expr {
  // IndexExpr = Expr "[" Expr "]"

  indexv :int = -1  // >=0 = resolved, -1 = invalid/unresolved
    // TODO: remove when we remove resolve.resolveTupleIndex

  indexnum :Num = -1
    // index value
    // >=0 : resolved
    //  -1 : invalid or unresolved

  constructor(pos :Pos, scope :Scope,
    public operand :Expr,
    index   :Expr,
    // public index   :Expr,
  ) {
    super(pos, scope)
    this._index = index
  }

  private _index :Expr

  get index() :Expr { return this._index }
  set index(x :Expr) {
    let e = new Error()
    console.log(
      '>>>> set index\n' +
      (e.stack as string).split('\n').slice(2).join('\n'))
    this._index = x
  }

  toString() :string {
    return `${this.operand}[${this.index}]`
  }
}


export class SliceExpr extends Expr {
  // SliceExpr = Expr "[" Expr? ":" Expr? "]"

  startnum :Num = -1
  endnum   :Num = -1
    // >=0 : resolved
    //  -1 : invalid or unresolved

  constructor(pos :Pos, scope :Scope,
    public operand :Expr,
    public start   :Expr|null,
    public end     :Expr|null,
  ) {
    super(pos, scope)
  }

  toString() :string {
    return `${this.operand}[${this.start || ''}:${this.end || ''}]`
  }
}


export class LiteralExpr extends Expr {}


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

  toString() :string {
    switch (this.kind) {
      case token.INT_HEX: return '0x' + this.value.toString(16)
      case token.INT_OCT: return '0o' + this.value.toString(8)
      case token.INT_BIN: return '0b' + this.value.toString(2)
      default:            return this.value.toString(10)
    }
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


// export const ImplicitOne = new IntLit(
//   0,
//   nilScope,
//   token.INT,
//   null as any as Uint8Array,
// )


export class StringLit extends LiteralExpr {
  type  :StrType
  value :Uint8Array

  constructor(pos :Pos, scope :Scope, value :Uint8Array, type :StrType) {
    super(pos, scope)
    this.type = type
  }

  toString() :string {
    return JSON.stringify(utf8.decodeToString(this.value))
  }
}

export class Assignment extends Expr {
  constructor(pos :Pos, scope :Scope,
  public op  :token, // ILLEGAL means no operation
  public lhs :Expr[],
  public rhs :Expr[], // empty == lhs++ or lhs--
  ) {
    super(pos, scope)
  }

  toString() :string {
    return `${this.lhs.join(', ')} ${tokstr(this.op)} ${this.rhs.join(', ')}`
  }
}

export class Operation extends Expr {
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
}

export class CallExpr extends Expr {
  // Fun(ArgList[0], ArgList[1], ...)
  constructor(pos :Pos, scope :Scope,
  public fun     :Expr,
  public args    :Expr[],
  public hasDots :bool,  // last argument is followed by ...
  ) {
    super(pos, scope)
  }
}

// export class ParenExpr extends Expr {
//   // (X)
//   constructor(pos :Pos, scope :Scope,
//   public x :Expr,
//   ) {
//     super(pos, scope)
//   }
// }

export class FunExpr extends Expr {
  body :Expr|null = null // nil = forward declaration
  // nlocali32 :int = 0
  // nlocali64 :int = 0
  // nlocalf32 :int = 0
  // nlocalf64 :int = 0

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
  public params :Field[],
  public result :TypeExpr | null,  // null = auto
  ) {
    super(pos, scope)
  }
}


export class TypeConvExpr extends Expr {
  constructor(pos :Pos, scope :Scope,
    public expr :Expr,
    public type :Type,
  ) {
    super(pos, scope)
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
  type :Type

  constructor(name :string, type :Type) {
    super(0, nilScope)
    this.name = name
    this.type = type
  }

  toString() {
    return this.name
  }
}


// built-in, predefined types
export const builtInTypes : {[name :string] :TypeExpr} = {
  "nil":   new NativeTypeExpr(types.t_nil),
  "bool":  new NativeTypeExpr(types.t_bool),
  "u8":    new NativeTypeExpr(types.t_u8),
  "i8":    new NativeTypeExpr(types.t_i8),
  "u16":   new NativeTypeExpr(types.t_u16),
  "i16":   new NativeTypeExpr(types.t_i16),
  "u32":   new NativeTypeExpr(types.t_u32),
  "i32":   new NativeTypeExpr(types.t_i32),
  "u64":   new NativeTypeExpr(types.t_u64),
  "i64":   new NativeTypeExpr(types.t_i64),
  "uint":  new NativeTypeExpr(types.t_uint),
  "int":   new NativeTypeExpr(types.t_int),
  "usize": new NativeTypeExpr(types.t_usize),
  "isize": new NativeTypeExpr(types.t_isize),
  "f32":   new NativeTypeExpr(types.t_f32),
  "f64":   new NativeTypeExpr(types.t_f64),

  "byte":  new NativeTypeExpr(types.t_byte),
  "char":  new NativeTypeExpr(types.t_char),

  "str":   new NativeTypeExpr(types.t_str),
}


const typeToBuiltInTypes = new Map<Type,TypeExpr>()
for (let k in builtInTypes) {
  let x = (builtInTypes)[k]
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
export const builtInValues : {[name :string] :Expr} = {
  "true":  new Atom("true",  types.t_bool),
  "false": new Atom("false", types.t_bool),
  "nil":   new Atom("nil",   types.t_nil),
}
