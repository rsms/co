//
// select generic operators given AST
//
import { token } from '../token'
import {
  Mem,
  BasicType,
  t_bool,
  t_u8,
  t_i8,
  t_u16,
  t_i16,
  t_u32,
  t_i32,
  t_u64,
  t_i64,
  t_f32,
  t_f64,
} from '../types'
import { Op } from './op'
import { ops } from "./ops"


// opselect1 returns the IR operation for the corresponding token operator
// and operand type.
//
export function opselect1(tok :token, x :BasicType) :Op {
  switch (tok) {

  case token.NOT: return ops.Not

  case token.ADD: switch (x.mem) { // -arg
    case Mem.i8:  return ops.NegI8
    case Mem.i16: return ops.NegI16
    case Mem.i32: return ops.NegI32
    case Mem.i64: return ops.NegI64
    case Mem.i32: return ops.NegF32
    case Mem.i64: return ops.NegF64
  }; break

  } // switch

  // unhandled operator token
  assert(false, `invalid token.${token[tok]} with type ${x}`)
  return ops.Invalid
}


// opselect2 returns the IR operator for the corresponding token operator
// and operand types.
//
export function opselect2(tok :token, x :BasicType, y :BasicType) :Op {
  switch (tok) {

  //
  // arithmetic
  //
  case token.ADD: switch (x.mem) { // +
    case Mem.i8:   return ops.AddI8
    case Mem.i16:  return ops.AddI16
    case Mem.i32:  return ops.AddI32
    case Mem.i64:  return ops.AddI64
    case Mem.f32:  return ops.AddF32
    case Mem.f64:  return ops.AddF64
  }; break

  case token.SUB: switch (x.mem) { // -
    case Mem.i8:   return ops.SubI8
    case Mem.i16:  return ops.SubI16
    case Mem.i32:  return ops.SubI32
    case Mem.i64:  return ops.SubI64
    case Mem.f32:  return ops.SubF32
    case Mem.f64:  return ops.SubF64
  }; break

  case token.MUL: switch (x.mem) { // *
    case Mem.i8:   return ops.MulI8
    case Mem.i16:  return ops.MulI16
    case Mem.i32:  return ops.MulI32
    case Mem.i64:  return ops.MulI64
    case Mem.f32:  return ops.MulF32
    case Mem.f64:  return ops.MulF64
  }; break

  case token.QUO: switch (x) { // /
    case t_i8:  return ops.DivS8
    case t_u8:  return ops.DivU8
    case t_i16: return ops.DivS16
    case t_u16: return ops.DivU16
    case t_i32: return ops.DivS32
    case t_u32: return ops.DivU32
    case t_i64: return ops.DivS64
    case t_u64: return ops.DivU64
    case t_f32: return ops.DivF32
    case t_f64: return ops.DivF64
  }; break

  case token.REM: switch (x) { // %
    case t_i8:  return ops.RemS8
    case t_u8:  return ops.RemU8
    case t_i16: return ops.RemS16
    case t_u16: return ops.RemU16
    case t_i32: return ops.RemS32
    case t_u32: return ops.RemU32
    case t_i64: return ops.RemI64
    case t_u64: return ops.RemU64
  }; break

  case token.AND: switch (x.mem) { // &
    case Mem.i8:   return ops.AndI8
    case Mem.i16:  return ops.AndI16
    case Mem.i32:  return ops.AndI32
    case Mem.i64:  return ops.AndI64
  }; break

  case token.OR: switch (x.mem) { // |
    case Mem.i8:   return ops.OrI8
    case Mem.i16:  return ops.OrI16
    case Mem.i32:  return ops.OrI32
    case Mem.i64:  return ops.OrI64
  }; break

  case token.XOR: switch (x.mem) { // ^
    case Mem.i8:   return ops.XorI8
    case Mem.i16:  return ops.XorI16
    case Mem.i32:  return ops.XorI32
    case Mem.i64:  return ops.XorI64
  }; break

  case token.AND_NOT: // &^  TODO implement. Emulated by: x & ~y
    assert(false, 'AND_NOT "&^" not yet supported')
    break

  //
  // comparisons
  //
  case token.EQL: switch (x.mem) { // ==
    case Mem.i8:   return ops.EqI8
    case Mem.i16:  return ops.EqI16
    case Mem.i32:  return ops.EqI32
    case Mem.i64:  return ops.EqI64
    case Mem.f32:  return ops.EqF32
    case Mem.f64:  return ops.EqF64
  }; break

  case token.NEQ: switch (x.mem) { // !=
    case Mem.i8:   return ops.NeqI8
    case Mem.i16:  return ops.NeqI16
    case Mem.i32:  return ops.NeqI32
    case Mem.i64:  return ops.NeqI64
    case Mem.f32:  return ops.NeqF32
    case Mem.f64:  return ops.NeqF64
  }; break

  case token.LSS: switch (x) { // <
    case t_i8:  return ops.LessS8
    case t_u8:  return ops.LessU8
    case t_i16: return ops.LessS16
    case t_u16: return ops.LessU16
    case t_i32: return ops.LessS32
    case t_u32: return ops.LessU32
    case t_i64: return ops.LessS64
    case t_u64: return ops.LessU64
    case t_f32: return ops.LessF32
    case t_f64: return ops.LessF64
  }; break

  case token.LEQ: switch (x) { // <=
    case t_i8:  return ops.LeqS8
    case t_u8:  return ops.LeqU8
    case t_i16: return ops.LeqS16
    case t_u16: return ops.LeqU16
    case t_i32: return ops.LeqS32
    case t_u32: return ops.LeqU32
    case t_i64: return ops.LeqS64
    case t_u64: return ops.LeqU64
    case t_f32: return ops.LeqF32
    case t_f64: return ops.LeqF64
  }; break

  case token.GTR: switch (x) { // >
    case t_i8:  return ops.GreaterS8
    case t_u8:  return ops.GreaterU8
    case t_i16: return ops.GreaterS16
    case t_u16: return ops.GreaterU16
    case t_i32: return ops.GreaterS32
    case t_u32: return ops.GreaterU32
    case t_i64: return ops.GreaterS64
    case t_u64: return ops.GreaterU64
    case t_f32: return ops.GreaterF32
    case t_f64: return ops.GreaterF64
  }; break

  case token.GEQ: switch (x) { // >=
    case t_i8:  return ops.GeqS8
    case t_u8:  return ops.GeqU8
    case t_i16: return ops.GeqS16
    case t_u16: return ops.GeqU16
    case t_i32: return ops.GeqS32
    case t_u32: return ops.GeqU32
    case t_i64: return ops.GeqS64
    case t_u64: return ops.GeqU64
    case t_f32: return ops.GeqF32
    case t_f64: return ops.GeqF64
  }; break

  //
  // shifts
  //
  case token.SHL: switch (x.mem) { // <<
    case Mem.i8: switch (y) {
      case t_u8:   return ops.ShLI8x8
      case t_u16:  return ops.ShLI8x16
      case t_u32:  return ops.ShLI8x32
      case t_u64:  return ops.ShLI8x64
    } break
    case Mem.i16: switch (y) {
      case t_u8:   return ops.ShLI16x8
      case t_u16:  return ops.ShLI16x16
      case t_u32:  return ops.ShLI16x32
      case t_u64:  return ops.ShLI16x64
    } break
    case Mem.i32: switch (y) {
      case t_u8:   return ops.ShLI32x8
      case t_u16:  return ops.ShLI32x16
      case t_u32:  return ops.ShLI32x32
      case t_u64:  return ops.ShLI32x64
    } break
    case Mem.i64: switch (y) {
      case t_u8:   return ops.ShLI64x8
      case t_u16:  return ops.ShLI64x16
      case t_u32:  return ops.ShLI64x32
      case t_u64:  return ops.ShLI64x64
    } break
  }; break

  case token.SHR: assert(y.isUnsignedInt); switch (x) { // >>
    case t_i8: switch (y) {
      case t_u8:   return ops.ShRS8x8
      case t_u16:  return ops.ShRS8x16
      case t_u32:  return ops.ShRS8x32
      case t_u64:  return ops.ShRS8x64
    } break
    case t_u8: switch (y) {
      case t_u8:   return ops.ShRU8x8
      case t_u16:  return ops.ShRU8x16
      case t_u32:  return ops.ShRU8x32
      case t_u64:  return ops.ShRU8x64
    } break
    case t_i16: switch (y) {
      case t_u8:   return ops.ShRS16x8
      case t_u16:  return ops.ShRS16x16
      case t_u32:  return ops.ShRS16x32
      case t_u64:  return ops.ShRS16x64
    } break
    case t_u16: switch (y) {
      case t_u8:   return ops.ShRU16x8
      case t_u16:  return ops.ShRU16x16
      case t_u32:  return ops.ShRU16x32
      case t_u64:  return ops.ShRU16x64
    } break
    case t_i32: switch (y) {
      case t_u8:   return ops.ShRS32x8
      case t_u16:  return ops.ShRS32x16
      case t_u32:  return ops.ShRS32x32
      case t_u64:  return ops.ShRS32x64
    } break
    case t_u32: switch (y) {
      case t_u8:   return ops.ShRU32x8
      case t_u16:  return ops.ShRU32x16
      case t_u32:  return ops.ShRU32x32
      case t_u64:  return ops.ShRU32x64
    } break
    case t_i64: switch (y) {
      case t_u8:   return ops.ShRS64x8
      case t_u16:  return ops.ShRS64x16
      case t_u32:  return ops.ShRS64x32
      case t_u64:  return ops.ShRS64x64
    } break
    case t_u64: switch (y) {
      case t_u8:   return ops.ShRU64x8
      case t_u16:  return ops.ShRU64x16
      case t_u32:  return ops.ShRU64x32
      case t_u64:  return ops.ShRU64x64
    } break
  }; break

  } // switch

  // unhandled operator token
  assert(false, `invalid token.${token[tok]} with types ${x}, ${y}`)
  return ops.Invalid
}


