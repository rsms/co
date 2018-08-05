import { Fun, Value } from './ssa'
import { ops } from './op'

// import { fmtir } from './ir-repr'
// import { debuglog as dlog } from './util'

// function dumplive(live :Set<Value>) {
//   let l :string[] = []
//   for (let v of live) {
//     l.push(v.toString())
//   }
//   console.log('  ' + l.join(', '))
// }


export function optdce(fn :Fun) {
  let live = new Set<Value>()  // set of live variables
  let b = fn.tailb  // start with last block in function
  while (true) {
    if (b.control) {
      // variable used as branching condition is live at end of block
      live.add(b.control)
    }
    let v = b.vtail
    while (v) {
      // attempt to remove receiver var from live (except for calls)
      //
      // TODO: when encountering a call, check if the call has
      // side effects (i.e. called function is not pure), and if not attempt
      // elimination of the call.
      // Currently we don't know if the call has side effects or not, so we
      // have to assume all calls have side effects, thus we never elminiate
      // calls.
      //
      if (v.op === ops.Call || v.op === ops.TailCall || live.delete(v)) {
        // register operands as being live (since they are read)
        // dlog(`${v} is live  ${fmtir(v)}`)
        if (v.args) for (let operand of v.args) {
          live.add(operand)
        }
        v = v.prevv
      } else {
        // dead (the var is not in `live`)
        // dlog(`${v} is dead  ${fmtir(v)}`)
        v = v.remove()  // returns previous sibling
      }
      // dumplive(live)
    }
    if (!b.parent) {
      break
    }
    b = b.parent  // walk parent/previous block
  }
}
