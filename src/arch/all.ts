import { ArchInfo } from './arch'
import covm from './covm'

export const archs : {[name:string] : ArchInfo} = {
  [covm.name]: covm,
}
