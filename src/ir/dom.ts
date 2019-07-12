// Ported from go/src/cmd/compile/internal/ssa/dom.go
//
// Copyright 2015 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
//
import { Fun, Block, Edge } from "./ssa"
import { postorder } from "./postorder"
// import { debuglog as dlog } from "../util"

// dominators computes the dominator tree for f. It returns a slice
// which maps block ID to the immediate dominator of that block.
// Unreachable blocks map to nil. The entry block maps to nil.
//
// TODO: consider using the Lengauer-Tarjan Dominator Tree algorithm.
// Go does and implements it in dominatorsLTOrig.
//
export function dominators(f :Fun) :(Block|null)[] {
  // A simple algorithm for now
  // Cooper, Harvey, Kennedy
  let idom = new Array<Block|null>(f.numBlocks())

  // Compute postorder walk
  let post = f.postorder()

  // Make map from block id to order index (for intersect call)
  let postnum = new Array<int>(f.numBlocks())
  for (let i = 0; i < post.length; i++) {
    postnum[post[i].id] = i
  }

  // Make the entry block a self-loop
  idom[f.entry.id] = f.entry

  assert(
    postnum[f.entry.id] == post.length-1,
    `entry block ${f.entry} not last in postorder`
  )

  // Compute relaxation of idom entries
  while (true) {
    let changed = false

    for (let i = post.length - 2; i >= 0; i--) {
      let b = post[i]
      let d :Block|null = null
      for (let e of b.preds) {
        let p = e  // p = e.b  // TODO Edge
        if (!idom[p.id]) {
          continue
        }
        if (!d) {
          d = p
          continue
        }
        d = intersect(d, p, postnum, idom)
      }
      if (d != idom[b.id]) {
        idom[b.id] = d
        changed = true
      }
    }
    if (!changed) {
      break
    }
  }

  // Set idom of entry block to null instead of itself
  idom[f.entry.id] = null

  // dlog("dominators END:\n" + idom.map((d, id) => `  b${id} => ${d}\n`).join(""))

  return idom
}


// intersect finds the closest dominator of both b and c.
// It requires a postorder numbering of all the blocks.
function intersect(b :Block, c :Block, postnum :int[], idom :(Block|null)[]) :Block {
  while (b !== c) {
    if (postnum[b.id] < postnum[c.id]) {
      b = idom[b.id]!
      assert(b)
    } else {
      c = idom[c.id]!
      assert(c)
    }
  }
  return b
}
