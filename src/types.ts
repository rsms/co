import * as ast from './ast'

// re-export
export const
  //
  // special
  t_auto = ast.u_t_auto
, t_nil  = ast.u_t_nil
  //
  // integers
, t_bool  = ast.u_t_bool
, t_u8    = ast.u_t_u8
, t_i8    = ast.u_t_i8
, t_u16   = ast.u_t_u16
, t_i16   = ast.u_t_i16
, t_u32   = ast.u_t_u32
, t_i32   = ast.u_t_i32
, t_u64   = ast.u_t_u64
, t_i64   = ast.u_t_i64
, t_uint  = ast.u_t_uint
, t_int   = ast.u_t_int
, t_usize = ast.u_t_usize
, t_isize = ast.u_t_isize
  //
  // floats
, t_f32 = ast.u_t_f32
, t_f64 = ast.u_t_f64
  //
  // pointers
, t_str = ast.u_t_str
  //
  // aliases
, t_byte = t_u8
, t_char = t_u32


// names of basic types (exposed in Universe)
export const basicTypes = new Map<string, ast.BasicType|ast.StrType>([
  ['bool', t_bool],
  ['u8',   t_u8],
  ['i8',   t_i8],
  ['u16',  t_u16],
  ['i16',  t_i16],
  ['u32',  t_u32],
  ['i32',  t_i32],
  ['u64',  t_u64],
  ['i64',  t_i64],

  ['uint',  t_uint],
  ['int',   t_int],
  ['usize', t_usize],
  ['isize', t_isize],
  
  ['f32', t_f32],
  ['f64', t_f64],
  
  ['str', t_str],

  // aliases
  ['byte', t_byte],
  ['char', t_char],
])

// intTypes returns a pair of [signed, unsigned] integer types
// that are bytesize wide.
//
export function intTypes(bytesize :int) :[ast.IntType,ast.IntType] {
  switch (bytesize) {
    case 1: return [t_i8,  t_u8]
    case 2: return [t_i16, t_u16]
    case 4: return [t_i32, t_u32]
    case 8: return [t_i64, t_u64]
  }
  panic(`invalid integer size ${bytesize}`)
  return [t_i32, t_u32]
}
