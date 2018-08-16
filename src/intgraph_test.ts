import { IntGraph } from './intgraph'


function uintpairs(s :string) {
  return s
    .trim()
    .split(/[\n;]+/)
    .map(s => s.trim())
    .filter(s => s.length)
    .map(uints)
}

function uints(s :string) {
  return s.trim().split(/\s+/).map(v => Number(v) >>> 0)
}


let samples = {
  nodes: uints(
    `1 2 3 4 5 6 7 8   10 11 12 13 14    16 17 18 19 20 21 22
     23 24 25 26 27 28
     210 211 212 213 214     216 217 218 219 220
    `),
  holes: uints(
    ` 9 15 30 40 50 60 120 123 215 `),
  edges: uintpairs(`
    2 1
    3 2 ; 3 1
    4 2 ; 4 1
    5 4 ; 5 2
    6 4 ; 6 1
    7 4 ; 7 2 ; 7 6
    8 4 ; 8 7
    10 4 ; 10 8 ; 10 7
    11 4 ; 11 8
    12 4 ; 12 7
    13 4 ; 13 8 ; 13 12 ; 13 1 ; 13 2 ; 13 26 ; 13 218
    14 13 ; 14 4
    16 14 ; 16 13 ; 16 4
    17 14
    18 13
    19 14 ; 19 18
    20 19

    22  21
    23  22  ; 23  21
    24  22  ; 24  21
    25  24  ; 25  22
    26  24  ; 26  21
    27  24  ; 27  22  ; 27 26
    28  24  ; 28  27
    210 24  ; 210 28  ; 210 27 ; 210 5 ; 210 2 ; 210 3 ; 210 25
    211 24  ; 211 28
    212 24  ; 212 27
    213 24  ; 213 28  ; 213 212
    214 213 ; 214 24
    216 214 ; 216 213 ; 216 24
    217 214
    218 213
    219 214 ; 219 218
    220 219
  `)
}


TEST('general', () => {
  let g = new IntGraph()

  // add
  for (let id of samples.nodes) {
    g.add(id)
  }

  // check existence
  let maxid = 0
  for (let id of samples.nodes) {
    assert(g.has(id), `g.has(${id})`)
    maxid = Math.max(maxid, id)
  }
  // check holes
  for (let id of samples.holes) {
    assert(!g.has(id), `!g.has(/* hole */ ${id})`)
  }
  // check non-existence
  for (let id of samples.nodes) {
    assert(!g.has(id + maxid + 1), `!g.has(${id + maxid + 1})`)
    assert(!g.has(id - maxid - 1), `!g.has(${id - maxid - 1})`)
  }

  // connect edges
  let connections = new Map()
  for (let e of samples.edges) {
    g.connect(e[0], e[1])

    let s0 = connections.get(e[0])
    if (s0) { s0.add(e[1]) } else { connections.set(e[0], new Set([ e[1] ])) }

    let s1 = connections.get(e[1])
    if (s1) { s1.add(e[0]) } else { connections.set(e[1], new Set([ e[0] ])) }
  }

  for (let id of samples.nodes) {
    let expectedDegree = connections.get(id) ? connections.get(id).size : 0
    assert(g.degree(id) == expectedDegree,
      `g.degree(${id}) = ${g.degree(id)} = ${expectedDegree}`)
  }

  // verify connections
  for (let e of samples.edges) {
    assert(g.connected(e[0], e[1]), `g.connected(${e[0]}, ${e[1]})`)
    assert(g.connected(e[1], e[0]), `g.connected(${e[1]}, ${e[0]})`)
  }
  // full connection check using connections map
  for (let id1 of samples.nodes) {
    let expectedEdges = connections.get(id1)
    for (let id2 of samples.nodes) {
      let isConnected = g.connected(id1, id2)
      if (expectedEdges && expectedEdges.has(id2)) {
        assert(isConnected, `g.connected(${id1}, ${id2})`)
      } else {
        assert(!isConnected, `!g.connected(${id1}, ${id2})`)
      }
    }
  }

  // verify edges
  // for (let edge of samples.edges) {
  //   let edges0 = g.edges(edge[0])
  //   assert(edges0.indexOf(edge[1]) != -1,
  //     `g.edges(${edge[0]}) contains ${edge[1]}`)

  //   let edges1 = g.edges(edge[1])
  //   assert(edges1.indexOf(edge[0]) != -1,
  //     `g.edges(${edge[1]}) contains ${edge[0]}`)
  // }

  // remove
  let removed = new Set()
  for (let id of samples.nodes) {
    // console.log(`remove ${id}; state before:`); g.inspect()
    g.remove(id)
    removed.add(id)
    // console.log(`removed ${id}; state after:`); g.inspect()
    assert(!g.has(id), `!g.has(${id}) after removing it`)


    // verify connections
    for (let [id1, id2] of samples.edges) {
      let isconn1 = g.connected(id1, id2)
      let isconn2 = g.connected(id2, id1)
      if (removed.has(id1)) {
        assert(!isconn1,
          `g.connected(${id1}, ${id2}) even though ${id1} has been removed`)
        assert(!isconn2,
          `g.connected(${id2}, ${id1}) even though ${id1} has been removed`)
      } else if (removed.has(id2)) {
        assert(!isconn1,
          `g.connected(${id1}, ${id2}) even though ${id2} has been removed`)
        assert(!isconn2,
          `g.connected(${id2}, ${id1}) even though ${id2} has been removed`)
      } else {
        assert(isconn1, `g.connected(${id1}, ${id2})`)
        assert(isconn2, `g.connected(${id2}, ${id1})`)
      }
    }
  }

})
