import { Value, Block, BlockKind, Fun, BranchPrediction } from './ssa'
import { phielimValue } from './phielim'
import { copyelim } from './copyelim'
import { ops } from './op'

// import { debuglog as dlog } from '../util'
const dlog = function(..._ :any[]){} // silence dlog


// deadcode removes dead code from f
//
export function deadcode(f :Fun) {
  // deadcode after regalloc is forbidden for now. Regalloc
  // doesn't quite generate legal SSA which will lead to some
  // required moves being eliminated.
  assert(f.regAlloc == null, `deadcode after regalloc for ${f}`)

  // Find reachable blocks.
  let reachable = reachableBlocks(f)
  dlog(`reachable blocks:`,
    reachable
      .map((reachable, id) => reachable ? id : undefined)
      .filter(id => id !== undefined)
      .join('  ')
  )

  // remove edges from dead to live code
  for (let b of f.blocks) {
    if (reachable[b.id]) {
      continue
    }
    let nsuccs = b.succs ? b.succs.length : 0
    for (let i = 0; i < nsuccs; ) {
      let e = b.succs[i]
      if (reachable[e.id]) {
        removeEdge(b, i)
      } else {
        i++
      }
    }
  }

  // remove dead edges from live code
  for (let b of f.blocks) {
    if (!reachable[b.id]) {
      continue
    }
    if (b.kind != BlockKind.First) {
      continue
    }
    removeEdge(b, 1)
    b.kind = BlockKind.Plain
    b.likely = BranchPrediction.Unknown
  }

  // Splice out any copies introduced during dead block removal
  copyelim(f)

  // Find live values.
  let live = liveValues(f, reachable)
  dlog(`live values:`, Object.keys(live).map(k => 'v' + k).join(', '))


  // Remove dead & duplicate entries from namedValues map.
  let s = new Set<Value>()
  for (let [key, e] of f.namedValues) {
    // let loc = e.local
    let j = 0
    s.clear()
    for (let v of e.values) {
      if (live[v.id] && !s.has(v)) {
        e.values[j] = v
        j++
        s.add(v)
      }
    }
    if (j == 0) {
      f.namedValues.delete(key)
    } else {
      for (let k = e.values.length - 1; k >= j; k--) {
        e.values[k] = undefined as any as Value
      }
      e.values.length = j
    }
  }

  dlog(`live names':`, Array.from(f.namedValues.keys()).join(', '))

  // Unlink values and conserve statement boundaries
  for (let b of f.blocks) {
    if (!reachable[b.id]) {
      b.setControl(null)
    }
    for (let v of b.values) {
      if (!live[v.id]) {
        v.resetArgs()
      }
    }
  }

  // Remove dead values from blocks' value list
  for (let b of f.blocks) {
    let i = 0
    for (let v of b.values) {
      if (live[v.id]) {
        b.values[i] = v
        i++
      } else {
        f.freeValue(v)
      }
    }
    b.values.length = i
  }

  // Remove unreachable blocks
  let i = 0
  for (let b of f.blocks) {
    if (reachable[b.id]) {
      f.blocks[i] = b
      i++
    } else {
      if (b.values.length > 0) {
        panic(`live values in unreachable block ${b}: ${b.values.join(', ')}`)
      }
      f.freeBlock(b)
    }
  }

  f.blocks.length = i

} // deadcode



// ReachableBlocks returns the reachable blocks in f
//
function reachableBlocks(f :Fun) :bool[] {
  let reachable = new Array<bool>(f.numBlocks())
  reachable[f.entry.id] = true

  let p :Block[] = [] // stack-like worklist
  p.push(f.entry)

  while (p.length > 0) {
    // Pop a reachable block
    let b = p.pop() as Block

    // Mark successors as reachable
    let succs = b.succs
    if (succs) {
      if (b.kind == BlockKind.First) {
        // Drop 2nd block from being considered reachable.
        // BlockKind.First indicates that only the first path is
        // ever taken, never the second.
        succs = succs.slice(0, 1)
      }
      for (let c of succs) {
        assert(c.id < reachable.length,
          `block ${c} >= f.numBlocks()=${reachable.length}`)
        if (!reachable[c.id]) {
          reachable[c.id] = true
          p.push(c)
        }
      }
    }
  }
  return reachable
}


