import { Fun, Block, BlockKind, Value, BranchPrediction } from './ssa'

// layout orders basic blocks in f with the goal of minimizing control flow
// instructions.
//
export function layoutRegallocOrder(f :Fun) :Block[] {
  const maxblocks = f.numBlocks()

  let order = new Array<Block>(maxblocks)
  let scheduled = new Array<bool>(maxblocks)
  let idToBlock = new Array<Block>(maxblocks)
  let indegree = new Array<int>(maxblocks)

  let posdegree = new Set<int>()  // blocks with positive remaining degree
  let zerodegree = new Set<int>() // blocks with zero remaining degree
  let exit = new Set<int>()       // exit blocks


  // Initialize indegree of each block
  for (let b of f.blocks) {
    idToBlock[b.id] = b

    if (b.kind == BlockKind.Ret) {
      // exit blocks are always scheduled last
      // TODO: also add blocks post-dominated by exit blocks
      exit.add(b.id)
      continue
    }

    let npreds = b.preds ? b.preds.length : 0
    indegree[b.id] = npreds
    if (npreds == 0) {
      zerodegree.add(b.id)
    } else {
      posdegree.add(b.id)
    }
  }


  let bid = f.entry.id
  let orderi = 0

  blockloop:
  while (true) {

    // add block to schedule
    let b = idToBlock[bid]
    order[orderi++] = b
    scheduled[bid] = true
    if (orderi == f.blocks.length) {
      break
    }

    if (b.succs) for (let c of b.succs) {
      indegree[c.id]--
      if (indegree[c.id] == 0) {
        posdegree.delete(c.id)
        zerodegree.add(c.id)
      }
    }

    // Pick the next block to schedule
    // Pick among the successor blocks that have not been scheduled yet.

    // Use likely direction if we have it.
    let likely :Block|undefined|null
    switch (b.likely) {
      case BranchPrediction.Likely:
        likely = b.succs && b.succs[0]
        break
      case BranchPrediction.Unlikely:
        likely = b.succs && b.succs[1]
        break
    }
    if (likely && !scheduled[likely.id]) {
      bid = likely.id
      continue
    }

    // Use degree for now.
    bid = 0
    let mindegree = maxblocks
    let lastb = order[orderi-1]
    if (lastb.succs) for (let c of lastb.succs) {
      if (scheduled[c.id] || c.kind == BlockKind.Ret) {
        continue
      }
      if (indegree[c.id] < mindegree) {
        mindegree = indegree[c.id]
        bid = c.id
      }
    }
    if (bid != 0) {
      continue
    }

    // TODO: improve this part
    // No successor of the previously scheduled block works.
    // Pick a zero-degree block if we can.
    while (zerodegree.size > 0) {
      let cid = setpop(zerodegree)
      if (!scheduled[cid]) {
        bid = cid
        continue blockloop
      }
    }
    // Still nothing, pick any non-exit block.
    while (posdegree.size > 0) {
      let cid = setpop(posdegree)
      if (!scheduled[cid]) {
        bid = cid
        continue blockloop
      }
    }
    // Pick any exit block.
    // TODO: Order these to minimize jump distances?
    while (true) {
      let cid = setpop(exit)
      if (!scheduled[cid]) {
        bid = cid
        continue blockloop
      }
    }

  }

  assert(order[0] === f.entry, 'moved entry block')
  order.length = orderi
  return order
}


// setpop removes an arbitrary item off of s and returns it
//
function setpop<T>(s :Set<T>) :T {
  assert(s.size > 0, 'setpop with empty set')
  let v = s[Symbol.iterator]().next().value
  s.delete(v)
  return v as T
}
