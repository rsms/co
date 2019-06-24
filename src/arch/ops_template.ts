// generated from arch/*_ops.ts -- do not edit.
import { Op, OpInfo, SymEffect } from "../ir/op"
import { UInt64 } from "../int64"
//$IMPORTS

//$BODY_START
// This is replaced by gen.ts -- defs here only to aid TypeScript
export const ops :{[k:string]:Op} = {}
export const opinfo :OpInfo[] = []
//$BODY_END

// fmtop returns a printable representation of an operator
//
export function fmtop(op :Op) :string {
  let info = opinfo[op]
  assert(info, `unknown op #${op}`)
  return info.name
}
