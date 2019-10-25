import { debuglog as dlog } from "../util"
import { Pos, NoPos } from "../pos"
import * as ir from "../ir/ssa"
import { ops as irops, opinfo as iropinfo, opnameMaxLen } from "../ir/ops"
import * as irop from "../ir/op"
import { Config } from "../ir/config"
import { ByteStr } from "../bytestr"
import { t_mem } from "../ast/nodes"
import { Int64 } from "../int64"


export type Opcode = int   // 16-bit unsigned integer


// Instr represent a single machine instruction
export class Instr {
  op       :Opcode    // assembler opcode
  pos      :Pos       // source position of this instruction
  spAdj    :int = 0   // effect of instruction on stack pointer (increment or decrement amount)

  constructor(op :Opcode, pos :Pos) {
    this.op = op
    this.pos = pos
  }

  toString() {
    let s = this

    let sop = s.op.toString(16)
    if (s.op <= 0xF) {
      sop = "00" + sop
    } else if (s.op <= 0xFF) {
      sop = "0" + sop
    }

    return `${sop}  // ${s.spAdj} "${iropinfo[s.op].name}"`
  }
}


function fmthex<T extends {toString(radix:int):string}>(n :T, z :int = 4) {
  let s = n.toString(16)
  if (s.length < z) {
    s = "0000000000000000".substr(0, z - s.length) + s
  }
  return s
}


const SPACES = "                             "

// padr pads s with padding (defaults to spaces) so that s is at least width long.
//
function padr(s :string, width :int, padding? :string) :string {
  return s.length < width ? s + (padding || SPACES).substr(0, width - s.length) : s
}


type EntryType = int
const TFUN   = 0 as EntryType
    , TINSTR = 2 as EntryType


// Entry is one line of assembly
class Entry {
  t       :EntryType
  op      :string    // operation or label
  imm     :string[]   // immediate arguments
  comment :string    // comment
  pos     :Pos       // original source position
  label   :int = -1  // blockId. Used by TINSTR
  addr    :int = -1  // assigned object-local linear address
  targetBlockId :int = -1        // used by branch instructions during addFun
  targetEntry :Entry|null = null // target of branch instructions (after addFun)

  constructor(t :EntryType, op :string, imm :string[], comment :string, pos :Pos) {
    this.t       = t
    this.op      = op
    this.imm     = imm
    this.comment = comment
    this.pos     = pos
  }

  toString() {
    const e = this
    let ind = this.t == TINSTR ? "    " : ""
    let s = `${ind}${padr(e.op, opnameMaxLen)}`
    let imm = e.imm.join("  ")
    if (e.comment) {
      s += `  ${padr(imm, 24 - ind.length)}  ; ${e.comment}`
    } else if (imm) {
      s += `  ${imm}`
    }
    return s
  }
}


export class Obj {
  target  :Config
  pos     :Pos  // current source position
  entries :Entry[] = []  // all entries in the object

  // set to true when addresses have been allocated.
  sealed = false

  // state used during each addFun call
  funEntries :Entry[] = []  // entries in the current function
  blockEntries :Entry[] = []  // blockId => Entry(t=TINSTR)
  pendingBlockEntry :int = -1  // blockId

  constructor(target :Config) {
    this.target = target
  }


  writeStr() :string {
    let lines :string[] = []
    let entries = this.entries
    const addrw = 2
    for (let i = 0, z = entries.length; i < z; i++) {
      let e = entries[i]
      let prefix = (
        e.addr >= 0 ? "0x" + fmthex(e.addr, addrw*2) + "  "
                    : SPACES.substr(0, 4 + addrw*2) )
      if (e.label != -1) {
        lines.push(`${prefix}  b${e.label}:`)
      }
      lines.push(prefix + e.toString())
    }
    return lines.join("\n")
  }


  seal(startAddr :int) {
    if (this.sealed) {
      throw new Error("already sealed")
    }
    this.sealed = true
    let entries = this.entries
    let addr = startAddr
    const addrw = 2

    let revisitBranches :Entry[] = []

    // assign addresses
    for (let i = 0, z = entries.length; i < z; i++) {
      let e = entries[i]
      if (e.t == TINSTR) {
        e.addr = addr++
        if (e.op == "CALL") {
          dlog(`TODO: resolve CALL address`)
        }
        if (e.targetEntry) {
          if (e.targetEntry.addr == -1) {
            revisitBranches.push(e)
          } else {
            e.imm.push("0x" + fmthex(e.targetEntry.addr, addrw*2))
            e.targetEntry = null  // clear so that subsequent calls doesn't add another imm
          }
        }
      }
    }

    // second pass on forward-jumping branches
    for (let e of revisitBranches) {
      assert(e.targetEntry)
      assert(e.targetEntry!.addr != -1)
      e.imm.push("0x" + fmthex(e.targetEntry!.addr, addrw*2))
      e.targetEntry = null  // clear so that subsequent calls doesn't add another imm
    }
  }


