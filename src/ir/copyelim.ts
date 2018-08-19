import { debuglog as dlog } from '../util'
import { Value, Fun } from './ssa'
import { ops } from './op'

// copyelim removes all uses of ops.Copy values from f.
// A subsequent deadcode pass is needed to actually remove the copies.
//
export function copyelim(f :Fun) {
  // Modify all values so no arg (including args of ops.Copy) is a copy.
  for (let b of f.blocks) {
    for (let v = b.vhead; v; v = v.nextv) {
      copyelimValue(v)
    }
  }

  // Update block control values
  for (let b of f.blocks) {
    let v = b.control
    if (v && v.op === ops.Copy) {
      b.setControl(v.args[0])
    }
  }

  // TODO: Update named values
  for (let e of f.namedValues.values()) {
    let values = e.values
    for (let i = 0; i < values.length; i++) {
      let v = values[i]
      if (v.op === ops.Copy) {
        values[i] = v.args[0]
      }
    }
  }
}

// copySource returns the (non-copy) op which is the
// ultimate source of v.  v must be a copy op.
//
export function copySource(v :Value) :Value {
  assert(v.op === ops.Copy)
  assert(v.args.length == 1)

  let w = v.args[0]

  // This loop is just:
  // for w.Op == OpCopy {
  //     w = w.Args[0]
  // }
  // but we take some extra care to make sure we
  // don't get stuck in an infinite loop.
  // Infinite copy loops may happen in unreachable code.
  // (TODO: or can they? Needs a test.)
  let slow = w
  let advance :bool = false
  while (w.op === ops.Copy) {
    w = w.args[0]
    if (w === slow) {
      w.reset(ops.Unknown)
      break
    }
    if (advance) {
      slow = slow.args[0]
    }
    advance = !advance
  }

  // The answer is w.  Update all the copies we saw
  // to point directly to w.  Doing this update makes
  // sure that we don't end up doing O(n^2) work
  // for a chain of n copies.
  while (v != w) {
    let x = v.args[0]
    v.setArg(0, w)
    v = x
  }
  return w
}


// copyelimValue ensures that no args of v are copies
//
export function copyelimValue(v :Value) {
  for (let i = 0; i < v.args.length; i++) {
    let a = v.args[i]
    if (a.op === ops.Copy) {
      v.setArg(i, copySource(a))
    }
  }
}
