import { SInt64, UInt64 } from './int64'
import { Num } from './num'
import {
  NumType,
  t_u8, t_i8, t_u16, t_i16, t_u32, t_i32, t_u64, t_i64,
  t_uint, t_int,
  t_f32, t_f64,
} from './types'

const _Int64_UINT32_MAX = UInt64.fromInt32(0xffffffff)
const _Int64_SINT32_MAX = SInt64.fromInt32(0x7fffffff)
const _Int64_SINT32_MIN = SInt64.fromInt32(-0x80000000)

const _Int32_UINT16_MAX = 0xffff >>> 0
const _Int32_SINT16_MAX = 0x7fff | 0
const _Int32_SINT16_MIN = -0x8000 | 0
const _Int64_UINT16_MAX = UInt64.fromInt32(_Int32_UINT16_MAX)
const _Int64_SINT16_MAX = SInt64.fromInt32(_Int32_SINT16_MAX)
const _Int64_SINT16_MIN = SInt64.fromInt32(_Int32_SINT16_MIN)

const _Int32_UINT8_MAX = 0xff >>> 0
const _Int32_SINT8_MAX = 0x7f | 0
const _Int32_SINT8_MIN = -0x80 | 0
const _Int64_UINT8_MAX = UInt64.fromInt32(_Int32_UINT8_MAX)
const _Int64_SINT8_MAX = SInt64.fromInt32(_Int32_SINT8_MAX)
const _Int64_SINT8_MIN = SInt64.fromInt32(_Int32_SINT8_MIN)


// numconv coverts a number to a type.
//
// Conversion always succeeds but might be lossy;
// returns [Num,true] when lossless, [Num,false] when conversion was lossy.
//
export function numconv(v :Num, t :NumType) :[Num,bool] {  // -> v2, lossless
  let lossless :bool = false

  // TODO FIXME if the type is arch dependent, assume 32-bit
  if (t === t_int) {
    t = t_i32
  } else if (t === t_uint) {
    t = t_u32
  }

  if (t === t_i64) {
    // ? -> i64
    if (typeof v == 'number') {
      if (v === (v | 0) || v === v >>> 0) {
        // i32|u32 -> i64
        lossless = true
        v = SInt64.fromFloat64(v)
      } else {
        // f32|f64 -> i64
        let n :SInt64|null
        if (Math.ceil(v) == v && (n = SInt64.maybeFromFloat64(v))) {
          lossless = true
          v = n
        } else {
          v = SInt64.fromFloat64(v)
        }
      }
    } else {
      // u64|i64 -> i64
      lossless = v.lte(SInt64.MAX)
      v = v.toSigned()
    }

  } else if (t === t_u64) {
    // ? -> u64
    if (typeof v == 'number') {
      if (v === v >>> 0) {
        // +i32|u32 -> u64
        lossless = true
        v = SInt64.fromInt32(v)
      } else {
        // -i32|f32|f64 -> u64
        let n :UInt64|null
        if (Math.ceil(v) == v && (n = UInt64.maybeFromFloat64(v))) {
          lossless = true
          v = n
        } else {
          v = UInt64.fromFloat64(v)
        }
      }
    } else {
      // u64|i64 -> i64
      lossless = v.isPos()
      v = v.toUnsigned()
    }

  } else if (t === t_i32) {
    // ? -> i32
    if (typeof v == 'number') {
      let v2 = v | 0
      lossless = v === v2
      v = v2
    } else {
      // u64|i64 -> i32
      lossless = v.gte(_Int64_SINT32_MIN) && v.lte(_Int64_SINT32_MAX)
      v = v.toInt32()
    }

  } else if (t === t_u32) {
    // ? -> u32
    if (typeof v == 'number') {
      let v2 = v >>> 0
      lossless = v === v2
      v = v2
    } else {
      // u64|i64 -> u32
      lossless = v.gte(UInt64.ZERO) && v.lte(_Int64_UINT32_MAX)
      v = v.toUInt32()
    }

  } else if (t === t_i16) {
    // ? -> i16
    if (typeof v == 'number') {
      let v2 = v | 0
      lossless = v === v2 && v >= _Int32_SINT16_MIN && v <= _Int32_SINT16_MAX
      v = v2
    } else {
      // u64|i64 -> i16
      lossless = v.gte(_Int64_SINT16_MIN) && v.lte(_Int64_SINT16_MAX)
      v = v.toInt32()
      assert(v >= _Int32_SINT16_MIN && v <= _Int32_SINT16_MAX)
    }

  } else if (t === t_u16) {
    // ? -> u16
    if (typeof v == 'number') {
      let v2 = v >>> 0
      lossless = v === v2 && v >= 0 && v <= _Int32_UINT16_MAX
      v = v2
    } else {
      // u64|i64 -> u16
      lossless = v.gte(UInt64.ZERO) && v.lte(_Int64_UINT16_MAX)
      v = v.toInt32()
      assert(v >= 0 && v <= _Int32_UINT16_MAX)
    }

  } else if (t === t_i8) {
    // ? -> i8
    if (typeof v == 'number') {
      let v2 = v | 0
      lossless = v === v2 && v >= _Int32_SINT8_MIN && v <= _Int32_SINT8_MAX
      v = v2
    } else {
      // u64|i64 -> i8
      lossless = v.gte(_Int64_SINT8_MIN) && v.lte(_Int64_SINT8_MAX)
      v = v.toInt32()
      assert(v >= _Int32_SINT8_MIN && v <= _Int32_SINT8_MAX)
    }

  } else if (t === t_u8) {
    // ? -> u8
    if (typeof v == 'number') {
      let v2 = v >>> 0
      lossless = v === v2 && v >= 0 && v <= _Int32_UINT8_MAX
      v = v2
    } else {
      // u64|i64 -> u8
      lossless = v.gte(UInt64.ZERO) && v.lte(_Int64_UINT8_MAX)
      v = v.toInt32()
      assert(v >= 0 && v <= _Int32_UINT8_MAX)
    }

  } else if (t === t_f64) {
    // ? -> f64
    lossless = true
    if (typeof v != 'number') {
      v = v.toFloat64()
    }

  } else if (t === t_f32) {
    // ? -> f32
    lossless = true
    if (typeof v != 'number') {
      v = v.toFloat64()
    }

  } else {
    assert(false, `unexpected destination type ${t}`)
  }

  return [v, lossless]
}
