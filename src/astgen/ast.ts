import { Pos, NoPos, SrcFile } from "../pos"
import { token } from "../token"
import { ByteStr } from "../bytestr"
import { Int64 } from "../int64"
import { Num } from "../num"
import { numconv } from "../numconv"
import { Scope, Ent, nilScope } from "../ast_scope"
import { Visitable, Visitor } from "../ast_visit"
import { ReprVisitor } from "../ast_repr"
import { StrWriter } from "../util"

// --------------------------------------------------------------------------------

export interface TypedNode {
  type :Type
}

class Node implements Visitable {
  pos :Pos

  toString() :string { return this.constructor.name }

  // repr returns a human-readable and machine-parsable string representation
  // of the tree represented by this node.
  repr(sep? :string) :string
  repr(sep :string, w :StrWriter) :void
  repr(sep :string = "\n", w? :StrWriter) :string|void {
    let v = new ReprVisitor(sep, w)
    v.visitNode(this)
    if (!w) { return v.toString() }
  }

  foofoo() {
    Storage[Storage.Int]
  }

  isUnresolved() :this is UnresolvedType|TypedNode {
    // isUnresolved returns true for any node that references something which is
    // not yet resolved. TODO: consider adding node UnresolvedIdent
    return (
      this.isUnresolvedType() ||
      (!this.isType() && (this as any).type instanceof UnresolvedType)
    )
  }
  // Auto-generated methods:
  // isTYPE() :this is TYPE
}

class Package extends Node {
  pos = NoPos
  name   :string
  _scope :Scope
  files  :File[] = []

  toString() :string { return `(Package ${JSON.stringify(this.name)})` }
}

class File extends Node {
  pos = NoPos
  sfile       :SrcFile
  _scope      :Scope
  imports?    :ImportDecl[]  // imports in this file
  decls       :(Decl|FunExpr)[]   // top-level declarations
  unresolved? :Set<Ident>    // unresolved references

  toString() :string { return `(File ${JSON.stringify(this.sfile.name)})` }
}

class Comment extends Node {
  value :Uint8Array
}

class Bad extends Node {
  message :string
  // Bad is a placeholder for something that failed to parse correctly
  // and where we can't provide a better node.
}

class FunSig extends Node {
  // TODO: consider merging with FunType
  params  :FieldDecl[]
  result? :Type  // null = auto
}

class Stmt extends Node {
  _scope :Scope
}

class Expr extends Stmt {
  type? :Type = null  // effective type of expression. null until resolved.
}

// -----------------------------------------------------------------------------
// Types

class Type extends Expr {
  _scope = nilScope
  // Note: "type" property on a type has a different meaning than for other
  // node classes. "type" is used to describe a subtype in some classes,
  // like for instance OptionalType.

  // accepts returns true if the other type is compatible with this type.
  // essentially: "this >= other"
  // For instance, if the receiver is the same as `other`
  // or a superset of `other`, true is returned.
  accepts(other :Type) :bool { return this.equals(other) }

  // equals returns true if the receiver is equivalent to `other`
  equals(other :Type) :bool { return this === other }

  // canonicalType returns the underlying canonical type for
  // classes that wraps a type, like AliasType.
  canonicalType() :Type { return this }
}

class VoidType extends Type {
  // Equivalent to a strict type of "nil"; function with no return value.
}

export const t_void = new VoidType(NoPos)

class UnresolvedType extends Type {
  // UnresolvedType represents a type that is not yet known, but may be
  // known later (i.e. during bind/resolve.)
  //
  // Whenever something refers to this type, you must call addRef(x) where
  // x is the thing that uses/refers to this type. This makes it possible
  // for the TypeResolver to--when resolving this type--go in an edit all
  // the uses of this type, updating them with the concrete, resolved type.
  refs? :Set<Node> = null  // things that references this type
  def   :Expr

  addRef(x :Node) {
    assert(x !== this.def, 'addRef called with own definition')
    if (!this.refs) {
      this.refs = new Set<Node>([x])
    } else {
      this.refs.add(x)
    }
  }

  repr(sep :string = "\n  ") {
    return '~' + this.def.repr(sep)
  }
}

class OptionalType extends Type { // aka "nullable" type
  // OptionalType = Type "?"
  type :Type

  equals(t :Type) :bool {
    return this === t || (t.isOptionalType() && this.type.equals(t.type))
  }
  accepts(t :Type) :bool {
    return (
      this.equals(t) ||        // e.g. "x T?; y T?; x = y"
      this.type.accepts(t) ||  // e.g. "x T?; y T; x = y"
      t === t_nil              // e.g. "x T?; x = nil"
    )
  }
}

