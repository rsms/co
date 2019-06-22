import { Value, Fun } from './ssa'
import { ops } from "../arch/ops"
import { BlockRewriter, ValueRewriter } from './config'
import { phielimValue } from './phielim'
import { copySource } from './copyelim'

export function rewrite(f :Fun, rb :BlockRewriter, rv :ValueRewriter) {
  // repeat rewrites until we find no more rewrites
  while (true) {
    let change = false
    for (let b of f.blocks) {

      // eliminate trivial copies in control
      if (b.control && b.control.op === ops.Copy) {
        while (b.control.op === ops.Copy) {
          assert(b.control != null)
          assert(b.control.args[0] != null)
          b.setControl(b.control.args[0] as Value)
        }
      }

      // dlog(`call BlockRewriter on b${b.id}`)
      if (rb(b)) {
        change = true
      }

      for (let j = 0; j < b.values.length; j++) {
        let v = b.values[j]

        // Attempt to eliminate/reduce Phi to a Copy, in case a previous
        // dead-code pass removed one of the values, or short-circuited v.
        //
        // This is rarely useful since we effectively eliminate trivial Phis
        // buring intial IR construction.
        //
        change = phielimValue(v) || change

        // Eliminate copy inputs
        // If any copy input becomes unused, mark it
        // as invalid and discard its argument. Repeat
        // recursively on the discarded argument.
        // This phase helps remove phantom "dead copy" uses
        // of a value so that a x.Uses==1 rule condition
        // fires reliably.
        for (let i = 0; i < v.args.length; i++) {
          let a = v.args[i]
          if (a.op !== ops.Copy) {
            continue
          }
          let aa = copySource(a)
          v.setArg(i, aa)

          change = true
          while (a.uses == 0) {
            let b = a.args[0]
            a.reset(ops.Invalid)
            a = b
          }
        }

        // apply rewrite function
        change = rv(v) || change
      }
    }

    if (!change) {
      break
    }
  }

  // remove clobbered values
  for (let b of f.blocks) {
    let j = 0
    for (let i = 0; i < b.values.length; i++) {
      let v = b.values[i]
      if (v.op === ops.Invalid) {
        f.freeValue(v)
        continue
      }
      if (i != j) {
        b.values[j] = v
      }
      j++
    }
    b.values.length = j
  }

}



// // Note that Nilcheck often vanishes, but when it doesn't, you'd love to start the statement there
// // so that a debugger-user sees the stop before the panic, and can examine the value.
// const poorStatementOps = new Set<Op>([
//   // ops.Addr,
//   // ops.LocalAddr,
//   // ops.OffPtr,
//   // ops.StructSelect,
//   ops.ConstBool,
//   ops.ConstI8,
//   ops.ConstI16,
//   ops.ConstI32,
//   ops.ConstI64,
//   ops.ConstF32,
//   ops.ConstF64,
// ])

// // nextGoodStatementIndex returns an index at i or later that is believed
// // to be a good place to start the statement for b.  This decision is
// // based on v's Op, the possibility of a better later operation, and
// // whether the values following i are the same line as v.
// // If a better statement index isn't found, then i is returned.
// function nextGoodStatementIndex(v :Value, i :int, b :Block) :int {
//   // If the value is the last one in the block, too bad, it will have to do
//   // (this assumes that the value ordering vaguely corresponds to the source
//   // program execution order, which tends to be true directly after ssa is
//   // first built.
//   if (i >= b.valcount - 1) {
//     return i
//   }
//   // Only consider the likely-ephemeral/fragile opcodes expected to vanish
//   // in a rewrite.
//   if (!poorStatementOps.has(v.op)) {
//     return i
//   }
//   // Look ahead to see what the line number is on the next thing that
//   // could be a boundary.
//   for (let j = i + 1; j < b.valcount; j++) {
//     if (posIsStmt(b.values[j].pos) == PosNotStmt) { // ignore non-statements
//       continue
//     }
//     if (posLine(b.values[j].pos) == posLince(v.pos)) {
//       return j
//     }
//     return i
//   }
//   return i
// }
