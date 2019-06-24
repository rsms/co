import { debuglog as dlog } from '../util'
import { Value, Fun } from './ssa'
import { ops } from "./ops"
import { copyelimValue } from './copyelim'


// phielim eliminates redundant phi values from f.
// A phi is redundant if its arguments are all equal. For
// purposes of counting, ignore the phi itself. Both of
// these phis are redundant:
//   v = phi(x,x,x)
//   v = phi(x,v,x,v)
// We repeat this process to also catch situations like:
//   v = phi(x, phi(x, x), phi(x, v))
//
export function phielim(f :Fun) {
  while (true) {
    let change = false
    for (let b of f.blocks) {
      for (let v of b.values) {
        copyelimValue(v)
        change = phielimValue(v) || change
      }
    }
    if (!change) {
      break
    }
  }
}


// phielimValue tries to convert the phi v to a copy.
export function phielimValue(v :Value) :bool {
  if (v.op !== ops.Phi) {
    return false
  }

  let args = v.args
  assert(args, `Phi ${v} without args`)

  // If there are two distinct args of v which
  // are not v itself, then the phi must remain.
  // Otherwise, we can replace it with a copy.
  var w :Value|null = null
  for (let x of args) {
    if (x === v) {
      continue
    }
    if (x === w) {
      continue
    }
    if (w) {
      return false
    }
    w = x
  }

  if (!w) {
    // v references only itself. It must be in
    // a dead code loop. Don't bother modifying it.
    return false
  }

  v.op = ops.Copy
  v.setArgs1(w)
  dlog(`eliminated phi ${v}`) // at v.Pos
  return true
}
