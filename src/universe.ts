import { ByteStr, ByteStrSet } from './bytestr'
import { asciibuf, bufcmp } from './util'
import { token, tokstr } from './token'
import { Pos } from './pos'
import { TypeSet } from './typeset'
import { SInt64 } from './int64'
import {
  Scope,
  Ent,
  BasicLit,
  IntrinsicVal,
  Type,
  BasicType,
  IntType,
  u_t_nil,
  u_t_bool,
  u_t_uint,
  u_t_int,
  u_t_i8,
  u_t_i16,
  u_t_i32,
  u_t_i64,
  u_t_u8,
  u_t_u16,
  u_t_u32,
  u_t_u64,
  u_t_f32,
  u_t_f64,
  u_t_str,
} from './ast'

export const universeTypes = new Map<string,Type>()
export const universeValues = new Map<string,IntrinsicVal>()

function namedtype(x :Type, name :string) {
  assert(!universeTypes.has(name))
  universeTypes.set(name, x)
  return x
}

function ival(name :string, typ :BasicType) :IntrinsicVal {
  const x = new IntrinsicVal(name, typ)
  assert(!universeValues.has(name))
  universeValues.set(name, x)
  return x
}

// universe values
export const
  u_v_true  = ival('true', u_t_bool)
, u_v_false = ival('false', u_t_bool)
, u_v_nil   = ival('nil', u_t_nil)

const uintz :number = 32 // TODO: target-dependant

// basic types
namedtype(u_t_bool, 'bool')
namedtype(u_t_uint, 'uint')
namedtype(u_t_int,  'int')
namedtype(u_t_i8,   'i8')
namedtype(u_t_i16,  'i16')
namedtype(u_t_i32,  'i32')
namedtype(u_t_i64,  'i64')
namedtype(u_t_u8,   'u8')
namedtype(u_t_u16,  'u16')
namedtype(u_t_u32,  'u32')
namedtype(u_t_u64,  'u64')
namedtype(u_t_f32,  'f32')
namedtype(u_t_f64,  'f64')
namedtype(u_t_str,  'str')

export const universeTypeAliases = new Map<string,string>([
  ['byte', 'u8'],
  ['char', 'u32'],
])


// type compatibility
export enum TypeCompat {
  NO = 0,   // not compatible
  LOSSY,    // can be converted at a loss
  LOSSLESS, // can be converted safely without loss
}

