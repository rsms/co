import { ByteStr, ByteStrSet } from './bytestr'
import { str8buf, buf8str, bufcmp } from './util'
import { token, tokstr } from './token'
import { Pos } from './pos'
import {
  Scope,
  Ent,
  BasicLit,
  Type,
  IntrinsicVal,
  IntrinsicType,
} from './ast'

export const universeTypes = new Map<string,IntrinsicType>()
export const universeValues = new Map<string,IntrinsicVal>()

function ityp(bitsize :int, name :string) :IntrinsicType {
  const x = new IntrinsicType(bitsize, name)
  assert(!universeTypes.has(name))
  universeTypes.set(name, x)
  return x
}

function ival(name :string, typ :IntrinsicType) :IntrinsicVal {
  const x = new IntrinsicVal(name, typ)
  assert(!universeValues.has(name))
  universeValues.set(name, x)
  return x
}

const ptrsize = 32 // TODO: target-dependant

// basic types
export const
  u_t_void  = new IntrinsicType(0, 'void') // note: unnamed
, u_t_auto  = new IntrinsicType(0, 'auto') // note: unnamed
, u_t_nil   = new IntrinsicType(0, '?') // note: unnamed, special type for nil

, u_t_bool  = ityp(1,  'bool')
, u_t_char  = ityp(32, 'char')
, u_t_usize = ityp(ptrsize, 'usize')

, u_t_i8  = ityp(7,  'i8')
, u_t_i16 = ityp(15, 'i16')
, u_t_i32 = ityp(31, 'i32')
, u_t_int = ityp(ptrsize-1, 'int')
, u_t_i64 = ityp(63, 'i64')

, u_t_u8  = ityp(8,  'u8')
, u_t_u16 = ityp(16, 'u16')
, u_t_u32 = ityp(32, 'u32')
, u_t_u64 = ityp(64, 'u64')

, u_t_f32 = ityp(32, 'f32')
, u_t_f64 = ityp(64, 'f64')

, u_t_string = ityp(ptrsize, 'string')

export const universeTypeAliases = new Map<string,string>([
  ['float', 'f64'],
  ['byte',  'u8'],
])


// ————————————————————————————————————————————————————————————————
// literal types

function intBinBits(v :Uint8Array) :number {
  let start = 2 // skip 0b or 0B
  while (v[start] == 0x30) { start++ } // skip leading zeroes
  let n = v.length - start
  return n > 64 ? 0 : n || 1
}

TEST("intBinBits", () => {
  for (let v of [
    ["0b0",         1], // 0x0
    ["0b1111111",   7], // 0x7F
    ["0b10000000",  8], // 0x80
    ["0b11111111",  8], // 0xFF
    
    ["0b100000000", 9],          // 0x100
    ["0b111111111111111",   15], // 0x7FFF
    ["0b1000000000000000",  16], // 0x8000
    ["0b1111111111111111",  16], // 0xFFFF
    
    ["0b10000000000000000", 17],                 // 0x10000
    ["0b1111111111111111111111111111111",   31], // 0x7FFFFFFF
    ["0b10000000000000000000000000000000",  32], // 0x80000000
    ["0b11111111111111111111111111111111",  32], // 0xFFFFFFFF

    ["0b100000000000000000000000000000000", 33], // 0x100000000
    ["0b11111111111111111111111111111111111111111111111111111", 53],
      // 0x1FFFFFFFFFFFFF (js MAX_SAFE_INTEGER)
    ["0b111111111111111111111111111111111111111111111111111111111111111", 63],
      // 0x7FFFFFFFFFFFFFFF
    ["0b1000000000000000000000000000000000000000000000000000000000000000", 64],
      // 0x8000000000000000
    ["0b1111111111111111111111111111111111111111111111111111111111111111", 64],
      // 0xFFFFFFFFFFFFFFFF
    ["0b10000000000000000000000000000000000000000000000000000000000000000", 0],
      // 0x10000000000000000 too large
  ]) {
    let input = v[0] as string
    let expected = v[1]
    let actual = intBinBits(str8buf(input))
    assert(
      actual == expected,
      `${JSON.stringify(input)} => ${actual}; expected ${expected}`
    )
  }
})


