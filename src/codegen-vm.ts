import { DiagKind, DiagHandler } from './diag'
import { Fun } from './ir'
import { debuglog as dlog } from './util'

export class VMCodeGenerator {
  diagh :DiagHandler|null = null

  init(diagh :DiagHandler|null = null) {
    const g = this
    g.diagh = diagh
  }

  genfun(f :Fun) {
    dlog(`${f}`)
  }
}
