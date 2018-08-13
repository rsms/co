import { debuglog as dlog } from '../util'
import { fmtAsciiMatrix } from '../debug'
import { UInt64 } from '../int64'
import { Pos } from '../pos'
import { Mem, t_int, t_uint, t_i32, t_u32, t_u64, intTypes } from '../types'
import { ID, Fun, Block, Value, BranchPrediction } from './ssa'
import { Op, ops } from './op'
import { RegAlloc } from './regalloc'
import { Register, Reg, RegSet, RegInfo, fmtRegSet, emptyRegSet } from './reg'
import { Config } from './config'
import { layoutRegallocOrder } from './layout'
import { fmtir } from './repr'
import { DesiredState } from './reg_desiredstate'

// NaiveRegAlloc performs naïve register allocation, meaning that for
// every operation, its operands are loaded into registers and--
// following the operation--the result is stored into memory.
//
// E.g. with input source:
//
//   fun foo(x, y int) int {
//     d = x + y
//     e = x - d
//     d * e
//   }
//
// IR before regalloc:
//
//   v1 = Param [0]
//   v2 = Param [1]
//   v3 = i32Add v1 v2
//   v4 = i32Sub v1 v3
//   v5 = i32Mul v3 v4
//   ret v5
//
// IR after applying NaiveRegAlloc:
//
//   v1 = i32Load [fp -12]
//   v2 = i32Load [fp -16]
//   v3 = i32Add v1 v2
//   v6 = i32Store v3 [fp -8]
//
//   v1 = i32Load [fp -12]
//   v2 = i32Load [fp -16]

//   v4 = i32Sub <i32> v1 v3
//   v5 = i32Mul <i32> v3 v4
//   ret v5
//


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

interface Use {
  dist :int      // distance from start of the block to a use of a value
  next :Use|null // linked list of uses of a value in nondecreasing dist order
  // pos  :Pos   // source position of the use
}

// A valState records the register allocation state for a (pre-regalloc) value.
class ValState {
  regs       = emptyRegSet as RegSet
    // the set of registers holding a Value (usually just one)
  uses       = null as Use|null   // list of uses in this block
  spill      = null as Value|null // spilled copy of the Value (if any)
  restoreMin = 0 as int  // minimum of all restores' blocks' sdom.entry
  restoreMax = 0 as int  // maximum of all restores' blocks' sdom.exit
  needReg    = false as bool // cached value of
    // !v.Type.IsMemory() && !v.Type.IsVoid() && !.v.Type.IsFlags()
  rematerializeable = false as bool  // cached value of v.rematerializeable()
}


export class NaiveRegAlloc implements RegAlloc {
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

  nospill :RegSet  // registers that contain values which can't be kicked out
  used    :RegSet  // registers currently in use
  tmpused :RegSet  // registers used in the current instruction

  // live and desired holds information about block's live values at the end
  // of the block, and those value's desired registers (if any.)
  // These are created by computeLive()
  live    :LiveInfo[][] = []
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
    const config_gpRegMask = 0xffffff
    this.allocatable = config.gpRegMask.or(config.fpRegMask.or(config.specialRegMask))

    // .allocatable &^= 1 << s.SPReg
    // .allocatable = .allocatable & ~(1 << s.SPReg)
    this.allocatable = this.allocatable.and(UInt64.ONE.shl(a.SPReg).not())
    this.allocatable = this.allocatable.and(UInt64.ONE.shl(a.SBReg).not())
    this.allocatable = this.allocatable.and(UInt64.ONE.shl(a.GReg).not())
    
