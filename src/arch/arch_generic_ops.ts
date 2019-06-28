//
// describes generic operations
//
import {
  ArchDescr,
  t, // types
  OpDescription,
  ZeroWidth,
  Constant,
  Commutative,
  ResultInArg0,
  ResultNotInArgs,
  Rematerializeable,
  ClobberFlags,
  Call,
  NilCheck,
  FaultOnNilArg0,
  FaultOnNilArg1,
  UsesScratch,
  HasSideEffects,
  Generic,
} from "./describe"
import { emptyRegSet } from "../ir/reg"

const ops :OpDescription[] = [

  // special
  ["Invalid"],
  ["Unknown"], // Unknown value. Used for Values whose values don't matter because they are dead code.
  ["Phi", -1, ZeroWidth], // select an argument based on which predecessor block we came from
  ["Copy", 1],  // output = arg0
  ["Arg", ZeroWidth, {aux: "Int32"}], // argument to current function. aux=position.
  ["CallArg", 1, ZeroWidth], // argument for function call
  ["NilCheck", 2, NilCheck, FaultOnNilArg0], // panic if arg0 is nil. arg1=mem.

  // function calls
  // Arguments to the call have already been written to the stack.
  // Return values appear on the stack.
  ["Call", 1, Call, {aux: "Int64"}], // call function
  ["TailCall", 1, Call, {aux: "Int64"}], // call function
  // ["ClosureCall", 3, Call, {aux: "Int64"}] // arg0=code pointer, arg1=context ptr, arg2=memory.  aux=arg size.
  // ["ICall", 2, Call, {aux: "Int64"}] // interface call.  arg0=code pointer, arg1=memory, aux=arg size.


  // constants
  // Constant values are stored in the aux field.
  ["ConstBool", Constant, {aux: "Bool"}], // aux is 0=false, 1=true
  ["ConstI8",   0, Constant, {aux: "Int8"}], // aux is sign-extended 8 bits
  ["ConstI16",  0, Constant, {aux: "Int16"}], // aux is sign-extended 16 bits
  ["ConstI32",  0, Constant, {aux: "Int32"}], // aux is sign-extended 32 bits
  ["ConstI64", Constant, {aux: "Int64"}], // aux is Int64
  ["ConstF32", Constant, {aux: "Int32"}],
  ["ConstF64", Constant, {aux: "Int64"}],
  ["ConstString", {aux: "String"}], // value is aux (string)


  // stack
  ["SP", ZeroWidth], // stack pointer
    // The SP pseudo-register is a virtual stack pointer used to refer
    // to frame-local variables and the arguments being prepared for
    // function calls. It points to the top of the local stack frame,
    // so references should use negative offsets in the range
    // [−framesize, 0): x-8(SP), y-4(SP), and so on.
  ["SB", ZeroWidth, t.usize],
    // static base pointer (a.k.a. globals pointer)
    // SB is a pseudo-register that holds the "static base" pointer,
    // i.e. the address of the beginning of the program address space.


  // memory
  ["Load", 2],          // Load from arg0. arg1=addr
  ["Store", 3, t.addr], // Store arg1 to arg0.  arg2=addr, aux=type
  ["Move", 3, t.addr],  // arg0=destptr, arg1=srcptr, arg2=addr, aux=type
  ["Zero", 2, t.addr],  // arg0=destptr, arg1=addr, auxInt=size, aux=type

  // resgiter allocation spill and restore
  ["StoreReg", 1],
  ["LoadReg", 1],


  // 2-input arithmetic
  // Types must be consistent with typing.
  // Add, for example, must take two values of the same type and produces that
  // same type
  //
  // arg0 + arg1 ; sign-agnostic addition
  ["AddI8",  2, Commutative, ResultInArg0],
  ["AddI16", 2, Commutative, ResultInArg0],
  ["AddI32", 2, Commutative, ResultInArg0],
  ["AddI64", 2, Commutative, ResultInArg0],
  ["AddF32", 2, Commutative, ResultInArg0],
  ["AddF64", 2, Commutative, ResultInArg0],
  //
  // arg0 - arg1 ; sign-agnostic subtraction
  ["SubI8",  2, ResultInArg0],
  ["SubI16", 2, ResultInArg0],
  ["SubI32", 2, ResultInArg0],
  ["SubI64", 2, ResultInArg0],
  ["SubF32", 2, ResultInArg0],
  ["SubF64", 2, ResultInArg0],
  //
  // arg0 * arg1 ; sign-agnostic multiplication
  ["MulI8",  2, Commutative, ResultInArg0],
  ["MulI16", 2, Commutative, ResultInArg0],
  ["MulI32", 2, Commutative, ResultInArg0],
  ["MulI64", 2, Commutative, ResultInArg0],
  ["MulF32", 2, Commutative, ResultInArg0],
  ["MulF64", 2, Commutative, ResultInArg0],
  //
  // arg0 / arg1 ; division
  ["DivS8",  2, ResultInArg0], // signed (result is truncated toward zero)
  ["DivU8",  2, ResultInArg0], // unsigned (result is floored)
  ["DivS16", 2, ResultInArg0],
  ["DivU16", 2, ResultInArg0],
  ["DivS32", 2, ResultInArg0],
  ["DivU32", 2, ResultInArg0],
  ["DivS64", 2, ResultInArg0],
  ["DivU64", 2, ResultInArg0],
  ["DivF32", 2, ResultInArg0],
  ["DivF64", 2, ResultInArg0],
  //
  // arg0 % arg1 ; remainder
  ["RemS8",  2, ResultInArg0], // signed (result has the sign of the dividend)
  ["RemU8",  2, ResultInArg0], // unsigned
  ["RemS16", 2, ResultInArg0],
  ["RemU16", 2, ResultInArg0],
  ["RemS32", 2, ResultInArg0],
  ["RemU32", 2, ResultInArg0],
  ["RemI64", 2, ResultInArg0],
  ["RemU64", 2, ResultInArg0],
  //
  // arg0 & arg1 ; sign-agnostic bitwise and
  ["AndI8",  2, Commutative, ResultInArg0],
  ["AndI16", 2, Commutative, ResultInArg0],
  ["AndI32", 2, Commutative, ResultInArg0],
  ["AndI64", 2, Commutative, ResultInArg0],
  //
  // arg0 | arg1 ; sign-agnostic bitwise inclusive or
  ["OrI8",  2, Commutative, ResultInArg0],
  ["OrI16", 2, Commutative, ResultInArg0],
  ["OrI32", 2, Commutative, ResultInArg0],
  ["OrI64", 2, Commutative, ResultInArg0],
  //
  // arg0 ^ arg1 ; sign-agnostic bitwise exclusive or
  ["XorI8",  2, Commutative, ResultInArg0],
  ["XorI16", 2, Commutative, ResultInArg0],
  ["XorI32", 2, Commutative, ResultInArg0],
  ["XorI64", 2, Commutative, ResultInArg0],
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
  ["ShLI8x8",   2, {aux: "Bool"}],
  ["ShLI8x16",  2, {aux: "Bool"}],
  ["ShLI8x32",  2, {aux: "Bool"}],
  ["ShLI8x64",  2, {aux: "Bool"}],
  ["ShLI16x8",  2, {aux: "Bool"}],
  ["ShLI16x16", 2, {aux: "Bool"}],
  ["ShLI16x32", 2, {aux: "Bool"}],
  ["ShLI16x64", 2, {aux: "Bool"}],
  ["ShLI32x8",  2, {aux: "Bool"}],
  ["ShLI32x16", 2, {aux: "Bool"}],
  ["ShLI32x32", 2, {aux: "Bool"}],
  ["ShLI32x64", 2, {aux: "Bool"}],
  ["ShLI64x8",  2, {aux: "Bool"}],
  ["ShLI64x16", 2, {aux: "Bool"}],
  ["ShLI64x32", 2, {aux: "Bool"}],
  ["ShLI64x64", 2, {aux: "Bool"}],
  //
  // arg0 >> arg1 ; sign-replicating (arithmetic) shift right
  ["ShRS8x8",   2, {aux: "Bool"}],
  ["ShRS8x16",  2, {aux: "Bool"}],
  ["ShRS8x32",  2, {aux: "Bool"}],
  ["ShRS8x64",  2, {aux: "Bool"}],
  ["ShRS16x8",  2, {aux: "Bool"}],
  ["ShRS16x16", 2, {aux: "Bool"}],
  ["ShRS16x32", 2, {aux: "Bool"}],
  ["ShRS16x64", 2, {aux: "Bool"}],
  ["ShRS32x8",  2, {aux: "Bool"}],
  ["ShRS32x16", 2, {aux: "Bool"}],
  ["ShRS32x32", 2, {aux: "Bool"}],
  ["ShRS32x64", 2, {aux: "Bool"}],
  ["ShRS64x8",  2, {aux: "Bool"}],
  ["ShRS64x16", 2, {aux: "Bool"}],
  ["ShRS64x32", 2, {aux: "Bool"}],
  ["ShRS64x64", 2, {aux: "Bool"}],
  //
  // arg0 >> arg1 (aka >>>) ; zero-replicating (logical) shift right
  ["ShRU8x8",   2, {aux: "Bool"}],
  ["ShRU8x16",  2, {aux: "Bool"}],
  ["ShRU8x32",  2, {aux: "Bool"}],
  ["ShRU8x64",  2, {aux: "Bool"}],
  ["ShRU16x8",  2, {aux: "Bool"}],
  ["ShRU16x16", 2, {aux: "Bool"}],
  ["ShRU16x32", 2, {aux: "Bool"}],
  ["ShRU16x64", 2, {aux: "Bool"}],
  ["ShRU32x8",  2, {aux: "Bool"}],
  ["ShRU32x16", 2, {aux: "Bool"}],
  ["ShRU32x32", 2, {aux: "Bool"}],
  ["ShRU32x64", 2, {aux: "Bool"}],
  ["ShRU64x8",  2, {aux: "Bool"}],
  ["ShRU64x16", 2, {aux: "Bool"}],
  ["ShRU64x32", 2, {aux: "Bool"}],
  ["ShRU64x64", 2, {aux: "Bool"}],


  // 2-input comparisons
  //
  // arg0 == arg1 ; sign-agnostic compare equal
  ["EqI8",  2, Commutative, t.bool],
  ["EqI16", 2, Commutative, t.bool],
  ["EqI32", 2, Commutative, t.bool],
  ["EqI64", 2, Commutative, t.bool],
  ["EqF32", 2, Commutative, t.bool],
  ["EqF64", 2, Commutative, t.bool],
  //
  // arg0 != arg1 ; sign-agnostic compare unequal
  ["NeqI8",  2, Commutative, t.bool],
  ["NeqI16", 2, Commutative, t.bool],
  ["NeqI32", 2, Commutative, t.bool],
  ["NeqI64", 2, Commutative, t.bool],
  ["NeqF32", 2, Commutative, t.bool],
  ["NeqF64", 2, Commutative, t.bool],
  //
  // arg0 < arg1 ; less than
  ["LessS8",  2, t.bool], // signed
  ["LessU8",  2, t.bool], // unsigned
  ["LessS16", 2, t.bool],
  ["LessU16", 2, t.bool],
  ["LessS32", 2, t.bool],
  ["LessU32", 2, t.bool],
  ["LessS64", 2, t.bool],
  ["LessU64", 2, t.bool],
  ["LessF32", 2, t.bool],
  ["LessF64", 2, t.bool],
  //
  // arg0 <= arg1 ; less than or equal
  ["LeqS8",  2, t.bool], // signed
  ["LeqU8",  2, t.bool], // unsigned
  ["LeqS16", 2, t.bool],
  ["LeqU16", 2, t.bool],
  ["LeqS32", 2, t.bool],
  ["LeqU32", 2, t.bool],
  ["LeqS64", 2, t.bool],
  ["LeqU64", 2, t.bool],
  ["LeqF32", 2, t.bool],
  ["LeqF64", 2, t.bool],
  //
  // arg0 > arg1 ; greater than
  ["GreaterS8",  2, t.bool], // signed
  ["GreaterU8",  2, t.bool], // unsigned
  ["GreaterS16", 2, t.bool],
  ["GreaterU16", 2, t.bool],
  ["GreaterS32", 2, t.bool],
  ["GreaterU32", 2, t.bool],
  ["GreaterS64", 2, t.bool],
  ["GreaterU64", 2, t.bool],
  ["GreaterF32", 2, t.bool],
  ["GreaterF64", 2, t.bool],
  //
  // arg0 <= arg1 ; greater than or equal
  ["GeqS8",  2, t.bool], // signed
  ["GeqU8",  2, t.bool], // unsigned
  ["GeqS16", 2, t.bool],
  ["GeqU16", 2, t.bool],
  ["GeqS32", 2, t.bool],
  ["GeqU32", 2, t.bool],
  ["GeqS64", 2, t.bool],
  ["GeqU64", 2, t.bool],
  ["GeqF32", 2, t.bool],
  ["GeqF64", 2, t.bool],
  //
  // boolean ops (AndB and OrB are not shortcircuited)
  // ["AndB", 2, Commutative, t.bool], // arg0 && arg1
  // ["OrB",  2, Commutative, t.bool], // arg0 || arg1
  // ["EqB",  2, Commutative, t.bool], // arg0 == arg1
  // ["NeqB", 2, Commutative, t.bool], // arg0 != arg1
  ["Not", 1, t.bool],                    // !arg0, boolean


  // min(arg0, arg1) ; max(arg0, arg1)
  ["MinF32", 2],
  ["MinF64", 2],
  ["MaxF32", 2],
  ["MaxF64", 2],

  // CondSelect is a conditional MOVE (register to register.)
  //
  // The type of a CondSelect is the same as the type of its first
  // two arguments, which should be register-width scalars; the third
  // argument should be a boolean.
  //
  // Placed during optimization by branchelim
  //
  // arg2 ? arg0 : arg1
  // ["CondSelect", 3],


  // 1-input ops
  //
  // -arg0 ; negation
  ["NegI8",  1],
  ["NegI16", 1],
  ["NegI32", 1],
  ["NegI64", 1],
  ["NegF32", 1],
  ["NegF64", 1],
  //
  // Count trailing (low order) zeroes
  ["CtzI8",  1], // returns 0-8
  ["CtzI16", 1], // returns 0-16
  ["CtzI32", 1], // returns 0-32
  ["CtzI64", 1], // returns 0-64
  //
  // same as above, but arg0 known to be non-zero
  ["CtzI8NonZero",  1], // returns 0-7
  ["CtzI16NonZero", 1], // returns 0-15
  ["CtzI32NonZero", 1], // returns 0-31
  ["CtzI64NonZero", 1], // returns 0-63
  //
  // Number of bits in arg0
  ["BitLen8",  1], // returns 0-8
  ["BitLen16", 1], // returns 0-16
  ["BitLen32", 1], // returns 0-32
  ["BitLen64", 1], // returns 0-64
  //
  // Swap bytes
  // ["Bswap32", 1],
  // ["Bswap64", 1], // Swap bytes
  //
  // Reverse the bits in arg0
  // ["BitRev8",  1],
  // ["BitRev16", 1], // Reverse the bits in arg0
  // ["BitRev32", 1], // Reverse the bits in arg0
  // ["BitRev64", 1], // Reverse the bits in arg0
  //
  // sign-agnostic count number of one bits in arg0
  ["PopCountI8",  1],
  ["PopCountI16", 1],
  ["PopCountI32", 1],
  ["PopCountI64", 1],
  //
  // Square root
  // Special cases:
  //   +∞  → +∞
  //   ±0  → ±0 (sign preserved)
  //   x<0 → NaN
  //   NaN → NaN
  ["SqrtF32", 1], // √arg0
  ["SqrtF64", 1], // √arg0
  //
  // Round to integer
  // Special cases:
  //   ±∞  → ±∞ (sign preserved)
  //   ±0  → ±0 (sign preserved)
  //   NaN → NaN
  ["FloorF32", 1], // round arg0 toward -∞
  ["FloorF64", 1],
  ["CeilF32", 1],   // round arg0 toward +∞
  ["CeilF64", 1],
  ["TruncF32", 1], // round arg0 toward 0
  ["TruncF64", 1],
  ["RoundF32", 1], // round arg0 to nearest, ties away from 0
  ["RoundF64", 1],
  //
  // round arg0 to nearest, ties to even
  ["RoundToEvenF32", 1],
  ["RoundToEvenF64", 1],
  //
  // Modify the sign bit
  ["AbsF32", 1], // absolute value arg0
  ["AbsF64", 1],
  ["CopysignF32", 2], // copy sign from arg0 to arg1
  ["CopysignF64", 2],


  // Conversions
  //
  // signed extensions
  ["SignExtI8to16",  1, t.i16], // i8  -> i16
  ["SignExtI8to32",  1, t.i32], // i8  -> i32
  ["SignExtI8to64",  1, t.i64], // i8  -> i64
  ["SignExtI16to32", 1, t.i32], // i16 -> i32
  ["SignExtI16to64", 1, t.i64], // i16 -> i64
  ["SignExtI32to64", 1, t.i64], // i32 -> i64
  //
  // zero (unsigned) extensions
  ["ZeroExtI8to16",  1, t.u16], // u8  -> u16
  ["ZeroExtI8to32",  1, t.u32], // u8  -> u32
  ["ZeroExtI8to64",  1, t.u64], // u8  -> u64
  ["ZeroExtI16to32", 1, t.u32], // u16 -> u32
  ["ZeroExtI16to64", 1, t.u64], // u16 -> u64
  ["ZeroExtI32to64", 1, t.u64], // u32 -> u64
  //
  // truncations to bool
  ["TruncI8toBool",  1, t.bool],
  ["TruncI16toBool", 1, t.bool],
  ["TruncI32toBool", 1, t.bool],
  ["TruncI64toBool", 1, t.bool],
  ["TruncF32toBool", 1, t.bool],
  ["TruncF64toBool", 1, t.bool],
  //
  // truncations
  ["TruncI16to8",  1], // i16 -> i8  ; u16 -> u8
  ["TruncI32to8",  1], // i32 -> i8  ; u32 -> u8
  ["TruncI32to16", 1], // i32 -> i16 ; u32 -> u16
  ["TruncI64to8",  1], // i64 -> i8  ; u64 -> u8
  ["TruncI64to16", 1], // i64 -> i16 ; u64 -> u16
  ["TruncI64to32", 1], // i64 -> i32 ; u64 -> u32
  //
  // conversions
  ["ConvI32toF32", 1, t.f32], // i32 -> f32
  ["ConvI32toF64", 1, t.f64], // i32 -> f64
  ["ConvI64toF32", 1, t.f32], // i64 -> f32
  ["ConvI64toF64", 1, t.f64], // i64 -> f64
  ["ConvF32toI32", 1, t.i32], // f32 -> i32
  ["ConvF32toI64", 1, t.i64], // f32 -> i64
  ["ConvF64toI32", 1, t.i32], // f64 -> i32
  ["ConvF64toI64", 1, t.i64], // f64 -> i64
  ["ConvF32toF64", 1, t.f64], // f32 -> f64
  ["ConvF64toF32", 1, t.f32], // f64 -> f32
  //
  // conversions only used on 32-bit arch
  ["ConvU32toF32", 1, t.f32], // u32 -> f32
  ["ConvU32toF64", 1, t.f64], // u32 -> f64
  ["ConvF32toU32", 1, t.u32], // f32 -> u32
  ["ConvF64toU32", 1, t.u32], // f64 -> u32
  //
  // conversions only used on archs that has the instruction
  ["ConvU64toF32", 1, t.f32], // u64 -> f32
  ["ConvU64toF64", 1, t.f64], // u64 -> f64
  ["ConvF32toU64", 1, t.u64], // f32 -> u64
  ["ConvF64toU64", 1, t.u64], // f64 -> u64


  // Atomic operations used for semantically inlining runtime/internal/atomic.
  // Atomic loads return a new memory so that the loads are properly ordered
  // with respect to other loads and stores.
  //
  ["AtomicLoad32", 2, /*{type: "(UInt32,Mem)"}*/], // Load from arg0.  arg1=memory.  Returns loaded value and new memory.
  ["AtomicLoad64", 2, /*{type: "(UInt64,Mem)"}*/], // Load from arg0.  arg1=memory.  Returns loaded value and new memory.
  ["AtomicLoadPtr", 2, /*{type: "(BytePtr,Mem)"}*/], // Load from arg0.  arg1=memory.  Returns loaded value and new memory.
  ["AtomicStore32", 3, HasSideEffects /*{type: "Mem"}*/], // Store arg1 to *arg0.  arg2=memory.  Returns memory.
  ["AtomicStore64", 3, HasSideEffects /*{type: "Mem"}*/], // Store arg1 to *arg0.  arg2=memory.  Returns memory.
  ["AtomicStorePtrNoWB", 3, HasSideEffects, t.addr], // Store arg1 to *arg0.  arg2=memory.  Returns memory.
  ["AtomicExchange32", 3, HasSideEffects /*{type: "(UInt32,Mem)"}*/], // Store arg1 to *arg0.  arg2=memory. Returns old contents of *arg0 and new memory.
  ["AtomicExchange64", 3, HasSideEffects /*{type: "(UInt64,Mem)"}*/], // Store arg1 to *arg0.  arg2=memory. Returns old contents of *arg0 and new memory.
  ["AtomicAdd32", 3, HasSideEffects /*{type: "(UInt32,Mem)"}*/], // Do *arg0 += arg1.  arg2=memory.  Returns sum and new memory.
  ["AtomicAdd64", 3, HasSideEffects /*{type: "(UInt64,Mem)"}*/], // Do *arg0 += arg1.  arg2=memory.  Returns sum and new memory.
  ["AtomicCompareAndSwap32", 4, HasSideEffects /*{type: "(Bool,Mem)"}*/], // if *arg0==arg1, then set *arg0=arg2. Returns true if store happens and new memory.
  ["AtomicCompareAndSwap64", 4, HasSideEffects /*{type: "(Bool,Mem)"}*/], // if *arg0==arg1, then set *arg0=arg2. Returns true if store happens and new memory.
  ["AtomicAnd8", 3, HasSideEffects, t.addr], // *arg0 &= arg1.  arg2=memory.  Returns memory.
  ["AtomicOr8", 3, HasSideEffects, t.addr], // *arg0 |= arg1.  arg2=memory.  Returns memory.

].map(d => {
  // add generic flag to all generic ops
  ;(d as any as any[]).push(Generic)
  return d
})


export default {
  arch:      "generic",
  ops,
  addrSize:  4,
  regSize:   4,
  intSize:   4,
  registers: [],
  hasGReg:   false,
  gpRegMask: emptyRegSet,
  fpRegMask: emptyRegSet,
} as ArchDescr