function intOctBits(b :Uint8Array) :number {
  let start = 2 // skip 0o or 0O
  while (b[start] == 0x30) { start++ } // skip leading zeroes
  let z = b.length - start
  //
  //         bits   hexadecimal             octal
  // ------  ---  ---------------  -----------------------
  // i8max    7   7F                177
  // u8max    8   FF                377
  // i16max  15   7FFF              77777
  // u16max  16   FFFF              177777
  // i32max  31   7FFFFFFF          17777777777
  // u32max  32   FFFFFFFF          37777777777
  // i64max  63   7FFFFFFFFFFFFFFF  777777777777777777777
  // u64max  64   FFFFFFFFFFFFFFFF  1777777777777777777777
  //
  return (
    z < 3 ? 7 :
    z == 3 ? (
      b[start] < 0x32 ? 7 : // <= 177 0x7F
      b[start] < 0x34 ? 8 : // <= 377 0xFF
      15 // > 377 0xFF
    ) :
    z < 6 ? 15 : // <= 77777 0x7FFF
    z == 6 && b[start] < 0x32 ? 16 : // <= 177777 0xFFFF
    z < 11 ? 31 : // > 177777 0xFFFF && < 10000000000 0x40000000
    z == 11 ? (
      b[start] < 0x32 ? 31 : // <= 17777777777 0x7FFFFFFF
      b[start] < 0x34 ? 32 : // <= 37777777777 0xFFFFFFFF
      63
    ) :
    z < 22 ? 63 : // <= 777777777777777777777 0x7FFFFFFFFFFFFFFF
    z == 22 && b[start] < 0x32 ? 64 : // <= 1777777777777777777777
    0
  )
}

TEST("intOctBits", () => {
  for (let v of [
    ["0o0",   7], // 0x0
    ["0o177", 7], // 0x7F
    ["0o200", 8], // 0x80
    ["0o377", 8], // 0xFF
    
    ["0o400", 15],    // 0x100
    ["0o77777",  15], // 0x7FFF
    ["0o100000", 16], // 0x8000
    ["0o177777", 16], // 0xFFFF
    
    ["0o200000", 31],      // 0x10000
    ["0o17777777777", 31], // 0x7FFFFFFF
    ["0o20000000000", 32], // 0x80000000
    ["0o37777777777", 32], // 0xFFFFFFFF

    ["0o40000000000", 63],            // 0x100000000
    ["0o377777777777777777", 63],     // 0x1FFFFFFFFFFFFF (js MAX_SAFE_INTEGER)
    ["0o777777777777777777777", 63],  // 0x7FFFFFFFFFFFFFFF
    ["0o1000000000000000000000", 64], // 0x8000000000000000
    ["0o1777777777777777777777", 64], // 0xFFFFFFFFFFFFFFFF
    ["0o2000000000000000000000", 0],  // 0x10000000000000000 too large
  ]) {
    let input = v[0] as string
    let expected = v[1]
    let actual = intOctBits(str8buf(input))
    assert(
      actual === expected,
      `${JSON.stringify(input)} => ${actual}; expected ${expected}`
    )
  }
})


const i64maxDecBuf = new Uint8Array([ // "9223372036854775807"
  57,50,50,51,51,55,50,48,51,54,56,53,52,55,55,53,56,48,55
])

const u64maxDecBuf = new Uint8Array([ // "18446744073709551615"
  49,56,52,52,54,55,52,52,48,55,51,55,48,57,53,53,49,54,49,53
])


function intDecBits(b :Uint8Array) :number {
  let v = 0, z = b.length
  for (let i = 0; i < z; i++) {
    v = v * 10 + (b[i] - 0x30)
  }
  if (v < 0x1FFFFFFFFFFFFF) {
    return v < 0x80 ? 7 : Math.floor(Math.log2(v)) + 1
  }
  // Beyond js integer precision. We have to look at the bytes.
  let start = 0
  while (b[start] == 0x30) { start++ } // skip leading zeroes
  z = b.length - start
  return  (
    z < 19 ? 63 :
    z == 19 ? bufcmp(b, i64maxDecBuf, start) <= 0 ? 63 : 64 :
    z == 20 && bufcmp(b, u64maxDecBuf, start) <= 0 ? 64 :
    0
  )
}

