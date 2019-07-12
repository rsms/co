import { monotime, fmtduration2 } from '../time'
import { Fun } from './ssa'
import { Config } from './config'

import { phielim } from './phielim'
import { copyelim } from './copyelim'
import { lower } from './lower'
import { deadcode } from './deadcode'
import { shortcircuit } from './shortcircuit'
import { regalloc } from './regalloc'
import { layout } from './layout'


type PassFun = (f :Fun, c :Config) => void

export interface Pass {
  name     :string
  required :bool
  fn       :PassFun
}

function optional(name :string, fn :PassFun) : Pass {
  return { name, fn, required: false }
}

function required(name :string, fn :PassFun) : Pass {
  return { name, fn, required:true }
}


// good next candidates for writing:
// - loopRotate
// - zcse (common-subexpression elimination, zero-arg values; pre-full-cse)
//
// bigger challenges:
// - opt (step 1: generic rewrites)
// - opt (step 2: generic optimizations)
//   - implies writing a "rule" code generator utility
// - decompose (phi compound builtin types -> phi simple types)
//

// All IR passes run over functions
//
const passes :Pass[] = [
  // optional("early phielim", phielim),
  // optional("early copyelim", copyelim),
  optional("early deadcode", deadcode),

  optional("short circuit", shortcircuit),

  // required("decompose user", decomposeUser),
  // required("opt", opt), // TODO: split required rules and optimizing rules
  // required("zero arg cse", zcse), // required to merge OpSB values
  // required("opt deadcode", deadcode), // remove blocks orphaned during opt
  // optional("generic cse", cse),
  // optional("phiopt", phiopt),
  // optional("nilcheckelim", nilcheckelim),
  // optional("prove", prove),
  // required("decompose builtin", decomposeBuiltIn),
  // required("softfloat", softfloat),
  // required("late opt", opt),
  //   // TODO: split required rules and optimizing rules
  // optional("dead auto elim", elimDeadAutosGeneric),
  required("generic deadcode", deadcode),
    // remove dead stores, which otherwise mess up store chain
  // optional("check bce", checkbce),
  // optional("branchelim", branchelim),
  // optional("fuse", fuse),
  // optional("dse", dse), // deadstore
  // required("writebarrier", writebarrier), // expand write barrier ops

  // optional("insert resched checks", insertLoopReschedChecks),
  //   // insert resched checks in loops.

  required("lower", lower),
  // optional("lowered cse", cse),
  // optional("elim unread autos", elimUnreadAutos),
  required("lowered deadcode", deadcode),
  // required("checkLower", checkLower),
  optional("late phielim", phielim),
  optional("late copyelim", copyelim),
  // optional("tighten", tighten), // move values closer to their uses
  // optional("phi tighten", phiTighten),
  optional("late deadcode", deadcode),
  // required("critical", critical), // remove critical edges
  // optional("likelyadjust", likelyadjust),

  required("layout", layout),     // schedule blocks
  // required("schedule", schedule), // schedule values
  // optional("late nilcheck", nilcheckelim2),
  // required("flagalloc", flagalloc), // allocate flags register
  required("regalloc", regalloc), // allocate registers & stack slots
  // optional("loop rotate", loopRotate),
  // required("stackframe", stackframe),
  // optional("trim", trim), // remove empty blocks
]


export function runPasses(f :Fun, c :Config, post? :(p:Pass)=>any) {
  for (let p of passes) {
    if (c.optimize || p.required) {
      p.fn(f, c)
      if (post) {
        post(p)
      }
    }
  }
}


export function runPassesDev(
  f :Fun,
  c :Config,
  stopAt :string,  // name of a pass to stop at (exclusive)
  post? :(p:Pass)=>any
) {
  let totaltime = 0
  for (let p of passes) {
    if (p.name == stopAt) {
      break
    }
    if (c.optimize || p.required) {
      console.log(`running pass ${p.name}`)

      let t = monotime()
      p.fn(f, c)
      t = monotime() - t
      totaltime += t

      console.log(`pass ${p.name} finished in ${fmtduration2(t)}`)

      if (post) {
        post(p)
      }
    }
  }
  console.log(
    `passes over ${f.name} finished in a total ${fmtduration2(totaltime)}`
  )
}