  addFun(f :ir.Fun) {
    const o = this
    if (o.sealed) {
      throw new Error("sealed")
    }

    // initialize function-specific state
    o.blockEntries = []
    o.pendingBlockEntry = -1
    o.funEntries = []

    // FUNC head
    this.addEntry(TFUN, `FUNC #${f.id}`, [], f.name.toString(), this.pos)

    // Since block IDs may be sparsely numbered, and we depend on lookup, build
    // dense list of blocks.
    let blocks = f.blocks.filter(b => !!b)

    // Emit basic blocks
    for (let i = 0; i < blocks.length; i++) {
      let nextBlock = blocks[i + 1]
      o.addBlock(blocks[i], nextBlock)
    }

    // resolve branch targets from blockIds to Entry references
    for (let i = 0, z = o.funEntries.length; i < z; i++) {
      let e = o.funEntries[i]
      if (e.targetBlockId != -1) {
        e.targetEntry = o.blockEntries[e.targetBlockId]
        if (!e.targetEntry) { dlog(o.blockEntries) }
        assert(e.targetEntry, `non-existing target b${e.targetBlockId} in ${e}`)
      }
    }

    // add function entries to all entries collection
    o.entries = o.entries.concat(o.funEntries)
  }


  addEntry(t :EntryType, op :string, imm :string[], comment :string, pos :Pos) :Entry {
    let e = new Entry(t, op, imm, comment, pos)
    this.funEntries.push(e)
    return e
  }


  addInstr(opname :string, imm :string[], comment :string) :Entry {
    let e = this.addEntry(TINSTR, opname, imm, comment, this.pos)
    if (this.pendingBlockEntry != -1) {
      e.label = this.pendingBlockEntry
      this.pendingBlockEntry = -1
      this.blockEntries[e.label] = e
    }
    return e
  }


  addInstrV(v :ir.Value) {
    let opinfo = iropinfo[v.op]
    if (opinfo.zeroWidth) {
      return
    }

    // immediates
    let imms = this.buildImms(v, opinfo)

    // let spAdj :int = 0  // stack pointer adjustment delta
    this.addInstr(opinfo.name, imms, "")
  }


  buildImms(v :ir.Value, opinfo :irop.OpInfo) :string[] {
    let imms :string[] = []

    // output register
    if (v.reg) {
      imms.push(v.reg.name)
    }

    // inputs
    for (let a of v.args) {
      let ainfo = iropinfo[a.op]
      if (a.reg) {
        imms.push(a.reg.name)
      } else if (a.aux !== null) {
        // then it must be a memory operand
        assert(ainfo.type === t_mem,
               `immediate operand ${a} to ${v} not in a register (${a}.type=${ainfo.type})`)
        imms.push("0x" + fmthex(a.aux as any as int, 8))
      }
    }

    function floatTo64Bits(f :number) :ArrayLike<int> {
      return new Uint32Array(new Float64Array([f]).buffer)
    }

    // add aux
    switch (opinfo.aux) {
      case irop.AuxType.None:
        break

      case irop.AuxType.Bool:          // auxInt is 0/1 for false/true
      case irop.AuxType.Int8:          // auxInt is an 8-bit integer
      case irop.AuxType.Int16:         // auxInt is a 16-bit integer
      case irop.AuxType.Int32:         // auxInt is a 32-bit integer
      case irop.AuxType.Int64:         // auxInt is a 64-bit integer
        imms.push(v.auxInt.toString(10))
        break

      case irop.AuxType.Float32:       // auxInt is a float32
      case irop.AuxType.Float64: {      // auxInt is a float64
        let low_high = floatTo64Bits(v.aux as any as number)
        imms.push("0x" + fmthex(low_high[0], 8) + fmthex(low_high[1], 4))
        break
      }

      case irop.AuxType.SymOff:        // aux is a symbol, auxInt is an offset
      case irop.AuxType.SymInt32:      // aux is a symbol, auxInt is a 32-bit integer
        // TODO symbol
        imms.push(v.auxInt.toString(10))
        break

      // TODO
      case irop.AuxType.Type:          // aux is a type
      case irop.AuxType.String:        // aux is a string
      case irop.AuxType.Sym:           // aux is a symbol
        break
    }

    // if (opinfo.aux != irop.AuxType.None) {
    //   if (!imms) { imms = [] }
    //   imms.push(opinfo.aux)
    // }

    return imms
  }


  addJump(blockId :int, comment :string) {
    let e = this.addInstr("JUMP", [], comment)
    e.targetBlockId = blockId
  }

  addBranch(blockId :int, cond :string, comment :string) {
    let e = this.addInstr("BR", [ cond ], comment)
    e.targetBlockId = blockId
  }

  addBranchNeg(blockId :int, cond :string, comment :string) {
    let e = this.addInstr("BRZ", [ cond ], comment)
    e.targetBlockId = blockId
  }