TEST("intDecBits", () => {
  for (let v of [
    ["0",   7],  // 0x0
    ["127", 7],  // 0x7F
    ["128", 8],  // 0x80
    ["255", 8],  // 0xFF
    
    ["256", 9],     // 0x100
    ["32767", 15],  // 0x7FFF
    ["32768", 16],  // 0x8000
    ["65535", 16],  // 0xFFFF
    
    ["65536", 17],      // 0x10000
    ["2147483647", 31], // 0x7FFFFFFF
    ["2147483648", 32], // 0x80000000
    ["4294967295", 32], // 0xFFFFFFFF

    ["4294967296", 33],           // 0x100000000
    ["9007199254740991", 63],     // 0x1FFFFFFFFFFFFF (js MAX_SAFE_INTEGER)
    ["9223372036854775807", 63],  // 0x7FFFFFFFFFFFFFFF
    ["9223372036854775808", 64],  // 0x8000000000000000
    ["18446744073709551615", 64], // 0xFFFFFFFFFFFFFFFF
    ["18446744073709551616", 0],  // 0x10000000000000000 too large
  ]) {
    let input = v[0] as string
    let expected = v[1]
    let actual = intDecBits(str8buf(input))
    assert(
      actual == expected,
      `${JSON.stringify(input)} => ${actual}; expected ${expected}`
    )
  }
})


function intHexBits(b :Uint8Array) :number {
  let v = 0, z = b.length
  for (let n = 0, i = 2; i < z; i++) {
    n = b[i]
    n = (
      n >= 0x30 && n <= 0x39 ? n - 0x30 :  // 0..9
      n >= 0x41 && n <= 0x46 ? n - 0x41 + 10 :  // A..F
      n - 0x61 + 10  // a..f -- scanner guarantees 0-9A-Fa-f
    )
    v = v * 16 + n
  }
  if (v < 0x1FFFFFFFFFFFFF) {
    return v < 0x80 ? 7 : Math.floor(Math.log2(v)) + 1
  }
  // Beyond js integer precision. We have to look at the bytes.
  let start = 2 // skip 0x or 0X
  while (b[start] == 0x30) { start++ } // skip leading zeroes
  z = b.length - start
  return (
    z < 16 || (z == 16 && b[start] <= 0x37) ? 63 :
    z == 16 ? 64 :
    0
  )
}

TEST("intHexBits", () => {
  for (let v of [
    ["0x0",  7],
    ["0x7F", 7],
    ["0x80", 8],
    ["0xFF", 8],
    
    ["0x100", 9],
    ["0x7FFF", 15],
    ["0x8000", 16],
    ["0xFFFF", 16],
    
    ["0x10000", 17],
    ["0x7FFFFFFF", 31],
    ["0x80000000", 32],
    ["0xFFFFFFFF", 32],

    ["0x100000000", 33],
    ["0x1FFFFFFFFFFFFF", 63],   // (js MAX_SAFE_INTEGER)
    ["0x7FFFFFFFFFFFFFFF", 63],
    ["0x8000000000000000", 64],
    ["0xFFFFFFFFFFFFFFFF", 64],
    ["0x10000000000000000", 0], // too large
  ]) {
    let input = v[0] as string
    let expected = v[1]
    let actual = intHexBits(str8buf(input))
    assert(
      actual == expected,
      `${JSON.stringify(input)} => ${actual}; expected ${expected}`
    )
  }
})


export type ErrorHandler = (msg :string, pos :Pos) => any

// basicLitTypeStorageMap maps storage types to all possible values types that
// can be stored (in the storage type) losslessly.
//
// const basicLitTypeStorageMap = new Map<IntrinsicType,Set<IntrinsicType>>([
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
type basicLitTypeFitter =
  (x :BasicLit, reqt :Type|null, errh? :ErrorHandler) => IntrinsicType