// Storage denotes the storage type needed for a primitive type
export enum Storage {
  None = 0, // zero-width; not a concrete type
  Ptr,      // Target-defined pointer (at least 32 bit)
  Int,      // Target-defined integer (at least 32 bit)
  Bool,     // Target-defined boolean
  i8,       // 8-bit integer
  i16,      // 16-bit integer
  i32,      // 32-bit integer
  i64,      // 64-bit integer
  f32,      // 32-bit floating-point
  f64,      // 64-bit floating-point
}
const StorageSize = {
  [Storage.None] : 0,
  [Storage.Ptr]  : 4, // Note: target arch may use different size
  [Storage.Int]  : 4, // Note: target arch may use different size
  [Storage.Bool] : 4, // Note: target arch may use different size
  [Storage.i8]   : 1,
  [Storage.i16]  : 2,
  [Storage.i32]  : 4,
  [Storage.i64]  : 8,
  [Storage.f32]  : 4,
  [Storage.f64]  : 8,
}

// class NativeType extends Type {
//   // NativeType represents all built-in types, like i32, str, bool, etc.
// }
class PrimType extends Type {  // was "BasicType"
  // primitive type, e.g. i32, f64, bool, etc.
  pos = NoPos

  name    :string
  storage :Storage  // type of underlying storage
  _storageSize = StorageSize[this.storage]  // size in bytes

  // storageSize returns the underlying storage size in bytes
  storageSize() :int { return this._storageSize }

  // convenience function used by arch rewrite rules
  isI8()   :bool { return this.storage == Storage.i8 }
  isI16()  :bool { return this.storage == Storage.i16 }
  isI32()  :bool { return this.storage == Storage.i32 }
  isI64()  :bool { return this.storage == Storage.i64 }
  isF32()  :bool { return this.storage == Storage.f32 }
  isF64()  :bool { return this.storage == Storage.f64 }
  isBool() :bool { return this.storage == Storage.Bool }
  isPtr()  :bool { return this.storage == Storage.Ptr }
  isNil()  :bool { return this.storage == Storage.None }
  toString() :string { return this.name }
  repr(sep :string = "") :string { return this.name }
}
class NilType extends PrimType {}
class BoolType extends PrimType {}
class NumType extends PrimType {} // all number types
  class FloatType extends NumType {}
  class IntType extends NumType {}
    class SIntType extends IntType {}
    class UIntType extends IntType {}
      class MemType extends UIntType {} // used by SSA IR to represent memory state

// predefined constant of all primitive types.
// string names should match exported constant name sans "t_".
export const t_nil     = new NilType("nil",      Storage.None)
export const t_bool    = new BoolType("bool",    Storage.Bool)
export const t_rune    = new UIntType("rune",    Storage.i32)
export const t_byte    = new UIntType("byte",    Storage.i8)
export const t_u8      = new UIntType("u8",      Storage.i8)
export const t_i8      = new SIntType("i8",      Storage.i8)
export const t_u16     = new UIntType("u16",     Storage.i16)
export const t_i16     = new SIntType("i16",     Storage.i16)
export const t_u32     = new UIntType("u32",     Storage.i32)
export const t_i32     = new SIntType("i32",     Storage.i32)
export const t_u64     = new UIntType("u64",     Storage.i64)
export const t_i64     = new SIntType("i64",     Storage.i64)
export const t_uint    = new UIntType("uint",    Storage.Int)
export const t_int     = new SIntType("int",     Storage.Int)
export const t_uintptr = new UIntType("uintptr", Storage.Ptr)
export const t_mem     = new MemType("mem",      Storage.Ptr)
export const t_f32     = new FloatType("f32",    Storage.f32)
export const t_f64     = new FloatType("f64",    Storage.f64)

class StrType extends Type {
  // StrType = "str" ("<" length ">")?
  len :int // -1 means length only known at runtime

  equals(t :Type) :bool { return this === t || t.isStrType() }
  repr(sep :string = "") :string { return this.len == -1 ? "str" : `str<${this.len}>` }
}

class UnionType extends Type {
  // UnionType = Type ("|" Type)+
  types :Set<Type>

  add(t :Type) {
    assert(!(t instanceof UnionType), 'adding union type to union type')
    this.types.add(t)
  }

