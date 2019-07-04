import { ByteStr, strings } from './bytestr'

// Mem denotes the storage type needed for a basic type
//
export enum Mem {
  None = 0, // zero-width; not a concrete type
  Ptr,      // Target-defined pointer (at least 32 bit)
  Int,      // Target-defined integer (at least 32 bit)
  i8,       // 8-bit integer
  i16,      // 16-bit integer
  i32,      // 32-bit integer
  i64,      // 64-bit integer
  f32,      // 32-bit floating-point
  f64,      // 64-bit floating-point
}

const memSize = {
  [Mem.None] : 0,
  [Mem.Ptr]  : 4, // virtual; target arch may use different size
  [Mem.Int]  : 4, // virtual; target arch may use different size
  [Mem.i8]   : 1,
  [Mem.i16]  : 2,
  [Mem.i32]  : 4,
  [Mem.i64]  : 8,
  [Mem.f32]  : 4,
  [Mem.f64]  : 8,
}


export class Type {

  // descriptor properties
  mem :Mem               // memory type
  size :int              // size in bytes
  isFloat = false        // true for floating-point numbers
  isInt = false          // true for bool and integers
  isSignedInt = false    // true for signed integers
  isUnsignedInt = false  // true for unsigned integers
  isUnresolved = false   // true for unresolved types

  constructor(mem :Mem = Mem.None) {
    this.mem = mem
    this.size = memSize[this.mem]
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

  isTuple() : this is TupleType {
    return this instanceof TupleType
  }

  // canonicalType returns the underlying canonical type for
  // classes that wraps a type, like AliasType.
  canonicalType() :Type {
    return this
  }
}


// UnresolvedType represents a type that is not yet known, but may be
// known later (i.e. during bind/resolve.)
//
// Whenever something refers to this type, you must call addRef(x) where
// x is the thing that uses/refers to this type. This makes it possible
// for the TypeResolver to--when resolving this type--go in an edit all
// the uses of this type, updating them with the concrete, resolved type.
//
export class UnresolvedType extends Type {
  isUnresolved = true
  refs :Set<Object>|null = null  // things that references this type
  def  :Object  // really ast.Expr

  // def is some optional information of where this type was seen.
  // def is only used by toString().
  //
  constructor(def :Object) {
    super()
    this.def = def
  }

  addRef(x :Object) {
    assert(x !== this.def, 'addRef called with own definition')
    if (!this.refs) {
      this.refs = new Set<Object>([x])
    } else {
      this.refs.add(x)
    }
  }

  toString() {
    return '~' + String(this.def || "T")
  }
}


// NativeType represents all built-in types, like i32, str, bool, etc.
//
export class NativeType extends Type {
}


// BasicType is a built-in basic type like i32, bool.
//
export class BasicType extends NativeType {
  name :string

  constructor(mem :Mem, name :string) {
    super(mem)
    this.name = name
  }

  toString() :string {
    return this.name
  }
}

export class NumType extends BasicType {
}

export class FloatType extends NumType {
  isFloat = true
  size = this.mem - 1
}

export class IntType extends NumType {
  isInt = true
}

export class SIntType extends IntType {
  isSignedInt = true
}

export class UIntType extends IntType {
  isUnsignedInt = true
}

// basic type constants
// Their names MUST BE THE SAME as their exported variable names sans "t_".
// i.e. a type exported as t_foo should be named "foo".
// This because generated code depends on the names.
//
export const
  // special types
  t_nil     = new BasicType(Mem.Ptr, 'nil')
  // integer types
, t_bool    = new UIntType(Mem.i8,   'bool')
, t_u8      = new UIntType(Mem.i8,   'u8')
, t_i8      = new SIntType(Mem.i8,   'i8')
, t_u16     = new UIntType(Mem.i16,  'u16')
, t_i16     = new SIntType(Mem.i16,  'i16')
, t_u32     = new UIntType(Mem.i32,  'u32')
, t_i32     = new SIntType(Mem.i32,  'i32')
, t_u64     = new UIntType(Mem.i64,  'u64')
, t_i64     = new SIntType(Mem.i64,  'i64')
, t_uint    = new UIntType(Mem.Int,  'uint')
, t_int     = new SIntType(Mem.Int,  'int')
, t_uintptr = new UIntType(Mem.Ptr,  'uintptr')
  // floating-point types
, t_f32     = new FloatType(Mem.f32, 'f32')
, t_f64     = new FloatType(Mem.f64, 'f64')
  // aliases
, t_byte    = t_u8
, t_char    = t_u32
, t_addr    = t_uintptr


// intTypes returns a pair of [signed, unsigned] integer types
// that are bytesize wide.
//
export function intTypes(bytesize :int) :[IntType,IntType] {
  switch (bytesize) {
    case 1: return [t_i8,  t_u8]
    case 2: return [t_i16, t_u16]
    case 4: return [t_i32, t_u32]
    case 8: return [t_i64, t_u64]
  }
  panic(`invalid integer size ${bytesize}`)
  return [t_i32, t_u32]
}


// StrType = "str" ("<" length ">")?
//
export class StrType extends NativeType {
  length :int // -1 means length only known at runtime