    // dlog(`allocatable:`, fmtRegSet(a.allocatable))
  }

  init(f :Fun) {
    const a = this
    a.f = f
  }

  regallocFun(f :Fun) {
    const a = this
    a.init(f)

    // Add SP (stack pointer) value to the top of the entry block.
    // TODO: track the need for this when generating the initial IR.
    // Some functions do not need SP.
    // Also consider always adding this during IR construction.
    const SP = f.newValue(f.entry, ops.SP, a.addrtype, null)
    f.entry.pushValueFront(SP)

    // Linear scan register allocation can be influenced by the order in which
    // blocks appear.
    // Decouple the register allocation order from the generated block order.
    // This also creates an opportunity for experiments to find a better order.
    // a.visitOrder = layoutRegallocOrder(f)
    // if (a.config.optimize) {
    //   // update function block order with new layout
    //   f.blocks = a.visitOrder
    // }
    a.visitOrder = f.blocks

    // Compute block order. This array allows us to distinguish forward edges
    // from backward edges and compute how far they go.
    // let blockOrder = new Array<int>(f.numBlocks())
    // for (let i = 0; i < a.visitOrder.length; i++) {
    //   blockOrder[a.visitOrder[i].id] = i >>> 0
    // }

    // s.regs = make([]regState, s.numRegs)
    a.values = new Array<ValState>(f.numValues())
    // s.orig = make([]*Value, f.NumValues())
    // s.copies = make(map[*Value]bool)
    for (let b of a.visitOrder) {
      let v :Value|null = b.vhead
      for (; v; v = v.nextv) {
        let t = v.type
        let val = new ValState()
        a.values[v.id] = val
        // if (!t.isMemory() && !t.IsVoid() && !t.IsFlags() && !t.IsTuple())
        if (t.mem > 0 && !t.isTuple()) {
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

    let ig = a.buildInterferenceGraph()
    let ifstr = a.fmtInterference(ig)
    let vizurl = (
      'https://rsms.me/co/doc/chaitin/?input=ifg&enable-briggs=1&ifg=' +
      encodeURIComponent(
        ifstr.trim().split(/[\r\n]+/).map(s => s.trim()).join('\n')
      ).replace(/\%20/g, '+')
    )
    dlog(`\ninterference:\n` + ifstr + '\nView at ' + vizurl)



    // // argalign defines address alignment for args.
    // // Must not be larger than address size.
    // let argalign = 4
    // assert(argalign <= a.addrsize, "argalign larger than address size")

    // // argoffs tracks bytes relative to a frame's SP
    // // where we are operating. It starts with the return address.
    // //
    // // Note: args are at the very beginning of the entry block, thus
    // // the while condition op==Arg.
    // //
    // let argoffs = a.addrsize
    // let v = SP.nextv; // SP is at top of entry block
    // while (v && v.op === ops.Arg) {
    //   v.aux = argoffs
    //   // v.args = [SP] ; SP.uses++ ; SP.users.push(v)
    //   assert(v.type.size > 0, `abstract type ${v.type}`)
    //   argoffs += v.type.size
    //   v = v.nextv
    // }
    
    // // visit function's entry block
    // a.block(f.blocks[0], SP)
  }


  buildInterferenceGraph() :bool[][] {
    const a = this
    const f = a.f

    // ig holds the interference graph
    let ig :bool[][] = new Array<bool[]>(f.numValues())  // bool[nvals][~]

    // visit blocks in reverse order
    for (let i = f.blocks.length, b :Block|undefined ; b = f.blocks[--i]; ) {
      let liveinfo :LiveInfo[] = a.live[b.id]
      let live :bool[]
      if (liveinfo) {
        live = new Array<bool>(f.numValues())
        for (let e of liveinfo) {
          live[e.id] = true
        }
      } else {
        live = []
      }

      // visit instructions in reverse order
      for (let v = b.vtail; v; v = v.prevv) {

        // remove defintion from currlive
        live[v.id] = false

        // update interference graph to add an edge from the definition v
        // to each other value alive at this point
        ig[v.id] = live.slice(0) // copy

        if (v.args) for (let operand of v.args) {
          live[operand.id] = true
        }
      }
    }

    return ig
  }

  fmtInterference(ig :bool[][]) :string {
    let lines :string[] = []
    for (let vid = 0; vid < ig.length; vid++) {
      let live = ig[vid]
      if (live) {
        let s :string[] = []
        for (let id2 = 0; id2 < live.length; id2++) {
          if (live[id2]) {
            s.push(`v${id2}`)
          }
        }
        if (s.length) {
          lines.push(`  v${vid} ${s.join(' ')}`)
        }
      }
    }
    return lines.join('\n')
  }


  block(b :Block, _SP :Value) {
    const a = this

    let localoffs = 0

    let limit = 50
    let v = b.vhead
    while (v && limit--) {

      // normalize target-dependent types
      dlog(`v ${v}`)

      // switch on operation
      switch (v.op) {

      case ops.Arg: // ignore arg (handled early on)
        break

      case ops.AddI32: {
        assert(v.args)

        let operands = v.args as Value[]
        
        let op0 = operands[0]
        let loadreg = a.loadreg(b, op0, 1)
        op0.uses--  // TODO: should we also remove from op0.users?
        operands[0] = b.insertValueBefore(v, loadreg)

        let op1 = operands[1]
        loadreg = a.loadreg(b, op1, 2)
        op0.uses--
        operands[1] = b.insertValueBefore(v, loadreg)

        // RegStore
        dlog(`v=${v}, v.type=${v.type}`)
        let storeaddr = b.f.constVal(a.addrtype, localoffs)
        let storereg = b.f.newValue(b, ops.Store, v.type, 1)
        storereg.args = [storeaddr] ; storeaddr.uses++ ; storeaddr.users.push(storereg)

        // let operands = v.args as Value[]
        // let loadv0 = operands[0]
        // let loadv1 = operands[1]
        // loadv0.replaceBy(a.loadreg(b, loadv0, 1, -12))
        // if (loadv0 !== loadv1) {
        //   loadv1.replaceBy(a.loadreg(b, loadv1, 2, -16))
        // }
      }
      break

      }

      v = v.nextv
    }
  }

  loadreg(b :Block, v :Value, reg :int) :Value {
    let regload = b.f.newValue(b, ops.Load, v.type, reg)
    regload.args = [v]
    v.uses++ ; v.users.push(regload)
    return regload
  }

  // loadreg(b :Block, v :Value, reg :int, fpoffs :int) :Value {
  //   let loadv = b.f.newValue(Op.RegLoad, v.type, b, fpoffs)
  //   return b.insertValueBefore(v, loadv)
  // }


  // regspec returns the RegInfo for operation op
  //
  regspec(op :Op) :RegInfo {
    const a = this
    // if (op == ops.OpConvert) {
    //   // OpConvert is a generic op, so it doesn't have a
    //   // register set in the static table. It can use any
    //   // allocatable integer register.
    //   m := s.allocatable & s.f.Config.gpRegMask
    //   return regInfo{inputs: []inputInfo{{regs: m}},
    //     outputs: []outputInfo{{regs: m}}}
    // }
    return op.reg
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
    // Calculate the dominator tree and locate all strongly connected components.
    // If a value is live in one block of an SCC, it is live in all.
    // Walk the dominator tree from end to beginning, just once, treating SCC
    // components as single blocks, duplicated calculated liveness information
    // out to all of them.
    //
    let po = f.postorder()
    // dlog('postorder blocks:', po.join(' '))


    while (true) {
      let changed = false

      for (let b of po) {
        // Start with known live values at the end of the block.
        // Add len(b.Values) to adjust from end-of-block distance
        // to beginning-of-block distance.
        live.clear()
        let liv = a.live[b.id];  // LiveInfo[] | undefined
        if (liv) for (let e of liv) {
          live.set(e.id, { val: e.dist + b.valcount, pos: e.pos })
        }

        // Mark control value as live
        if (b.control && a.values[b.control.id].needReg) {
          live.set(b.control.id, { val: b.valcount, pos: b.pos })
        }

        // dlog(`live: ` + Array.from(live).map(p =>
        //   `v${p[0]} - v${p[1].val}`
        // ).join('\n'))

        // Propagate backwards to the start of the block
        // Assumes Values have been scheduled.
        phis = []
        let i = b.valcount - 1
        for (let v = b.vtail; v; v = v.prevv, i--) {
        // for (let i = b.valcount - 1; i >= 0; i--) {
          // let v = b.Values[i]

          live.delete(v.id)
          if (v.op === ops.Phi) {
            // save phi ops for later
            phis.push(v)
            continue
          }
          if (v.op.call) {
            for (let v of live.values()) {
              v.val += unlikelyDistance
            }
          }
          if (v.args) for (let arg of v.args) {
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

        for (let v = b.vtail; v; v = v.prevv, i--) {
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
            assert(v.args, `null args in ${v}`)
            desired.add((v.args as Value[])[j.idx].id, pickReg(j.regs))
          }
          // Set desired register of input 0 if this is a 2-operand instruction.
          if (v.op.resultInArg0) {
            assert(v.args, `null args in ${v}`)
            if (v.op.commutative) {
              desired.addList((v.args as Value[])[1].id, prefs)
            }
            desired.addList((v.args as Value[])[0].id, prefs)
          }
        }

        // dlog(`desired: ${desired}`)


        // For each predecessor of b, expand its list of live-at-end values.
        // invariant: live contains the values live at the start of b
        // (excluding phi inputs)
        if (b.preds) for (let i = 0; i < b.preds.length; i++) {
          let p = b.preds[i]

          // Compute additional distance for the edge.
          // Note: delta must be at least 1 to distinguish the control
          // value use from the first user in a successor block.
          let delta = normalDistance
          if (p.succs && p.succs.length == 2) {
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
            assert(v.args, 'phi without args')
            let id = (v.args as Value[])[i].id
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
  } // computeLive


  fmtLive() :string {
    const a = this
    let s = ''
    for (let b of a.f.blocks) {
      s += `  ${b}:`
      let blive = a.live[b.id]
      if (blive) for (let x of blive) {
        s += ` v${x.id}`
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

}



// operands returns the register numbers for the expected operand count in v
//
// function operands(v :Value, n :int) :number[] {
//   assert(v.args, 'missing args')
//   let args = v.args as Value[]
//   assert(args.length == n, `expected ${n} args but has ${args.length}`)
//   return args.map(v => v.id)
// }
