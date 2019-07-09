import { UInt64 } from '../int64'
import { Pos } from '../pos'
import { Mem, t_u32, intTypes } from '../types'
import { ID, Fun, Block, Value, BranchPrediction, Location } from './ssa'
import { Config } from './config'
import { DesiredState } from './reg_desiredstate'
import { IntGraph } from '../intgraph'
import { Op } from './op'
import { ops, opinfo } from "./ops"
import {
  Register,
  Reg,
  RegSet,
  RegInfo,
  fmtRegSet,
  emptyRegSet,
  nilRegInfo,
} from './reg'

import { debuglog as dlog } from '../util'
// const dlog = function(..._ :any[]){} // silence dlog

const allocatorCache = new Map<Config,RegAllocator>()
let allocator :RegAllocator|null = null

// regalloc allocates registers for function f
//
export function regalloc(f :Fun, config :Config) {
  if (!allocator || allocator.config !== config) {
    allocator = allocatorCache.get(config) || null
    if (!allocator) {
      allocator = new RegAllocator(config)
      allocatorCache.set(config, allocator)
    }
  }
  allocator.regallocFun(f)
}


// distance is a measure of how far into the future values are used.
// distance is measured in units of instructions.
const
  likelyDistance   = 1
, normalDistance   = 10
, unlikelyDistance = 100



interface LiveInfo {
  id   :ID   // ID of value
  dist :int  // # of instructions before next use
  pos  :Pos  // source position of next use
}


interface ValMapEntry {
  val :int
  pos :Pos
}


const maxregs = 64  // maximum number of registers we can manage
const noReg :Reg = 255 >>> 0  // symbolizes "none"


// countRegs returns the number of set bits in the register mask.
//
function countRegs(m :RegSet) :int {
  return m.popcnt()
  // let n = 0
  // while (m != 0) {
  //   n += m & 1
  //   m >>= 1
  // }
  // return n
}


// pickReg picks an arbitrary register from the register mask.
//
function pickReg(m :RegSet) :Reg {
  // pick the lowest one
  if (m.isZero()) {
    panic("can't pick a register from an empty set")
  }
  for (let i :Reg = 0; ; i++) {
    if (!m.and(UInt64.ONE).isZero()) {
      return i
    }
    m = m.shr(1) // m = m >> 1
  }
}

// interface Use {
//   dist :int      // distance from start of the block to a use of a value
//   next :Use|null // linked list of uses of a value in nondecreasing dist order
//   // pos  :Pos   // source position of the use
// }

// ValState records the register allocation state for a (pre-regalloc) value.
class ValState {
  v          :Value
  regs       = emptyRegSet as RegSet
    // the set of registers holding a Value (usually just one)
  // uses       = null as Use|null   // list of uses in this block
  // spill      = null as Value|null // spilled copy of the Value (if any)
  // restoreMin = 0 as int  // minimum of all restores' blocks' sdom.entry
  // restoreMax = 0 as int  // maximum of all restores' blocks' sdom.exit
  needReg    = false as bool // cached value of
    // !v.Type.IsMemory() && !v.Type.IsVoid() && !.v.Type.IsFlags()
  rematerializeable = false as bool  // cached value of v.rematerializeable()

  mindist :int = 0  // distance between definition and first use
  maxdist :int = 0  // distance between definition and last use

  constructor(v :Value) {
    this.v = v
  }
}


// interface RegState {
//   v :Value|null // Original (preregalloc) Value stored in this register.
//   c :Value|null // A Value equal to v which is currently in a register.
//                 // Might be v or a copy of it.
//   // If a register is unused, v==c==nil
// }


export class RegAllocator {
  readonly config :Config
  readonly addrsize :Mem
  readonly addrtype = t_u32

  // labels :Map<Value,int>  // maps values to addresses

  readonly registers   :Register[]  // registers of the target architecture
  readonly numregs     :int         // always == registers.length
  readonly allocatable :RegSet      // registers we are allowed to allocate