  constructor(length :int) {
    super()
    this.length = length
  }

  toString() :string {
    return this.length > -1 ? `str<${this.length}>` : 'str'
  }

  equals(other :Type) :bool {
    // TODO: break this up, partly into accepts(), so its truly "equals",
    // e.g. "str<4> != str"
    return (
      this === other ||
      ( other instanceof StrType &&
        this.length == other.length
      )
    )
  }
}



class GenericTypeVar {
  name :ByteStr
  constructor(name :ByteStr) {
    this.name = name
  }
  toString() {
    return this.name.toString()
  }
}

// GenericType describes a type with type variables
//
export class GenericType extends Type {
  name :ByteStr
  vars :GenericTypeVar[]     // named placeholders
  rest :GenericTypeVar|null  // non-null when rest/spread is accepted as last var

  // TODO: data describing the type template

  constructor(name :ByteStr, vars :GenericTypeVar[], rest :GenericTypeVar|null) {
    super()
    assert(rest || vars.length > 0, `generic type without any typevars`)
    this.name = name
    this.vars = vars
    this.rest = rest
  }

  toString() :string {
    return `${this.name}<${this.vars.map(v => v.name).join(",")}>`
  }

  // instantiate creates a new specific instance of this generic type.
  //
  // Note: Do not call directly during parsing, but instead use
  // TypeResolve.getGenericInstance which is cached and calls this
  // function when needed.
  //
  newInstance(types :Type[]) :GenericTypeInstance {
    return new GenericTypeInstance(this, types)
  }
}


// GenericTypeInstance = Type "<" (TypeArgs ","? )? ">"
// TypeArgs            = Type ("," Type)*
//
// GenericTypeInstance describes a use, or instance, of a generic type.
//
//
export class GenericTypeInstance extends Type {
  proto :GenericType|UnresolvedType
  types :Type[]  // typevars

  constructor(proto :GenericType|UnresolvedType, types :Type[]) {
    super()
    this.proto = proto
    this.types = types
  }

  toString() :string {
    let name = (
      this.proto instanceof UnresolvedType ? this.proto.toString() :
      this.proto.name.toString()
    )
    return `${name}<${this.types.join(",")}>`
  }
}


// ListType = Type "[]"
// Specialized generic type instance.
//
export class ListType extends GenericTypeInstance {
  constructor(type :Type) {
    super(t_list, [type])
  }

  toString() :string {
    return `${this.types[0]}[]`
  }

  equals(other :Type) :bool {
    return (
      this === other ||
      (other instanceof ListType && this.types[0].equals(other.types[0]))
    )
  }

  // accepts returns true if the other type is compatible with this type.
  accepts(other :Type) :bool {
    // accept all [sub]classes of ListType, including e.g. RestType
    return other instanceof ListType && this.types[0].equals(other.types[0])
  }
}


// RestType = "..." Type
// Specialized generic type instance.
// Rest is really a list, but represented as a subclass
//
export class RestType extends ListType {
  toString() :string {
    return `...${this.types[0]}`
  }

  equals(other :Type) :bool {
    return (
      this === other ||
      (other instanceof RestType && this.types[0].equals(other.types[0]))
    )
  }
}


// TupleType = "(" Type ("," Type)+ ")"
//
export class TupleType extends GenericTypeInstance {

