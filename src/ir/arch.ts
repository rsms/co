// Generated from arch/arch_* -- do not edit.
// Describes all available architectures.
//
import { UInt64 } from "../int64"
import { ArchInfo } from "./arch_info"
import { rewriteValue as covm_rewriteValue } from "./rewrite_covm"

const u64_ffff = new UInt64(65535,0),
      u64_ffff0000 = new UInt64(-65536,0);

export const archs = new Map<string,ArchInfo>([
  [ "generic", {
    arch: 'generic',
    addrSize: 4,
    regSize: 4,
    intSize: 4,
    registers: [],
    hasGReg: false,
    gpRegMask: UInt64.ZERO,
    fpRegMask: UInt64.ZERO,
  }],
  [ "covm", {
    arch: 'covm',
    addrSize: 4,
    regSize: 4,
    intSize: 4,
    registers: [ { num: 0, name: 'R0' },
      { num: 1, name: 'R1' },
      { num: 2, name: 'R2' },
      { num: 3, name: 'R3' },
      { num: 4, name: 'R4' },
      { num: 5, name: 'R5' },
      { num: 6, name: 'R6' },
      { num: 7, name: 'R7' },
      { num: 8, name: 'R8' },
      { num: 9, name: 'R9' },
      { num: 10, name: 'R10' },
      { num: 11, name: 'R11' },
      { num: 12, name: 'R12' },
      { num: 13, name: 'R13' },
      { num: 14, name: 'R14' },
      { num: 15, name: 'R15' },
      { num: 16, name: 'F0' },
      { num: 17, name: 'F1' },
      { num: 18, name: 'F2' },
      { num: 19, name: 'F3' },
      { num: 20, name: 'F4' },
      { num: 21, name: 'F5' },
      { num: 22, name: 'F6' },
      { num: 23, name: 'F7' },
      { num: 24, name: 'F8' },
      { num: 25, name: 'F9' },
      { num: 26, name: 'F10' },
      { num: 27, name: 'F11' },
      { num: 28, name: 'F12' },
      { num: 29, name: 'F13' },
      { num: 30, name: 'F14' },
      { num: 31, name: 'F15' },
      { num: 32, name: 'SP' },
      { num: 33, name: 'g' },
      { num: 34, name: 'SB' } ],
    hasGReg: true,
    gpRegMask: u64_ffff /*RegSet { r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 }*/,
    fpRegMask: u64_ffff0000 /*RegSet { r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 r10 r11 r12 r13 r14 r15 r16 r17 r18 r19 r20 r21 r22 r23 r24 r25 r26 r27 r28 r29 r30 r31 }*/,
    lowerValue: covm_rewriteValue,
  }],
]);
