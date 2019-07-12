// Ported from go/src/cmd/compile/internal/ssa/likelyadjust.go
//
// Copyright 2016 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.
//
import { Fun, Block } from "./ssa"
import { BlockTree } from "./blocktree"
import { debuglog as dlog } from "../util"


export class Loop {
  header :Block // The header node of this (reducible) loop
  outer  :Loop|null = null  // loop containing this loop

  // By default, children, exits, and depth are not initialized.
  children :Loop[]  // loops nested directly within this loop. Initialized by assembleChildren().
  exits    :Block[] // exits records blocks reached by exits from this loop. Initialized by findExits().

  // Next three fields used by regalloc and/or
  // aid in computation of inner-ness and list of blocks.
  nBlocks :int   // Number of blocks in this loop but not within inner loops
  depth   :int   // Nesting depth of the loop; 1 is outermost. Initialized by calculateDepths().
  isInner :bool  // True if never discovered to contain a loop

  // register allocation uses this.
  containsUnavoidableCall :bool // True if all paths through the loop have a call

  constructor(header :Block, isInner :bool) {
    this.header = header
    isInner = isInner
  }

  // nearestOuterLoop returns the outer loop of loop most nearly
  // containing block b; the header must dominate b.  loop itself
  // is assumed to not be that loop. For acceptable performance,
  // we're relying on loop nests to not be terribly deep.
  nearestOuterLoop(sdom :BlockTree, b :Block) :Loop|null {
    let o: Loop|null = this.outer
    for (; o && !sdom.isAncestorEq(o.header, b); o = o.outer) {}
    return o
  }

  setDepth(d :int) {
    this.depth = d
    for (let c of this.children) {
      c.setDepth(d + 1)
    }
  }

  // iterationEnd checks if block b ends iteration of loop l.
  // Ending iteration means either escaping to outer loop/code or
  // going back to header
  iterationEnd(b :Block, b2l :Loop[]) :bool {
    return (
      b === this.header ||
      b2l[b.id] == null ||
      (b2l[b.id] !== this && b2l[b.id].depth <= this.depth)
    )
  }

  // recordIfExit checks sl (the loop containing b) to see if it is outside of
  // this loop, and if so, records b as an exit block from l and returns true.
  recordIfExit(sl :Loop|null, b :Block) :bool {
    const l = this
    if (sl !== l) {
      if (!sl || sl.depth <= l.depth) {
        l.exits.push(b)
        return true
      }
      // sl is not nil, and is deeper than l
      // it's possible for this to be a goto into an irreducible loop made from gotos.
      while (sl!.depth > l.depth) {
        sl = sl!.outer
      }
      if (sl !== l) {
        l.exits.push(b)
        return true
      }
    }
    return false
  }
}


export class LoopNest {
  f              :Fun
  b2l            :Loop[]
  po             :Block[]
  sdom           :BlockTree
  loops          :Loop[]
  hasIrreducible :bool

  // Record which of the lazily initialized fields have actually been initialized.
  initializedChildren :bool = false
  initializedDepth    :bool = false
  initializedExits    :bool = false

  constructor(
    f              :Fun,
    b2l            :Loop[],
    po             :Block[],
    sdom           :BlockTree,
    loops          :Loop[],
    hasIrreducible :bool,
  ) {
   this.f              = f
   this.b2l            = b2l
   this.po             = po
   this.sdom           = sdom
   this.loops          = loops
   this.hasIrreducible = hasIrreducible
  }

  // assembleChildren initializes the children field of each loop in the nest.
  // Loop A is a child of loop B if A is directly nested within B
  // (based on the reducible-loops detection above)
  assembleChildren() {
    const ln = this
    if (ln.initializedChildren) {
      return
    }
    for (let l of ln.loops) {
      if (l.outer) {
        l.outer.children.push(l)
      }
    }
    ln.initializedChildren = true
  }

  // calculateDepths uses the children field of loops to determine the nesting
  // depth (outer=1) of each loop.  This is helpful for finding exit edges.
  calculateDepths() {
    const ln = this
    if (ln.initializedDepth) {
      return
    }
    ln.assembleChildren()
    for (let l of ln.loops) {
      if (!l.outer) {
        l.setDepth(1)
      }
    }
    ln.initializedDepth = true
  }

  // findExits uses loop depth information to find the exits from a loop.
  findExits() {
    const ln = this
    if (ln.initializedExits) {
      return
    }
    ln.calculateDepths()
    let b2l = ln.b2l
    for (let b of ln.po) {
      let l = b2l[b.id]
      if (l && b.succs.length == 2) {
        let sl = b2l[b.succs[0].id]
        if (l.recordIfExit(sl, b.succs[0])) {
          continue
        }
        sl = b2l[b.succs[1].id]
        if (l.recordIfExit(sl, b.succs[1])) {
          continue
        }
      }
    }
    ln.initializedExits = true
  }
}


