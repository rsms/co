// Ported from go/src/cmd/compile/internal/ssa/sparsetree.go
//
// Copyright 2015 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
//
import { Fun, Block } from "./ssa"
// import { debuglog as dlog } from "../util"

class Node {
  parent  :Block|null = null
  sibling :Block|null = null
  child   :Block|null = null

  // Every block has 6 numbers associated with it:
  // entry-1, entry, entry+1, exit-1, and exit, exit+1.
  // entry and exit are conceptually the top of the block (phi functions)
  // entry+1 and exit-1 are conceptually the bottom of the block (ordinary defs)
  // entry-1 and exit+1 are conceptually "just before" the block (conditions flowing in)
  //
  // This simplifies life if we wish to query information about x
  // when x is both an input to and output of a block.
  entry :int = 0
  exit  :int = 0

  toString() :string {
    return `[${this.entry},${this.exit}]`
  }
}

export class BlockTree {
  t :Node[]

  constructor(f :Fun, parentOf :(Block|null)[]) {
    // creates a SparseTree from a block-to-parent map (array indexed by Block.id)
    const t = new Array<Node>(f.numBlocks())
    for (let i = t.length; i > 0;) {
      t[--i] = new Node()
    }
    for (let b of f.blocks) {
      let p = parentOf[b.id]
      if (p) {
        let n = t[b.id]
        let pn = t[p.id]
        n.parent = p
        n.sibling = pn.child
        pn.child = b
      }
    }
    this.t = t
    this.numberBlock(f.entry, 1)
    // dlog(`t ${t}`)
  }


  // numberBlock assigns entry and exit numbers for b and b's
  // children in an in-order walk from a gappy sequence, where n
  // is the first number not yet assigned or reserved. N should
  // be larger than zero. For each entry and exit number, the
  // values one larger and smaller are reserved to indicate
  // "strictly above" and "strictly below". numberBlock returns
  // the smallest number not yet assigned or reserved (i.e., the
  // exit number of the last block visited, plus two, because
  // last.exit+1 is a reserved value.)
  //
  // examples:
  //
  // single node tree Root, call with n=1
  //         entry=2 Root exit=5; returns 7
  //
  // two node tree, Root->Child, call with n=1
  //         entry=2 Root exit=11; returns 13
  //         entry=5 Child exit=8
  //
  // three node tree, Root->(Left, Right), call with n=1
  //         entry=2 Root exit=17; returns 19
  // entry=5 Left exit=8;  entry=11 Right exit=14
  //
  // This is the in-order sequence of assigned and reserved numbers
  // for the last example:
  //   root     left     left      right       right       root
  //  1 2e 3 | 4 5e 6 | 7 8x 9 | 10 11e 12 | 13 14x 15 | 16 17x 18
  //
  numberBlock(b :Block, n :int) :int {
    const t = this.t
    // reserve n for entry-1, assign n+1 to entry
    n++
    t[b.id].entry = n
    // reserve n+1 for entry+1, n+2 is next free number
    n += 2
    for (let c = t[b.id].child; c != null; c = t[c.id].sibling) {
      n = this.numberBlock(c, n) // preserves n = next free number
    }
    // reserve n for exit-1, assign n+1 to exit
    n++
    t[b.id].exit = n
    // reserve n+1 for exit+1, n+2 is next free number, returned.
    return n + 2
  }

  // sibling returns a sibling of x in the dominator tree (i.e.,
  // a node with the same immediate dominator) or nil if there
  // are no remaining siblings in the arbitrary but repeatable
  // order chosen. Because the child-sibling order is used
  // to assign entry and exit numbers in the treewalk, those
  // numbers are also consistent with this order (i.e.,
  // sibling(x) has entry number larger than x's exit number).
  sibling(x :Block) :Block|null {
    return this.t[x.id].sibling
  }

  // child returns a child of x in the dominator tree, or
  // nil if there are none. The choice of first child is
  // arbitrary but repeatable.
  child(x :Block) :Block|null {
    return this.t[x.id].child
  }

  // isAncestorEq reports whether x is an ancestor of or equal to y.
  isAncestorEq(x :Block, y :Block) :bool {
    if (x === y) {
      return true
    }
    let xx = this.t[x.id]
    let yy = this.t[y.id]
    return xx.entry <= yy.entry && yy.exit <= xx.exit
  }

  // isAncestor reports whether x is a strict ancestor of y.
  isAncestor(x :Block, y :Block) :bool {
    if (x === y) {
      return false
    }
    let xx = this.t[x.id]
    let yy = this.t[y.id]
    return xx.entry < yy.entry && yy.exit < xx.exit
  }
}
