import { debuglog as dlog } from '../util'
import { UInt64 } from '../int64'
import { Mem, t_int, t_uint, t_i32, t_u32, t_u64, intTypes } from '../types'
import { Fun, Block, Value } from './ssa'
import { Op, ops } from './op'
import { RegAlloc } from './regalloc'
import { Register, Reg, RegSet, fmtRegSet, emptyRegSet } from './reg'
import { Config } from './config'
import { layoutRegallocOrder } from './layout'
import { fmtir } from './repr'

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

    dlog(`allocatable:`, fmtRegSet(a.allocatable))
    process.exit(0)
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
    a.visitOrder = layoutRegallocOrder(f)
    if (a.config.optimize) {
      // update function block order with new layout
      f.blocks = a.visitOrder
    }

    // Compute block order. This array allows us to distinguish forward edges
    // from backward edges and compute how far they go.
    let blockOrder = new Array<int>(f.numBlocks())
    for (let i = 0; i < a.visitOrder.length; i++) {
      blockOrder[a.visitOrder[i].id] = i >>> 0
    }

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


    // argalign defines address alignment for args.
    // Must not be larger than address size.
    let argalign = 4
    assert(argalign <= a.addrsize, "argalign larger than address size")

    // argoffs tracks bytes relative to a frame's SP
    // where we are operating. It starts with the return address.
    //
    // Note: args are at the very beginning of the entry block, thus
    // the while condition op==Arg.
    //
    let argoffs = a.addrsize
    let v = SP.nextv; // SP is at top of entry block
    while (v && v.op === ops.Arg) {
      v.aux = argoffs
      // v.args = [SP] ; SP.uses++ ; SP.users.push(v)
      assert(v.type.size > 0, `abstract type ${v.type}`)
      argoffs += v.type.size
      v = v.nextv
    }
    
    // visit function's entry block
    a.block(f.blocks[0], SP)
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

}



// operands returns the register numbers for the expected operand count in v
//
// function operands(v :Value, n :int) :number[] {
//   assert(v.args, 'missing args')
//   let args = v.args as Value[]
//   assert(args.length == n, `expected ${n} args but has ${args.length}`)
//   return args.map(v => v.id)
// }