  f          :Fun  // function being processed
  visitOrder :Block[] = []

  SPReg :Reg  // the SP register
  SBReg :Reg  // the SB register
  GReg  :Reg  // the g register (current coroutine)

  // current state of each (preregalloc) Value
  values :ValState[] = []

  sp :int // ID of SP register Value
  sb :int // ID of SB register Value

  // current state of each register
  // regs :RegState[]

  nospill :RegSet  // registers that contain values which can't be kicked out
  used    :RegSet  // registers currently in use
  tmpused :RegSet  // registers used in the current instruction

  gpSpillReg :Reg = -1  // reserved spill register. -1 = nothing reserved

  // live and desired holds information about block's live values at the end
  // of the block, and those value's desired registers (if any.)
  // These are created by computeLive()
  live    :LiveInfo[][] = []  // indexed by block
  desired :DesiredState[] = []


  constructor(config :Config) {
    const a = this

    this.config = config
    this.addrtype = intTypes(config.addrSize)[1]
    this.addrsize = config.addrSize

    // TODO provide registers as an argument
    this.registers = config.registers
    this.numregs = config.registers.length
    if (a.numregs == 0 || a.numregs > maxregs) {
      panic(`invalid number of registers: ${a.numregs}`)
    }

    // Locate SP, SB, and g registers.
    this.SPReg = noReg
    this.SBReg = noReg
    this.GReg = noReg
    for (let r :Reg = 0; r < a.numregs; r++) {
      switch (a.registers[r].name) {
        case "SP": a.SPReg = r; break
        case "SB": a.SBReg = r; break
        case "g":  if (config.hasGReg) { a.GReg = r }; break
      }
    }
    if (a.SPReg == noReg) { panic("no SP register found") }
    if (a.SBReg == noReg) { panic("no SB register found") }
    if (config.hasGReg && a.GReg == noReg) { panic("no g register found") }

    // Figure out which registers we're allowed to use.
    this.allocatable = config.gpRegMask.or(config.fpRegMask.or(config.specialRegMask))

    // .allocatable &^= 1 << s.SPReg
    // .allocatable = .allocatable & ~(1 << s.SPReg)
    this.allocatable = this.allocatable.and(UInt64.ONE.shl(a.SPReg).not())
    this.allocatable = this.allocatable.and(UInt64.ONE.shl(a.SBReg).not())
    if (config.hasGReg) {
      this.allocatable = this.allocatable.and(UInt64.ONE.shl(a.GReg).not())
    }

    // dlog(`allocatable:`, fmtRegSet(a.allocatable))
  }