// maps destination type to receiver types and their compatbility type
const typeCompatMap = new Map<BasicType,Map<BasicType,TypeCompat>>([

  [u_t_u64, new Map<BasicType,TypeCompat>([
    [u_t_uint, TypeCompat.LOSSLESS],
    [u_t_int,  TypeCompat.LOSSLESS],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSLESS],
    [u_t_i32, TypeCompat.LOSSLESS],
    [u_t_i64, TypeCompat.LOSSLESS],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u16, TypeCompat.LOSSLESS],
    [u_t_u32, TypeCompat.LOSSLESS],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_i64, new Map<BasicType,TypeCompat>([
    [u_t_uint, uintz <= 63 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [u_t_int,  TypeCompat.LOSSLESS],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSLESS],
    [u_t_i32, TypeCompat.LOSSLESS],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u16, TypeCompat.LOSSLESS],
    [u_t_u32, TypeCompat.LOSSLESS],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_u32, new Map<BasicType,TypeCompat>([
    [u_t_uint, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [u_t_int,  uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSLESS],
    [u_t_i32, TypeCompat.LOSSLESS],
    [u_t_i64, TypeCompat.LOSSY],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u16, TypeCompat.LOSSLESS],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_i32, new Map<BasicType,TypeCompat>([
    [u_t_uint, TypeCompat.LOSSY],
    [u_t_int,  uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSLESS],
    [u_t_i64, TypeCompat.LOSSY],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u16, TypeCompat.LOSSLESS],
    [u_t_u32, TypeCompat.LOSSY],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_uint, new Map<BasicType,TypeCompat>([
    [u_t_int, TypeCompat.LOSSLESS],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSLESS],
    [u_t_i32, TypeCompat.LOSSLESS],
    [u_t_i64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u16, TypeCompat.LOSSLESS],
    [u_t_u32, uintz >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [u_t_u64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_int, new Map<BasicType,TypeCompat>([
    [u_t_uint, TypeCompat.LOSSY],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSLESS],
    [u_t_i32, TypeCompat.LOSSLESS],
    [u_t_i64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u16, TypeCompat.LOSSLESS],
    [u_t_u32, uintz >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_u16, new Map<BasicType,TypeCompat>([
    [u_t_uint, TypeCompat.LOSSY],
    [u_t_int,  TypeCompat.LOSSY],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSLESS],
    [u_t_i32, TypeCompat.LOSSY],
    [u_t_i64, TypeCompat.LOSSY],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u32, TypeCompat.LOSSY],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_i16, new Map<BasicType,TypeCompat>([
    [u_t_uint, TypeCompat.LOSSY],
    [u_t_int,  TypeCompat.LOSSY],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i32, TypeCompat.LOSSY],
    [u_t_i64, TypeCompat.LOSSY],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u16, TypeCompat.LOSSY],
    [u_t_u32, TypeCompat.LOSSY],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_u8, new Map<BasicType,TypeCompat>([
    [u_t_uint, TypeCompat.LOSSY],
    [u_t_int,  TypeCompat.LOSSY],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSY],
    [u_t_i32, TypeCompat.LOSSY],
    [u_t_i64, TypeCompat.LOSSY],

    [u_t_u16, TypeCompat.LOSSY],
    [u_t_u32, TypeCompat.LOSSY],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_i8, new Map<BasicType,TypeCompat>([
    [u_t_uint, TypeCompat.LOSSY],
    [u_t_int,  TypeCompat.LOSSY],

    [u_t_i16, TypeCompat.LOSSY],
    [u_t_i32, TypeCompat.LOSSY],
    [u_t_i64, TypeCompat.LOSSY],

    [u_t_u8,  TypeCompat.LOSSY],
    [u_t_u16, TypeCompat.LOSSY],
    [u_t_u32, TypeCompat.LOSSY],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSY],
    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_f32, new Map<BasicType,TypeCompat>([
    [u_t_uint, TypeCompat.LOSSY],
    [u_t_int,  TypeCompat.LOSSY],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSLESS],
    [u_t_i32, TypeCompat.LOSSY],
    [u_t_i64, TypeCompat.LOSSY],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u16, TypeCompat.LOSSLESS],
    [u_t_u32, TypeCompat.LOSSY],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f64, TypeCompat.LOSSY],
  ])],

  [u_t_f64, new Map<BasicType,TypeCompat>([
    [u_t_uint, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [u_t_int,  uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [u_t_i8,  TypeCompat.LOSSLESS],
    [u_t_i16, TypeCompat.LOSSLESS],
    [u_t_i32, TypeCompat.LOSSLESS],
    [u_t_i64, TypeCompat.LOSSY],

    [u_t_u8,  TypeCompat.LOSSLESS],
    [u_t_u16, TypeCompat.LOSSLESS],
    [u_t_u32, TypeCompat.LOSSLESS],
    [u_t_u64, TypeCompat.LOSSY],

    [u_t_f32, TypeCompat.LOSSLESS],
  ])],
])

export function basicTypeCompat(dst :BasicType, src :BasicType) :TypeCompat {
  assert(dst !== src, "same type is always compatible")
  let s = typeCompatMap.get(dst)
  return s && s.get(src) || TypeCompat.NO
}

TEST("basicTypeCompat", () => {
  function assertTypeCompat(
    dst :BasicType,
    src :BasicType,
    expect :TypeCompat,
    cons :Function,
  ) {
    const r = basicTypeCompat(dst, src)
    assert(
      r === expect,
      `${dst}(${src}) == ${TypeCompat[r]} (expected ${TypeCompat[expect]})`,
      cons
    )
  }

  function assert_LOSSLESS(dst :BasicType, src :BasicType) {
    assertTypeCompat(dst, src, TypeCompat.LOSSLESS, assert_LOSSLESS)
  }

  function assert_LOSSY(dst :BasicType, src :BasicType) {
    assertTypeCompat(dst, src, TypeCompat.LOSSY, assert_LOSSY)
  }

  // u64
  assert_LOSSLESS(u_t_u64, u_t_uint)
  assert_LOSSLESS(u_t_u64, u_t_int)
  assert_LOSSLESS(u_t_u64, u_t_i64)
  assert_LOSSLESS(u_t_u64, u_t_u32)
  assert_LOSSLESS(u_t_u64, u_t_i32)
  assert_LOSSLESS(u_t_u64, u_t_u16)
  assert_LOSSLESS(u_t_u64, u_t_i16)
  assert_LOSSLESS(u_t_u64, u_t_u8)
  assert_LOSSLESS(u_t_u64, u_t_i8)
  assert_LOSSY   (u_t_u64, u_t_f32)
  assert_LOSSY   (u_t_u64, u_t_f64)

  // i64
  assert_LOSSLESS(u_t_i64, u_t_uint)
  if (uintz == 64) {
    assert_LOSSY(u_t_i64, u_t_int)
  } else {
    assert_LOSSLESS(u_t_i64, u_t_int)
  }
  assert_LOSSY   (u_t_i64, u_t_u64)
  assert_LOSSLESS(u_t_i64, u_t_u32)
  assert_LOSSLESS(u_t_i64, u_t_i32)
  assert_LOSSLESS(u_t_i64, u_t_u16)
  assert_LOSSLESS(u_t_i64, u_t_i16)
  assert_LOSSLESS(u_t_i64, u_t_u8)
  assert_LOSSLESS(u_t_i64, u_t_i8)
  assert_LOSSY   (u_t_i64, u_t_f32)
  assert_LOSSY   (u_t_i64, u_t_f64)

  // u32
  if (uintz == 64) {
    assert_LOSSY(u_t_u32, u_t_uint)
    assert_LOSSY(u_t_u32, u_t_int)
  } else {
    assert_LOSSLESS(u_t_u32, u_t_uint)
    assert_LOSSLESS(u_t_u32, u_t_int)
  }
  assert_LOSSY   (u_t_u32, u_t_u64)
  assert_LOSSY   (u_t_u32, u_t_i64)
  assert_LOSSLESS(u_t_u32, u_t_i32)
  assert_LOSSLESS(u_t_u32, u_t_u16)
  assert_LOSSLESS(u_t_u32, u_t_i16)
  assert_LOSSLESS(u_t_u32, u_t_u8)
  assert_LOSSLESS(u_t_u32, u_t_i8)
  assert_LOSSY   (u_t_u32, u_t_f32)
  assert_LOSSY   (u_t_u32, u_t_f64)

  // i32
  assert_LOSSY   (u_t_i32, u_t_uint)
  if (uintz == 64) {
    assert_LOSSY(u_t_i32, u_t_int)
  } else {
    assert_LOSSLESS(u_t_i32, u_t_int)
  }
  assert_LOSSY   (u_t_i32, u_t_u64)
  assert_LOSSY   (u_t_i32, u_t_i64)
  assert_LOSSY   (u_t_i32, u_t_u32)
  assert_LOSSLESS(u_t_i32, u_t_u16)
  assert_LOSSLESS(u_t_i32, u_t_i16)
  assert_LOSSLESS(u_t_i32, u_t_u8)
  assert_LOSSLESS(u_t_i32, u_t_i8)
  assert_LOSSY   (u_t_i32, u_t_f32)
  assert_LOSSY   (u_t_i32, u_t_f64)

  // u16
  assert_LOSSY   (u_t_u16, u_t_uint)
  assert_LOSSY   (u_t_u16, u_t_int)
  assert_LOSSY   (u_t_u16, u_t_u64)
  assert_LOSSY   (u_t_u16, u_t_i64)
  assert_LOSSY   (u_t_u16, u_t_u32)
  assert_LOSSY   (u_t_u16, u_t_i32)
  assert_LOSSLESS(u_t_u16, u_t_i16)
  assert_LOSSLESS(u_t_u16, u_t_u8)
  assert_LOSSLESS(u_t_u16, u_t_i8)
  assert_LOSSY   (u_t_u16, u_t_f32)
  assert_LOSSY   (u_t_u16, u_t_f64)

  // i16
  assert_LOSSY   (u_t_i16, u_t_uint)
  assert_LOSSY   (u_t_i16, u_t_int)
  assert_LOSSY   (u_t_i16, u_t_u64)
  assert_LOSSY   (u_t_i16, u_t_i64)
  assert_LOSSY   (u_t_i16, u_t_u32)
  assert_LOSSY   (u_t_i16, u_t_i32)
  assert_LOSSY   (u_t_i16, u_t_u16)
  assert_LOSSLESS(u_t_i16, u_t_u8)
  assert_LOSSLESS(u_t_i16, u_t_i8)
  assert_LOSSY   (u_t_i16, u_t_f32)
  assert_LOSSY   (u_t_i16, u_t_f64)

  // u8
  assert_LOSSY   (u_t_u8, u_t_uint)
  assert_LOSSY   (u_t_u8, u_t_int)
  assert_LOSSY   (u_t_u8, u_t_u64)
  assert_LOSSY   (u_t_u8, u_t_i64)
  assert_LOSSY   (u_t_u8, u_t_u32)
  assert_LOSSY   (u_t_u8, u_t_i32)
  assert_LOSSY   (u_t_u8, u_t_u16)
  assert_LOSSY   (u_t_u8, u_t_i16)
  assert_LOSSLESS(u_t_u8, u_t_i8)
  assert_LOSSY   (u_t_u8, u_t_f32)
  assert_LOSSY   (u_t_u8, u_t_f64)

  // i8
  assert_LOSSY   (u_t_i8, u_t_uint)
  assert_LOSSY   (u_t_i8, u_t_int)
  assert_LOSSY   (u_t_i8, u_t_u64)
  assert_LOSSY   (u_t_i8, u_t_i64)
  assert_LOSSY   (u_t_i8, u_t_u32)
  assert_LOSSY   (u_t_i8, u_t_i32)
  assert_LOSSY   (u_t_i8, u_t_u16)
  assert_LOSSY   (u_t_i8, u_t_i16)
  assert_LOSSY   (u_t_i8, u_t_u8)
  assert_LOSSY   (u_t_i8, u_t_f32)
  assert_LOSSY   (u_t_i8, u_t_f64)

  // f64
  if (uintz <= 32) {
    assert_LOSSLESS(u_t_f64, u_t_uint)
    assert_LOSSLESS(u_t_f64, u_t_int)
  } else {
    assert_LOSSY   (u_t_f64, u_t_uint)
    assert_LOSSY   (u_t_f64, u_t_int)
  }
  assert_LOSSY   (u_t_f64, u_t_u64)
  assert_LOSSY   (u_t_f64, u_t_i64)
  assert_LOSSLESS(u_t_f64, u_t_u32)
  assert_LOSSLESS(u_t_f64, u_t_i32)
  assert_LOSSLESS(u_t_f64, u_t_u16)
  assert_LOSSLESS(u_t_f64, u_t_i16)
  assert_LOSSLESS(u_t_f64, u_t_u8)
  assert_LOSSLESS(u_t_f64, u_t_i8)
  assert_LOSSLESS(u_t_f64, u_t_f32)

  // f32
  assert_LOSSY   (u_t_f32, u_t_uint)
  assert_LOSSY   (u_t_f32, u_t_int)
  assert_LOSSY   (u_t_f32, u_t_u64)
  assert_LOSSY   (u_t_f32, u_t_i64)
  assert_LOSSY   (u_t_f32, u_t_u32)
  assert_LOSSY   (u_t_f32, u_t_i32)
  assert_LOSSLESS(u_t_f32, u_t_u16)
  assert_LOSSLESS(u_t_f32, u_t_i16)
  assert_LOSSLESS(u_t_f32, u_t_u8)
  assert_LOSSLESS(u_t_f32, u_t_i8)
  assert_LOSSY   (u_t_f32, u_t_f64)
})


export type ErrorHandler = (msg :string, pos :Pos) => any

// basicLitTypeStorageMap maps storage types to all possible values types that
// can be stored (in the storage type) losslessly.
//
// const basicLitTypeStorageMap = new Map<BasicType,Set<BasicType>>([
//   // storageType => valueTypes[]
//   [u_t_i64, new Set([
//     u_t_char,
//     u_t_i8, u_t_i16, u_t_i32, u_t_i64,
//     u_t_u8, u_t_u16, u_t_u32
//   ])],
// ])

// basicLitTypeFitter is a function that produces the most fitting type
// for a basic literal. It may receive a "requested type", in which case the
// reqt should be reutned if the literal can safely be represented as reqt.
//
type basicLitTypeFitter = (
  x :BasicLit,
  reqt :Type|null,
  errh? :ErrorHandler,
  op? :token,
) => BasicType


// intBits calculates the minimum bit size for an integer constant
//
function intBits(x :BasicLit) :int {
  if (typeof x.value == 'number') {
    // int32
    assert(!isNaN(x.value))
    return x.value > 0x7FFFFFFF ? 32 : 31
  }
  // int64
  return x.value.gt(SInt64.MAX) ? 64 : 63
}



function intLitTypeFitter(
  x :BasicLit,
  reqt :Type|null,
  errh? :ErrorHandler,
  op? :token,
) :BasicType {
  const neg = op == token.SUB
  let bits = intBits(x)
  const maxtype = neg ? u_t_i64 : u_t_u64

  if (bits == 0) {  // literal is too large
    // TODO: support bigint transparently
    if (errh) {
      let t = reqt instanceof BasicType ? reqt : maxtype
      errh(`constant ${x} overflows ${t.name}`, x.pos)
      bits = 64
    }
  } else if (reqt) {
    if (reqt instanceof IntType) {
      if (reqt.bitsize >= bits && (!neg || reqt.signed)) {
        // yay! requested type is large enough for the literal
        return reqt
      }
      if (errh) {
        errh(`constant ${x} overflows ${reqt.name}`, x.pos)
        bits = 64
      }
    } else if (reqt === u_t_f64 || reqt === u_t_f32) {
      return reqt as BasicType
    } else if (errh) {
      errh(`cannot use ${x} as type ${reqt}`, x.pos)
    }
  } else if (neg && bits >= 64 && errh) {
    errh(`constant ${x} overflows i64`, x.pos)
  }

  // pick type that matches the bit length
  return (
    bits <= 31 ? u_t_int :
    bits <= 63 ? u_t_i64 :
    maxtype
  )
}


function floatLitTypeFitter(
  x :BasicLit,
  reqt :Type|null,
  errh? :ErrorHandler,
  op? :token,
) :BasicType {
  if (reqt && reqt !== u_t_f32 && reqt !== u_t_f64) {
    if (reqt instanceof IntType) {
      errh && errh(`constant ${x} truncated to ${reqt.name}`, x.pos)
      return reqt
    } else if (errh) {
      errh(`cannot use ${x} as type ${reqt}`, x.pos)
    }
  }
  return reqt === u_t_f32 ? u_t_f32 : u_t_f64
}


function charLitTypeFitter(
  x :BasicLit,
  reqt :Type|null,
  errh? :ErrorHandler,
  op? :token,
) :BasicType {
  if (reqt) {
    if (reqt instanceof IntType) {
      // TODO: actually check if it fits
      return reqt
    }
    errh && errh(`cannot use ${x} as type ${reqt}`, x.pos)
  }
  return op == token.SUB ? u_t_i32 : u_t_u32
}


const basicLitTypesFitters = new Map<token,basicLitTypeFitter>([
  [token.CHAR, charLitTypeFitter],
  
  [token.INT,     intLitTypeFitter],
  [token.INT_BIN, intLitTypeFitter],
  [token.INT_OCT, intLitTypeFitter],
  [token.INT_HEX, intLitTypeFitter],

  [token.FLOAT, floatLitTypeFitter],
])



export class Universe {
  readonly strSet  :ByteStrSet
  readonly typeSet :TypeSet
  readonly scope   :Scope

  constructor(strSet :ByteStrSet, typeSet :TypeSet) {
    this.strSet = strSet
    this.typeSet = typeSet

    // r.universe.internType(u_t_optstr)

    // build scope
    const unidecls = new Map<ByteStr,Ent>()

    for (let [name, t] of universeTypes) {
      // console.log(`DEF UNIVERSE TYPE "${name}"`)
      let n = strSet.emplace(asciibuf(name))
      unidecls.set(n, new Ent(n, t, t))
    }

    for (let [aliasName, canonName] of universeTypeAliases) {
      // console.log(`DEF UNIVERSE TYPE ALIAS "${aliasName}" for "${canonName}"`)
      let aliasNameBuf = strSet.emplace(asciibuf(aliasName))
      let canonNameBuf = strSet.emplace(asciibuf(canonName))
      const obj = unidecls.get(canonNameBuf)
      assert(obj)
      unidecls.set(aliasNameBuf, obj as Ent)
    }

    for (let [name, x] of universeValues) {
      // console.log(`DEF UNIVERSE VAL "${name}"`)
      let n = strSet.emplace(asciibuf(name))
      unidecls.set(n, new Ent(n, x, x))
    }

    this.scope = new Scope(null, unidecls)
  }

  // basicLitType returns the most suitable type for a literal.
  //
  // If reqt is provided, this function will attempt to fit the literal
  // into the reqt. If that fails, the most suitable type for the literal
  // alone is returned, and an error message is produces if errh is provided
  // You can thus check if contextual type fitting succeeded by comparing
  // reqt with the result.
  //
  basicLitType(
    x :BasicLit,
    reqt? :Type|null,
    errh? :ErrorHandler,
    op? :token, // e.g. token.SUB for "-", token.NOT for "!", etc.
  ) :BasicType {
    let f = basicLitTypesFitters.get(x.kind) as basicLitTypeFitter
    assert(f, `missing type fitter for ${tokstr(x.kind)}`)
    return f(x, reqt || null, errh, op)
  }

  // internType potentially returns an equivalent type (t1.equals(t2) == true)
  // if previously seen. Otherwise it registers t for future calls to this
  // function and returns t as-is. Populates typeSet.
  //
  // The trade-offs are as follows:
  //
  //  [-] slower to parse files with many different types because of
  //      intern-miss overhead.
  //
  //  [+] faster to parse files with few types that are used many times
  //      (common case), since type equality testing is cheap for correct code.
  //
  //  [+] uses less memory (fewer resident Type instances).
  //
  internType<T extends Type>(t :T) :T {
    return this.typeSet.intern(t)
  }

}
