import { OpInfo } from "../ir/op"
import * as types from '../types'

export const t = {
  "bool":  types.t_bool,
  "u8":    types.t_u8,
  "u16":   types.t_u16,
  "i16":   types.t_i16,
  "u32":   types.t_u32,
  "i32":   types.t_i32,
  "u64":   types.t_u64,
  "i64":   types.t_i64,
  "usize": types.t_usize,
  "addr":  types.t_addr,
  "f32":   types.t_f32,
  "f64":   types.t_f64,
  "str":   types.t_str,
}

export const
  ZeroWidth = Symbol("ZeroWidth")
, Constant = Symbol("Constant") // true if the value is a constant. Value in aux
, Commutative = Symbol("Commutative") // this operation is commutative on its first 2 arguments (e.g. addition)
, ResultInArg0 = Symbol("ResultInArg0") // (first, if a tuple) output of v and v.Args[0] must be allocated to the same register
, ResultNotInArgs = Symbol("ResultNotInArgs") // outputs must not be allocated to the same registers as inputs
, Rematerializeable = Symbol("Rematerializeable") // whether a register allocator can recompute a value instead of spilling/restoring it.
, ClobberFlags = Symbol("ClobberFlags") // this op clobbers flags register
, Call = Symbol("Call")         // is a function call
, NilCheck = Symbol("NilCheck")     // this op is a nil check on arg0
, FaultOnNilArg0 = Symbol("FaultOnNilArg0") // this op will fault if arg0 is nil (and aux encodes a small offset)
, FaultOnNilArg1 = Symbol("FaultOnNilArg1") // this op will fault if arg1 is nil (and aux encodes a small offset)
, UsesScratch = Symbol("UsesScratch")  // this op requires scratch memory space
, HasSideEffects = Symbol("HasSideEffects") // for "reasons", not to be eliminated.  E.g., atomic store.
, Generic = Symbol("Generic") // generic op

export type OpDescription = (string|ArgLen|Flag|Partial<OpInfo>)[]

type ArgLen = int
type Flag = symbol

export function parseOpDescr(d :OpDescription) :OpInfo {
  // interpret d which is a list of:
  //   name :string [ArgLen | Flag | Props]*
  let props = {
    name: d[0] as string,
    argLen: 0,
  } as OpInfo

  assert(typeof props.name == "string",
    "op descriptor " + repr(d) + " does not start with name")

  for (let i = 1; i < d.length; i++) {
    let v = d[i]
    switch (typeof v) {
      case "number":
        props.argLen = v
        break

      case "symbol": switch (v) {
        case ZeroWidth:         props.zeroWidth         = true; break
        case Constant:          props.constant          = true; break
        case Commutative:       props.commutative       = true; break
        case ResultInArg0:      props.resultInArg0      = true; break
        case ResultNotInArgs:   props.resultNotInArgs   = true; break
        case Rematerializeable: props.rematerializeable = true; break
        case ClobberFlags:      props.clobberFlags      = true; break
        case Call:              props.call              = true; break
        case NilCheck:          props.nilCheck          = true; break
        case FaultOnNilArg0:    props.faultOnNilArg0    = true; break
        case FaultOnNilArg1:    props.faultOnNilArg1    = true; break
        case UsesScratch:       props.usesScratch       = true; break
        case HasSideEffects:    props.hasSideEffects    = true; break
        case Generic:           props.generic           = true; break
        default: panic("unexpected symbol", v) }
        break

      case "object":
        Object.assign(props, v)
        break

      default:
        panic("unexpected value", v, "in op descriptor", d)
    }
  }

  return props
}