  toString() :string {
    let s = '(', first = true
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

class TypeVar {
  name        :ByteStr
  def?        :Type     // e.g. "T = int"  TODO: remove and instead use TemplateType._scope
  constraint? :Type     // e.g. "T is ConstraintType"

  equals(t :TypeVar) :bool {
    return (
      // this.name.equals(t.name) &&
      !this.def == !t.def &&
      (!this.def || this.def.equals(t.def!)) &&
      !this.constraint == !t.constraint &&
      (!this.constraint || this.constraint.equals(t.constraint!))
    )
  }
}

class TemplateType extends Type {
  _scope :Scope  // holds bindings for `type`
  type   :Type   // type this template is based on
  vars   :Map<ByteStr,TypeVar>  // never empty.  position and name are both important
}

// class GenericType extends Type {
//   // GenericType describes a type with potential type variables.
//   // At definition site "<T>" defines a new TypeVar, and "T" references it.
//   // Note: A GenericType object without any vars denotes a concrete type.
//   vars     :TypeVar[]  // named placeholders
//   restvar? :TypeVar    // non-null when rest/spread is accepted as last var
//   // init() { assert(this.rest || this.vars.length > 0, `generic type without any typevars`) }

//   // isTemplate returns true if there are any type vars
//   isTemplate() :bool {
//     return !!(this.vars.length > 0 || this.restvar)
//   }

//   equals(t :Type) :bool {
//     if (this === t) {
//       return true
//     }
//     if (
//       t.constructor !== this.constructor ||
//       this.vars.length != (t as GenericType).vars.length ||
//       !this.restvar != !(t as GenericType).restvar ||
//       (this.restvar && !this.restvar.equals((t as GenericType).restvar!))
//     ) {
//       return false
//     }
//     for (let i = 0; i < this.vars.length; i++) {
//       if (!this.vars[i].equals((t as GenericType).vars[i])) {
//         return false
//       }
//     }
//     return true
//   }
// }

class AliasType extends Type {
  // AliasType = "type" Ident Type
  // AliasType is an alternate name for a type.
  name :ByteStr  // alias name
  type :Type     // type this is an alias of

  equals(other :Type) :bool {
    return this === other || (other.isAliasType() && this.type.equals(other.type))
  }
  canonicalType() :Type { return this.type }
}

class TupleType extends Type {
  // TupleType = "(" Type ("," Type)+ ")"
  pos = NoPos
  types :Type[]
}

class ListType extends Type {
  // ListType = Type "[]"
  pos = NoPos
  type :Type  // element type

  equals(t :Type) :bool {
    return this === t || (t instanceof ListType && this.type.equals(t.type))
  }
  accepts(t :Type) :bool {
    // Note: This way, ListType <= RestType, e.g.
    // fun foo(x ...int) { y int[] = x }
    return t instanceof ListType && this.type.equals(t.type)
  }
}

class RestType extends ListType {
  // RestType = "..." Type
  // Specialized generic type instance.
  // Rest is really a list, but represented as a subclass
  toString() :string { return `...${super.toString()}` }
  equals(t :Type) :bool {
    return this === t || (t instanceof RestType && this.type.equals(t.type))
  }
}

class StructType extends Type {
  // StructType = "{" (Decl ";")* "}"
  decls :Decl[]
}

class FunType extends Type {
  // FunType = ( Type | TupleType ) "->" Type
  args   :Type[]
  result :Type

  equals(t :Type) :bool {
    return (
      this === t ||
      ( t.isFunType() &&
        this.args.length == t.args.length &&
        this.result.equals(t.result) &&
        this.args.every((at, i) => at.equals(t.args[i]))
      )
    )
  }
}

// end of types
// -----------------------------------------------------------------------------
// Flow control

class ReturnStmt extends Stmt {
  result :Expr       // t_nil means no explicit return values
  type   :Type|null  // effective type. null until resolved.
}
class ForStmt extends Stmt {
  // "for" init ; cond ; incr { body }
  init :Stmt|null // initializer
  cond :Expr|null // condition for executing the body. null=unconditional
  incr :Stmt|null // incrementor
  body :Expr
}
class WhileStmt extends ForStmt {
  // "while" cond { body }
  init = null
  incr = null
}
class BranchStmt extends Stmt {
  // BranchStmt = ("break" | "continue") label?
  tok   :token // BREAK | CONTINUE
  label :Ident|null = null
}

// end of flow control
// -----------------------------------------------------------------------------
// Declarations

class Decl extends Stmt {}
class ImportDecl extends Decl {
  path       :StringLit
  localIdent :Ident|null
}
class MultiDecl extends Decl {
  // MultiDecl represents a collection of declarations that were parsed from
  // a multi-declaration site. E.g. "type (a int; b f32)"
  decls :Decl[]
}
class VarDecl extends Decl {
  // VarDecl = Idents (Type | Type? "=" Values)
  idents  :Ident[]
  group   :Object|null   // null means not part of a group
  type    :Type|null     // null means no type
  values  :Expr[]|null   // null means no values
}
class TypeDecl extends Decl {
  // TypeDecl = "type" Ident Type
  ident  :Ident
  type   :Type
  group  :Object|null  // nil = not part of a group
}
class FieldDecl extends Decl {
  // FieldDecl = (VarDecl | EmbeddedField | MethodDecl)
  type  :Type
  name? :Ident  // null means anonymous field/parameter
}


// -----------------------------------------------------------------------------
// Expressions

class Ident extends Expr {
  ent?  :Ent = null // what this name references
  value :ByteStr         // interned value

  incrWrite() {
    assert(this.ent != null)
    this.ent!.writes++
  }

  // ref registers a reference to this ent from an identifier
  refEnt(ent :Ent) {
    assert(this !== ent.decl, "ref declaration")
    ent.nreads++
    this.ent = ent
  }

  // ref unregisters a reference to this ent from an identifier
  unrefEnt() {
    assert(this.ent, "null ent")
    this.ent!.nreads--
    this.ent = null
  }

  toString() :string { return `(Ident ${this.value})` }
  repr(sep :string = "") :string { return this.toString() }
}

class Block extends Expr {
  list :Stmt[]
}

class IfExpr extends Expr {
  cond :Expr
  then :Expr
  els_ :Expr|null
}

class CollectionExpr extends Expr {
  entries :Expr[]
}
class TupleExpr extends CollectionExpr {
  // TupleExpr = "(" Expr ("," Expr)+ ")"
  // e.g. (1, true, "three")
  type? :TupleType = null
}
class ListExpr extends CollectionExpr {
  // ListExpr = "[" ExprList [("," | ";")] "]"
  // e.g. [1, 2, x]
  type? :ListType
}

class SelectorExpr extends Expr {
  // Selector = Expr "." ( Ident | Selector )
  lhs :Expr
  rhs :Expr  // Ident or SelectorExpr
}

class IndexExpr extends Expr {
  // IndexExpr = Expr "[" Expr "]"
  // e.g. foo[1]
  operand :Expr
  index   :Expr
  indexnum :Num = -1  // used by resolver. >=0 : resolved, -1 : invalid or unresolved
}

class SliceExpr extends Expr {
  // SliceExpr = Expr "[" Expr? ":" Expr? "]"
  // e.g. foo[1:4]
  type?    :ListType|TupleType = null
  operand  :Expr
  start    :Expr|null
  end      :Expr|null
  startnum :Num = -1  // used by resolver. >=0 : resolved, -1 : invalid or unresolved
  endnum   :Num = -1  // used by resolver. >=0 : resolved, -1 : invalid or unresolved
}

class LiteralExpr extends Expr {
  _scope = nilScope
  value :Int64|number|Uint8Array
}
class NumLit extends LiteralExpr {
  value :Int64 | number
  type  :NumType

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
class IntLit extends NumLit {
  kind  :token.INT | token.INT_BIN | token.INT_OCT | token.INT_HEX
  type  :IntType  // type is always known

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
}
class RuneLit extends NumLit {
  type = t_rune
  value :int
}
class FloatLit extends NumLit {
  value :number
  type  :FloatType
}
class StringLit extends LiteralExpr {
  value :Uint8Array
  type  :StrType
}

class Assignment extends Expr {
  // e.g. "x = y", "x++"
  op    :token   // ILLEGAL means no operation
  lhs   :Expr[]
  rhs   :Expr[]  // empty == lhs++ or lhs--
  decls :bool[]  // index => bool: new declaration?
}

class Operation extends Expr {
  // e.g. "x + y"
  op :token      // [token.operator_beg .. token.operator_end]
  x  :Expr       // left-hand side
  y  :Expr|null  // right-hand size. nil means unary expression
}

class CallExpr extends Expr {
  // Fun(ArgList[0], ArgList[1], ...)
  receiver :Expr
  args     :Expr[]
  hasRest  :bool  // last argument is followed by ...
}

class FunExpr extends Expr {
  sig    :FunSig
  name?  :Ident          // null = anonymous func expression
  isInit :bool           // true for special "init" funs at file level
  type?  :FunType = null
  body?  :Expr = null    // null = forward declaration
}

class TypeConvExpr extends Expr {
  // converts expr to type
  expr :Expr
  type :Type
}

class Atom extends Expr {
  // Atom = "nil" | "true" | "false"
  // A value that identifies itself.
  pos = NoPos
  _scope = nilScope
  name :string
  type :BoolType|NilType
}
