import { BasicType } from './ast'
import {
  t_bool,
  t_u8,
  t_i8,
  t_u16,
  t_i16,
  t_u32,
  t_i32,
  t_u64,
  t_i64,
  t_uint,
  t_int,
  t_usize,
  t_isize,
  
  t_f32,
  t_f64,

  t_str,
} from './types'

export enum SymEffect {
  None = 0,
  Read,
  Addr,
}

export const defaultOp = {
  name:              "" as string,
    // printed name
  typ:               null as BasicType|null,
    // default result type
  aux:               null as BasicType|null,
    // ?
  argLength:         0 as int,
    // number of arguments, if -1, then this operation has a variable number
    // of arguments
  commutative:       false as bool,
    // this operation is commutative on its first 2 arguments (e.g. addition)
  resultInArg0:      false as bool,
    // (first, if a tuple) output of v and v.Args[0] must be allocated to the
    // same register
  resultNotInArgs:   false as bool,
    // outputs must not be allocated to the same registers as inputs
  clobberFlags:      false as bool,
    // this op clobbers flags register
  call:              false as bool,
    // is a function call
  nilCheck:          false as bool,
    // this op is a nil check on arg0
  faultOnNilArg0:    false as bool,
    // this op will fault if arg0 is nil (and aux encodes a small offset)
  faultOnNilArg1:    false as bool,
    // this op will fault if arg1 is nil (and aux encodes a small offset)
  usesScratch:       false as bool,
    // this op requires scratch memory space
  hasSideEffects:    false as bool,
    // for "reasons", not to be eliminated.  E.g., atomic store.
  zeroWidth:         false as bool,
    // op never translates into any machine code. example: copy, which may
    // sometimes translate to machine code, is not zero-width.
  symEffect:         "" as string,
    // effect this op has on symbol in aux

  // reg?            null, // regInfo
  // asm:            "", // string
}

const t_addr = t_usize

type OpInfo = typeof defaultOp

export const genericOps :OpInfo[] = []

function Op(name :string, argLength :int, props? :Partial<OpInfo>) :OpInfo {
  const op = {} as OpInfo
  Object.assign(op, defaultOp)
  if (props) {
    Object.assign(op, props as OpInfo)
  }
  op.name = name
  op.argLength = argLength || 0
  genericOps.push(op)
  return op
}

