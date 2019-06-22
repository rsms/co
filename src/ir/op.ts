import { NativeType, BasicType } from '../types'
import { RegSet, emptyRegSet } from './reg'
import {
  t_bool,
  t_u8,
  t_u16,
  t_i16,
  t_u32,
  t_i32,
  t_u64,
  t_i64,
  t_usize,
  t_addr,
  t_f32,
  t_f64,
} from "../types"
// export * from "../arch/ops"


// Strategy borrowed from
//   go/src/cmd/compile/internal/ssa/op.go
//
// Instruction set inspired by
//   go/src/cmd/compile/internal/ssa/gen/genericOps.go
//


interface RegInfoEntry {
  idx  :int    // index in Args array
  regs :RegSet // allowed input registers
}

export class RegInfo {
  inputs   :RegInfoEntry[]  // allowed input registers
  outputs  :RegInfoEntry[]  // allowed output registers
  clobbers :RegSet

  constructor(
    inputs   :RegSet[] = [],
    outputs  :RegSet[] = [],
    clobbers :RegSet = emptyRegSet
  ) {
    this.inputs = inputs.map((regs, idx) => ({ idx, regs }))
    this.outputs = outputs.map((regs, idx) => ({ idx, regs }))
    this.clobbers = clobbers
  }

  // inputs and outputs are ordered in register allocation order
}


// A SymEffect describes the effect that an SSA Value has on the variable
// identified by the symbol in its aux field.
export enum SymEffect {
  None = 0,

  Read = 1,
  Write = 2,
  Addr = 4,

  ReadWrite = 1 | 2,  // Read | Write
}


export interface OpInfo {
  name: string // printed name
  argLen: int // number of arguments, if -1, then this operation has a variable number of arguments

  type? :BasicType // default result type
  aux?  :NativeType // type of aux field

  constant? :bool // true if the value is a constant. Value in aux
  commutative? :bool // this operation is commutative on its first 2 arguments (e.g. addition)
  resultInArg0? :bool // (first, if a tuple) output of v and v.Args[0] must be allocated to the same register
  resultNotInArgs? :bool // outputs must not be allocated to the same registers as inputs
  rematerializeable? :bool // whether a register allocator can recompute a value instead of spilling/restoring it.
  clobberFlags? :bool // this op clobbers flags register
  call? :bool         // is a function call
  nilCheck? :bool     // this op is a nil check on arg0
  faultOnNilArg0? :bool // this op will fault if arg0 is nil (and aux encodes a small offset)
  faultOnNilArg1? :bool // this op will fault if arg1 is nil (and aux encodes a small offset)
  usesScratch? :bool  // this op requires scratch memory space
  hasSideEffects? :bool // for "reasons", not to be eliminated.  E.g., atomic store.
  zeroWidth? :bool // op never translates into any machine code.
                   // example: copy, which may sometimes translate to machine code, is not zero-width.
  generic? :bool   // true if generic op

  symEffect? :SymEffect // effect this op has on symbol in aux
  reg? :RegInfo
  // asm? :string // Asm
}


export class Op {
  name: string // printed name
  argLen: int
  type = null as BasicType|null // default result type
  aux = null as NativeType|null // type of aux field
    // number of arguments, if -1, then this operation has a variable number
    // of arguments
  constant = false as bool // true if the value is a constant. Value in aux
  commutative = false as bool
    // this operation is commutative on its first 2 arguments (e.g. addition)
  resultInArg0 = false as bool
    // (first, if a tuple) output of v and v.Args[0] must be allocated to the
    // same register
  resultNotInArgs = false as bool
    // outputs must not be allocated to the same registers as inputs
  rematerializeable = false as bool
    // whether a register allocator can recompute a value instead of
    // spilling/restoring it.
  clobberFlags = false as bool // this op clobbers flags register
  call = false as bool         // is a function call
  nilCheck = false as bool     // this op is a nil check on arg0
  faultOnNilArg0 = false as bool
    // this op will fault if arg0 is nil (and aux encodes a small offset)
  faultOnNilArg1 = false as bool
    // this op will fault if arg1 is nil (and aux encodes a small offset)
  usesScratch = false as bool  // this op requires scratch memory space
  hasSideEffects = false as bool
    // for "reasons", not to be eliminated.  E.g., atomic store.
  zeroWidth = false as bool
    // op never translates into any machine code. example: copy, which may
    // sometimes translate to machine code, is not zero-width.
  symEffect = SymEffect.None as SymEffect
    // effect this op has on symbol in aux
  // asm = "" // ObjAs
  reg = new RegInfo()

