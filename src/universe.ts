import { ByteStr, ByteStrSet } from './bytestr'
import { asciibuf } from './util'
import { TypeSet } from './typeset'
import { Scope, Ent, builtInTypes, builtInValues } from './ast'
import { Type } from './types'
// import * as types from './types'

// // map of built-in types keyed by name
// //
// const builtInTypes = new Map<string, Type>([
//   [types.t_bool.name,  types.t_bool],
//   [types.t_u8.name,    types.t_u8],
//   [types.t_i8.name,    types.t_i8],
//   [types.t_u16.name,   types.t_u16],
//   [types.t_i16.name,   types.t_i16],
//   [types.t_u32.name,   types.t_u32],
//   [types.t_i32.name,   types.t_i32],
//   [types.t_u64.name,   types.t_u64],
//   [types.t_i64.name,   types.t_i64],
//   [types.t_uint.name,  types.t_uint],
//   [types.t_int.name,   types.t_int],
//   [types.t_usize.name, types.t_usize],
//   [types.t_isize.name, types.t_isize],
//   [types.t_f32.name,   types.t_f32],
//   [types.t_f64.name,   types.t_f64],

//   ["str", types.t_strz],

//   // aliases
//   ['byte', types.t_byte],
//   ['char', types.t_char],
// ])

// // built-in, predefined values
// const
// , v_true  = new BuiltInVal('true',  t_bool)
// , v_false = new BuiltInVal('false', t_bool)
// , v_nil   = new BuiltInVal('nil',   t_nil)

// const builtInValues = [
//   v_true,
//   v_false,
//   v_nil,
// ]

// // exported built-ins
// export const builtins = {

//   // types (populated )
//   "bool":  new TypeExpr(),
//   "u8":    new TypeExpr(),
//   "i8":    new TypeExpr(),
//   "u16":   new TypeExpr(),
//   "i16":   new TypeExpr(),
//   "u32":   new TypeExpr(),
//   "i32":   new TypeExpr(),
//   "u64":   new TypeExpr(),
//   "i64":   new TypeExpr(),
//   "uint":  new TypeExpr(),
//   "int":   new TypeExpr(),
//   "usize": new TypeExpr(),
//   "isize": new TypeExpr(),
//   "f32":   new TypeExpr(),
//   "f64":   new TypeExpr(),
//   "str":   new TypeExpr(),
//   "byte":  new TypeExpr(),
//   "char":  new TypeExpr(),

//   // values
//   "true": v_true,
//   "false": v_false,
//   "nil": v_nil,
// }


export class Universe {
  readonly strSet  :ByteStrSet
  readonly typeSet :TypeSet
  readonly scope   :Scope

  constructor(strSet :ByteStrSet, typeSet :TypeSet) {
    this.strSet = strSet
    this.typeSet = typeSet

    // build scope
    const decls = new Map<ByteStr,Ent>()

    // export all built-in types
    for (let name of Object.keys(builtInTypes)) {
      const t = builtInTypes[name]  // a TypeExpr
      const namebuf = strSet.emplace(asciibuf(name))
      // declare t as namebuf of type t.type
      decls.set(namebuf, new Ent(namebuf, t, null, t.type))
    }

    // export all built-in values (true, false, nil, etc)
    for (let name of Object.keys(builtInValues)) {
      const v = builtInValues[name]  // a Expr
      const namebuf = strSet.emplace(asciibuf(name))
      // define v as namebuf with value v of type v.type
      decls.set(namebuf, new Ent(namebuf, v, v, v.type))
    }

    this.scope = new Scope(null, decls)
  }

  // internType potentially returns an equivalent type (t1.equals(t2) == true)
  // if previously seen. Otherwise it registers t for future calls to this
  // function and returns t as-is. Populates typeSet.
  //
  // The trade-offs are as follows:
  //
  //  [-] slower to parse files with many different types because of
  //      intern-miss overhead.
  //
  //  [+] faster to parse files with few types that are used many times
  //      (common case), since type equality testing is cheap for correct code.
  //
  //  [+] uses less memory (fewer resident Type instances).
  //
  internType<T extends Type>(t :T) :T {
    return this.typeSet.intern(t)
  }

}