export function loopnest(f :Fun) :LoopNest {
  let po = f.postorder()
  let sdom = f.sdom()
  let numblocks = f.numBlocks()
  let b2l = new Array<Loop>(numblocks)
  let loops = [] as Loop[]
  let visited = new Array<bool>(numblocks)
  let sawIrred = false

  // Reducible-loop-nest-finding.
  for (let b of po) {
    dlog(`loop finding at ${b}`)

    let innermost :Loop|null = null // innermost header reachable from this block

    // IF any successor s of b is in a loop headed by h
    // AND h dominates b
    // THEN b is in the loop headed by h.
    //
    // Choose the first/innermost such h.
    //
    // IF s itself dominates b, then s is a loop header;
    // and there may be more than one such s.
    // Since there's at most 2 successors, the inner/outer ordering
    // between them can be established with simple comparisons.
    for (let bb of b.succs) {
      // bb := e.b
      let l :Loop|null = b2l[bb.id]

      if (sdom.isAncestorEq(bb, b)) { // Found a loop header
        dlog(`loop finding    succ ${bb} of ${b} is header`)
        if (l) {
          l = new Loop(bb, /*isInner*/ true)
          loops.push(l)
          b2l[bb.id] = l
        }
      } else if (!visited[bb.id]) { // Found an irreducible loop
        sawIrred = true
        dlog(`loop finding    succ ${bb} of ${b} is IRRED, in ${f}`)
      } else if (l) {
        // TODO handle case where l is irreducible.
        // Perhaps a loop header is inherited.
        // is there any loop containing our successor whose header dominates b?
        if (!sdom.isAncestorEq(l.header, b)) {
          l = l.nearestOuterLoop(sdom, b)
        }
        if (!l) {
          dlog(`loop finding    succ ${bb} of ${b} has no loop`)
        } else {
          dlog(`loop finding    succ ${bb} of ${b} provides loop with header ${l.header}`)
        }
      } else { // No loop
        dlog(`loop finding    succ ${bb} of ${b} has no loop`)
      }

      if (!l || innermost === l) {
        continue
      }

      if (!innermost) {
        innermost = l
        continue
      }

      if (sdom.isAncestor(innermost.header, l.header)) {
        outerinner(sdom, innermost, l)
        innermost = l
      } else if (sdom.isAncestor(l.header, innermost.header)) {
        outerinner(sdom, l, innermost)
      }
    }

    if (innermost) {
      b2l[b.id] = innermost
      innermost.nBlocks++
    }
    visited[b.id] = true
  }

  let ln = new LoopNest(f, b2l, po, sdom, loops, sawIrred)

  // Calculate containsUnavoidableCall for regalloc
  let dominatedByCall = new Array<bool>(f.numBlocks())
  for (let b of po) {
    if (b.containsCall()) {
      dominatedByCall[b.id] = true
    }
  }
  // Run dfs to find path through the loop that avoids all calls.
  // Such path either escapes loop or return back to header.
  // It isn't enough to have exit not dominated by any call, for example:
  // ... some loop
  // call1   call2
  //   \      /
  //     exit
  // ...
  // exit is not dominated by any call, but we don't have call-free path to it.
  for (let l of loops) {
    // Header contains call.
    if (dominatedByCall[l.header.id]) {
      l.containsUnavoidableCall = true
      continue
    }
    let callfreepath = false
    let tovisit = [] as Block[]
    // Push all non-loop non-exit successors of header onto toVisit.
    for (let nb of l.header.succs) {
      // This corresponds to loop with zero iterations.
      if (!l.iterationEnd(nb, b2l)) {
        tovisit.push(nb)
      }
    }
    while (tovisit.length > 0) {
      let cur = tovisit.pop()! ; assert(cur)
      if (dominatedByCall[cur.id]) {
        continue
      }
      // Record visited in dominatedByCall.
      dominatedByCall[cur.id] = true
      for (let nb of cur.succs) {
        if (l.iterationEnd(nb, b2l)) {
          callfreepath = true
        }
        if (!dominatedByCall[nb.id]) {
          tovisit.push(nb)
        }

      }
      if (callfreepath) {
        break
      }
    }
    if (!callfreepath) {
      l.containsUnavoidableCall = true
    }
  }

  if (f.config.loopstats && loops.length > 0) {
    ln.assembleChildren()
    ln.calculateDepths()
    ln.findExits()
    // Note stats for non-innermost loops are slightly flawed because
    // they don't account for inner loop exits that span multiple levels.
    for (let l of loops) {
      let x = l.exits.length
      let cf = 0
      if (!l.containsUnavoidableCall) {
        cf = 1
      }
      let inner = 0
      if (l.isInner) {
        inner++
      }

      let stats :[string,any][] = [
        ["depth", l.depth],
        ["exits", x],
        ["is_inner", inner],
        ["always_calls", cf],
        ["n_blocks", l.nBlocks],
      ]
      let longestStatName = stats.reduce((a, s) => Math.max(a, s[0].length), 0)
      let spaces = "                 "
      print(
        `loopstats:` + stats.map(s =>
          `${s[0]}${spaces.substr(0, longestStatName - s[0].length)} ${s[1]}\n`
        ).join("")
      )
    }
  }

  // if f.pass != nil && f.pass.debug > 1 && len(loops) > 0 {
  //   fmt.Printf("Loops in %s:\n", f.Name)
  //   for _, l := range loops {
  //     fmt.Printf("%s, b=", l.LongString())
  //     for _, b := range f.Blocks {
  //       if b2l[b.id] == l {
  //         fmt.Printf(" %s", b)
  //       }
  //     }
  //     fmt.Print("\n")
  //   }
  //   fmt.Printf("Nonloop blocks in %s:", f.Name)
  //   for _, b := range f.Blocks {
  //     if b2l[b.id] == nil {
  //       fmt.Printf(" %s", b)
  //     }
  //   }
  //   fmt.Print("\n")
  // }

  return ln
}


// outerinner records that outer contains inner
function outerinner(sdom :BlockTree, outer :Loop, inner :Loop) {
  // There could be other outer loops found in some random order,
  // locate the new outer loop appropriately among them.

  // Outer loop headers dominate inner loop headers.
  // Use this to put the "new" "outer" loop in the right place.
  let oldouter = inner.outer
  let inn = inner as Loop|null
  while (oldouter && sdom.isAncestor(outer.header, oldouter.header)) {
    inn = oldouter
    oldouter = inn.outer
  }
  if (outer === oldouter) {
    return
  }
  if (oldouter) {
    outerinner(sdom, oldouter, outer)
  }

  inner.outer = outer
  outer.isInner = false
}
