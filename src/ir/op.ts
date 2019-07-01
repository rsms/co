import { BasicType } from '../types'
import { RegInfo } from './reg'


// Operators are identified by numbers which are defined in the
// auto-generated file ops.ts which also defines opinfo; a table
// mapping Op => OpInfo.
//
export type Op = int


// A SymEffect describes the effect that an SSA Value has on the variable
// identified by the symbol in its aux field.
export enum SymEffect {
  None = 0,

  Read = 1,
  Write = 2,
  Addr = 4,

  ReadWrite = 1 | 2,  // Read | Write
}

export enum AuxType {
  None = 0,
  Bool,          // auxInt is 0/1 for false/true
  Int8,          // auxInt is an 8-bit integer
  Int16,         // auxInt is a 16-bit integer
  Int32,         // auxInt is a 32-bit integer
  Int64,         // auxInt is a 64-bit integer
  Float32,       // auxInt is a float32 (encoded with math.Float64bits)
  Float64,       // auxInt is a float64 (encoded with math.Float64bits)
  String,        // aux is a string
  Sym,           // aux is a symbol (a *gc.Node for locals or an *obj.LSym for globals)
  SymOff,        // aux is a symbol, auxInt is an offset
  SymValAndOff,  // aux is a symbol, auxInt is a ValAndOff
  SymInt32,      // aux is a symbol, auxInt is a 32-bit integer
  Typ,           // aux is a type
  TypSize,       // aux is a type, auxInt is a size, must have Aux.(Type).Size() == AuxInt
  CCop,          // aux is a ssa.Op that represents a flags-to-bool conversion (e.g. LessThan)
}

// export function auxTypeHasAuxInt(at :AuxType) :bool {
//   switch (at) {
//     case AuxType.Bool:
//     case AuxType.Int8:
//     case AuxType.Int16:
//     case AuxType.Int32:
//     case AuxType.Int64:
//     case AuxType.Float32:
//     case AuxType.Float64:
//     case AuxType.SymOff:
//     case AuxType.SymValAndOff:
//     case AuxType.SymInt32:
//     case AuxType.TypSize:
//       return true
//   }
//   return false
// }


// OpInfo describes characteristics of a certain operator.
// All available OpInfo data is defined by the auto-generated file ops.ts.
//
export interface OpInfo {
  name: string // printed name
  argLen: int // number of arguments, if -1, then this operation has a variable number of arguments

  type? :BasicType // default result type
  aux?  :AuxType // type of aux field

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
