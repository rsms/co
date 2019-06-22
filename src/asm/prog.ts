import { debuglog as dlog } from '../util'
import { Pos, NoPos } from '../pos'
import { Fun } from '../ir/ssa'
import { Config } from '../ir/config'
import { Asm, AEND } from './asm'


// Instr represent a single machine instruction
export class Instr {
  link :Instr|null = null  // next in linked list
  pc       :int            // for back ends or assembler: virtual or actual
                           //   program counter, depending on phase.
  pos      :Pos            // source position of this instruction
  spadj    :int            // effect of instruction on stack pointer (increment or decrement amount)
  asm      :Asm            // assembler opcode
}

// Program represents machine code for a function
export class Program {
  c      :Config       // configuration
  f      :Fun          // f these instructions are for
  next   :Instr        // next instruction
  pc     :int = 0      // virtual PC; count of Progs
  pos    :Pos          // position to use for new Progs
  cache  :Instr[]      // local cache
  cachei :int          // first free element of cache

  constructor(f :Fun, c :Config) {
    this.f = f
    this.c = c
    this.pos = f.pos
    this.cache = []
    this.cachei = 0
    this.next = this.newInstr()
  }

  newInstr() :Instr {
    const p = this
    let s = p.cache.pop()
    if (!s) {
      s = new Instr()
    }

    s.asm = AEND
    s.pc = p.pc
    p.pc++

    return s
  }

  instr(asm :Asm) :Instr {
    const p = this

    let s = p.next!
    p.next = p.newInstr()
    s.link = p.next

    s.asm = asm
    s.pos = p.pos

    return s
  }

  gen() {
    const p = this, f = p.f

    // If the very first instruction is not tagged as a statement,
    // debuggers may attribute it to previous function in program.
    let firstPos = NoPos
    for (let v of f.entry.values) {
      if (v.pos != NoPos) {
        firstPos = v.pos
        break
      }
    }
    dlog(`firstPos: ${repr(firstPos)}`)

    // Emit basic blocks
    for (let i = 0; i < f.blocks.length; i++) {
      let b = f.blocks[i]

      for (let v of b.values) {
        let x = p.next
        // switch (v.op) {
        //   TODO once ops are numeric
        // }
      }
    }

    dlog(`prog gen`)
  }

}
