
// PathMap is a map-like container which can map
// lists of values (i.e. "paths") of any type.
// It's implemented as a trie.
//
export class PathMap<K,V> {
  readonly size :int = 0

  _root :PathMapNode<K,V>|null = null

  get(keys :Iterable<K>) :V|undefined {
    let n :PathMapNode<K,V>|null|undefined = this._root
    for (let k of keys) {
      if (!n) {
        break
      }
      n = n.m && n.m.get(k)
    }
    return n ? n.v : undefined
  }

  has(keys :Iterable<K>) :bool {
    return this.get(keys) !== undefined
  }

  set(keys :Iterable<K>, value :Exclude<V,undefined>) {
    let n :PathMapNode<K,V> = this._root || (this._root = new PathMapNode<K,V>())
    for (let k of keys) {
      if (!n.m) {
        n.m = new Map<K,PathMapNode<K,V>>()
      }
      let n2 = n.m.get(k)
      if (!n2) {
        n.m.set(k, n2 = new PathMapNode<K,V>())
      }
      n = n2
    }
    if (n.v === undefined) {
      (this as any).size++
    }
    n.v = value
  }

  delete(keys :Iterable<K>) :bool {  // deleted?
    if (this._root && this._root.delete(Array.isArray(keys) ? keys : Array.from(keys), 0)) {
      ;(this as any).size--
      return true
    }
    return false
  }

  clear() {
    if (this._root && this._root.m) {
      this._root.m.clear()
      this._root.v = undefined
    } else {
      this._root = null
    }
    ;(this as any).size = 0
  }

  items() :[K[],V][] {
    let items = [] as [K[],V][]
    if (this._root) {
      this._root.collectItems([], items)
    }
    return items
  }

  toString(indent :string = "\n  ") :string {
    let items = this.items()
    return (
      `PathMap{` +
      (items.length > 0 ?
        indent + items.map(e =>
          `[${e[0].map(String).join(", ")}] => ${e[1]}`
        ).join(indent) + (indent.indexOf("\n") == -1 ? "}" : "\n}")
      :
        "}"
      )
    )
  }

}


class PathMapNode<K,V> {
  v  :V|undefined = undefined
  m? :Map<K,PathMapNode<K,V>>

  collectItems(keys :K[], items :[K[],V][]) {
    if (this.v !== undefined) {
      items.push([keys, this.v])
    }
    if (this.m) for (let [k, br] of this.m) {
      br.collectItems(keys.concat([k]), items)
    }
  }

  delete(keys :K[], ki :int) :int {  // deleted?
    if (ki == keys.length) {
      if (this.v !== undefined) {
        this.v = undefined
        return 2  // deleted "branch" (i.e. leaf value)
      }
    } else if (this.m) {
      let br = this.m.get(keys[ki])
      if (br) {
        let delcode = br.delete(keys, ki + 1)
        if (delcode == 2 && (!br.m || br.m.size == 0) && br.v === undefined) {
          // remove dead branch
          if (this.m.size == 1) {
            this.m = undefined
          } else {
            this.m.delete(keys[ki])
          }
          return 2 // deleted whole branch
        }
        return 1 // deleted only value (not branch)
      }
    }
    return 0 // nothing deleted
  }
}


TEST("PathMap", () => {
  let A = {toString:()=>"A"}
  let B = {toString:()=>"B"}
  let C = {toString:()=>"C"}

  // [intentionally disabled]
  // The following tests the "exclude undefined" TypeScript type
  // constraints which helps prevent assigning "undefined" which
  // has exceptional effect.
  // let m1 = new PathMap<any,string|undefined>()
  // m1.set([A], "foo" as string|undefined)
  // m1.set([A], "foo")

  // create
  let m = new PathMap<any,string>()
  assert(m.size == 0)
  assert(m.get([A,B,C]) === undefined)
  assert(m.get([A,B]) === undefined)
  assert(m.get([A]) === undefined)
  assert(m.get([]) === undefined)


  // set add
  m.set([A,B,C], "abc")
  assert(m.size == 1)
  assert(m.get([A,B,C]) === "abc")
  assert(m.get([A,B]) === undefined)
  assert(m.get([A]) === undefined)
  assert(m.get([]) === undefined)

  m.set([A,B], "ab")
  assert(m.size == 2)
  assert(m.get([A,B,C]) === "abc")
  assert(m.get([A,B]) === "ab")
  assert(m.get([A]) === undefined)
  assert(m.get([]) === undefined)

  m.set([A], "a")
  assert(m.size == 3)
  assert(m.get([A,B,C]) === "abc")
  assert(m.get([A,B]) === "ab")
  assert(m.get([A]) === "a")
  assert(m.get([]) === undefined)

  m.set([A,C,B], "acb")
  m.set([A,A,A], "aaa")
  m.set([A,B,B], "abb")
  assert(m.size == 6)
  assert(m.get([A,B,C]) === "abc")
  assert(m.get([A,C,B]) === "acb")
  assert(m.get([A,A,A]) === "aaa")
  assert(m.get([A,B,B]) === "abb")
  assert(m.get([A,B]) === "ab")
  assert(m.get([A]) === "a")
  assert(m.get([]) === undefined)


  // set replace
  m.set([A,C,B], "ACB")
  m.set([A,A,A], "AAA")
  m.set([A,B,B], "ABB")
  assert(m.size == 6)
  assert(m.get([A,B,C]) === "abc")
  assert(m.get([A,C,B]) === "ACB")
  assert(m.get([A,A,A]) === "AAA")
  assert(m.get([A,B,B]) === "ABB")
  assert(m.get([A,B]) === "ab")
  assert(m.get([A]) === "a")
  assert(m.get([]) === undefined)


  // delete
  m.delete([A,B,C])
  assert(m.size == 5)
  assert(m.get([A,B,C]) === undefined)
  assert(m.get([A,C,B]) === "ACB")
  assert(m.get([A,A,A]) === "AAA")
  assert(m.get([A,B,B]) === "ABB")
  assert(m.get([A,B]) === "ab")
  assert(m.get([A]) === "a")
  assert(m.get([]) === undefined)

  m.delete([A,B,B])
  assert(m.size == 4)
  assert(m.get([A,B,C]) === undefined)
  assert(m.get([A,C,B]) === "ACB")
  assert(m.get([A,A,A]) === "AAA")
  assert(m.get([A,B,B]) === undefined)
  assert(m.get([A,B]) === "ab")
  assert(m.get([A]) === "a")
  assert(m.get([]) === undefined)


  // clear
  m.clear()
  assert(m.size == 0)
  assert(m.get([A,B,C]) === undefined)
  assert(m.get([A,C,B]) === undefined)
  assert(m.get([A,A,A]) === undefined)
  assert(m.get([A,B,B]) === undefined)
  assert(m.get([A,B]) === undefined)
  assert(m.get([A]) === undefined)
  assert(m.get([]) === undefined)

  // print(`${m}`)
})
