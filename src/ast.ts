import { Pos, SrcFile } from './pos'
import { ByteStr } from './bytestr'
import { token, tokstr } from './token'
import * as utf8 from './utf8'
import { Num, numconv } from './num'
import { Int64 } from './int64'

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
//        Type
//          ...
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
  public type :Expr,
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
  writes :int = 0  // Tracks stores
  nreads :int = 0  // Tracks loads
    // writes and reads does NOT include the definition/declaration itself.

  constructor(
    public name  :ByteStr,
    public decl  :Node,
    public value :Expr|null,
    public data  :any = null,
    public type  :Type|null = null, // TODO: use this
  ) {}

  getTypeExpr() :Expr | null {
    return (
      ( this.decl && (
        this.decl instanceof Field ||
        this.decl instanceof VarDecl
      ) && this.decl.type) ||

      ( this.value && this.value.type) ||

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
  public result :Expr, // u_t_nil means no explicit return values
  public type :Type,  // effective type. null until resolved.
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


// ——————————————————————————————————————————————————————————————————
// Expressions

export class Expr extends Stmt {
  type :Type|null = null  // effective type of expression. null until resolved.
}

// Placeholder for an expression that failed to parse correctly and
// where we can't provide a better node.
export class BadExpr extends Expr {}


export class Ident extends Expr {
  ent :Ent|null = null // what this name references

  constructor(pos :Pos, scope :Scope,
    public value :ByteStr, // interned in ByteStrSet
    public ver :int = 0,   // SSA version
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


export class RestExpr extends Expr {
  // ...expr
  constructor(pos :Pos, scope :Scope,
    public expr :Expr,
  ) {
    super(pos, scope)
  }
}

export class LiteralExpr extends Expr {}


export class NumLit extends LiteralExpr {
  //
  // kind = INT | INT_BIN | INT_OCT | INT_HEX | FLOAT | CHAR
  //

  type :NumType  // type is always known

  // Note: kind is only needed for Universe.basicLitType
  // so when we get rid of that function, we can get rid of "kind"

  constructor(pos :Pos, scope :Scope,
    public kind  :token,
    public value :Int64|number,
    type         :NumType,
  ) {
    super(pos, scope)
    assert(token.literal_basic_beg < kind && kind < token.literal_basic_end)
    this.type = type
  }

  toString() :string {
    return this.value.toString()
  }

  isInt() :bool {
    return this.type instanceof IntType
  }

  isFloat() :bool {
    return !this.isInt()
  }

  // convertTo coverts the value of the literal to the provided basic type.
  // Returns true if the conversion was lossless.
  //
  convertToType(t :NumType) :bool {
    let [v, lossless] = numconv(this.value, t)
    this.type = t
    this.value = v
    return lossless
  }

  // // castToType returns a new NumLit of type t.
  // // Returns null if the conversion would be lossy.
  // // Note: Returns a new NumLit even when this.type==t
  // //
  // castToType(t :NumType) :NumLit|null {
  //   let [v, lossless] = numconv(this.value, t)
  //   this.type = t
  //   this.value = v
  //   return lossless
  // }
}

// export const ImplicitOne = new NumLit(
//   0,
//   nilScope,
//   token.INT,
//   null as any as Uint8Array,
// )

export class StringLit extends LiteralExpr {
  constructor(pos :Pos, scope :Scope,
    public value :Uint8Array
  ) {
    super(pos, scope)
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
  public result :Expr,
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


export class TypeConvExpr extends Expr {
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

  // accepts returns true if the other type is compatible with this type.
  // essentially: "this >= other"
  // For instance, if the receiver is the same as `other`
  // or a superset of `other`, true is returned.
  //
  accepts(other :Type) :bool {
    return this.equals(other)
  }

  // equals returns true if the receiver is equivalent to `other`
  //
  equals(other :Type) :bool {
    return this === other
  }
}

export class UnresolvedType extends Type {
  refs :Set<Expr|FunSig>|null = null  // things that references this type

  constructor(pos :Pos, scope :Scope,
    public expr :Expr,
  ) {
    super(pos, scope)
  }

  addRef(x :Expr|FunSig) {
    assert(x !== this.expr)
    // if (x !== this.expr) {
    if (!this.refs) {
      this.refs = new Set<Expr|FunSig>([x])
    } else {
      this.refs.add(x)
    }
    // }
  }

  toString() {
    return '~' + this.expr.toString()
  }
}

// storage type needed for a basic type
export enum MemType {
  i32,
  i64,
  f32,
  f64
}

export class BasicType extends Type {
  constructor(
    public bitsize :int,
    public memtype :MemType,
    public name :string, // only used for debugging and printing
  ) {
    super(0, nilScope)
  }

  toString() :string {
    return this.name
  }

  equals(other :Type) :bool {
    return this === other
  }

  // TODO: accepts(other :Type) :bool
}


export class NumType extends BasicType {
}


export class IntType extends NumType {
  constructor(bitsize :int, memtype :MemType, name :string,
    public signed :bool, // true if type is signed
  ) {
    super(bitsize, memtype, name)
  }
}

// basic type constants
const uintz :number = 32 // TODO: target-dependant
const uintmemtype = uintz <= 32 ? MemType.i32 : MemType.i64

export const
  u_t_auto = new BasicType(0,    MemType.i32, 'auto') // special
, u_t_nil  = new BasicType(0,    MemType.i32, 'nil') // special, aka "void"
, u_t_bool = new BasicType(1,    MemType.i32, 'bool')
, u_t_u8  = new IntType(8,       MemType.i32, 'u8', false)
, u_t_i8  = new IntType(7,       MemType.i32, 'i8', true)
, u_t_u16 = new IntType(16,      MemType.i32, 'u16', false)
, u_t_i16 = new IntType(15,      MemType.i32, 'i16', true)
, u_t_u32 = new IntType(32,      MemType.i32, 'u32', false)
, u_t_i32 = new IntType(31,      MemType.i32, 'i32', true)
, u_t_u64 = new IntType(64,      MemType.i64, 'u64', false)
, u_t_i64 = new IntType(63,      MemType.i64, 'i64', true)
, u_t_f32 = new NumType(32,    MemType.f32, 'f32')
, u_t_f64 = new NumType(64,    MemType.f64, 'f64')
, u_t_uint = new IntType(uintz,  uintmemtype, 'uint', false)
, u_t_int  = new IntType(uintz-1,uintmemtype, 'int', true)
, u_t_uint_itype = uintmemtype == MemType.i32 ? u_t_u32 : u_t_u64
, u_t_int_itype = uintmemtype == MemType.i32 ? u_t_i32 : u_t_i64


export class StrType extends Type {
  constructor(
    public length :int, // -1 == length only known at runtime
  ) {
    super(0, nilScope)
  }

  toString() :string {
    return this.length > -1 ? `str<${this.length}>` : 'str'
  }

  equals(other :Type) :bool {
    // TODO: break this up, partly into accepts(), so its truly "equals",
    // e.g. "cstr<4> != str"
    return (
      this === other ||
      ( other instanceof StrType &&
        this.length == other.length
      )
    )
  }
}


export const u_t_str = new StrType(-1)  // heap-allocated string



export class RestType extends Type {
  // ...type
  constructor(
    public type :Type,
  ) {
    super(0, nilScope)
    this.type = type
  }

  toString() :string {
    return `...${this.type}`
  }

  equals(other :Type) :bool {
    return (
      this === other ||
      ( other instanceof RestType &&
        this.type.equals(other.type)
      )
    )
  }
}

export class TupleType extends Type {
  // TupleType = "(" Type ("," Type)+ ")"
  constructor(
  public types :Type[],
  ) {
    super(0, nilScope)
  }

  toString() :string {
    return '(' + this.types.map(t => t.toString()).join(', ') + ')'
  }

  equals(other :Type) :bool {
    return (
      this === other ||
      ( other instanceof TupleType &&
        this.types.length == other.types.length &&
        this.types.every((t, i) => t.equals(other.types[i]))
      )
    )
  }
}

export class FunType extends Type {
  // FunType = ( Type | TupleType ) "->" Type
  constructor(
  public inputs :Type[],
  public result :Type,
  ) {
    super(0, nilScope)
  }

  equals(other :Type) :bool {
    return (
      this === other ||
      ( other instanceof FunType &&
        this.inputs.length == other.inputs.length &&
        this.result.equals(other.result) &&
        this.inputs.every((t, i) => t.equals(other.inputs[i]))
      )
    )
  }
}

export class UnionType extends Type {
  constructor(
    public types :Set<Type>,
  ) {
    super(0, nilScope)
  }

  add(t :Type) {
    assert(!(t instanceof UnionType))
    this.types.add(t)
  }

  toString() :string {
    let s = '(U ', first = true
    for (let t of this.types) {
      if (first) {
        first = false
      } else {
        s += '|'
      }
      s += t.toString()
    }
    return s + ')'
  }

  equals(other :Type) :bool {
    if (this === other) {
      return true
    }
    if (!(other instanceof UnionType) || other.types.size != this.types.size) {
      return false
    }
    // Note: This relies on type instances being singletons (being interned)
    for (let t of this.types) {
      if (!other.types.has(t)) {
        return false
      }
    }
    return true
  }

  accepts(other :Type) :bool {
    if (this === other) {
      return true
    }
    if (!(other instanceof UnionType)) {
      return false
    }
    // Note: This relies on type instances being singletons (being interned)
    // make sure that we have at least the types of `other`.
    // e.g.
    //   (int|f32|bool) accepts (int|f32) => true
    //   (int|f32) accepts (int|f32|bool) => false
    for (let t of other.types) {
      if (!this.types.has(t)) {
        return false
      }
    }
    return true
  }
}


export class OptionalType extends Type {
  constructor(
    public type :Type,
  ) {
    super(0, nilScope)
    assert(!(type instanceof OptionalType))
    assert(!(type instanceof UnionType))
    assert(!(type instanceof BasicType))
  }

  toString() :string {
    return this.type.toString() + '?'
  }

  equals(other :Type) :bool {
    return (
      this === other ||
      ( other instanceof OptionalType &&
        this.type.equals(other.type)
      )
    )
  }

  accepts(other :Type) :bool {
    return (
      this.equals(other) ||       // e.g. "x str?; y str?; x = y"
      this.type.equals(other) ||  // e.g. "x str?; y str; x = y"
      other === u_t_nil           // e.g. "x str?; x = nil"
    )
  }
}


export const u_t_optstr = new OptionalType(u_t_str)



// ——————————————————————————————————————————————————————————————————
// File

// A File corresponds to a source file
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