// opselectConv returns the IR operation for converting x to y.
//
export function opselectConv(src :BasicType, dst :BasicType) :Op {
  switch (src) {

  case t_i8: switch (dst) {
    case t_bool: return ops.TruncI8toBool
    case t_i16:  return ops.SignExtI8to16
    case t_i32:  return ops.SignExtI8to32
    case t_i64:  return ops.SignExtI8to64
  }; break

  case t_u8: switch (dst) {
    case t_bool: return ops.TruncI8toBool
    case t_u16:  return ops.ZeroExtI8to16
    case t_u32:  return ops.ZeroExtI8to32
    case t_u64:  return ops.ZeroExtI8to64
  }; break

  case t_i16: switch (dst) {
    case t_bool: return ops.TruncI16toBool
    case t_i8:   return ops.TruncI16to8
    case t_i32:  return ops.SignExtI16to32
    case t_i64:  return ops.SignExtI16to64
  }; break

  case t_u16: switch (dst) {
    case t_bool: return ops.TruncI16toBool
    case t_u8:   return ops.TruncI16to8
    case t_u32:  return ops.ZeroExtI16to32
    case t_u64:  return ops.ZeroExtI16to64
  }; break

  case t_i32: switch (dst) {
    case t_bool: return ops.TruncI32toBool
    case t_i8:   return ops.TruncI32to8
    case t_i16:  return ops.TruncI32to16
    case t_i64:  return ops.SignExtI32to64
    case t_f32:  return ops.ConvI32toF32
    case t_f64:  return ops.ConvI32toF64
  }; break

  case t_u32: switch (dst) {
    case t_bool: return ops.TruncI32toBool
    case t_u8:   return ops.TruncI32to8
    case t_u16:  return ops.TruncI32to16
    case t_u64:  return ops.ZeroExtI32to64
    case t_f32:  return ops.ConvU32toF32
    case t_f64:  return ops.ConvU32toF64
  }; break

  case t_i64: switch (dst) {
    case t_bool: return ops.TruncI64toBool
    case t_i8:   return ops.TruncI64to8
    case t_i16:  return ops.TruncI64to16
    case t_i32:  return ops.TruncI64to32
    case t_f32:  return ops.ConvI64toF32
    case t_f64:  return ops.ConvI64toF64
  }; break

  case t_u64: switch (dst) {
    case t_bool: return ops.TruncI64toBool
    case t_u8:   return ops.TruncI64to8
    case t_u16:  return ops.TruncI64to16
    case t_u32:  return ops.TruncI64to32
    case t_f32:  return ops.ConvU64toF32
    case t_f64:  return ops.ConvU64toF64
  }; break

  case t_f32: switch (dst) {
    case t_bool: return ops.TruncF32toBool
    case t_i32:  return ops.ConvF32toI32
    case t_u32:  return ops.ConvF32toU32
    case t_i64:  return ops.ConvF32toI64
    case t_u64:  return ops.ConvF32toU64
    case t_f64:  return ops.ConvF32toF64
  }; break

  case t_f64: switch (dst) {
    case t_bool: return ops.TruncF64toBool
    case t_i32:  return ops.ConvF64toI32
    case t_u32:  return ops.ConvF64toU32
    case t_i64:  return ops.ConvF64toI64
    case t_u64:  return ops.ConvF64toU64
    case t_f32:  return ops.ConvF64toF32
  }; break

  } // switch

  // unhandled operator token
  assert(false, `invalid conversion ${src} -> ${dst}`)
  return ops.Invalid
}
