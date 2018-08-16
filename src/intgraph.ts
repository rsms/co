// IntGraph represents an undirected graph structure for integers.
//
// It's implementated with adjacency lists and has shown to provide
// great performance in comparison with adjacency matrix implementations
// and bitset implementations.
//
// This is primarily used to graph sparse values of a moderate magnitude,
// around 15-300 values in total (common number of IR values in a function.)
//
export class IntGraph {
  nodes :Set<int>[]
  readonly length :int

  constructor() {
    this.nodes = []
    this.length = 0
  }

  copy() :IntGraph {
    let g = new IntGraph()
    ;(g as any).length = this.length
    g.nodes = []
    for (let id = 0; id < this.nodes.length; id++) {
      let s = this.nodes[id]
      if (s !== undefined) {
        g.nodes[id] = new Set<int>(s)
      }
    }
    return g
  }

  has(id :int) {
    return !!this.nodes[id]
  }

  add(id :int) {
    if (!this.nodes[id]) {
      this.nodes[id] = new Set<int>()
      ;(this as any).length++
    }
  }

  remove(id :int) {
    let s = this.nodes[id]
    if (s) {
      for (let id2 of s) {
        this.nodes[id2].delete(id)
      }
      ;(this.nodes as any)[id] = undefined
      ;(this as any).length--
    }
  }

  connect(id1 :int, id2 :int) {
    let s = this.nodes[id1]
    if (!s) {
      this.nodes[id1] = new Set<int>([id2])
      ;(this as any).length++
    } else {
      s.add(id2)
    }
    s = this.nodes[id2]
    if (!s) {
      this.nodes[id2] = new Set<int>([id1])
      ;(this as any).length++
    } else {
      s.add(id1)
    }
  }

  connected(id1 :int, id2 :int) {
    let s = this.nodes[id1]
    return s && s.has(id2)
  }

  disconnect(id1 :int, id2 :int) {
    let s = this.nodes[id1]
    if (s) {
      s.delete(id2)
    }
    s = this.nodes[id2]
    if (s) {
      s.delete(id1)
    }
  }

  edges(id :int) :Set<int>|undefined {
    return this.nodes[id]
  }

  degree(id :int) :int {
    return this.nodes[id].size
  }

  any() :int|undefined {
    for (let id = 0; id < this.nodes.length; id++) {
      if (this.nodes[id] !== undefined) {
        return id
      }
    }
    return undefined
  }

  keys() :int[] {
    let keys :int[] = []
    for (let id = 0; id < this.nodes.length; id++) {
      if (this.nodes[id] !== undefined) {
        keys.push(id)
      }
    }
    return keys
  }

  // fmt returns a dot-compatible string representation of the graph
  //
  fmt() :string {
    let pairs = new Set<string>()
    for (let k in this.nodes) {
      let id = k as any as int
      let edges = this.edges(id)
      if (edges) {
        if (edges.size > 0) {
          for (let id2 of edges) {
            if (id < id2) {
              pairs.add(`${id} -- ${id2}`)
            } else {
              pairs.add(`${id2} -- ${id}`)
            }
          }
        } else {
          pairs.add(`${id}`)
        }
      }
    }
    return Array.from(pairs).join('\n')
  }

}