  regallocFun(f :Fun) {
    const a = this
    a.f = f

    // reset spill reg
    a.gpSpillReg = -1

    assert(f.regAlloc == null, `registers already allocated for ${f}`)
    f.regAlloc = new Array<Location>(f.numValues())  // TODO: fill this

    // Assign stack pointer (SP) and static base pointer (SB) registers.
    // Note that dead-code elimination might have removed SP, SB or both.
    // However, we know that they are always in the same order (SP, SB), so
    // we look at the two first values in the block.
    let v1 = f.entry.values[1]
    let v2 = f.entry.values[2]
    if (v1) {
      if (v1.op == ops.SP) {
        v1.reg = a.registers[this.SPReg]
        if (v2 && v2.op == ops.SB) {
          v2.reg = a.registers[this.SBReg]
        }
      } else if (v1.op == ops.SB) {
        v1.reg = a.registers[this.SBReg]
      }
    }
    // TODO: if we spill and we don't have SP, reintroduce SP.

    // // Add SP (stack pointer) value to the top of the entry block.
    // // TODO: track the need for this when generating the initial IR.
    // // Some functions do not need SP.
    // const SP = f.newValue(f.entry, ops.SP, a.addrtype, 0, null)
    // SP.reg = a.registers[this.SPReg]
    // f.entry.pushValueFront(SP)
    // dlog("TODO: assign SP reg to SP")

    // Decouple the register allocation order from the generated block order.
    // This also creates an opportunity for experiments to find a better order.
    // DISABLED
    // a.visitOrder = layoutOrder(f)
    // if (a.config.optimize) {
    //   // update function block order with new layout
    //   f.blocks = a.visitOrder
    // }
    a.visitOrder = f.blocks

    // Compute block order. This array allows us to distinguish forward edges
    // from backward edges and compute how far they go.
    // DISABLED
    // let blockOrder = new Array<int>(f.numBlocks())
    // for (let i = 0; i < a.visitOrder.length; i++) {
    //   blockOrder[a.visitOrder[i].id] = i >>> 0
    // }

    // s.regs = make([]regState, s.numRegs)
    a.values = new Array<ValState>(f.numValues())
    // s.orig = make([]*Value, f.NumValues())
    // s.copies = make(map[*Value]bool)
    for (let b of a.visitOrder) {
      for (let v of b.values) {
        let t = v.type
        let val = new ValState(v)
        a.values[v.id] = val
        // if (!t.isMemory() && !t.isVoid() && !t.isFlags() && !t.isTuple())
        if (!t.isMemory && !t.isTuple() && !v.reg) {
          print(`needReg ${v}`)
          val.needReg = true
          val.rematerializeable = v.rematerializeable()
          // a.orig[v.id] = v
        }
      }
    }
    // dlog('a.values:', a.values)


    // we start by computing live ranges, mapping each value definition
    // to a set of values alive at the point of the definition.
    a.computeLive()
    dlog("\nlive values at end of each block\n" + a.fmtLive())

    // debug valstate
    if (DEBUG) {
      dlog(`\nvalstate:`)
      for (let vs of a.values) {
        if (vs) {
          dlog(`  v${vs.v.id} - ` + [
            ['needReg', vs.needReg],
            ['mindist', vs.mindist],
            ['maxdist', vs.maxdist],
          ].map(v => v.join(': ')).join(', '))
        }
      }
    }

    // We then build an interference graph of values that interfere.
    // Two values interfere if one of them is live at a definition point of
    // the other.
    let ig = a.buildInterferenceGraph()

    // debug log state of interference graph
    if (DEBUG) {
      let ifstr = ig.fmt()
      let vizurl = (
        'https://rsms.me/co/doc/chaitin/?'+
        'input=ifg&enable-briggs=1&immediate=1&ifg=' +
        encodeURIComponent(
          ifstr.trim().split(/[\r\n]+/).map(s => s.trim()).join('\n')
        ).replace(/\%20/g, '+')
      )
      dlog(`\ninterference:\n` + ifstr + '\nView at ' + vizurl)
    }

    let spills = a.pickValues(ig)

    // place LoadReg at spill users
    if (spills.length) {
      dlog(`spills:`,
        spills.length == 0 ? '(none)' :
        spills.reverse().map(id => `v${id}`).join(" ")
      )

      // build map of dependency => dependant
      let usermap = new Map<Value,Set<Value|Block>>()
      for (let b of a.visitOrder) {
        if (b.control) {
          let s = usermap.get(b.control)
          if (s) {
            s.add(b)
          } else {
            usermap.set(b.control, new Set<Value|Block>([b]))
          }
        }
        for (let v of b.values) {
          for (let arg of v.args) {
            let s = usermap.get(arg)
            if (s) {
              s.add(v)
            } else {
              usermap.set(arg, new Set<Value|Block>([v]))
            }
          }
        }
      }

      // dlog(`usermap:\n  ` +
      //   Array.from(usermap).map(
      //     ([v, us]) => ( `${v}\t` + Array.from(us).join(", "))
      //   ).join("\n  ")
      // )

      for (let sid of spills) {
        let v = a.values[sid].v
        let users = usermap.get(v)
        if (users) {
          for (let user of users) {
            if (user instanceof Value) {
              let load = user.b.f.newValue(user.b, ops.LoadReg, v.type, 0, null)
              load.addArg(v)
              load.reg = a.registers[a.gpSpillReg]
              let idx = user.b.values.indexOf(user)
              assert(idx != -1)
              user.b.values.splice(idx, 0, load)
              let aidx = user.args.indexOf(v)
              assert(aidx != -1)
              user.setArg(aidx, load)
            }
          }
        } else {
          assert(false, `${v} is spilled but has no users`)
        }
      }
    }
  }


