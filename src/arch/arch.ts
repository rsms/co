import { Op } from '../ir/op'
import { Register, RegSet, emptyRegSet } from '../ir/reg'
import { Config } from '../ir/config'


export class ArchInfo {
  readonly name            :string
  readonly addrSize        :int = 4  // 4 or 8 bytes
  readonly regSize         :int = 0  // 4 or 8 bytes
  readonly intSize         :int = 0  // 1, 2, 4 or 8 bytes

  readonly ops             = [] as Op[]
  readonly regNames        = [] as string[]
  readonly gpRegMask       = emptyRegSet as RegSet
  readonly fpRegMask       = emptyRegSet as RegSet
  readonly specialRegMask  = emptyRegSet as RegSet
  readonly generic         = false as bool

  // readonly pkg     :string // obj package to import for this arch.
  // readonly genfile :string // source file containing opcode code generation.
  // readonly blocks  :[]blockData
  // readonly fpReg   :int // int8; frame pointer -1 when not used
  // readonly linkreg :int // int8; -1 when not used


  constructor(name :string, props: Partial<ArchInfo>) {
    this.name = name

    for (let k of Object.keys(props)) {
      assert(k in (this as any))
      ;(this as any)[k] = (props as any)[k]
    }

    assert(this.regNames.length <= 64, 'too many registers')
    assert(this.addrSize == 4 || this.addrSize == 8,
      `invalid addrSize ${this.addrSize}`)

    this.regSize = this.regSize || this.addrSize
    this.intSize = this.intSize || this.addrSize
  }


  config(props? :Partial<Config>) :Config {
    const registers :Register[] = this.regNames.map(
      (name, num) => ({ num, name })
    )

    const c :Partial<Config> = {
      arch: this.name,
      registers,

      addrSize:       this.addrSize,
      regSize:        this.regSize,
      intSize:        this.intSize,

      hasGReg:        this.regNames.includes("g"),
      gpRegMask:      this.gpRegMask,
      fpRegMask:      this.fpRegMask,
      specialRegMask: this.specialRegMask,
    }

    if (props) {
      Object.assign(c, props)
    }

    return new Config(c)
  }

}