  addBlock(b :ir.Block, nextb :ir.Block|null) {
    const o = this

    // enqueue block entry
    assert(this.pendingBlockEntry == -1, `block immediately following another block`)
    o.pendingBlockEntry = b.id

    // instructions
    for (let v of b.values) {
      o.addInstrV(v)
    }

    // continuation
    switch (b.kind) {

      case ir.BlockKind.Plain: {
        // unconditional jump
        // TODO: immediate-successor jump elimination optimization
        let contb = b.succs[0]
        assert(contb)
        o.addJump(contb.id, `b${contb.id}`)
        break
      }

      case ir.BlockKind.First:
        // BlockKind.First: 2 successors, always takes the first one (second is dead)
        assert(0, `unexpected temporary IR "first" block ${b}`)
        break

      case ir.BlockKind.If: {
        // branch
        let thenb = b.succs[0] ; assert(thenb)
        let elseb = b.succs[1] ; assert(elseb)
        assert(b.control, "missing control (condition) value")

        let ctrlReg = b.control!.reg!
        assert(ctrlReg, `control value ${b.control} not in register`)

        if (nextb === thenb) {
          // if false goto elseb; cont thenb
          o.addBranchNeg(elseb.id, ctrlReg.name, `if !${b.control} ? b${elseb.id} : b${thenb.id}`)
        } else if (nextb === elseb) {
          // if true goto thenb; cont elseb
          o.addBranch(thenb.id, ctrlReg.name, `if ${b.control} ? b${thenb.id} : b${elseb.id}`)
        } else {
          // if true goto thenb; goto elseb
          o.addBranch(thenb.id, ctrlReg.name, `if ${b.control} ? b${thenb.id} ...`)
          o.addJump(elseb.id, `... : b${elseb.id}`)
        }
        break
      }

      case ir.BlockKind.Ret: {
        // return
        assert(b.succs.length == 0, "can't have successor to return block")
        // TODO: consider if we need to do antyhing with b.control which is the memory
        // location at the end (stack memory location.)
        o.addInstr("RET", [], "")
        break
      }

      default:
        assert(false, `unexpected block kind ${ir.BlockKind[b.kind]}`)
    }
  }

}





// // These are generic, portable opcodes common to all architectures.
// export const
//   AXXX           :Opcode = 0
// , ACALL          :Opcode = 1
// , ADUFFCOPY      :Opcode = 2
// , ADUFFZERO      :Opcode = 3
// , AEND           :Opcode = 4
// , AFUNCDATA      :Opcode = 5
// , AJMP           :Opcode = 6
// , ANOP           :Opcode = 7
// , APCALIGN       :Opcode = 8
// , APCDATA        :Opcode = 9
// , ARET           :Opcode = 10
// , AGETCALLERPC   :Opcode = 11
// , ATEXT          :Opcode = 12
// , AUNDEF         :Opcode = 13


// export function assemblePkg(pkg :ir.Pkg, c :Config) {
//   for (let f of pkg.funs) {
//     let fun = Fun.gen(f, c)
//   }
// }




// // In-development covm instruction map, mapping IR op => Native op
// // We start beyond the generic op IDs, so we can use generic op IDs verbatim
// // for now, while developing this thing.
// let nextCovmInstrNum :Opcode = 0x1000
// const OP_JUMP = nextCovmInstrNum++
// const OP_RET = nextCovmInstrNum++
// const OP_BR = nextCovmInstrNum++
// const covmInstrMap :Opcode[] = new Array<Opcode>(irops.OpcodeMax)
// covmInstrMap[irops.CovmMOV32const] = nextCovmInstrNum++
// covmInstrMap[irops.CovmLoad8] = nextCovmInstrNum++
// covmInstrMap[irops.CovmLoad16] = nextCovmInstrNum++
// covmInstrMap[irops.CovmLoad32] = nextCovmInstrNum++
// covmInstrMap[irops.CovmLoad64] = nextCovmInstrNum++
// covmInstrMap[irops.CovmStore8] = nextCovmInstrNum++
// covmInstrMap[irops.CovmStore16] = nextCovmInstrNum++
// covmInstrMap[irops.CovmStore32] = nextCovmInstrNum++
// covmInstrMap[irops.CovmStore64] = nextCovmInstrNum++
// covmInstrMap[irops.CovmADD32] = nextCovmInstrNum++
// covmInstrMap[irops.CovmADD32const] = nextCovmInstrNum++
// covmInstrMap[irops.CovmADD64] = nextCovmInstrNum++
// covmInstrMap[irops.CovmADD32] = nextCovmInstrNum++
// covmInstrMap[irops.CovmADD32const] = nextCovmInstrNum++
// covmInstrMap[irops.CovmADD64] = nextCovmInstrNum++
// covmInstrMap[irops.CovmMUL32] = nextCovmInstrNum++
// covmInstrMap[irops.CovmCALL] = nextCovmInstrNum++
// covmInstrMap[irops.CovmLowNilCheck] = nextCovmInstrNum++
// covmInstrMap[irops.CovmZeroLarge] = nextCovmInstrNum++
