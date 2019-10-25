// import { debuglog as dlog } from "../util"
// import { Pos, NoPos } from "../pos"
// import * as ir from "../ir/ssa"
// import { opinfo as iropinfo } from "../ir/ops"
// import { Config } from "../ir/config"
// import { Opcode, AEND } from "./asm"
// import { stdoutStyle as tstyle } from '../termstyle'


// // Instr represent a single machine instruction
// export class Instr {
//   op       :Opcode    // assembler opcode
//   pos      :Pos       // source position of this instruction
//   spAdj    :int = 0   // effect of instruction on stack pointer (increment or decrement amount)

//   constructor(op :Opcode, pos :Pos) {
//     this.op = op
//     this.pos = pos
//   }

//   toString() {
//     let s = this

//     let sop = s.op.toString(16)
//     if (s.op <= 0xF) {
//       sop = "00" + sop
//     } else if (s.op <= 0xFF) {
//       sop = "0" + sop
//     }

//     return `${sop}  // ${s.spAdj} "${iropinfo[s.op].name}"`
//   }
// }


// function fmthex(n :int, z :int = 4) {
//   let s = n.toString(16)
//   if (s.length < z) {
//     s = "0000000000000000".substr(0, z - s.length) + s
//   }
//   return s
// }


// export class Obj {
//   target :Config

//   iaddr = 0  // instruction address (local address counter)
//   buffer = ""

//   constructor(target :Config) {
//     this.target = target
//   }

//   write(s :string) {
//     this.buffer += s + "\n"
//     console.log(tstyle.lightyellow(s))
//   }

//   writeFunLabel(funid :int) {
//     this.write(`        fun ${funid}:`)
//   }

//   writeBlockLabel(blockId :int) {
//     this.write(`          b${blockId}:`)
//   }

//   writeInstr(op :Opcode, comment :string) :int {
//     let addr = this.iaddr++
//     let s = `${fmthex(addr)}        ${fmthex(op,3)}`
//     if (comment) {
//       s += `  // ${comment}`
//     }
//     this.write(s)
//     return addr
//   }

//   writeInstrV(v :ir.Value) :int {
//     let opinfo = iropinfo[v.op]
//     if (opinfo.zeroWidth) {
//       return -1
//     }
//     let op :Opcode = v.op  // for the sake of a demo vm, asm opcode == ir opcode (for now.)
//     // let spAdj :int = 0  // stack pointer adjustment delta
//     return this.writeInstr(op, `${opinfo.name}`)
//   }

//   writeJumpInstr(blockId :int) :int {
//     let op = 0xFFF
//     return this.writeInstr(op, `JUMP b${blockId}`)
//   }
// }


// // TODO: add as argument to Fun. One instance of ObjWriter per object.
// const _fixme_obj = new Obj()


// function genfun(f :ir.Fun, obj :Obj) {}


// // machine code for a function
// export class Fun {
//   c       :Config       // configuration
//   f       :ir.Fun       // f these instructions are for
//   w       :ObjWriter
//   pos     :Pos          // position to use for new instructions
//   pc      :int = 0      // program counter

//   // labels  :int[] = []   // maps blockId => local address

//   static gen(f :ir.Fun, c :Config) {
//     return new Fun(f, c, _fixme_objwriter).genFun()
//   }

//   constructor(f :ir.Fun, c :Config, w :ObjWriter) {
//     this.f = f
//     this.c = c
//     this.w = w
//     this.pos = f.pos
//   }


//   genFun() {
//     const p = this, f = p.f

//     // If the very first instruction is not tagged as a statement,
//     // debuggers may attribute it to previous function in program.
//     let firstPos = NoPos
//     for (let v of f.entry.values) {
//       if (v.pos != NoPos) {
//         firstPos = v.pos
//         break
//       }
//     }
//     dlog(`asm/genFun "${f.name}" firstPos: ${repr(firstPos)}`)

//     p.w.writeFunLabel(f.id)

//     // Since block IDs may be sparsely numbered, and we depend on lookup, build
//     // dense list of blocks.
//     let blocks = f.blocks.filter(b => !!b)

//     // Emit basic blocks
//     for (let i = 0; i < blocks.length; i++) {
//       let nextBlock = blocks[i + 1]
//       p.genBlock(blocks[i], nextBlock)
//     }
//   }


//   goTo(blockId :int) {
//     this.w.writeJumpInstr(blockId)
//   }


//   genBlock(b :ir.Block, nextb :ir.Block|null) {
//     const p = this
//     dlog(`asm/genBlock ${b}`)

//     // block label
//     p.w.writeBlockLabel(b.id)

//     // instructions
//     for (let v of b.values) {
//       p.w.writeInstrV(v)
//     }

//     // continuation
//     switch (b.kind) {

//       case ir.BlockKind.Plain: {
//         // simple unconditional continuation to some block
//         // TODO: immediate-successor jump elimination optimization
//         let contb = b.succs[0]
//         assert(contb)
//         p.goTo(contb.id)
//         break
//       }

//       case ir.BlockKind.First:
//       case ir.BlockKind.If: {
//         let thenb = b.succs[0]
//         let elseb = b.succs[1]
//         dlog("TODO: control continuation")
//         // if (thenb && elseb) {
//         //   assert(b.control, "missing control (condition) value")
//         //   f.println(
//         //     indent +
//         //     f.style.cyan(b.kind == ir.BlockKind.If ? 'if' : 'first') +
//         //     ` ${b.control}${f.rarr}` +
//         //     fmtsucc(thenb) + ', ' + fmtsucc(elseb)
//         //   )
//         // }
//         break
//       }

//       case ir.BlockKind.Ret: {
//         // check successors
//         assert(b.succs.length == 0, "can't have successor to return block")
//         dlog("TODO: return")
//         // f.println(
//         //   indent +
//         //   f.style.cyan('ret') + (b.control ? ' ' + b.control : '')
//         // )
//         break
//       }

//       default:
//         assert(false, `unexpected block kind ${ir.BlockKind[b.kind]}`)
//     }
//   }

// }
