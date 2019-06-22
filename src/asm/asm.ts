export type Asm = int

// These are generic, portable opcodes common to all architectures.
export const
  AXXX           :Asm = 0
, ACALL          :Asm = 1
, ADUFFCOPY      :Asm = 2
, ADUFFZERO      :Asm = 3
, AEND           :Asm = 4
, AFUNCDATA      :Asm = 5
, AJMP           :Asm = 6
, ANOP           :Asm = 7
, APCALIGN       :Asm = 8
, APCDATA        :Asm = 9
, ARET           :Asm = 10
, AGETCALLERPC   :Asm = 11
, ATEXT          :Asm = 12
, AUNDEF         :Asm = 13
, A_ARCHSPECIFIC :Asm = 14

