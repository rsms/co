import { Fun, Block } from './ssa'

interface blockAndIndex {
  b     :Block
  index :int
    // index is the number of successor edges of b that have already
    // been explored.
}

// postorder provides a DFS postordering of blocks in f
//
export function postorder(f :Fun) :Block[] {
  // let postnums = new Array<int>(f.numBlocks())
  let explored = new Array<bool>(f.numBlocks())

  // result ordering
  let order :Block[] = []

  // stack of blocks and next child to visit
  let s :blockAndIndex[] = [ { b: f.entry, index: 0 } ]
  explored[f.entry.id] = true

  while (s.length > 0) {
    let tos = s.length - 1

    let x :blockAndIndex = s[tos]
    let b = x.b
    let i = x.index

    if (i < b.succs.length) {
      s[tos].index++
      let bb = b.succs[i]
      if (!explored[bb.id]) {
        explored[bb.id] = true
        s.push({ b: bb, index: 0 })
      }
    } else {
      s = s.slice(0, tos)
      //postnums[b.id] = order.length
      order.push(b)
    }
  }

  //dlog(`postnums: ${postnums.map((n, bi) => `b${bi} = #${n}`).join(', ')}`)

  return order
}