  reserveGpSpillReg(r :Reg) {
    this.gpSpillReg = r
    dlog(`reserved spill register ${this.registers[r].name}`)
  }


  // pickValues assigns registers in a greedy fashion; e.g. say that some code
  // could be allocated in only 4 registerd without spilling, but the arch
  // has 8 available registers, this function might still make use of all
  // available registers. This should have no side effects or negative impact,
  // though it's good to know, would you wonder why many registers are used.
  //
  pickValues(ig :IntGraph) :ID[] {
    const a = this

    // {gp,fp}k is the maximum number of registers we have available for
    // general-purpose and floating-point registers.
    let gpk = countRegs(this.config.gpRegMask)
    // let fpk = countRegs(this.config.fpRegMask)
    // gpk = 4 // DEBUG XXX OVERRIDE test/dev spilling
    // fpk = 4 // DEBUG XXX OVERRIDE test/dev spilling

    // Stack of values
    let valstack :{id:ID, edges:Set<ID>}[] = []

    // Move values to stack, from interference graph
    let sortedIds = ig.keys()

    function sortIds() {
      sortedIds.sort((a, b) => ig.degree(a) - ig.degree(b))
      // dlog('sortedIds:', sortedIds.map(id =>
      //   `\n  v${id} : ${ig.degree(id)}` ).join(''))
    }

    // initial sorting of IDs
    sortIds()

    // reserve preemptively.
    // When disabled, the reserveGpSpillReg function is called at the first
    // sight of what might lead to spill during the picking phase.
    // this.reserveGpSpillReg(--gpk)

    dlog('\n---------------------------------------------------------')

    // isSpilling
    //   During the picking phase, this is set to true if we pick n.degree >= R
    //   During the put-back phase, this is used to decide when to reserve
    //   a spill register.
    let isSpilling = false

    pick_loop: while (true) {
      // console.log('nodes:', ig.keys().map(id =>
      //   `\n  v${id} : ${ig.degree(id)}` ).join(''))

      // try picking a node with degree < R
      for (let i = 0; i < sortedIds.length; i++) {
        let id = sortedIds[i]
        let edges = ig.edges(id) as Set<ID>
        assert(edges, `missing edge data for v${id}`)
        if (edges.size < gpk) {
          dlog(`pick v${id} with degree ${edges.size} < R`)
          sortedIds.splice(i, 1)
          ig.remove(id)
          valstack.push({ id, edges })
          continue pick_loop
        }
      }

      if (ig.length == 0) {
        dlog(`picking done`)
        break
      }

      // we didn't find a node with degree < R.
      // Optimistically pick next and continue
      let id = sortedIds.shift() as ID
      let edges = ig.edges(id) as Set<ID>
      dlog(`pick v${id} with degree ${edges.size} >= R (may spill)`)
      ig.remove(id as ID)
      valstack.push({ id, edges })

      isSpilling = true
    }

    dlog('valstack:', valstack.map(v => `v${v.id}`).join(' '))

    // possible spill?
    // This branch trades compilation time for smaller code size and better
    // code efficiency. It can be avoided to speed up compilation.
    // TODO: consider only taking this branch if config.optimize==true
    if (isSpilling) {
      isSpilling = false
      // register number (round-robin incremented by loops)
      let reg = -1
      let rallocmap = new Map<ID,int>()
      spill_check_loop: for (let i = valstack.length; i > 0;) {
        let v = valstack[--i]

        // pick next register (round-robin)
        reg = (reg + 1) % gpk

        let gpcount = gpk
        reg_conflict_loop1: while (gpcount--) {
          for (let id2 of v.edges) {
            let reg2 = rallocmap.get(id2)
            if (reg2 != -1 && reg2 == reg) {
              // conflict
              // definitely spilling
              isSpilling = true
              break spill_check_loop
              // reg = (reg + 1) % gpk
              // continue reg_conflict_loop1
            }
          }
          // ok -- picked reg does not conflict with interfering values
          break
        }

        rallocmap.set(v.id, reg)
      }
    }


    if (isSpilling) {
      // Reserve spill register.
      //
      // We take an opportunistic approach to reserving a register for
      // spills by doing it only when we _might_ spill, i.e. when picking
      // results in selecting a node with interference greater than the
      // number of available registers. This allows us to use all available
      // registers in cases where there is no spill. However, the downside
      // is that since we do not actually know for sure if picking a node
      // leads to a spill later on, we can paradoxically cause spills which
      // would otherwise be avoidable with the same number of registers.
      //
      // TODO: Consider a multi-pass approach, perhaps when config.optimize
      // is set. We would trade compilation time for possibly much better
      // code, but how much better remains to be tested & researched.
      this.reserveGpSpillReg(--gpk)
    }

    // Values that definitely spill (returned from this function)
    let spills = [] as ID[]

    // rebuild ig by moving back values from the stack
    let reg = -1  // register number (round-robin incremented by loops)
    for (let i = valstack.length; i > 0;) {
      let v = valstack[--i]

      // pick next register (round-robin)
      reg = (reg + 1) % gpk

      // now, often round-robin is not enough. Resolve
      let gpcount = gpk
      let conflict = true
      reg_conflict_loop: while (gpcount--) {
        for (let id2 of v.edges) {
          let reg2 = a.values[id2].v.reg
          if (reg2 && reg2.num == reg) {
            // dlog(`conflict -- interfering v${id2} already assigned r${reg}`)
            reg = (reg + 1) % gpk
            continue reg_conflict_loop
          }
        }
        // ok -- picked reg does not conflict with interfering values
        conflict = false
        break
      }

      if (conflict) {
        // no assignable register -- spill
        // dlog(`unable to find register for v${v.id}`)

        reg = noReg

        // access SSA value
        let val = a.values[v.id]
        let x = val.v

        if (x.uses == 1 && x.b.control === x) {
          // Optimization: single-use "spills" that are block controls
          // move up to control point (end of block) if all of their
          // arguments are alive at the end of the block.
          // This seems to avoid a lot of spills.
          let idx = x.b.values.indexOf(x)
          assert(
            idx != -1,
            `${x} not in parent block's ${x}.b.values=${x.b.values}`
          )
          if (idx == x.b.values.length - 1) {
            // x is already last in b
            reg = a.gpSpillReg
          } else {
            let live = a.live[x.b.id]  // live values at end of b
            if (live) {
              // check to see if all of x's args are alive at end of block
              let ndead = x.args.length
              livecheck: for (let arg of x.args) {
                for (let e /*LiveInfo*/ of live) {
                  if (e.id == arg.id && --ndead == 0) {
                    break livecheck  // all args alive
                  }
                }
              }
              if (ndead == 0) {
                // move value to end of block
                x.b.values.splice(idx, 1)
                x.b.values.push(x)
                reg = a.gpSpillReg
              }
            }
          }
        }

        if (reg == noReg) {
          // spill
          // rewrite value as StoreReg with the original value as arg0
          assert(a.gpSpillReg != -1)
          spills.push(v.id)
          let y = x.clone()
          y.reg = a.registers[a.gpSpillReg]
          x.reset(ops.StoreReg)
          x.addArg(y)
          x.b.insertValue(x, y)
          dlog(`spill ${x} -> ${y}`)
        }
      }

      dlog(
        `pop v${v.id}`,
        `${reg == noReg ? "spill" : a.registers[reg].name} edges:`,
        Array.from(v.edges).map(id => `v${id}`).join(" ")
      )

      // add back into graph
      ig.add(v.id)
      for (let id2 of v.edges) {
        ig.connect(v.id, id2)
      }

      // assign register to value
      if (reg != noReg) {
        let val = a.values[v.id]
        assert(val.needReg, `unexpected v${v.id}.needReg=false`)
        val.v.reg = a.registers[reg]
        // Note: computeLive() consults a.values and only includes values
        // which needReg.
      } else {
        assert(!a.values[v.id].v.reg, `v${v.id}.reg != null; reg=noReg`)
      }

      // dlog(`ig.fmt():\n` + ig.fmt())
    }

    return spills
  }


