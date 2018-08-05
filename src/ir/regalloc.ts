import { Fun } from './fun'

export interface RegAlloc {
  visitFun(f :Fun) : void
}
