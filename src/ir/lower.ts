import { rewrite } from './rewrite'
import { Value, Block, Fun } from './ssa'
import { Config } from './config'

function nullLowerBlock(_ :Block) :bool { return false }
function nullLowerValue(_ :Value) :bool { return false }

export function lower(f :Fun, c :Config) {
  if (c.lowerBlock || c.lowerValue) {
    rewrite(
      f,
      c.lowerBlock || nullLowerBlock,
      c.lowerValue || nullLowerValue
    )
  }
}