// liveValues returns the live values in f and a list of values that are
// eligible to be statements in reversed data flow order.
// reachable is a map from block ID to whether the block is reachable.
//
function liveValues(f :Fun, reachable :bool[]) :bool[] {
  let live = new Array<bool>(f.numBlocks())

  // After regalloc, consider all values to be live.
  // See the comment at the top of regalloc.go and in deadcode for details.
  if (f.regAlloc) {
    live.fill(true)
    // for (let i = 0; i < live.length; i++) {
    //   live[i] = true
    // }
    return live
  }

  // Find all live values
  let q :Value[] = [] // stack-like worklist of unscanned values

  // Starting set: all control values of reachable blocks are live.
  // Calls are live (because callee can observe the memory state).
  for (let b of f.blocks) {
    if (!reachable[b.id]) {
      continue
    }
    let v = b.control
    if (v && !live[v.id]) {
      live[v.id] = true
      q.push(v)
    }
    for (let v of b.values) {
      if ((v.op.call || v.op.hasSideEffects) && !live[v.id]) {
        live[v.id] = true
        q.push(v)
      }
      if (v.op.nilCheck && !live[v.id]) {
        // nil checks must be kept
        live[v.id] = true
        q.push(v)
      }
    }
  }

  // Compute transitive closure of live values
  while (q.length > 0) {
    // pop a reachable value
    let v = q.pop() as Value
    for (let i = 0; i < v.args.length; i++) {
      let x = v.args[i]
      if (v.op === ops.Phi && !reachable[v.b.preds[i].id]) {
        continue
      }
      if (!live[x.id]) {
        live[x.id] = true
        q.push(x)
      }
    }
  }

  return live
}


// function constControl(ctrl :Value) :Value {
//   let args :Value[]|undefined
//   for (let i = 0; i < ctrl.args.length; i++) {
//     let arg = ctrl.args[i]
//     if (arg.op === ops.Phi && arg.b === ifb) {
//       if (!args) {
//         args = ctrl.args.slice() // copy
//       }
//       assert(ifb.preds[0] === entryb, `entryb not at expected index`)
//       args[i] = arg.args[0]
//     }
//   }
//   // args will be set only if we found at least one Phi in control.args
//   if (args) {
//     // attempt constant evaluation of control value
//     let constctrl :Value|null = null
//     if (args.length == 2) {
//       constctrl = optcf_op2(ifb, control.op, args[0], args[1])
//     } else if (args.length == 1) {
//       constctrl = optcf_op1(ifb, control.op, args[0])
//     }
//     if (constctrl && constctrl.auxIsZero()) {
//       // while loop never taken -- shortcut entryb -> nextb
//       removeEdge(entryb, 0)
//       entryb.succs = [nextb]
//       removeEdge(ifb, 0)
//       nextb.preds = [entryb]
//       // s.f.removeBlock(ifb)
//       // s.f.removeBlock(thenb)
//     }
//   }
// }


// removeEdge removes the i'th outgoing edge from b (and the corresponding
// incoming edge from b.succs[i])
//
export function removeEdge(b :Block, i :int) {
  // e := b.Succs[i]
  // c := e.b
  // j := e.i
  //
  // // Adjust b.Succs
  // b.removeSucc(i)
  //
  // // Adjust c.Preds
  // c.removePred(j)

  // index of reverse edge.  Invariant:
  //   e := x.Succs[idx]
  //   e.b.Preds[e.i] = Edge{x,idx}
  // and similarly for predecessors.
  //
  // index of reverse edge.  Invariant:
  //   e := x.Preds[idx]
  //   e.b.Succs[e.i] = Edge{x,idx}
  //

  let c = b.succs[i]

  // Adjust b.succs (see details of Adjust c.preds below)
  b.removeNthSucc(i)

  // Adjust c.preds.
  // This removes b from c.preds and reduces c.preds.length by 1
  // The returned value is the index of b as it was in c.preds before removal.
  let j = c.removePred(b)

  // Remove phi args from c's phis.
  let n = c.preds.length
  for (let v of c.values) {
    if (v.op !== ops.Phi) {
      continue
    }
    // remove the edge from Phi's args, i.e. (Phi x y) -> (Phi x)
    v.args[j].uses--
    v.args[j] = v.args[n]
    v.args.length = n

    // (Phi x) -> (Copy x)
    phielimValue(v)

    // [from go/src/cmd/compile/internal/ssa/deadcode.go]
    //
    // Note: this is trickier than it looks. Replacing
    // a Phi with a Copy can in general cause problems because
    // Phi and Copy don't have exactly the same semantics.
    // Phi arguments always come from a predecessor block,
    // whereas copies don't. This matters in loops like:
    // 1: x = (Phi y)
    //    y = (Add x 1)
    //    goto 1
    // If we replace Phi->Copy, we get
    // 1: x = (Copy y)
    //    y = (Add x 1)
    //    goto 1
    // (Phi y) refers to the *previous* value of y, whereas
    // (Copy y) refers to the *current* value of y.
    // The modified code has a cycle and the scheduler
    // will barf on it.
    //
    // Fortunately, this situation can only happen for dead
    // code loops. We know the code we're working with is
    // not dead, so we're ok.
    // Proof: If we have a potential bad cycle, we have a
    // situation like this:
    //   x = (Phi z)
    //   y = (op1 x ...)
    //   z = (op2 y ...)
    // Where opX are not Phi ops. But such a situation
    // implies a cycle in the dominator graph. In the
    // example, x.Block dominates y.Block, y.Block dominates
    // z.Block, and z.Block dominates x.Block (treating
    // "dominates" as reflexive).  Cycles in the dominator
    // graph can only happen in an unreachable cycle.
  }
}

