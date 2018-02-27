import { Pkg, Fun, Block, BlockKind, Value, Op } from './ir'
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
      // attempt to remove receiver var from live.
      if (!live.delete(v)) {
        // dead (the var is not in `live`)
        // dlog(`${v} is dead  ${fmtir(v)}`)
        v = v.remove()  // returns previous sibling
      } else {
        // register operands as being live (since they are read)
        // dlog(`${v} is live  ${fmtir(v)}`)
        if (v.args) for (let operand of v.args) {
          live.add(operand)
        }
        v = v.prevv
      }
      // dumplive(live)
    }
    if (!b.parent) {
      break
    }
    b = b.parent  // walk parent/previous block
  }
}
