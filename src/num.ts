import { Int64, SInt64, UInt64 } from './int64'

export type Num = number | Int64

// numIsZero return true if the number is zero
//
export function numIsZero(v :Num) :bool {
  return (typeof v == 'number') ? v == 0 : v.isZero()
}

// isNum return true if v is a Num
//
export function isNum(v :any) :v is Num {
  return (
    typeof v == 'number' ||
    v instanceof SInt64 ||
    v instanceof UInt64
  )
}