  buildInterferenceGraph() :IntGraph {
    const a = this
    const f = a.f

    // Chaitin's algorithm for building the interference graph is fairly
    // straight forward:
    //
    //   for every block B in F:
    //     CurrLive = LiveOut(B)
    //     for I in B in reverse order:
    //       for definition D in I:
    //         add an interference from D to every element in ...
    //         ... CurrLive - {D} creating nodes if necessary
    //       for every definition D in I
    //         remove D from CurrLive
    //       for every use U in I
    //         add U to CurrLive
    //
    // Since our IR is in SSA form, we always have exactly one definition
    // per I, so the algorithm can be described in a simpler form:
    //
    //   for every block B in F:
    //     CurrLive = LiveOut(B)
    //     for I in B in reverse order:
    //       let D be the definition of I
    //       remove D from CurrLive
    //       add an interference from D to every element in CurrLive
    //       for every use U in I
    //         add U to CurrLive
    //

    let g = new IntGraph()

    // visit blocks in reverse order
    for (let i = f.blocks.length, b :Block|undefined ; b = f.blocks[--i]; ) {
      // live tracks currently-live IDs
      let live = new Set<ID>()
      let liveout :LiveInfo[] = a.live[b.id]
      if (liveout) {
        for (let e of liveout) {
          live.add(e.id)
        }
      }

      // visit instructions in reverse order
      for (let i = b.values.length-1; i >= 0; --i) {
        let v = b.values[i]
        let vinfo = a.values[v.id]

        if (g.length == 0) {
          // very first value.
          // we know there are no live values; this is the first.
          assert(live.size == 0, "empty graph but has live set")
          if (vinfo.needReg) {
            g.add(v.id)
          }
        } else {
          // remove definition from live set
          live.delete(v.id)

          // Do not create interference for Copy ops.
          // `v2 = Copy v1` does not create an interference between v1 and v2
          // because the two live ranges have the same value and
          // therefore can occupy the same register.
          if (vinfo.needReg && v.op != ops.Copy) {
            // update interference graph to add an edge from the definition v
            // to each other value alive at this point
            for (let id2 of live) {
              if (a.values[id2].needReg) {
                g.connect(v.id, id2)
              }
            }
          }
        }

        for (let operand of v.args) {
          live.add(operand.id)
        }
      }
    }

    return g
  }