function intLitTypeFitter(x :BasicLit, reqt :Type|null, errh? :ErrorHandler
) :IntrinsicType {
  // debuglog(`${tokstr(x.tok)} ${JSON.stringify(buf8str(x.value))}`)

  let bits = 0

  // calculate minimum bit length
  switch (x.tok) {
    case token.INT_BIN: bits = intBinBits(x.value); break
    case token.INT_OCT: bits = intOctBits(x.value); break
    case token.INT:     bits = intDecBits(x.value); break
    case token.INT_HEX: bits = intHexBits(x.value); break
  }

  if (bits == 0) {  // literal is too large
    // TODO: support bigint transparently
    if (errh) {
      let t = reqt instanceof IntrinsicType ? reqt : u_t_u64
      errh(`constant ${buf8str(x.value)} overflows ${t.name}`, x.pos)
      bits = 64
    }
  } else if (reqt instanceof IntrinsicType) {
    if (reqt.bitsize >= bits) {
      // yay! requested type is large enough for the literal
      return reqt
    }
    if (errh) {
      errh(`constant ${buf8str(x.value)} overflows ${reqt.name}`, x.pos)
      bits = 64
    }
  }

  // pick type that matches the bit length
  return (
    bits <= 31 ? u_t_int :
    bits <= 63 ? u_t_i64 :
    u_t_u64
  )
}

function floatLitTypeFitter(x :BasicLit, reqt :Type|null, errh? :ErrorHandler
) :IntrinsicType {
  // TODO
  return u_t_f64
}

function charLitTypeFitter(x :BasicLit, reqt :Type|null, errh? :ErrorHandler
) :IntrinsicType {
  // TODO reqt
  return u_t_char
}

const basicLitTypesFitters = new Map<token,basicLitTypeFitter>([
  [token.CHAR, charLitTypeFitter],
  
  [token.INT,     intLitTypeFitter],
  [token.INT_BIN, intLitTypeFitter],
  [token.INT_OCT, intLitTypeFitter],
  [token.INT_HEX, intLitTypeFitter],

  [token.FLOAT, floatLitTypeFitter],
])


// universe values
export const
  u_v_true  = ival('true', u_t_bool)
, u_v_false = ival('false', u_t_bool)
, u_v_nil   = ival('nil', u_t_nil)


export class Universe {
  readonly strSet :ByteStrSet
  readonly scope  :Scope

  constructor(strSet :ByteStrSet) {
    this.strSet = strSet

    // build scope
    const unidecls = new Map<ByteStr,Ent>()

    for (let [name, t] of universeTypes) {
      // console.log(`DEF UNIVERSE TYPE "${name}"`)
      let n = strSet.emplace(str8buf(name))
      unidecls.set(n, new Ent(n, t, t))
    }

    for (let [aliasName, canonName] of universeTypeAliases) {
      // console.log(`DEF UNIVERSE TYPE ALIAS "${aliasName}" for "${canonName}"`)
      let aliasNameBuf = strSet.emplace(str8buf(aliasName))
      let canonNameBuf = strSet.emplace(str8buf(canonName))
      const obj = unidecls.get(canonNameBuf)
      assert(obj)
      unidecls.set(aliasNameBuf, obj as Ent)
    }

    for (let [name, x] of universeValues) {
      // console.log(`DEF UNIVERSE VAL "${name}"`)
      let n = strSet.emplace(str8buf(name))
      unidecls.set(n, new Ent(n, x, x))
    }

    this.scope = new Scope(null, unidecls)
  }

  // basicLitType returns the most suitable type for a literal.
  //
  // If reqType is provided, this function will attempt to fit the literal
  // into the reqType. If that fails, the most suitable type for the literal
  // alone is returned, and an error message is produces if errh is provided
  // You can thus check if contextual type fitting succeeded by comparing
  // reqType with the result.
  //
  basicLitType(x :BasicLit, reqType? :Type|null, errh? :ErrorHandler) :Type {
    let f = basicLitTypesFitters.get(x.tok) as basicLitTypeFitter
    assert(f, `missing type fitter for ${tokstr(x.tok)}`)
    return f(x, reqType || null, errh)
  }

}
