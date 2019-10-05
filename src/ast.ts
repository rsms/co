import { NoPos } from "./pos"
import { strings } from "./bytestr"
import * as n from "./ast/nodes"
import { nilScope } from "./ast/scope"  // order matters i/r/t nodes.ts

export * from "./ast/nodes"
export * from "./ast/scope"
export * from "./ast/visit"
export * from "./ast/transform"
export { printAst as print } from "./ast/repr"

const str_T = strings.get(new Uint8Array([0x54])) // "T"
const id_T = new n.Ident(NoPos, nilScope, str_T)

// dynamically-sized string. i.e. "str"
export const t_str = new n.StrType(NoPos, -1)

// the empty string. i.e. "str<0>"
export const t_str0 = new n.StrType(NoPos, 0)

// optional "str". i.e. "str?"
export const t_stropt = new n.OptionalType(NoPos, t_str)

// tvar used for List
let List_tvar0 = new n.TemplateVar(NoPos, nilScope, id_T, null, null)

// exported type objects
export const types = {
  // Property names should be the same, sans "t_".
  //
  // PrimType
  nil:     n.t_nil,
  mem:     n.t_mem,
  bool:    n.t_bool,
  u8:      n.t_u8,
  i8:      n.t_i8,
  u16:     n.t_u16,
  i16:     n.t_i16,
  u32:     n.t_u32,
  i32:     n.t_i32,
  u64:     n.t_u64,
  i64:     n.t_i64,
  uint:    n.t_uint,
  int:     n.t_int,
  uintptr: n.t_uintptr,
  f32:     n.t_f32,
  f64:     n.t_f64,
  byte:    n.t_byte,  // == u8
  rune:    n.t_rune,  // == u32
  //
  // type Str<size=-1> <intrinsic>
  str: t_str, // size known at runtime. i.e. "str"
  //
  // // type Tuple<T...> <intrinsic>
  // Tuple: new n.Template(
  //   NoPos,
  //   nilScope,
  //   [Tuple_tvar0],
  //   new n.TupleType(Tuple_tvar0)
  // ),
  //
  // type List<T> <intrinsic>
  List: new n.Template(NoPos, nilScope, [List_tvar0], new n.ListType(List_tvar0)),
}

// built-in, predefined values
export const values = {
  true:  new n.Atom("true",  types.bool),
  false: new n.Atom("false", types.bool),
  nil:   new n.Atom("nil",   types.nil),
}

// intTypes returns a pair of [signed, unsigned] integer types
// that are bytesize wide.
//
export function intTypes(bytesize :int) :[n.IntType,n.IntType] {
  switch (bytesize) {
    case 1: return [types.i8,  types.u8]
    case 2: return [types.i16, types.u16]
    case 4: return [types.i32, types.u32]
    case 8: return [types.i64, types.u64]
  }
  panic(`invalid integer size ${bytesize}`)
  return [types.i32, types.u32]
}