  // regspec returns the RegInfo for operation op
  //
  regspec(op :Op) :RegInfo {
    // const a = this
    // if (op == ops.OpConvert) {
    //   // OpConvert is a generic op, so it doesn't have a
    //   // register set in the static table. It can use any
    //   // allocatable integer register.
    //   m := s.allocatable & s.f.Config.gpRegMask
    //   return regInfo{inputs: []inputInfo{{regs: m}},
    //     outputs: []outputInfo{{regs: m}}}
    // }
    return opinfo[op].reg || nilRegInfo
  }


  // computeLive computes a map from block ID to a list of value IDs live at
  // the end of that block. Together with the value ID is a count of how many
  // instructions to the next use of that value.
  // The resulting map is stored in this.live.
  //
  // computeLive also computes the desired register information at the end of
  // each block. This desired register information is stored in this.desired.
  //
  // TODO: this could be quadratic if lots of variables are live across lots of
  // basic blocks. Figure out a way to make this function (or, more precisely,
  // the user of this function) require only linear size & time.
  //
  computeLive() {
    const a = this
    const f = a.f

    a.live = new Array<LiveInfo[]>(f.numBlocks())
    a.desired = new Array<DesiredState>(f.numBlocks())

    let phis :Value[] = []

    let live = new Map<ID,ValMapEntry>()
    let t = new Map<ID,ValMapEntry>()

    // Keep track of which value we want in each register.
    let desired = new DesiredState()

    // Instead of iterating over f.blocks, iterate over their postordering.
    // Liveness information flows backward, so starting at the end increases
    // the probability that we will stabilize quickly.
    //
    // TODO: Do a better job yet. Here's one possibility:
    // Calculate the dominator tree and locate all strongly connected
    // components. If a value is live in one block of an SCC, it is live in all.
    // Walk the dominator tree from end to beginning, just once, treating SCC
    // components as single blocks, duplicated calculated liveness information
    // out to all of them.
    //
    let po = f.postorder()
    // dlog('postorder blocks:', po.join(' '))

    // will be set to true if f.invalidateCFG() needs to be called at the end
    // let invalidateCFG = false


    while (true) {
      let changed = false

      for (let b of po) {
        // Start with known live values at the end of the block.
        // Add b.values.length to adjust from end-of-block distance
        // to beginning-of-block distance.
        live.clear()
        let liv = a.live[b.id];  // LiveInfo[] | undefined
        if (liv) for (let e of liv) {
          live.set(e.id, { val: e.dist + b.values.length, pos: e.pos })
        }

        // Mark control value as live
        if (b.control && a.values[b.control.id].needReg) {
          live.set(b.control.id, { val: b.values.length, pos: b.pos })
        }

        // dlog(`live: ` + Array.from(live).map(p =>
        //   `v${p[0]} - v${p[1].val}`
        // ).join('\n'))

        // Propagate backwards to the start of the block
        // Assumes Values have been scheduled.
        phis = []
        for (let i = b.values.length - 1; i >= 0; i--) {
          let v = b.values[i]

          // definition of v -- remove from live
          let x = live.get(v.id)
          if (x) {
            // save longest distance
            a.values[v.id].maxdist = x.val
            live.delete(v.id)
          }

          if (v.op === ops.Phi) {
            // save phi ops for later
            phis.push(v)
            continue
          }
          if (opinfo[v.op].call) {
            for (let v of live.values()) {
              v.val += unlikelyDistance
            }
          }
          for (let arg of v.args) {
            if (a.values[arg.id].needReg) {
              live.set(arg.id, { val: i, pos: v.pos })
            }
          }
        }

        // Propagate desired registers backwards
        let other = a.desired[b.id]
        if (other) {
          desired.copy(other)
        } else {
          desired.clear()
        }

        for (let i = b.values.length - 1; i >= 0; i--) {
          let v = b.values[i]
          let prefs = desired.remove(v.id)
          if (v.op === ops.Phi) {
            // TODO: if v is a phi, save desired register for phi inputs.
            // For now, we just drop it and don't propagate
            // desired registers back though phi nodes.
            continue
          }
          let regspec = a.regspec(v.op)
          // Cancel desired registers if they get clobbered.
          desired.clobber(regspec.clobbers)
          // Update desired registers if there are any fixed register inputs.
          for (let j of regspec.inputs) {
            if (countRegs(j.regs) != 1) {
              continue
            }
            desired.clobber(j.regs)
            desired.add(v.args[j.idx].id, pickReg(j.regs))
          }
          // Set desired register of input 0 if this is a 2-operand instruction.
          if (opinfo[v.op].resultInArg0) {
            if (opinfo[v.op].commutative) {
              desired.addList(v.args[1].id, prefs)
            }
            desired.addList(v.args[0].id, prefs)
          }
        }

        // dlog(`desired: ${desired}`)


        // For each predecessor of b, expand its list of live-at-end values.
        // invariant: live contains the values live at the start of b
        // (excluding phi inputs)
        for (let i = 0; i < b.preds.length; i++) {
          let p = b.preds[i]

          // Compute additional distance for the edge.
          // Note: delta must be at least 1 to distinguish the control
          // value use from the first user in a successor block.
          let delta = normalDistance
          if (p.succs.length == 2) {
            if (
              p.succs[0] == b && p.likely == BranchPrediction.Likely ||
              p.succs[1] == b && p.likely == BranchPrediction.Unlikely
            ) {
              delta = likelyDistance
            } else if (
              p.succs[0] == b && p.likely == BranchPrediction.Unlikely ||
              p.succs[1] == b && p.likely == BranchPrediction.Likely
            ) {
              delta = unlikelyDistance
            }
          }

          // Update any desired registers at the end of p.
          let pdesired = a.desired[p.id]
          if (!pdesired) {
            a.desired[p.id] = new DesiredState(desired)
          } else {
            pdesired.merge(desired)
          }

          // Start t off with the previously known live values at the end of p.
          t.clear()
          let plive = a.live[p.id]
          if (plive) for (let e of plive) {
            t.set(e.id, { val: e.dist, pos: e.pos })
          }

          let update = false

          // Add new live values from scanning this block.
          for (let [key, e] of live) {
            let d = e.val + delta
            let e2 = t.get(key)
            if (!e2 || d < e2.val) {
              update = true
              t.set(key, { val: d, pos: e.pos })
            }
          }
          // Also add the correct arg from the saved phi values.
          // All phis are at distance delta (we consider them
          // simultaneously happening at the start of the block).
          for (let v of phis) {
            let id = v.args[i].id
            if (a.values[id].needReg) {
              let e2 = t.get(id)
              if (!e2 || delta < e2.val) {
                update = true
                t.set(id, { val: delta, pos: v.pos })
              }
            }
          }

          if (!update) {
            continue
          }

          // The live set has changed, update it.
          let l :LiveInfo[] = new Array<LiveInfo>(t.size), j = 0
          for (let [key, e] of t) {
            l[j++] = { id: key, dist: e.val, pos: e.pos }
          }
          a.live[p.id] = l
          changed = true
        }
      }

      if (!changed) {
        break
      }

      // break
    }

    // if (invalidateCFG) {
    //   f.invalidateCFG()
    // }

  } // computeLive