  constructor(name :string, argLen :int, props? :Partial<Op>) {
    if (props) for (let k in props) {
      ;(this as any)[k] = (props as any)[k]
    }
    this.name = name
    this.argLen = argLen || 0
  }

  toString() :string {
    return this.name
  }
}


function op(name :string, argLen :int, props? :Partial<Op>) :Op {
  return new Op(name, argLen, props)
}


// operations
export const ops = {

  // special
  Invalid:  op("Invalid", 0),
  Unknown:  op("Unknown", 0),
    // Unknown value.
    // Used for Values whose values don't matter because they are dead code.
  Phi:      op("Phi", -1, {zeroWidth: true}),
    // select an argument based on which predecessor block we came from
  Copy:     op("Copy", 1),  // output = arg0
  Arg:      op("Arg", 0, {zeroWidth: true}), // argument to current function
  CallArg:  op("CallArg", 1, {zeroWidth: true}), // argument for function call
  NilCheck: op("NilCheck", 2,
    {nilCheck: true, faultOnNilArg0: true}), // panic if arg0 is nil. arg1=mem.

  // function calls
  //
  // Arguments to the call have already been written to the stack.
  // Return values appear on the stack.
  Call:     op("Call", 1, {aux: t_usize, call: true}), // call function
  TailCall: op("TailCall", 1, {aux: t_usize, call: true}), // call function
  // ClosureCall: op("ClosureCall", 3, {aux: t_usize, call: true})
    // arg0=code pointer, arg1=context ptr, arg2=memory.  aux=arg size.
  // ICall: op("ICall", 2, {aux: t_usize, call: true})
    // interface call.  arg0=code pointer, arg1=memory, aux=arg size.


  // constants
  // Constant values are stored in the aux field.
  ConstBool:   op("ConstBool", 0, {aux: t_bool, constant: true}),
    // aux is 0=false, 1=true
  ConstI8:     op("ConstI8",   0, {aux: t_u8, constant: true}),
    // aux is sign-extended 8 bits
  ConstI16:    op("ConstI16",  0, {aux: t_u16, constant: true}),
    // aux is sign-extended 16 bits
  ConstI32:    op("ConstI32",  0, {aux: t_u32, constant: true}),
    // aux is sign-extended 32 bits
  ConstI64:    op("ConstI64", 0, {aux: t_u64, constant: true}),
    // aux is Int64
  ConstF32:    op("ConstF32", 0, {aux: t_u32, constant: true}),
    // value is math.Float64frombits(uint64(aux))
    // and is exactly prepresentable as float 32
  ConstF64:    op("ConstF64", 0, {aux: t_u64, constant: true}),
    // value is math.Float64frombits(uint64(aux))
  // ConstString: op("ConstString", 0, {aux: t_str}),
  //   // value is aux (string)


  // stack
  SP: op("SP", 0, {zeroWidth: true}), // stack pointer
    // The SP pseudo-register is a virtual stack pointer used to refer
    // to frame-local variables and the arguments being prepared for
    // function calls. It points to the top of the local stack frame,
    // so references should use negative offsets in the range
    // [−framesize, 0): x-8(SP), y-4(SP), and so on.
  SB: op("SB", 0, {type: t_usize, zeroWidth: true}),
    // static base pointer (a.k.a. globals pointer)
    // SB is a pseudo-register that holds the "static base" pointer,
    // i.e. the address of the beginning of the program address space.


  // memory
  Load:  op("Load", 2),
    // Load from arg0. arg1=addr
  Store: op("Store", 3, {type: t_addr}),
    // Store arg1 to arg0.  arg2=addr, aux=type
  Move:  op("Move", 3, {type: t_addr}),
    // arg0=destptr, arg1=srcptr, arg2=addr, aux=type
  Zero:  op("Zero", 2, {type: t_addr}),
    // arg0=destptr, arg1=addr, auxint=size, aux=type


  // 2-input arithmetic
  // Types must be consistent with typing.
  // Add, for example, must take two values of the same type and produces that
  // same type
  //
  // arg0 + arg1 ; sign-agnostic addition
  AddI8:  op("AddI8",  2, {commutative: true, resultInArg0: true}),
  AddI16: op("AddI16", 2, {commutative: true, resultInArg0: true}),
  AddI32: op("AddI32", 2, {commutative: true, resultInArg0: true}),
  AddI64: op("AddI64", 2, {commutative: true, resultInArg0: true}),
  AddF32: op("AddF32", 2, {commutative: true, resultInArg0: true}),
  AddF64: op("AddF64", 2, {commutative: true, resultInArg0: true}),
  //
  // arg0 - arg1 ; sign-agnostic subtraction
  SubI8:  op("SubI8",  2, {resultInArg0: true}),
  SubI16: op("SubI16", 2, {resultInArg0: true}),
  SubI32: op("SubI32", 2, {resultInArg0: true}),
  SubI64: op("SubI64", 2, {resultInArg0: true}),
  SubF32: op("SubF32", 2, {resultInArg0: true}),
  SubF64: op("SubF64", 2, {resultInArg0: true}),
  //
  // arg0 * arg1 ; sign-agnostic multiplication
  MulI8:  op("MulI8",  2, {commutative: true, resultInArg0: true}),
  MulI16: op("MulI16", 2, {commutative: true, resultInArg0: true}),
  MulI32: op("MulI32", 2, {commutative: true, resultInArg0: true}),
  MulI64: op("MulI64", 2, {commutative: true, resultInArg0: true}),
  MulF32: op("MulF32", 2, {commutative: true, resultInArg0: true}),
  MulF64: op("MulF64", 2, {commutative: true, resultInArg0: true}),
  //
  // arg0 / arg1 ; division
  DivS8:  op("DivS8",  2, {resultInArg0: true}), // signed (result is truncated toward zero)
  DivU8:  op("DivU8",  2, {resultInArg0: true}), // unsigned (result is floored)
  DivS16: op("DivS16", 2, {resultInArg0: true}),
  DivU16: op("DivU16", 2, {resultInArg0: true}),
  DivS32: op("DivS32", 2, {resultInArg0: true}),
  DivU32: op("DivU32", 2, {resultInArg0: true}),
  DivS64: op("DivS64", 2, {resultInArg0: true}),
  DivU64: op("DivU64", 2, {resultInArg0: true}),
  DivF32: op("DivF32", 2, {resultInArg0: true}),
  DivF64: op("DivF64", 2, {resultInArg0: true}),
  //
  // arg0 % arg1 ; remainder
  RemS8:  op("RemS8",  2, {resultInArg0: true}), // signed (result has the sign of the dividend)
  RemU8:  op("RemU8",  2, {resultInArg0: true}), // unsigned
  RemS16: op("RemS16", 2, {resultInArg0: true}),
  RemU16: op("RemU16", 2, {resultInArg0: true}),
  RemS32: op("RemS32", 2, {resultInArg0: true}),
  RemU32: op("RemU32", 2, {resultInArg0: true}),
  RemI64: op("RemI64", 2, {resultInArg0: true}),
  RemU64: op("RemU64", 2, {resultInArg0: true}),
  //
  // arg0 & arg1 ; sign-agnostic bitwise and
  AndI8:  op("AndI8",  2, {commutative: true, resultInArg0: true}),
  AndI16: op("AndI16", 2, {commutative: true, resultInArg0: true}),
  AndI32: op("AndI32", 2, {commutative: true, resultInArg0: true}),
  AndI64: op("AndI64", 2, {commutative: true, resultInArg0: true}),
  //
  // arg0 | arg1 ; sign-agnostic bitwise inclusive or
  OrI8:  op("OrI8",  2, {commutative: true, resultInArg0: true}),
  OrI16: op("OrI16", 2, {commutative: true, resultInArg0: true}),
  OrI32: op("OrI32", 2, {commutative: true, resultInArg0: true}),
  OrI64: op("OrI64", 2, {commutative: true, resultInArg0: true}),
  //
  // arg0 ^ arg1 ; sign-agnostic bitwise exclusive or
  XorI8:  op("XorI8",  2, {commutative: true, resultInArg0: true}),
  XorI16: op("XorI16", 2, {commutative: true, resultInArg0: true}),
  XorI32: op("XorI32", 2, {commutative: true, resultInArg0: true}),
  XorI64: op("XorI64", 2, {commutative: true, resultInArg0: true}),
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
  ShLI8x8:   op("ShLI8x8",   2, {aux: t_bool}),
  ShLI8x16:  op("ShLI8x16",  2, {aux: t_bool}),
  ShLI8x32:  op("ShLI8x32",  2, {aux: t_bool}),
  ShLI8x64:  op("ShLI8x64",  2, {aux: t_bool}),
  ShLI16x8:  op("ShLI16x8",  2, {aux: t_bool}),
  ShLI16x16: op("ShLI16x16", 2, {aux: t_bool}),
  ShLI16x32: op("ShLI16x32", 2, {aux: t_bool}),
  ShLI16x64: op("ShLI16x64", 2, {aux: t_bool}),
  ShLI32x8:  op("ShLI32x8",  2, {aux: t_bool}),
  ShLI32x16: op("ShLI32x16", 2, {aux: t_bool}),
  ShLI32x32: op("ShLI32x32", 2, {aux: t_bool}),
  ShLI32x64: op("ShLI32x64", 2, {aux: t_bool}),
  ShLI64x8:  op("ShLI64x8",  2, {aux: t_bool}),
  ShLI64x16: op("ShLI64x16", 2, {aux: t_bool}),
  ShLI64x32: op("ShLI64x32", 2, {aux: t_bool}),
  ShLI64x64: op("ShLI64x64", 2, {aux: t_bool}),
  //
  // arg0 >> arg1 ; sign-replicating (arithmetic) shift right
  ShRS8x8:   op("ShRS8x8",   2, {aux: t_bool}),
  ShRS8x16:  op("ShRS8x16",  2, {aux: t_bool}),
  ShRS8x32:  op("ShRS8x32",  2, {aux: t_bool}),
  ShRS8x64:  op("ShRS8x64",  2, {aux: t_bool}),
  ShRS16x8:  op("ShRS16x8",  2, {aux: t_bool}),
  ShRS16x16: op("ShRS16x16", 2, {aux: t_bool}),
  ShRS16x32: op("ShRS16x32", 2, {aux: t_bool}),
  ShRS16x64: op("ShRS16x64", 2, {aux: t_bool}),
  ShRS32x8:  op("ShRS32x8",  2, {aux: t_bool}),
  ShRS32x16: op("ShRS32x16", 2, {aux: t_bool}),
  ShRS32x32: op("ShRS32x32", 2, {aux: t_bool}),
  ShRS32x64: op("ShRS32x64", 2, {aux: t_bool}),
  ShRS64x8:  op("ShRS64x8",  2, {aux: t_bool}),
  ShRS64x16: op("ShRS64x16", 2, {aux: t_bool}),
  ShRS64x32: op("ShRS64x32", 2, {aux: t_bool}),
  ShRS64x64: op("ShRS64x64", 2, {aux: t_bool}),
  //
  // arg0 >> arg1 (aka >>>) ; zero-replicating (logical) shift right
  ShRU8x8:   op("ShRU8x8",   2, {aux: t_bool}),
  ShRU8x16:  op("ShRU8x16",  2, {aux: t_bool}),
  ShRU8x32:  op("ShRU8x32",  2, {aux: t_bool}),
  ShRU8x64:  op("ShRU8x64",  2, {aux: t_bool}),
  ShRU16x8:  op("ShRU16x8",  2, {aux: t_bool}),
  ShRU16x16: op("ShRU16x16", 2, {aux: t_bool}),
  ShRU16x32: op("ShRU16x32", 2, {aux: t_bool}),
  ShRU16x64: op("ShRU16x64", 2, {aux: t_bool}),
  ShRU32x8:  op("ShRU32x8",  2, {aux: t_bool}),
  ShRU32x16: op("ShRU32x16", 2, {aux: t_bool}),
  ShRU32x32: op("ShRU32x32", 2, {aux: t_bool}),
  ShRU32x64: op("ShRU32x64", 2, {aux: t_bool}),
  ShRU64x8:  op("ShRU64x8",  2, {aux: t_bool}),
  ShRU64x16: op("ShRU64x16", 2, {aux: t_bool}),
  ShRU64x32: op("ShRU64x32", 2, {aux: t_bool}),
  ShRU64x64: op("ShRU64x64", 2, {aux: t_bool}),


  // 2-input comparisons
  //
  // arg0 == arg1 ; sign-agnostic compare equal
  EqI8:  op("EqI8",  2, {commutative: true, type: t_bool}),
  EqI16: op("EqI16", 2, {commutative: true, type: t_bool}),
  EqI32: op("EqI32", 2, {commutative: true, type: t_bool}),
  EqI64: op("EqI64", 2, {commutative: true, type: t_bool}),
  EqF32: op("EqF32", 2, {commutative: true, type: t_bool}),
  EqF64: op("EqF64", 2, {commutative: true, type: t_bool}),
  //
  // arg0 != arg1 ; sign-agnostic compare unequal
  NeqI8:  op("NeqI8",  2, {commutative: true, type: t_bool}),
  NeqI16: op("NeqI16", 2, {commutative: true, type: t_bool}),
  NeqI32: op("NeqI32", 2, {commutative: true, type: t_bool}),
  NeqI64: op("NeqI64", 2, {commutative: true, type: t_bool}),
  NeqF32: op("NeqF32", 2, {commutative: true, type: t_bool}),
  NeqF64: op("NeqF64", 2, {commutative: true, type: t_bool}),
  //
  // arg0 < arg1 ; less than
  LessS8:  op("LessS8",  2, {type: t_bool}), // signed
  LessU8:  op("LessU8",  2, {type: t_bool}), // unsigned
  LessS16: op("LessS16", 2, {type: t_bool}),
  LessU16: op("LessU16", 2, {type: t_bool}),
  LessS32: op("LessS32", 2, {type: t_bool}),
  LessU32: op("LessU32", 2, {type: t_bool}),
  LessS64: op("LessS64", 2, {type: t_bool}),
  LessU64: op("LessU64", 2, {type: t_bool}),
  LessF32: op("LessF32", 2, {type: t_bool}),
  LessF64: op("LessF64", 2, {type: t_bool}),
  //
  // arg0 <= arg1 ; less than or equal
  LeqS8:  op("LeqS8",  2, {type: t_bool}), // signed
  LeqU8:  op("LeqU8",  2, {type: t_bool}), // unsigned
  LeqS16: op("LeqS16", 2, {type: t_bool}),
  LeqU16: op("LeqU16", 2, {type: t_bool}),
  LeqS32: op("LeqS32", 2, {type: t_bool}),
  LeqU32: op("LeqU32", 2, {type: t_bool}),
  LeqS64: op("LeqS64", 2, {type: t_bool}),
  LeqU64: op("LeqU64", 2, {type: t_bool}),
  LeqF32: op("LeqF32", 2, {type: t_bool}),
  LeqF64: op("LeqF64", 2, {type: t_bool}),
  //
  // arg0 > arg1 ; greater than
  GreaterS8:  op("GreaterS8",  2, {type: t_bool}), // signed
  GreaterU8:  op("GreaterU8",  2, {type: t_bool}), // unsigned
  GreaterS16: op("GreaterS16", 2, {type: t_bool}),
  GreaterU16: op("GreaterU16", 2, {type: t_bool}),
  GreaterS32: op("GreaterS32", 2, {type: t_bool}),
  GreaterU32: op("GreaterU32", 2, {type: t_bool}),
  GreaterS64: op("GreaterS64", 2, {type: t_bool}),
  GreaterU64: op("GreaterU64", 2, {type: t_bool}),
  GreaterF32: op("GreaterF32", 2, {type: t_bool}),
  GreaterF64: op("GreaterF64", 2, {type: t_bool}),
  //
  // arg0 <= arg1 ; greater than or equal
  GeqS8:  op("GeqS8",  2, {type: t_bool}), // signed
  GeqU8:  op("GeqU8",  2, {type: t_bool}), // unsigned
  GeqS16: op("GeqS16", 2, {type: t_bool}),
  GeqU16: op("GeqU16", 2, {type: t_bool}),
  GeqS32: op("GeqS32", 2, {type: t_bool}),
  GeqU32: op("GeqU32", 2, {type: t_bool}),
  GeqS64: op("GeqS64", 2, {type: t_bool}),
  GeqU64: op("GeqU64", 2, {type: t_bool}),
  GeqF32: op("GeqF32", 2, {type: t_bool}),
  GeqF64: op("GeqF64", 2, {type: t_bool}),
  //
  // boolean ops (AndB and OrB are not shortcircuited)
  // AndB: op("AndB", 2, {commutative: true, type: t_bool}), // arg0 && arg1
  // OrB:  op("OrB",  2, {commutative: true, type: t_bool}), // arg0 || arg1
  // EqB:  op("EqB",  2, {commutative: true, type: t_bool}), // arg0 == arg1
  // NeqB: op("NeqB", 2, {commutative: true, type: t_bool}), // arg0 != arg1
  Not:  op("Not",  1, {type: t_bool}),                    // !arg0, boolean


  // min(arg0, arg1) ; max(arg0, arg1)
  MinF32: op("MinF32", 2),
  MinF64: op("MinF64", 2),
  MaxF32: op("MaxF32", 2),
  MaxF64: op("MaxF64", 2),

  // CondSelect is a conditional MOVE (register to register.)
  //
  // The type of a CondSelect is the same as the type of its first
  // two arguments, which should be register-width scalars; the third
  // argument should be a boolean.
  //
  // Placed during optimization by branchelim
  //
  // arg2 ? arg0 : arg1
  // CondSelect: op("CondSelect", 3),


  // 1-input ops
  //
  // -arg0 ; negation
  NegI8:  op("NegI8",  1),
  NegI16: op("NegI16", 1),
  NegI32: op("NegI32", 1),
  NegI64: op("NegI64", 1),
  NegF32: op("NegF32", 1),
  NegF64: op("NegF64", 1),
  //
  // Count trailing (low order) zeroes
  CtzI8:  op("CtzI8",  1), // returns 0-8
  CtzI16: op("CtzI16", 1), // returns 0-16
  CtzI32: op("CtzI32", 1), // returns 0-32
  CtzI64: op("CtzI64", 1), // returns 0-64
  //
  // same as above, but arg0 known to be non-zero
  CtzI8NonZero:  op("CtzI8NonZero",  1), // returns 0-7
  CtzI16NonZero: op("CtzI16NonZero", 1), // returns 0-15
  CtzI32NonZero: op("CtzI32NonZero", 1), // returns 0-31
  CtzI64NonZero: op("CtzI64NonZero", 1), // returns 0-63
  //
  // Number of bits in arg0
  BitLen8:  op("BitLen8",  1), // returns 0-8
  BitLen16: op("BitLen16", 1), // returns 0-16
  BitLen32: op("BitLen32", 1), // returns 0-32
  BitLen64: op("BitLen64", 1), // returns 0-64
  //
  // Swap bytes
  // op("Bswap32", 1)
  // op("Bswap64", 1) // Swap bytes
  //
  // Reverse the bits in arg0
  // op("BitRev8", 1)
  // op("BitRev16", 1) // Reverse the bits in arg0
  // op("BitRev32", 1) // Reverse the bits in arg0
  // op("BitRev64", 1) // Reverse the bits in arg0
  //
  // sign-agnostic count number of one bits in arg0
  PopCountI8:  op("PopCountI8",  1),
  PopCountI16: op("PopCountI16", 1),
  PopCountI32: op("PopCountI32", 1),
  PopCountI64: op("PopCountI64", 1),
  //
  // Square root
  // Special cases:
  //   +∞  → +∞
  //   ±0  → ±0 (sign preserved)
  //   x<0 → NaN
  //   NaN → NaN
  SqrtF32: op("SqrtF32", 1), // √arg0
  SqrtF64: op("SqrtF64", 1), // √arg0
  //
  // Round to integer
  // Special cases:
  //   ±∞  → ±∞ (sign preserved)
  //   ±0  → ±0 (sign preserved)
  //   NaN → NaN
  FloorF32: op("FloorF32", 1), // round arg0 toward -∞
  FloorF64: op("FloorF64", 1),
  CeilF32:  op("CeilF32", 1),   // round arg0 toward +∞
  CeilF64:  op("CeilF64", 1),
  TruncF32: op("TruncF32", 1), // round arg0 toward 0
  TruncF64: op("TruncF64", 1),
  RoundF32: op("RoundF32", 1), // round arg0 to nearest, ties away from 0
  RoundF64: op("RoundF64", 1),
  //
  // round arg0 to nearest, ties to even
  RoundToEvenF32: op("RoundToEvenF32", 1),
  RoundToEvenF64: op("RoundToEvenF64", 1),
  //
  // Modify the sign bit
  AbsF32: op("AbsF32", 1), // absolute value arg0
  AbsF64: op("AbsF64", 1),
  CopysignF32: op("CopysignF32", 2), // copy sign from arg0 to arg1
  CopysignF64: op("CopysignF64", 2),


  // Conversions
  //
  // signed extensions
  SignExtI8to16:  op("SignExtS8to16",  1, {type: t_i16}), // i8  -> i16
  SignExtI8to32:  op("SignExtS8to32",  1, {type: t_i32}), // i8  -> i32
  SignExtI8to64:  op("SignExtS8to64",  1, {type: t_i64}), // i8  -> i64
  SignExtI16to32: op("SignExtS16to32", 1, {type: t_i32}), // i16 -> i32
  SignExtI16to64: op("SignExtS16to64", 1, {type: t_i64}), // i16 -> i64
  SignExtI32to64: op("SignExtS32to64", 1, {type: t_i64}), // i32 -> i64
  //
  // zero (unsigned) extensions
  ZeroExtI8to16:  op("ZeroExtU8to16",  1, {type: t_u16}), // u8  -> u16
  ZeroExtI8to32:  op("ZeroExtU8to32",  1, {type: t_u32}), // u8  -> u32
  ZeroExtI8to64:  op("ZeroExtU8to64",  1, {type: t_u64}), // u8  -> u64
  ZeroExtI16to32: op("ZeroExtU16to32", 1, {type: t_u32}), // u16 -> u32
  ZeroExtI16to64: op("ZeroExtU16to64", 1, {type: t_u64}), // u16 -> u64
  ZeroExtI32to64: op("ZeroExtU32to64", 1, {type: t_u64}), // u32 -> u64
  //
  // truncations to bool
  TruncI8toBool:  op("TruncI8toBool",  1, {type: t_bool}),
  TruncI16toBool: op("TruncI16toBool", 1, {type: t_bool}),
  TruncI32toBool: op("TruncI32toBool", 1, {type: t_bool}),
  TruncI64toBool: op("TruncI64toBool", 1, {type: t_bool}),
  TruncF32toBool: op("TruncF32toBool", 1, {type: t_bool}),
  TruncF64toBool: op("TruncF64toBool", 1, {type: t_bool}),
  //
  // truncations
  TruncI16to8:  op("TruncI16to8",  1), // i16 -> i8  ; u16 -> u8
  TruncI32to8:  op("TruncI32to8",  1), // i32 -> i8  ; u32 -> u8
  TruncI32to16: op("TruncI32to16", 1), // i32 -> i16 ; u32 -> u16
  TruncI64to8:  op("TruncI64to8",  1), // i64 -> i8  ; u64 -> u8
  TruncI64to16: op("TruncI64to16", 1), // i64 -> i16 ; u64 -> u16
  TruncI64to32: op("TruncI64to32", 1), // i64 -> i32 ; u64 -> u32
  //
  // conversions
  ConvI32toF32: op("ConvI32toF32", 1, {type: t_f32}), // i32 -> f32
  ConvI32toF64: op("ConvI32toF64", 1, {type: t_f64}), // i32 -> f64
  ConvI64toF32: op("ConvI64toF32", 1, {type: t_f32}), // i64 -> f32
  ConvI64toF64: op("ConvI64toF64", 1, {type: t_f64}), // i64 -> f64
  ConvF32toI32: op("ConvF32toI32", 1, {type: t_i32}), // f32 -> i32
  ConvF32toI64: op("ConvF32toI64", 1, {type: t_i64}), // f32 -> i64
  ConvF64toI32: op("ConvF64toI32", 1, {type: t_i32}), // f64 -> i32
  ConvF64toI64: op("ConvF64toI64", 1, {type: t_i64}), // f64 -> i64
  ConvF32toF64: op("ConvF32toF64", 1, {type: t_f64}), // f32 -> f64
  ConvF64toF32: op("ConvF64toF32", 1, {type: t_f32}), // f64 -> f32
  //
  // conversions only used on 32-bit arch
  ConvU32toF32: op("ConvU32toF32", 1, {type: t_f32}), // u32 -> f32
  ConvU32toF64: op("ConvU32toF64", 1, {type: t_f64}), // u32 -> f64
  ConvF32toU32: op("ConvF32toU32", 1, {type: t_u32}), // f32 -> u32
  ConvF64toU32: op("ConvF64toU32", 1, {type: t_u32}), // f64 -> u32
  //
  // conversions only used on archs that has the instruction
  ConvU64toF32: op("ConvU64toF32", 1, {type: t_f32}), // u64 -> f32
  ConvU64toF64: op("ConvU64toF64", 1, {type: t_f64}), // u64 -> f64
  ConvF32toU64: op("ConvF32toU64", 1, {type: t_u64}), // f32 -> u64
  ConvF64toU64: op("ConvF64toU64", 1, {type: t_u64}), // f64 -> u64


  // Atomic operations used for semantically inlining runtime/internal/atomic.
  // Atomic loads return a new memory so that the loads are properly ordered
  // with respect to other loads and stores.
  //
  AtomicLoad32: op("AtomicLoad32", 2, {/*type: "(UInt32,Mem)"*/}),
    // Load from arg0.  arg1=memory.  Returns loaded value and new memory.
  AtomicLoad64: op("AtomicLoad64", 2, {/*type: "(UInt64,Mem)"*/}),
    // Load from arg0.  arg1=memory.  Returns loaded value and new memory.
  AtomicLoadPtr: op("AtomicLoadPtr", 2, {/*type: "(BytePtr,Mem)"*/}),
    // Load from arg0.  arg1=memory.  Returns loaded value and new memory.
  AtomicStore32: op("AtomicStore32", 3, {/*type: "Mem",*/hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.  Returns memory.
  AtomicStore64: op("AtomicStore64", 3, {/*type: "Mem",*/hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.  Returns memory.
  AtomicStorePtrNoWB: op("AtomicStorePtrNoWB", 3,
    {type: t_addr, hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.  Returns memory.
  AtomicExchange32: op("AtomicExchange32", 3,
    {/*type: "(UInt32,Mem)",*/hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.
    // Returns old contents of *arg0 and new memory.
  AtomicExchange64: op("AtomicExchange64", 3,
    {/*type: "(UInt64,Mem)",*/hasSideEffects: true}),
    // Store arg1 to *arg0.  arg2=memory.
    // Returns old contents of *arg0 and new memory.
  AtomicAdd32: op("AtomicAdd32", 3,
    {/*type: "(UInt32,Mem)",*/hasSideEffects: true}),
    // Do *arg0 += arg1.  arg2=memory.  Returns sum and new memory.
  AtomicAdd64: op("AtomicAdd64", 3,
    {/*type: "(UInt64,Mem)",*/hasSideEffects: true}),
    // Do *arg0 += arg1.  arg2=memory.  Returns sum and new memory.
  AtomicCompareAndSwap32: op("AtomicCompareAndSwap32", 4,
    {/*type: "(Bool,Mem)",*/hasSideEffects: true}),
    // if *arg0==arg1, then set *arg0=arg2.
    // Returns true iff store happens and new memory.
  AtomicCompareAndSwap64: op("AtomicCompareAndSwap64", 4,
    {/*type: "(Bool,Mem)",*/hasSideEffects: true}),
    // if *arg0==arg1, then set *arg0=arg2.
    // Returns true if store happens and new memory.
  AtomicAnd8: op("AtomicAnd8", 3, {type: t_addr, hasSideEffects: true}),
    // *arg0 &= arg1.  arg2=memory.  Returns memory.
  AtomicOr8: op("AtomicOr8", 3, {type: t_addr, hasSideEffects: true}),
  // *arg0 |= arg1.  arg2=memory.  Returns memory.

} // end `const op`
