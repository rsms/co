import { Value, Block, BlockKind, Fun, BranchPrediction } from './ssa'
import { phielimValue } from './phielim'
import { copyelim } from './copyelim'
import { ops, opinfo } from "./ops"

// import { printir } from './repr'
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

  // debug log
  dlog(`reachable blocks:  ` +
    reachable
      .map((reachable, id) => reachable ? "b"+id : undefined)
      .filter(id => id !== undefined)
      .join("  ")
  )

  // remove edges from dead to live code
  for (let b of f.blocks) {
    if (reachable[b.id]) {
      continue
    }
    dlog(`${b} is dead; remove edges to live blocks`)
    for (let i = 0; i < b.succs.length;) {
      let sb = b.succs[i]
      if (reachable[sb.id]) {
        dlog(`  remove edge ${sb} -> ${b}`)
        removeEdge(b, i)
      } else {
        // sb not reachable (no need to disconnect)
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
  let s = new Set<int>()
  // let i = 0
  for (let [key, e] of f.namedValues) {
    let j = 0
    s.clear()
    let values = e.values
    for (let v of values) {
      if (live[v.id] && !s.has(v.id)) {
        values[j] = v
        j++
        s.add(v.id)
      }
    }
    if (j == 0) {
      f.namedValues.delete(key)
    } else {
      // f.names[i] = key
      // i++
      // for (let k = values.length - 1; k >= j; k--) {
      //   // values[k].uses--
      //   ;(values as any)[k] = null
      // }
      // e.values = values.slice(0, j)
      values.length = j
    }
  }
  // f.names.length = i

  dlog(`live names:`, Array.from(f.namedValues.keys()).join(', '))

  // Unlink values
  for (let b of f.blocks) {
    if (!reachable[b.id]) {
      b.setControl(null)
      // for (let v of b.values) {
      //   // v.uses = 0
      //   v.resetArgs()
      // }
      // continue
    }
    // dlog(`${b}`)
    for (let v of b.values) {
      if (!live[v.id]) {
        // dlog(`  ${v}.resetArgs() ${v.args}`)
        // for (let arg of v.args) {
        //   // dlog(`  ${arg}.resetArgs()`)
        //   arg.resetArgs()
        // }
        v.resetArgs()
      } //else dlog(`  ${v}   (keep live)`)
    }
  }

  // print('———————————————————————————-')
  // printir(f)

  // decrement use counters of unused args and reduce Phis
  for (let b of f.blocks) {
    if (!reachable[b.id]) {
      continue
    }
    for (let v of b.values) {
      if (v.op == ops.Phi) {
        let args = v.args
        if (live[v.id]) {
          let i = 0
          for (let a of v.args) {
            if (live[a.id]) {
              dlog(`phireduce keep ${v}[${a}]`)
              v.args[i++] = a
            } else {
              dlog(`phireduce remove ${v}[${a}]`)
              a.uses--
            }
          }
          v.args.length = i
          phielimValue(v)
        } else {
          for (let a of v.args) {
            dlog(`phireduce remove ${v}[${a}]`)
            a.uses--
          }
        }
      }
    }
  }

  // print('———————————————————————————-')
  // printir(f)

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
      assert(
        b.values.length == 0,
        `live values in unreachable block ${b}: ${b.values.join(', ')}`
      )
      f.freeBlock(b)
    }
  }

  f.blocks.length = i

  // print('———————————————————————————-')
  // printir(f)
  // process.exit(0)

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
    let s = b.succs
    if (b.kind == BlockKind.First) {
      // Drop 2nd block from being considered reachable.
      // BlockKind.First indicates that only the first path is
      // ever taken, never the second.
      s.splice(1, 1)
    }
    for (let c of s) {
      assert(
        c.id < reachable.length,
        `block ${c} >= f.numBlocks()=${reachable.length}`
      )
      if (!reachable[c.id]) {
        reachable[c.id] = true
        p.push(c)
      }
    }
  }
  return reachable
}


// liveValues returns the live values in f and a list of values that are
// eligible to be statements in reversed data flow order.
// reachable is a map from block id to whether the block is reachable.
//
function liveValues(f :Fun, reachable :bool[]) :bool[] {
  let live = new Array<bool>(f.numValues())

  // After regalloc, consider all values to be live.
  // See the comment at the top of regalloc.go and in deadcode for details.
  if (f.regAlloc) {
    live.fill(true)
    return live
  }

  // TODO: inlining // Record all the inline indexes we need
  // let liveInlIdx = new Map<int,bool>()
  // let pt = f.config.ctxt.PosTable
  // ...

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
      // dlog(`flag live block control ${v}`)
      live[v.id] = true
      q.push(v)
    }
    for (let v of b.values) {
      let info = opinfo[v.op]
      if ((info.call || info.hasSideEffects) && !live[v.id]) {
        // dlog(`flag live call/side-effect ${v}`)
        live[v.id] = true
        q.push(v)
      }
      if (info.type && info.type.isNil() && !live[v.id]) {
        // The only Void ops are nil checks and inline marks.  We must keep these.
        // if (v.op == ops.InlMark && !liveInlIdx[v.auxInt]) {
        //   // We don't need marks for bodies that
        //   // have been completely optimized away.
        //   // TODO: save marks only for bodies which
        //   // have a faulting instruction or a call?
        //   continue
        // }
        // dlog(`flag live niltype ${v}`)
        live[v.id] = true
        q.push(v)
      }
    }
  }

  dlog(`live: ${live.map((v, i) => [v,"v"+i]).filter(v => v[0] !== undefined).map(v => v[1])}`)
  dlog(`q: ${q}`)

  // Compute transitive closure of live values.
  while (q.length > 0) {
    // pop a reachable value
    let v = q.pop()!
    dlog(`${v} reachable`)
    for (let i = 0; i < v.args.length; i++) {
      let x = v.args[i]
      if (v.op == ops.Phi && !reachable[v.b.preds[i].id]) {
        dlog(`  args[${i}] = ${x}  --  skip phi`)
        continue
      }
      if (reachable[x.b.id] && !live[x.id]) {
        dlog(`    args[${i}] = ${x}  --  promote to live`)
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



// removeEdge removes the i'th outgoing edge from b
// (and the corresponding incoming edge from b.succs[i])
//
export function removeEdge(b :Block, i :int) {
  let c = b.succs[i]
  let j = c.preds.indexOf(b)

  // index of reverse edge.  Invariant:
  //   e := x.succs[idx]
  //   e.b.preds[e.i] = Edge(x,idx)
  assert(b.succs[i] === c)
  // index of reverse edge.  Invariant:
  //   e := x.preds[idx]
  //   e.b.succs[e.i] = Edge(x,idx)
  assert(b === c.preds[j])

  // Adjust b.succs
  b.removeSucc(i)

  // Adjust c.preds
  c.removePred(j)

  // Remove phi args from c's phis.
  let n = c.preds.length
  for (let v of c.values) {
    if (v.op != ops.Phi) {
      continue
    }
    // remove the edge from Phi's args, i.e. (Phi x y) -> (Phi x)
    v.args[j].uses--
    v.args[j] = v.args[n]
    v.args.length = n

    // x = (Phi y _) -> x = (Copy y)
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

