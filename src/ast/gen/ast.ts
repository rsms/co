import { Pos, NoPos, SrcFile, Position } from "../../pos"
import { token } from "../../token"
import { ByteStr } from "../../bytestr"
import { Int64 } from "../../int64"
import { Num } from "../../num"
import { numconv } from "../../numconv"
import { StrWriter } from "../../util"

import { Scope, Ent, nilScope } from "../scope"
import { NodeVisitor } from "../visit"
import { ReprVisitor, ReprOptions } from "../repr"

// --------------------------------------------------------------------------------

export interface TypedNode {
  type :Type
}

class Node {
  _scope? :Scope = undefined
  pos     :Pos

  toString() :string { return this.constructor.name }

  // repr returns a human-readable and machine-parsable string representation
  // of the tree represented by this node.
  // If a custom writer is provided via options.w, the empty string is returned.
  repr(options? :ReprOptions) :string {
    let v = new ReprVisitor(options)
    v.visitNode(this)
    return v.toString()
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

  isType() :this is Type {
    return (
      this instanceof Type &&
      (
        this instanceof Template ? this.base.isType() :
        this instanceof TemplateInvocation ? this.template.isType() :
        true
      )
    )
  }

  // convertToNodeInPlace is a destructive action which transforms the receiver
  // to become a copy of otherNode.
  convertToNodeInPlace<T extends Node>(otherNode :T) :T {
    let dst = this as any
    let src = otherNode as any
    dst.__proto__ = src.__proto__
    for (let k in dst) {
      delete dst[k]
    }
    for (let k in src) {
      dst[k] = src[k]
    }
    return dst as T
  }
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
  imports     :ImportDecl[]      // imports in this file
  decls       :(Decl|FunExpr)[]  // top-level declarations
  unresolved? :Set<Ident>        // unresolved references
  endPos      :Position|null     // when non-null, the position of #end "data tail"
  endMeta     :Expr[]            // Any metadata as part of #end

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
  // for the TypeResolver to--when resolving this type--go in and edit all
  // the uses of this type, updating them with a concrete, resolved type.
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

  repr(options? :ReprOptions) {
    return '~' + this.def.repr(options)
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
  toString() :string { return `${this.type}?` }
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

class PrimType extends Type {  // was "BasicType"
  // primitive type, e.g. i32, f64, bool, etc.
  pos = NoPos

  name    :string
  storage :Storage  // type of underlying storage
  _storageSize = StorageSize[this.storage]  // size in bytes

  // storageSize returns the underlying storage size in bytes
  storageSize() :int { return this._storageSize }

  // simplified type te
  isType() :this is Type { return true }

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
  repr(options? :ReprOptions) :string { return this.name }
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

  toString() :string { return this.len == -1 ? "str" : `str<${this.len}>` }
  equals(t :Type) :bool { return this === t || t.isStrType() }
  repr(options? :ReprOptions) :string { return this.toString() }
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
      // e.g. (int|i32|i64) accepts i32
      return this.types.has(other)
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


class AliasType extends Type {
  // AliasType = "type" Ident Type
  // AliasType is an alternate name for a type.
  name :ByteStr  // alias name
  type :Type     // type this is an alias of

  equals(other :Type) :bool {
    return this === other || (other.isAliasType() && this.type.equals(other.type))
  }
  canonicalType() :Type {
    let t :Type = this.type
    while (t instanceof AliasType) {
      t = t.type
    }
    return t
  }
  toString() :string { return `(AliasType ${this.type})` }
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
  _scope :Scope
  name   :Ident|null
  decls  :Decl[]

  toString() :string {
    return this.name ? this.name.toString() : "{anon}"
  }

  // equals(t :Type) :bool {
  //   if (this === t) {
  //     return true
  //   }
  //   if (t instanceof StructType) {
  //     if (
  //       this.decls.length != t.decls.length ||
  //       ( this.name !== t.name &&
  //         (!this.name || !t.name || this.name.value !== t.name.value)
  //       )
  //     ) {
  //       return false
  //     }
  //     for (let i = 0; i < this.decls.length; i++) {
  //       let a = this.decls[i]
  //       let b = t.decls[i]
  //       if (a !== b) {
  //         if (a.isType() && b.isType()) {
  //           if (!a.equals(b)) {
  //             return false
  //           }
  //         } else {
  //           return false
  //         }
  //       }
  //     }
  //     return true
  //   }
  //   return false
  // }
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

// -----------------------------------------------------------------------------
// Template

class Template<T extends Node=Node> extends Type {
  // Note on extends Type:
  //   Template can be both a value and a type.
  //   Node.isType has been specialized to check template's base.
  //   This means that:
  //     let n1 = new Template<Expr>(someExpr)
  //     let n2 = new Template<Type>(someType)
  //     n1.isType() // == false
  //     n2.isType() // == true
  //

  _scope :Scope
  vars   :TemplateVar[]             // never empty.  position and name are both important
  base   :T | TemplateInvocation<T> // node this template can instantiate

  // bottomBase returns the bottom-most base
  bottomBase() :Node {
    return this.base instanceof Template ? this.base.bottomBase() : this.base
  }

  // aliases returns a possibly-empty list of Templates which this template
  // uses as its base.
  //
  // Example:
  //   type A<T> {x T}
  //   type B<X> A<X>
  //   type C<Y> B<Y>
  //
  // Template(A).aliases() => []  // none
  // Template(B).aliases() => [ Template(A) ]
  // Template(C).aliases() => [ Template(B), Template(A) ]
  //
  aliases() :Template[] {
    let a :Template[] = []
    let bn :Node = this.base
    while (true) {
      if (bn instanceof TemplateInvocation) {
        bn = bn.template
      } else if (bn instanceof Template) {
        a.push(bn)
        bn = bn.base
      } else {
        break
      }
    }
    return a
  }

  toString() :string {
    return (
      this.bottomBase() +
      "<" + this.vars.map(v => v.name).join(",") + ">"
    )
  }
}

class TemplateInvocation<T extends Node=Node> extends Type {
  // Note on extends Type: See note in Template class definition.
  _scope   :Scope
  name     :Ident|null  // e.g "Foo2" from "Foo2<X> Foo<X>"
  args     :Node[]
  template :Template<T>

  toString() :string {
    return (
      (this.name ? this.name.toString() : this.template.bottomBase().toString()) +
      "<" + this.args.join(",") + ">"
    )
  }
}

class TemplateVar<T extends Node=Node> extends Type {
  // TemplateVar = Ident Constraint? ("=" Default)?
  // Constraint  = Node
  // Default     = Expr

  _scope      :Scope
  name        :Ident
  constraint? :Node  // e.g. "T is ConstraintType"
  def?        :T     // e.g. "T = int"

  equals(t :TemplateVar) :bool { return this === t }
  toString() :string { return `(TemplateVar ${this.name})` }
}

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
  group   :Object|null   // null means not part of a group
  idents  :Ident[]
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
    assert(this !== ent.value, "ref declaration")
    ent.nreads++
    this.ent = ent
  }

  // ref unregisters a reference to this ent from an identifier
  unrefEnt() {
    assert(this.ent, "null ent")
    this.ent!.nreads--
    this.ent = null
  }

  toString() :string { return this.value.toString() }
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
  // Returns null if the conversion would be lossy.
  //
  convertToType(t :NumType) :NumLit|null {
    if (t === this.type) {
      return this
    }
    let [v, lossless] = numconv(this.value, t)
    if (lossless) {
      if (t instanceof FloatType) {
        return new FloatLit(this.pos, v as number, t)
      }
      if (t instanceof IntType) {
        return new IntLit(this.pos, v, t, token.INT)
      }
      throw new Error(`unexpected NumType ${t.constructor}`)
    }
    return null
  }

  toString() :string { return this.value.toString() }
}
class IntLit extends NumLit {
  format :token.INT | token.INT_BIN | token.INT_OCT | token.INT_HEX
  type   :IntType  // type is always known

  base() :int {
    switch (this.format) {
      case token.INT_HEX: return 16
      case token.INT_OCT: return 8
      case token.INT_BIN: return 2
      default:            return 10
    }
  }

  convertToType(t :NumType) :NumLit|null {
    // specialization of NumLit.convertToType that carries over format
    let n = super.convertToType(t)
    if (n && n !== this && n instanceof IntLit) {
      n.format = this.format
    }
    return n
  }

  toString() :string {
    switch (this.format) {
      case token.INT_HEX: return '0x' + this.value.toString(16)
      case token.INT_OCT: return '0o' + this.value.toString(8)
      case token.INT_BIN: return '0b' + this.value.toString(2)
      default:            return this.value.toString(10)
    }
  }

  visit(v: NodeVisitor) {
    v.visitFieldN("type", this.type)
    v.visitField("value", this.value)
    v.visitFieldE("format", this.format, token)
  }
}
const zeros = "00000000"
class RuneLit extends NumLit {
  type = t_rune
  value :int  // codepoint

  // 'a', '\n', '\x00', '\u0000', '\U00000000'
  toString() :string {
    let c = this.value
    switch (c) {
    // see scanner/scanEscape
    case 0x00: return "'\\0'"
    case 0x07: return "'\\a'"
    case 0x08: return "'\\b'"
    case 0x09: return "'\\t'"
    case 0x0A: return "'\\n'"
    case 0x0B: return "'\\v'"
    case 0x0C: return "'\\f'"
    case 0x0D: return "'\\r'"
    case 0x27: return "'\\''"
    case 0x5C: return "'\\\\'"
    }
    if (c >= 0x20 && c <= 0x7E) { // visible printable ASCII
      return `'${String.fromCharCode(c)}'`
    }
    let s = c.toString(16).toUpperCase(), z = s.length
    return (
      z > 4 ?         ("'\\U" + (z < 8 ? zeros.substr(0, 8-z) : ""))
            : z > 2 ? ("'\\u" + (z < 4 ? zeros.substr(0, 4-z) : ""))
                    : ("'\\x" + (z < 4 ? zeros.substr(0, 2-z) : ""))
    ) + s + "'"
  }
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