  fmtLive() :string {
    const a = this
    let s = ''
    for (let b of a.f.blocks) {
      s += `  ${b}:`
      let blive = a.live[b.id]
      if (blive) for (let x of blive) {
        // s += `  v${x.id} (${x.dist})`
        s += `  v${x.id}`
        let desired = a.desired[b.id]
        if (desired) for (let e of desired.entries) {
          if (e.id != x.id) {
            continue
          }
          s += "["
          let first = true
          for (let r of e.regs) {
            if (r == noReg) {
              continue
            }
            if (!first) {
              s += ","
            }
            let reg = a.registers[r]
            s += `${reg.name}#${reg.num}`
            first = false
          }
          s += "]"
        }
      }
      if (a.desired[b.id]) {
        let avoid = a.desired[b.id].avoid
        if (!avoid.isZero()) {
          s += " avoid=" + fmtRegSet(avoid)
        }
      }
      s += "\n"
    }
    return s.trimRight()
  }


  // _usermapCache :Map<Value,Set<Value|Block>>|null = null

  // getUserMap() {
  //   const a = this
  //   if (a._usermapCache) {
  //     return a._usermapCache
  //   }
  //   let usermap = new Map<Value,Set<Value|Block>>()
  //   for (let b of a.visitOrder) {
  //     if (b.control) {
  //       let s = usermap.get(b.control)
  //       if (s) {
  //         s.add(b)
  //       } else {
  //         usermap.set(b.control, new Set<Value|Block>([b]))
  //       }
  //     }
  //     for (let v of b.values) {
  //       for (let arg of v.args) {
  //         let s = usermap.get(arg)
  //         if (s) {
  //           s.add(v)
  //         } else {
  //           usermap.set(arg, new Set<Value|Block>([v]))
  //         }
  //       }
  //     }
  //   }
  //   a._usermapCache = usermap
  //   return usermap
  // }
}