  constructor(types :Type[]) {
    super(t_tuple, types)
  }

  toString() :string {
    return 'tuple<' + this.types.map(t => t.toString()).join(',') + '>'
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

  isTuple() : this is TupleType {
    return true
  }
}


// FunType = ( Type | TupleType ) "->" Type
//
export class FunType extends Type {
  args   :Type[]
  result :Type

  constructor(args :Type[], result :Type) {
    super()
    this.args = args
    this.result = result
  }

  toString() :string {
    return `(${this.args.join(', ')}) -> ${this.result}`
  }

  equals(other :Type) :bool {
    return (
      this === other ||
      ( other instanceof FunType &&
        this.args.length == other.args.length &&
        this.result.equals(other.result) &&
        this.args.every((t, i) => t.equals(other.args[i]))
      )
    )
  }
}


// UnionType = Type ("|" Type)+
//
export class UnionType extends Type {
  types :Set<Type>

  constructor(types :Set<Type>) {
    super()
    this.types = types
  }

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


// // TypeType represents the type of a type.
// // For example, typeof(int) == TypeType{type:IntType}
// //
// export class TypeType extends Type {
//   type :Type

//   constructor(type :Type) {
//     super()
//     assert(!(type instanceof TypeType), "assigning TypeType to TypeType")
//     this.type = type
//   }

//   toString() :string {
//     return `type<${this.type}>`
//   }

//   equals(other :Type) :bool {
//     return this === other || (other instanceof TypeType && this.type.equals(other.type))
//   }

//   canonicalType() :Type {
//     return this.type
//   }
// }


// AliasType is a named type.
//
// type foo int => AliasType("foo", int)
//
export class AliasType extends Type {
  name :ByteStr
  type :Type

  constructor(name :ByteStr, t :Type) {
    super()
    this.name = name
    this.type = t
  }

  equals(other :Type) :bool {
    return this === other || (other instanceof AliasType && this.type.equals(other.type))
  }

  toString() :string {
    return `alias ${this.name} ${this.type}`
  }

  canonicalType() :Type {
    return this.type
  }
}


// OptionalType = Type "?"
// A nullable type.
//
export class OptionalType extends Type {
  type :Type

  constructor(type :Type) {
    super()
    assert(!(type instanceof OptionalType), "optional already optional")
    assert(!(type instanceof UnionType), "union type can't be nil")
    assert(!(type instanceof BasicType), "basic types can't be nil")
    this.type = type
  }

  toString() :string {
    return `${this.type}?`
  }

  equals(other :Type) :bool {
    return this === other || (other instanceof OptionalType && this.type.equals(other.type))
  }

  accepts(other :Type) :bool {
    return (
      this.equals(other) ||       // e.g. "x str?; y str?; x = y"
      this.type.equals(other) ||  // e.g. "x str?; y str; x = y"
      other === t_nil           // e.g. "x str?; x = nil"
    )
  }
}


// t_str0 is a preallocated singleton representing the type of
// the empty string
// i.e. "str<0>"
//
export const t_str0 = new StrType(0)


// t_str is a preallocated singleton representing a heap-allocated
// string which size is only known at runtime.
// i.e. "str"
//
export const t_str = new StrType(-1)


// t_stropt is a preallocated singleton representing an optional
// heap-allocated string which size is only known at runtime.
// i.e. "str?"
//
export const t_stropt = new OptionalType(t_str)


const str_T = strings.get(new Uint8Array([0x54])) // "T"
const str_list = strings.get(new Uint8Array([0x6c,0x69,0x73,0x74])) // "list"
const str_tuple = strings.get(new Uint8Array([0x74,0x75,0x70,0x6c,0x65])) // "tuple"

const tvar_T = new GenericTypeVar(str_T)


// list<T>
export const t_list = new GenericType(str_list, [tvar_T], /*rest*/null)
t_list.newInstance = (types :Type[]) => {
  return new ListType(types[0])
}

// tuple<...T>
export const t_tuple = new GenericType(str_tuple, [], /*rest*/tvar_T)
t_tuple.newInstance = (types :Type[]) => {
  return new TupleType(types)
}
