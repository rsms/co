import { Register, RegSet, emptyRegSet } from './reg'
import { Value, Block } from './ssa'

export type BlockRewriter = (b :Block)=>bool
export type ValueRewriter = (v :Value)=>bool

// Config holds readonly compilation information.
// It is created once, early during compilation, and shared across
// all compilations.
//
export class Config {
  // arch           string // "amd64", etc.
  // PtrSize        int64  // 4 or 8; copy of cmd/internal/sys.Arch.PtrSize
  // RegSize        int64  // 4 or 8; copy of cmd/internal/sys.Arch.RegSize
  // Types          Types
  // lowerBlock     blockRewriter // lowering function
  // lowerValue     valueRewriter // lowering function
  // registers      []Register    // machine registers
  // gpRegMask      regMask       // general purpose integer register mask
  // fpRegMask      regMask       // floating point register mask
  // specialRegMask regMask       // special register mask
  // GCRegMap       []*Register   // garbage collector register map, by GC register index
  // FPReg          int8          // register number of frame pointer, -1 if not used
  // LinkReg        int8          // register number of link register if it is a general purpose register, -1 if not used
  // hasGReg        bool          // has hardware g register
  // ctxt           *obj.Link     // Generic arch information
  // optimize       bool          // Do optimization
  // noDuffDevice   bool          // Don't use Duff's device
  // useSSE         bool          // Use SSE for non-float operations
  // useAvg         bool          // Use optimizations that need Avg* operations
  // useHmul        bool          // Use optimizations that need Hmul* operations
  // nacl           bool          // GOOS=nacl
  // use387         bool          // GO386=387
  // SoftFloat      bool          //
  // NeedsFpScratch bool          // No direct move between GP and FP register sets
  // BigEndian      bool          //

  arch      :string = '?' // e.g. "covm"
  optimize  :bool = false  // Do optimization

  addrSize  :int = 4  // 4 or 8 bytes
  regSize   :int = 4  // 4 or 8 bytes
  intSize   :int = 4  // 1, 2, 4 or 8 bytes

  registers :Register[] = []   // machine registers

  hasGReg        :bool = false         // has hardware g register
  gpRegMask      :RegSet = emptyRegSet // general purpose integer register mask
  fpRegMask      :RegSet = emptyRegSet // floating point register mask
  specialRegMask :RegSet = emptyRegSet // special register mask
  
  lowerBlock     :BlockRewriter|null = null // lowering function
  lowerValue     :ValueRewriter|null = null // lowering function

  constructor(props?: Partial<Config>) {
    if (props) for (let k of Object.keys(props as Object)) {
      if (!(k in (this as any))) {
        panic(`invalid config property ${k}`)
      }
      ;(this as any)[k] = (props as any)[k]
    }
  }


  toString() :string {
    return `${this.arch}/${this.addrSize * 8}/${this.optimize ? 'opt':'debug'}`
  }
}
