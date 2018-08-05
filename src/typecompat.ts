//
// Exposes the function
//   basicTypeCompat(dst :BasicType, src :BasicType) :TypeCompat
// which can be used to understand how conversion from one type to another
// affects its value.
//
// The result can be
//
import {
  BasicType,
  t_uint,
  t_int,
  t_i8,
  t_i16,
  t_i32,
  t_i64,
  t_u8,
  t_u16,
  t_u32,
  t_u64,
  t_f32,
  t_f64,
} from './types'

// type compatibility
export enum TypeCompat {
  NO = 0,   // not compatible
  LOSSY,    // can be converted at a loss
  LOSSLESS, // can be converted safely without loss
}

const uintz :number = 32 // TODO FIXME: target-dependant

// maps destination type to receiver types and their compatbility type
// TODO: separate into a "type" source file.
const typeCompatMap = new Map<BasicType,Map<BasicType,TypeCompat>>([

  [t_u64, new Map<BasicType,TypeCompat>([
    [t_uint, TypeCompat.LOSSLESS],
    [t_int,  TypeCompat.LOSSLESS],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSLESS],
    [t_i32, TypeCompat.LOSSLESS],
    [t_i64, TypeCompat.LOSSLESS],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u16, TypeCompat.LOSSLESS],
    [t_u32, TypeCompat.LOSSLESS],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_i64, new Map<BasicType,TypeCompat>([
    [t_uint, uintz <= 63 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [t_int,  TypeCompat.LOSSLESS],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSLESS],
    [t_i32, TypeCompat.LOSSLESS],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u16, TypeCompat.LOSSLESS],
    [t_u32, TypeCompat.LOSSLESS],
    [t_u64, TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_u32, new Map<BasicType,TypeCompat>([
    [t_uint, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [t_int,  uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSLESS],
    [t_i32, TypeCompat.LOSSLESS],
    [t_i64, TypeCompat.LOSSY],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u16, TypeCompat.LOSSLESS],
    [t_u64, TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_i32, new Map<BasicType,TypeCompat>([
    [t_uint, TypeCompat.LOSSY],
    [t_int,  uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSLESS],
    [t_i64, TypeCompat.LOSSY],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u16, TypeCompat.LOSSLESS],
    [t_u32, TypeCompat.LOSSY],
    [t_u64, TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_uint, new Map<BasicType,TypeCompat>([
    [t_int, TypeCompat.LOSSLESS],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSLESS],
    [t_i32, TypeCompat.LOSSLESS],
    [t_i64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u16, TypeCompat.LOSSLESS],
    [t_u32, uintz >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [t_u64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_int, new Map<BasicType,TypeCompat>([
    [t_uint, TypeCompat.LOSSY],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSLESS],
    [t_i32, TypeCompat.LOSSLESS],
    [t_i64, uintz >= 64 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u16, TypeCompat.LOSSLESS],
    [t_u32, uintz >= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [t_u64, TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_u16, new Map<BasicType,TypeCompat>([
    [t_uint, TypeCompat.LOSSY],
    [t_int,  TypeCompat.LOSSY],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSLESS],
    [t_i32, TypeCompat.LOSSY],
    [t_i64, TypeCompat.LOSSY],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u32, TypeCompat.LOSSY],
    [t_u64, TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_i16, new Map<BasicType,TypeCompat>([
    [t_uint, TypeCompat.LOSSY],
    [t_int,  TypeCompat.LOSSY],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i32, TypeCompat.LOSSY],
    [t_i64, TypeCompat.LOSSY],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u16, TypeCompat.LOSSY],
    [t_u32, TypeCompat.LOSSY],
    [t_u64, TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_u8, new Map<BasicType,TypeCompat>([
    [t_uint, TypeCompat.LOSSY],
    [t_int,  TypeCompat.LOSSY],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSY],
    [t_i32, TypeCompat.LOSSY],
    [t_i64, TypeCompat.LOSSY],

    [t_u16, TypeCompat.LOSSY],
    [t_u32, TypeCompat.LOSSY],
    [t_u64, TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_i8, new Map<BasicType,TypeCompat>([
    [t_uint, TypeCompat.LOSSY],
    [t_int,  TypeCompat.LOSSY],

    [t_i16, TypeCompat.LOSSY],
    [t_i32, TypeCompat.LOSSY],
    [t_i64, TypeCompat.LOSSY],

    [t_u8,  TypeCompat.LOSSY],
    [t_u16, TypeCompat.LOSSY],
    [t_u32, TypeCompat.LOSSY],
    [t_u64, TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSY],
    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_f32, new Map<BasicType,TypeCompat>([
    [t_uint, TypeCompat.LOSSY],
    [t_int,  TypeCompat.LOSSY],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSLESS],
    [t_i32, TypeCompat.LOSSY],
    [t_i64, TypeCompat.LOSSY],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u16, TypeCompat.LOSSLESS],
    [t_u32, TypeCompat.LOSSY],
    [t_u64, TypeCompat.LOSSY],

    [t_f64, TypeCompat.LOSSY],
  ])],

  [t_f64, new Map<BasicType,TypeCompat>([
    [t_uint, uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],
    [t_int,  uintz <= 32 ? TypeCompat.LOSSLESS : TypeCompat.LOSSY],

    [t_i8,  TypeCompat.LOSSLESS],
    [t_i16, TypeCompat.LOSSLESS],
    [t_i32, TypeCompat.LOSSLESS],
    [t_i64, TypeCompat.LOSSY],

    [t_u8,  TypeCompat.LOSSLESS],
    [t_u16, TypeCompat.LOSSLESS],
    [t_u32, TypeCompat.LOSSLESS],
    [t_u64, TypeCompat.LOSSY],

    [t_f32, TypeCompat.LOSSLESS],
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
  assert_LOSSLESS(t_u64, t_uint)
  assert_LOSSLESS(t_u64, t_int)
  assert_LOSSLESS(t_u64, t_i64)
  assert_LOSSLESS(t_u64, t_u32)
  assert_LOSSLESS(t_u64, t_i32)
  assert_LOSSLESS(t_u64, t_u16)
  assert_LOSSLESS(t_u64, t_i16)
  assert_LOSSLESS(t_u64, t_u8)
  assert_LOSSLESS(t_u64, t_i8)
  assert_LOSSY   (t_u64, t_f32)
  assert_LOSSY   (t_u64, t_f64)

  // i64
  assert_LOSSLESS(t_i64, t_uint)
  if (uintz == 64) {
    assert_LOSSY(t_i64, t_int)
  } else {
    assert_LOSSLESS(t_i64, t_int)
  }
  assert_LOSSY   (t_i64, t_u64)
  assert_LOSSLESS(t_i64, t_u32)
  assert_LOSSLESS(t_i64, t_i32)
  assert_LOSSLESS(t_i64, t_u16)
  assert_LOSSLESS(t_i64, t_i16)
  assert_LOSSLESS(t_i64, t_u8)
  assert_LOSSLESS(t_i64, t_i8)
  assert_LOSSY   (t_i64, t_f32)
  assert_LOSSY   (t_i64, t_f64)

  // u32
  if (uintz == 64) {
    assert_LOSSY(t_u32, t_uint)
    assert_LOSSY(t_u32, t_int)
  } else {
    assert_LOSSLESS(t_u32, t_uint)
    assert_LOSSLESS(t_u32, t_int)
  }
  assert_LOSSY   (t_u32, t_u64)
  assert_LOSSY   (t_u32, t_i64)
  assert_LOSSLESS(t_u32, t_i32)
  assert_LOSSLESS(t_u32, t_u16)
  assert_LOSSLESS(t_u32, t_i16)
  assert_LOSSLESS(t_u32, t_u8)
  assert_LOSSLESS(t_u32, t_i8)
  assert_LOSSY   (t_u32, t_f32)
  assert_LOSSY   (t_u32, t_f64)

  // i32
  assert_LOSSY   (t_i32, t_uint)
  if (uintz == 64) {
    assert_LOSSY(t_i32, t_int)
  } else {
    assert_LOSSLESS(t_i32, t_int)
  }
  assert_LOSSY   (t_i32, t_u64)
  assert_LOSSY   (t_i32, t_i64)
  assert_LOSSY   (t_i32, t_u32)
  assert_LOSSLESS(t_i32, t_u16)
  assert_LOSSLESS(t_i32, t_i16)
  assert_LOSSLESS(t_i32, t_u8)
  assert_LOSSLESS(t_i32, t_i8)
  assert_LOSSY   (t_i32, t_f32)
  assert_LOSSY   (t_i32, t_f64)

  // u16
  assert_LOSSY   (t_u16, t_uint)
  assert_LOSSY   (t_u16, t_int)
  assert_LOSSY   (t_u16, t_u64)
  assert_LOSSY   (t_u16, t_i64)
  assert_LOSSY   (t_u16, t_u32)
  assert_LOSSY   (t_u16, t_i32)
  assert_LOSSLESS(t_u16, t_i16)
  assert_LOSSLESS(t_u16, t_u8)
  assert_LOSSLESS(t_u16, t_i8)
  assert_LOSSY   (t_u16, t_f32)
  assert_LOSSY   (t_u16, t_f64)

  // i16
  assert_LOSSY   (t_i16, t_uint)
  assert_LOSSY   (t_i16, t_int)
  assert_LOSSY   (t_i16, t_u64)
  assert_LOSSY   (t_i16, t_i64)
  assert_LOSSY   (t_i16, t_u32)
  assert_LOSSY   (t_i16, t_i32)
  assert_LOSSY   (t_i16, t_u16)
  assert_LOSSLESS(t_i16, t_u8)
  assert_LOSSLESS(t_i16, t_i8)
  assert_LOSSY   (t_i16, t_f32)
  assert_LOSSY   (t_i16, t_f64)

  // u8
  assert_LOSSY   (t_u8, t_uint)
  assert_LOSSY   (t_u8, t_int)
  assert_LOSSY   (t_u8, t_u64)
  assert_LOSSY   (t_u8, t_i64)
  assert_LOSSY   (t_u8, t_u32)
  assert_LOSSY   (t_u8, t_i32)
  assert_LOSSY   (t_u8, t_u16)
  assert_LOSSY   (t_u8, t_i16)
  assert_LOSSLESS(t_u8, t_i8)
  assert_LOSSY   (t_u8, t_f32)
  assert_LOSSY   (t_u8, t_f64)

  // i8
  assert_LOSSY   (t_i8, t_uint)
  assert_LOSSY   (t_i8, t_int)
  assert_LOSSY   (t_i8, t_u64)
  assert_LOSSY   (t_i8, t_i64)
  assert_LOSSY   (t_i8, t_u32)
  assert_LOSSY   (t_i8, t_i32)
  assert_LOSSY   (t_i8, t_u16)
  assert_LOSSY   (t_i8, t_i16)
  assert_LOSSY   (t_i8, t_u8)
  assert_LOSSY   (t_i8, t_f32)
  assert_LOSSY   (t_i8, t_f64)

  // f64
  if (uintz <= 32) {
    assert_LOSSLESS(t_f64, t_uint)
    assert_LOSSLESS(t_f64, t_int)
  } else {
    assert_LOSSY   (t_f64, t_uint)
    assert_LOSSY   (t_f64, t_int)
  }
  assert_LOSSY   (t_f64, t_u64)
  assert_LOSSY   (t_f64, t_i64)
  assert_LOSSLESS(t_f64, t_u32)
  assert_LOSSLESS(t_f64, t_i32)
  assert_LOSSLESS(t_f64, t_u16)
  assert_LOSSLESS(t_f64, t_i16)
  assert_LOSSLESS(t_f64, t_u8)
  assert_LOSSLESS(t_f64, t_i8)
  assert_LOSSLESS(t_f64, t_f32)

  // f32
  assert_LOSSY   (t_f32, t_uint)
  assert_LOSSY   (t_f32, t_int)
  assert_LOSSY   (t_f32, t_u64)
  assert_LOSSY   (t_f32, t_i64)
  assert_LOSSY   (t_f32, t_u32)
  assert_LOSSY   (t_f32, t_i32)
  assert_LOSSLESS(t_f32, t_u16)
  assert_LOSSLESS(t_f32, t_i16)
  assert_LOSSLESS(t_f32, t_u8)
  assert_LOSSLESS(t_f32, t_i8)
  assert_LOSSY   (t_f32, t_f64)
})
