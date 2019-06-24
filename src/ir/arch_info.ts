import { Register, RegSet } from './reg'
import { Value, Block } from './ssa'

export type BlockRewriter = (b :Block)=>bool
export type ValueRewriter = (v :Value)=>bool

// ArchInfo describes a particular architecture
//
export interface ArchInfo {
  arch :string  // e.g. "covm"

  addrSize  :int  // 4 or 8 bytes
  regSize   :int  // 4 or 8 bytes
  intSize   :int  // 1, 2, 4 or 8 bytes

  registers       :Register[]  // machine registers indexed by Register.num
  hasGReg         :bool        // has hardware g register
  gpRegMask       :RegSet      // general purpose integer register mask
  fpRegMask       :RegSet      // floating point register mask
  specialRegMask? :RegSet      // special register mask

  lowerBlock?    :BlockRewriter // lowering function
  lowerValue?    :ValueRewriter // lowering function
}