// operations
export const op = {

  // special
  Invalid:  Op("Invalid", 0),
  Unknown:  Op("Unknown", 0),
    // Unknown value.
    // Used for Values whose values don't matter because they are dead code.
  Phi:      Op("Phi", -1, {zeroWidth: true}),
    // select an argument based on which predecessor block we came from
  Copy:     Op("Copy", 1),  // output = arg0
  Arg:      Op("Arg", 0, {zeroWidth: true}), // argument to current function
  CallArg:  Op("CallArg", 1, {zeroWidth: true}), // argument for function call


  // function calls
  //
  // Arguments to the call have already been written to the stack.
  // Return values appear on the stack.
  Call:     Op("Call", 1, {aux: t_usize, call: true}), // call function
  TailCall: Op("TailCall", 1, {aux: t_usize, call: true}), // call function
  // ClosureCall: Op("ClosureCall", 3, {aux: t_usize, call: true})
    // arg0=code pointer, arg1=context ptr, arg2=memory.  aux=arg size.
  // ICall: Op("ICall", 2, {aux: t_usize, call: true})
    // interface call.  arg0=code pointer, arg1=memory, aux=arg size.


  // constants
  // Constant values are stored in the aux field.
  ConstBool:   Op("ConstBool", 0, {aux: t_bool}),   // aux is 0=false, 1=true
  ConstI8:     Op("ConstI8", 0, {aux: t_u8}),   // aux is sign-extended 8 bits
  ConstI16:    Op("ConstI16", 0, {aux: t_u16}), // aux is sign-extended 16 bits
  ConstI32:    Op("ConstI32", 0, {aux: t_u32}), // aux is sign-extended 32 bits
    // Note: ConstX are sign-extended even when the type of the value is
    // unsigned.
    // For instance, uint8(0xaa) is stored as aux=0xffffffffffffffaa.
  ConstI64:    Op("ConstI64", 0, {aux: t_u64}),    // value is aux
  ConstF32:    Op("ConstF32", 0, {aux: t_u32}),
    // value is math.Float64frombits(uint64(aux)) and is exactly prepresentable as float 32
  ConstF64:    Op("ConstF64", 0, {aux: t_u64}),
    // value is math.Float64frombits(uint64(aux))
  // ConstString: Op("ConstString", 0, {aux: t_str}),
  //   // value is aux (string)


  // stack
  SP: Op("SP", 0, {zeroWidth: true}), // stack pointer
    // The SP pseudo-register is a virtual stack pointer used to refer
    // to frame-local variables and the arguments being prepared for
    // function calls. It points to the top of the local stack frame,
    // so references should use negative offsets in the range
    // [−framesize, 0): x-8(SP), y-4(SP), and so on.
  SB: Op("SB", 0, {typ: t_usize, zeroWidth: true}),
    // static base pointer (a.k.a. globals pointer)
    // SB is a pseudo-register that holds the "static base" pointer,
    // i.e. the address of the beginning of the program address space.


  // memory
  Load:  Op("Load", 2),
    // Load from arg0. arg1=addr
  Store: Op("Store", 3, {typ: t_addr}),
    // Store arg1 to arg0.  arg2=addr, aux=type
  Move:  Op("Move", 3, {typ: t_addr}),
    // arg0=destptr, arg1=srcptr, arg2=addr, aux=type
  Zero:  Op("Zero", 2, {typ: t_addr}),
    // arg0=destptr, arg1=addr, auxint=size, aux=type


  // 2-input arithmetic
  // Types must be consistent with typing.
  // Add, for example, must take two values of the same type and produces that
  // same type
  //
  // arg0 + arg1 ; sign-agnostic addition
  AddI8:  Op("AddI8",  2, {commutative: true}),
  AddI16: Op("AddI16", 2, {commutative: true}),
  AddI32: Op("AddI32", 2, {commutative: true}),
  AddI64: Op("AddI64", 2, {commutative: true}),
  AddF32: Op("AddF32", 2, {commutative: true}),
  AddF64: Op("AddF64", 2, {commutative: true}),
  //
  // arg0 - arg1 ; sign-agnostic subtraction
  SubI8:  Op("SubI8",  2),
  SubI16: Op("SubI16", 2),
  SubI32: Op("SubI32", 2),
  SubI64: Op("SubI64", 2),
  SubF32: Op("SubF32", 2),
  SubF64: Op("SubF64", 2),
  //
  // arg0 * arg1 ; sign-agnostic multiplication
  MulI8:  Op("MulI8",  2, {commutative: true}),
  MulI16: Op("MulI16", 2, {commutative: true}),
  MulI32: Op("MulI32", 2, {commutative: true}),
  MulI64: Op("MulI64", 2, {commutative: true}),
  MulF32: Op("MulF32", 2, {commutative: true}),
  MulF64: Op("MulF64", 2, {commutative: true}),
  //
  // arg0 / arg1 ; division
  DivS8:  Op("DivS8",  2), // signed (result is truncated toward zero)
  DivU8:  Op("DivU8",  2), // unsigned (result is floored)
  DivS16: Op("DivS16", 2),
  DivU16: Op("DivU16", 2),
  DivS32: Op("DivS32", 2),
  DivU32: Op("DivU32", 2),
  DivS64: Op("DivS64", 2),
  DivU64: Op("DivU64", 2),
  DivF32: Op("DivF32", 2),
  DivF64: Op("DivF64", 2),
  //
  // arg0 % arg1 ; remainder
  RemS8:  Op("RemS8",  2), // signed (result has the sign of the dividend)
  RemU8:  Op("RemU8",  2), // unsigned
  RemS16: Op("RemS16", 2),
  RemU16: Op("RemU16", 2),
  RemS32: Op("RemS32", 2),
  RemU32: Op("RemU32", 2),
  RemI64: Op("RemI64", 2),
  RemU64: Op("RemU64", 2),
  //
  // arg0 & arg1 ; sign-agnostic bitwise and
  AndI8:  Op("AndI8",  2, {commutative: true}),
  AndI16: Op("AndI16", 2, {commutative: true}),
  AndI32: Op("AndI32", 2, {commutative: true}),
  AndI64: Op("AndI64", 2, {commutative: true}),
  //
  // arg0 | arg1 ; sign-agnostic bitwise inclusive or
  OrI8:  Op("OrI8",  2, {commutative: true}),
  OrI16: Op("OrI16", 2, {commutative: true}),
  OrI32: Op("OrI32", 2, {commutative: true}),
  OrI64: Op("OrI64", 2, {commutative: true}),
  //
  // arg0 ^ arg1 ; sign-agnostic bitwise exclusive or
  XorI8:  Op("XorI8",  2, {commutative: true}),
  XorI16: Op("XorI16", 2, {commutative: true}),
  XorI32: Op("XorI32", 2, {commutative: true}),
  XorI64: Op("XorI64", 2, {commutative: true}),
  //
  // For shifts, AxB means the shifted value has A bits and the shift amount
  // has B bits.
  // Shift amounts are considered unsigned.
  // If arg1 is known to be less than the number of bits in arg0,
  // then aux may be set to 1.
  // According to the Go assembler, this enables better code generation
  // on some platforms.
  //
  // arg0 << arg1 ; sign-agnostic shift left
  ShLI8x8:   Op("ShLI8x8",   2, {aux: t_bool}),
  ShLI8x16:  Op("ShLI8x16",  2, {aux: t_bool}),
  ShLI8x32:  Op("ShLI8x32",  2, {aux: t_bool}),
  ShLI8x64:  Op("ShLI8x64",  2, {aux: t_bool}),
  ShLI16x8:  Op("ShLI16x8",  2, {aux: t_bool}),
  ShLI16x16: Op("ShLI16x16", 2, {aux: t_bool}),
  ShLI16x32: Op("ShLI16x32", 2, {aux: t_bool}),
  ShLI16x64: Op("ShLI16x64", 2, {aux: t_bool}),
  ShLI32x8:  Op("ShLI32x8",  2, {aux: t_bool}),
  ShLI32x16: Op("ShLI32x16", 2, {aux: t_bool}),
  ShLI32x32: Op("ShLI32x32", 2, {aux: t_bool}),
  ShLI32x64: Op("ShLI32x64", 2, {aux: t_bool}),
  ShLI64x8:  Op("ShLI64x8",  2, {aux: t_bool}),
  ShLI64x16: Op("ShLI64x16", 2, {aux: t_bool}),
  ShLI64x32: Op("ShLI64x32", 2, {aux: t_bool}),
  ShLI64x64: Op("ShLI64x64", 2, {aux: t_bool}),
  //
  // arg0 >> arg1 ; sign-replicating (arithmetic) shift right
  ShRS8x8:   Op("ShRS8x8",   2, {aux: t_bool}),
  ShRS8x16:  Op("ShRS8x16",  2, {aux: t_bool}),
  ShRS8x32:  Op("ShRS8x32",  2, {aux: t_bool}),
  ShRS8x64:  Op("ShRS8x64",  2, {aux: t_bool}),
  ShRS16x8:  Op("ShRS16x8",  2, {aux: t_bool}),
  ShRS16x16: Op("ShRS16x16", 2, {aux: t_bool}),
  ShRS16x32: Op("ShRS16x32", 2, {aux: t_bool}),
  ShRS16x64: Op("ShRS16x64", 2, {aux: t_bool}),
  ShRS32x8:  Op("ShRS32x8",  2, {aux: t_bool}),
  ShRS32x16: Op("ShRS32x16", 2, {aux: t_bool}),
  ShRS32x32: Op("ShRS32x32", 2, {aux: t_bool}),
  ShRS32x64: Op("ShRS32x64", 2, {aux: t_bool}),
  ShRS64x8:  Op("ShRS64x8",  2, {aux: t_bool}),
  ShRS64x16: Op("ShRS64x16", 2, {aux: t_bool}),
  ShRS64x32: Op("ShRS64x32", 2, {aux: t_bool}),
  ShRS64x64: Op("ShRS64x64", 2, {aux: t_bool}),
  //
  // arg0 >> arg1 (aka >>>) ; zero-replicating (logical) shift right
  ShRU8x8:   Op("ShRU8x8",   2, {aux: t_bool}),
  ShRU8x16:  Op("ShRU8x16",  2, {aux: t_bool}),
  ShRU8x32:  Op("ShRU8x32",  2, {aux: t_bool}),
  ShRU8x64:  Op("ShRU8x64",  2, {aux: t_bool}),
  ShRU16x8:  Op("ShRU16x8",  2, {aux: t_bool}),
  ShRU16x16: Op("ShRU16x16", 2, {aux: t_bool}),
  ShRU16x32: Op("ShRU16x32", 2, {aux: t_bool}),
  ShRU16x64: Op("ShRU16x64", 2, {aux: t_bool}),
  ShRU32x8:  Op("ShRU32x8",  2, {aux: t_bool}),
  ShRU32x16: Op("ShRU32x16", 2, {aux: t_bool}),
  ShRU32x32: Op("ShRU32x32", 2, {aux: t_bool}),
  ShRU32x64: Op("ShRU32x64", 2, {aux: t_bool}),
  ShRU64x8:  Op("ShRU64x8",  2, {aux: t_bool}),
  ShRU64x16: Op("ShRU64x16", 2, {aux: t_bool}),
  ShRU64x32: Op("ShRU64x32", 2, {aux: t_bool}),
  ShRU64x64: Op("ShRU64x64", 2, {aux: t_bool}),


  // 2-input comparisons
  //
  // arg0 == arg1 ; sign-agnostic compare equal
  EqI8:  Op("EqI8",  2, {commutative: true, typ: t_bool}),
  EqI16: Op("EqI16", 2, {commutative: true, typ: t_bool}),
  EqI32: Op("EqI32", 2, {commutative: true, typ: t_bool}),
  EqI64: Op("EqI64", 2, {commutative: true, typ: t_bool}),
  EqF32: Op("EqF32", 2, {commutative: true, typ: t_bool}),
  EqF64: Op("EqF64", 2, {commutative: true, typ: t_bool}),
  //
  // arg0 != arg1 ; sign-agnostic compare unequal
  NeqI8:  Op("NeqI8",  2, {commutative: true, typ: t_bool}),
  NeqI16: Op("NeqI16", 2, {commutative: true, typ: t_bool}),
  NeqI32: Op("NeqI32", 2, {commutative: true, typ: t_bool}),
  NeqI64: Op("NeqI64", 2, {commutative: true, typ: t_bool}),
  NeqF32: Op("NeqF32", 2, {commutative: true, typ: t_bool}),
  NeqF64: Op("NeqF64", 2, {commutative: true, typ: t_bool}),
  //
  // arg0 < arg1 ; less than
  LessS8:  Op("LessS8",  2, {typ: t_bool}), // signed
  LessU8:  Op("LessU8",  2, {typ: t_bool}), // unsigned
  LessS16: Op("LessS16", 2, {typ: t_bool}),
  LessU16: Op("LessU16", 2, {typ: t_bool}),
  LessS32: Op("LessS32", 2, {typ: t_bool}),
  LessU32: Op("LessU32", 2, {typ: t_bool}),
  LessS64: Op("LessS64", 2, {typ: t_bool}),
  LessU64: Op("LessU64", 2, {typ: t_bool}),
  LessF32: Op("LessF32", 2, {typ: t_bool}),
  LessF64: Op("LessF64", 2, {typ: t_bool}),
  //
  // arg0 <= arg1 ; less than or equal
  LeqS8:  Op("LeqS8",  2, {typ: t_bool}), // signed
  LeqU8:  Op("LeqU8",  2, {typ: t_bool}), // unsigned
  LeqS16: Op("LeqS16", 2, {typ: t_bool}),
  LeqU16: Op("LeqU16", 2, {typ: t_bool}),
  LeqS32: Op("LeqS32", 2, {typ: t_bool}),
  LeqU32: Op("LeqU32", 2, {typ: t_bool}),
  LeqS64: Op("LeqS64", 2, {typ: t_bool}),
  LeqU64: Op("LeqU64", 2, {typ: t_bool}),
  LeqF32: Op("LeqF32", 2, {typ: t_bool}),
  LeqF64: Op("LeqF64", 2, {typ: t_bool}),
  //
  // arg0 > arg1 ; greater than
  GreaterS8:  Op("GreaterS8",  2, {typ: t_bool}), // signed
  GreaterU8:  Op("GreaterU8",  2, {typ: t_bool}), // unsigned
  GreaterS16: Op("GreaterS16", 2, {typ: t_bool}),
  GreaterU16: Op("GreaterU16", 2, {typ: t_bool}),
  GreaterS32: Op("GreaterS32", 2, {typ: t_bool}),
  GreaterU32: Op("GreaterU32", 2, {typ: t_bool}),
  GreaterS64: Op("GreaterS64", 2, {typ: t_bool}),
  GreaterU64: Op("GreaterU64", 2, {typ: t_bool}),
  GreaterF32: Op("GreaterF32", 2, {typ: t_bool}),
  GreaterF64: Op("GreaterF64", 2, {typ: t_bool}),
  //
  // arg0 <= arg1 ; greater than or equal
  GeqS8:  Op("GeqS8",  2, {typ: t_bool}), // signed
  GeqU8:  Op("GeqU8",  2, {typ: t_bool}), // unsigned
  GeqS16: Op("GeqS16", 2, {typ: t_bool}),
  GeqU16: Op("GeqU16", 2, {typ: t_bool}),
  GeqS32: Op("GeqS32", 2, {typ: t_bool}),
  GeqU32: Op("GeqU32", 2, {typ: t_bool}),
  GeqS64: Op("GeqS64", 2, {typ: t_bool}),
  GeqU64: Op("GeqU64", 2, {typ: t_bool}),
  GeqF32: Op("GeqF32", 2, {typ: t_bool}),
  GeqF64: Op("GeqF64", 2, {typ: t_bool}),
  //
  // boolean ops (AndB and OrB are not shortcircuited)
  AndB: Op("AndB", 2, {commutative: true, typ: t_bool}), // arg0 && arg1
  OrB:  Op("OrB",  2, {commutative: true, typ: t_bool}), // arg0 || arg1
  EqB:  Op("EqB",  2, {commutative: true, typ: t_bool}), // arg0 == arg1
  NeqB: Op("NeqB", 2, {commutative: true, typ: t_bool}), // arg0 != arg1
  Not:  Op("Not",  1, {typ: t_bool}),                    // !arg0, boolean


  // min(arg0, arg1) ; max(arg0, arg1)
  MinF32: Op("MinF32", 2),
  MinF64: Op("MinF64", 2),
  MaxF32: Op("MaxF32", 2),
  MaxF64: Op("MaxF64", 2),

  // the type of a CondSelect is the same as the type of its first
  // two arguments, which should be register-width scalars; the third
  // argument should be a boolean.
  //
  // arg2 ? arg0 : arg1
  CondSelect: Op("CondSelect", 3),


  // 1-input ops
  //
  // -arg0 ; negation
  NegI8:  Op("NegI8",  1),
  NegI16: Op("NegI16", 1),
  NegI32: Op("NegI32", 1),
  NegI64: Op("NegI64", 1),
  NegF32: Op("NegF32", 1),
  NegF64: Op("NegF64", 1),
  //
  // Count trailing (low order) zeroes
  CtzI8:  Op("CtzI8",  1), // returns 0-8
  CtzI16: Op("CtzI16", 1), // returns 0-16
  CtzI32: Op("CtzI32", 1), // returns 0-32
  CtzI64: Op("CtzI64", 1), // returns 0-64
  //
  // same as above, but arg0 known to be non-zero
  CtzI8NonZero:  Op("CtzI8NonZero",  1), // returns 0-7
  CtzI16NonZero: Op("CtzI16NonZero", 1), // returns 0-15
  CtzI32NonZero: Op("CtzI32NonZero", 1), // returns 0-31
  CtzI64NonZero: Op("CtzI64NonZero", 1), // returns 0-63
  //
  // Number of bits in arg0
  BitLen8:  Op("BitLen8",  1), // returns 0-8
  BitLen16: Op("BitLen16", 1), // returns 0-16
  BitLen32: Op("BitLen32", 1), // returns 0-32
  BitLen64: Op("BitLen64", 1), // returns 0-64
  //
  // Swap bytes
  // Op("Bswap32", 1)
  // Op("Bswap64", 1) // Swap bytes
  //
  // Reverse the bits in arg0
  // Op("BitRev8", 1)  
  // Op("BitRev16", 1) // Reverse the bits in arg0
  // Op("BitRev32", 1) // Reverse the bits in arg0
  // Op("BitRev64", 1) // Reverse the bits in arg0
  //
  // sign-agnostic count number of one bits in arg0
  PopCountI8:  Op("PopCountI8",  1),
  PopCountI16: Op("PopCountI16", 1),
  PopCountI32: Op("PopCountI32", 1),
  PopCountI64: Op("PopCountI64", 1),
  //
  // Square root
  // Special cases:
  //   +∞  → +∞
  //   ±0  → ±0 (sign preserved)
  //   x<0 → NaN
  //   NaN → NaN
  SqrtF32: Op("SqrtF32", 1), // √arg0
  SqrtF64: Op("SqrtF64", 1), // √arg0
  //
  // Round to integer
  // Special cases:
  //   ±∞  → ±∞ (sign preserved)
  //   ±0  → ±0 (sign preserved)
  //   NaN → NaN
  FloorF32: Op("FloorF32", 1), // round arg0 toward -∞
  FloorF64: Op("FloorF64", 1),
  CeilF32:  Op("CeilF32", 1),   // round arg0 toward +∞
  CeilF64:  Op("CeilF64", 1),
  TruncF32: Op("TruncF32", 1), // round arg0 toward 0
  TruncF64: Op("TruncF64", 1),
  RoundF32: Op("RoundF32", 1), // round arg0 to nearest, ties away from 0
  RoundF64: Op("RoundF64", 1),
  //
  // round arg0 to nearest, ties to even
  RoundToEvenF32: Op("RoundToEvenF32", 1),
  RoundToEvenF64: Op("RoundToEvenF64", 1),
  //
  // Modify the sign bit
  AbsF32: Op("AbsF32", 1), // absolute value arg0
  AbsF64: Op("AbsF64", 1),
  CopysignF32: Op("CopysignF32", 2), // copy sign from arg0 to arg1
  CopysignF64: Op("CopysignF64", 2),


  // Conversions
  //
  // signed extensions
  SignExtI8to16:  Op("SignExtS8to16",  1, {typ: t_i16}), // i8  -> i16
  SignExtI8to32:  Op("SignExtS8to32",  1, {typ: t_i32}), // i8  -> i32
  SignExtI8to64:  Op("SignExtS8to64",  1, {typ: t_i64}), // i8  -> i64
  SignExtI16to32: Op("SignExtS16to32", 1, {typ: t_i32}), // i16 -> i32
  SignExtI16to64: Op("SignExtS16to64", 1, {typ: t_i64}), // i16 -> i64
  SignExtI32to64: Op("SignExtS32to64", 1, {typ: t_i64}), // i32 -> i64
  //
  // zero (unsigned) extensions
  ZeroExtI8to16:  Op("ZeroExtU8to16",  1, {typ: t_u16}), // u8  -> u16
  ZeroExtI8to32:  Op("ZeroExtU8to32",  1, {typ: t_u32}), // u8  -> u32
  ZeroExtI8to64:  Op("ZeroExtU8to64",  1, {typ: t_u64}), // u8  -> u64
  ZeroExtI16to32: Op("ZeroExtU16to32", 1, {typ: t_u32}), // u16 -> u32
  ZeroExtI16to64: Op("ZeroExtU16to64", 1, {typ: t_u64}), // u16 -> u64
  ZeroExtI32to64: Op("ZeroExtU32to64", 1, {typ: t_u64}), // u32 -> u64
  //
  // truncations
  TruncI16to8:  Op("TruncI16to8",  1), // i16 -> i8  ; u16 -> u8
  TruncI32to8:  Op("TruncI32to8",  1), // i32 -> i8  ; u32 -> u8
  TruncI32to16: Op("TruncI32to16", 1), // i32 -> i16 ; u32 -> u16
  TruncI64to8:  Op("TruncI64to8",  1), // i64 -> i8  ; u64 -> u8
  TruncI64to16: Op("TruncI64to16", 1), // i64 -> i16 ; u64 -> u16
  TruncI64to32: Op("TruncI64to32", 1), // i64 -> i32 ; u64 -> u32
  //
  // conversions
  ConvI32toF32: Op("ConvI32toF32", 1), // i32 -> f32
  ConvI32toF64: Op("ConvI32toF64", 1), // i32 -> f64
  ConvI64toF32: Op("ConvI64toF32", 1), // i64 -> f32
  ConvI64toF64: Op("ConvI64toF64", 1), // i64 -> f64
  ConvF32toI32: Op("ConvF32toI32", 1), // f32 -> i32
  ConvF32toI64: Op("ConvF32toI64", 1), // f32 -> i64
  ConvF64toI32: Op("ConvF64toI32", 1), // f64 -> i32
  ConvF64toI64: Op("ConvF64toI64", 1), // f64 -> i64
  ConvF32toF64: Op("ConvF32toF64", 1), // f32 -> f64
  ConvF64toF32: Op("ConvF64toF32", 1), // f64 -> f32
  //
  // conversions only used on 32-bit arch
  ConvU32toF32: Op("ConvU32toF32", 1), // u32 -> f32
  ConvU32toF64: Op("ConvU32toF64", 1), // u32 -> f64
  ConvF32toU32: Op("ConvF32toU32", 1), // f32 -> u32
  ConvF64toU32: Op("ConvF64toU32", 1), // f64 -> u32
  //
  // conversions only used on archs that has the instruction
  ConvU64toF32: Op("ConvU64toF32", 1), // u64 -> f32
  ConvU64toF64: Op("ConvU64toF64", 1), // u64 -> f64
  ConvF32toU64: Op("ConvF32toU64", 1), // f32 -> u64
  ConvF64toU64: Op("ConvF64toU64", 1), // f64 -> u64


  // Atomic operations used for semantically inlining runtime/internal/atomic.
  // Atomic loads return a new memory so that the loads are properly ordered
  // with respect to other loads and stores.
  //
  AtomicLoad32: Op("AtomicLoad32", 2, {/*typ: "(UInt32,Mem)"*/}),
    // Load from arg0.  arg1=memory.  Returns loaded value and new memory.
  AtomicLoad64: Op("AtomicLoad64", 2, {/*typ: "(UInt64,Mem)"*/}),
    // Load from arg0.  arg1=memory.  Returns loaded value and new memory.
  AtomicLoadPtr: Op("AtomicLoadPtr", 2, {/*typ: "(BytePtr,Mem)"*/}),
    // Load from arg0.  arg1=memory.  Returns loaded value and new memory.
  AtomicStore32: Op("AtomicStore32", 3, {/*typ: "Mem",*/hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.  Returns memory.
  AtomicStore64: Op("AtomicStore64", 3, {/*typ: "Mem",*/hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.  Returns memory.
  AtomicStorePtrNoWB: Op("AtomicStorePtrNoWB", 3,
    {typ: t_addr, hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.  Returns memory.
  AtomicExchange32: Op("AtomicExchange32", 3,
    {/*typ: "(UInt32,Mem)",*/hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.
    // Returns old contents of *arg0 and new memory.
  AtomicExchange64: Op("AtomicExchange64", 3,
    {/*typ: "(UInt64,Mem)",*/hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.
    // Returns old contents of *arg0 and new memory.
  AtomicAdd32: Op("AtomicAdd32", 3,
    {/*typ: "(UInt32,Mem)",*/hasSideEffects: true}),
    // Do *arg0 += arg1.  arg2=memory.  Returns sum and new memory.
  AtomicAdd64: Op("AtomicAdd64", 3,
    {/*typ: "(UInt64,Mem)",*/hasSideEffects: true}),
    // Do *arg0 += arg1.  arg2=memory.  Returns sum and new memory.
  AtomicCompareAndSwap32: Op("AtomicCompareAndSwap32", 4,
    {/*typ: "(Bool,Mem)",*/hasSideEffects: true}),
    // if *arg0==arg1, then set *arg0=arg2.
    // Returns true iff store happens and new memory.
  AtomicCompareAndSwap64: Op("AtomicCompareAndSwap64", 4,
    {/*typ: "(Bool,Mem)",*/hasSideEffects: true}),
    // if *arg0==arg1, then set *arg0=arg2.
    // Returns true if store happens and new memory.
  AtomicAnd8: Op("AtomicAnd8", 3, {typ: t_addr, hasSideEffects: true}),
    // *arg0 &= arg1.  arg2=memory.  Returns memory.
  AtomicOr8: Op("AtomicOr8", 3, {typ: t_addr, hasSideEffects: true}),
  // *arg0 |= arg1.  arg2=memory.  Returns memory.

} // end `const op`

// Instruction set borrowed from
// go/src/cmd/compile/internal/ssa/gen/genericOps.go
