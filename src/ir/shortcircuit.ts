// import { debuglog as dlog } from '../util'
import { Value, Fun, BlockKind } from './ssa'
import { ops } from './op'
import { t_bool } from '../types'

// Shortcircuit finds situations where branch directions
// are always correlated and rewrites the CFG to take
// advantage of that fact.
// This optimization is useful for compiling && and || expressions.
//
export function shortcircuit(f :Fun) {
  // Step 1: Replace a phi arg with a constant if that arg
  // is the control value of a preceding If block.
  // b1:
  //    If a goto b2 else b3
  // b2: <- b1 ...
  //    x = phi(a, ...)
  //
  // We can replace the "a" in the phi with the constant true.
  let ct :Value|null = null   // cont true
  let cf :Value|null = null;  // cont false
  for (let b of f.blocks) {
    // visit all Phis in the block
    for (let v of b.values) {
      if (v.op !== ops.Phi) {
        continue
      }
      if (v.type !== t_bool) {
        continue
      }
      for (let i = 0; i < v.args.length; i++) {
        let p = b.preds[i]
        if (p.kind != BlockKind.If) {
          continue
        }
        let a = v.args[i]
        if (p.control !== a) {
          continue
        }
        // ei is reverse edge index of succ -> b
        let ei = p.succs.indexOf(b)
        if (ei == 0) {
          if (!ct) {
            ct = f.constBool(true)
          }
          v.setArg(i, ct)
        } else {
          if (!cf) {
            cf = f.constBool(false)
          }
          v.setArg(i, cf)
        }
      }
    }
  }

  // Step 2: Compute which values are live across blocks.
  // This is lazily called by Step 3 as it's often not needed.
  let live :bool[]|undefined
  const computeLive = () : bool[] => {
    let live = new Array<bool>(f.numValues())
    for (let b of f.blocks) {
      for (let v of b.values) {
        for (let a of v.args) {
          if (a.b !== v.b) {
            live[a.id] = true
          }
        }
      }
      if (b.control && b.control.b !== b) {
        live[b.control.id] = true
      }
    }
    // dlog(`live values:`,
    //   live
    //     .map((_,id) => id)
    //     .filter(id => id !== undefined)
    //     .map(id => `v${id}`)
    //     .join(', ')
    // )
    return live
  }

  // Step 3: Redirect control flow around known branches.
  // p:
  //   ... goto b ...
  // b: <- p ...
  //   v = phi(true, ...)
  //   if v goto t else u
  // We can redirect p to go directly to t instead of b.
  // (If v is not live after b).
  for (let b of f.blocks) {
    if (b.kind != BlockKind.If) {
      continue
    }
    if (b.values.length != 1) {
      continue
    }
    let v = b.values[0]
    if (v.op !== ops.Phi) {
      continue
    }
    if (b.control !== v) {
      continue
    }
    if (!live) {
      live = computeLive()
    }
    if (live[v.id]) {
      continue
    }
    for (let i = 0; i < v.args.length; i++) {
      let a = v.args[i]
      if (a.op !== ops.ConstBool) {
        continue
      }

      // The predecessor we come in from.
      let p = b.preds[i]
      let pi = p.succs.indexOf(b)
      // let e1 := b.Preds[i]
      // p := e1.b
      // pi := e1.i

      // The successor we always go to when coming in from that predecessor.
      // Note: a.aux = true|false = 1|0
      let t = b.succs[1 - (a.aux as number)]
      let ti = t.preds.indexOf(b)

      // Remove b's incoming edge from p.
      b.removeNthPred(i)
      let n = b.preds.length
      v.args[i].uses--
      v.args[i] = v.args[n]
      v.args.length = n

      // Redirect p's outgoing edge to t.
      p.succs[pi] = t

      // Fix up t to have one more predecessor.
      t.preds.push(p)
      for (let w of t.values) {
        if (w.op !== ops.Phi) {
          continue
        }
        w.addArg(w.args[ti])
      }

      if (b.preds.length == 1) {
        v.op = ops.Copy
        // No longer a phi, stop optimizing here.
        break
      }
      i--
    }
  }
}
