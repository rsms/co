
// Mem denotes the storage type needed for a basic type
//
export enum Mem {
  None = -1,  // zero-width; not a concrete type
  Ptr  =  0,  // pointer (actual size defined by IR)
  i8   =  1,  // 8-bit integer
  i16  =  2,  // 16-bit integer
  i32  =  4,  // 32-bit integer
  i64  =  8,  // 64-bit integer
  f32  =  5,  // 32-bit floating-point
  f64  =  9,  // 64-bit floating-point
}


export class Type {

  // descriptor properties
  mem :Mem               // memory type
  size :int              // size in bytes
  isFloat = false        // true for floating-point numbers
  isInt = false          // true for bool and integers
  isSignedInt = false    // true for signed integers
  isUnsignedInt = false  // true for unsigned integers
  //isUnresolved = false  // true for unresolved types

  constructor(mem :Mem = Mem.None) {
    this.mem = mem
    this.size = this.mem as int
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
    assert(x !== this.def, 'register ref to definition')
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
  t_nil   = new BasicType(Mem.Ptr,  'nil')
  // integer types
, t_bool  = new UIntType(Mem.i8,    'bool')
, t_u8    = new UIntType(Mem.i8,    'u8')
, t_i8    = new SIntType(Mem.i8,    'i8')
, t_u16   = new UIntType(Mem.i16,   'u16')
, t_i16   = new SIntType(Mem.i16,   'i16')
, t_u32   = new UIntType(Mem.i32,   'u32')
, t_i32   = new SIntType(Mem.i32,   'i32')
, t_u64   = new UIntType(Mem.i64,   'u64')
, t_i64   = new SIntType(Mem.i64,   'i64')
, t_uint  = new UIntType(Mem.Ptr,   'uint')
, t_int   = new SIntType(Mem.Ptr,   'int')
, t_usize = new UIntType(Mem.Ptr,   'usize')
, t_isize = new SIntType(Mem.Ptr,   'isize')
  // floating-point types
, t_f32   = new FloatType(Mem.f32,  'f32')
, t_f64   = new FloatType(Mem.f64,  'f64')
  // aliases
, t_byte = t_u8
, t_char = t_u32
, t_addr = t_usize


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


// RestType = "..." Type
//
export class RestType extends Type {
  type :Type

  constructor(type :Type) {
    super()
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


// TupleType = "(" Type ("," Type)+ ")"
//
export class TupleType extends Type {
  types :Type[]

  constructor(types :Type[]) {
    super()
    this.types = types
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


// OptionalType = Type "?"
//
export class OptionalType extends Type {
  type :Type

  constructor(type :Type) {
    super()
    assert(!(type instanceof OptionalType), "optional already optional")
    assert(!(type instanceof UnionType), "union type can't be nil")
    assert(!(type instanceof BasicType), "basic types can't be nil")
  }

  toString() :string {
    return `${this.type}?`
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

