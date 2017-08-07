export interface BTreeNode<T> {
  k  :ArrayLike<byte>
  v  :T
  L? :BTreeNode<T>
  R? :BTreeNode<T>
}

export class BTree<T> {
  readonly root :BTreeNode<T>
  constructor(root :BTreeNode<T>) {
    this.root = root
  }

  get(key :ArrayLike<byte>) :T|null {
    return lookup(key, this.root)
  }
}

// function lookup<T>(key :ArrayLike<byte>, n :BTreeNode<T>) :T|null {
//   let c = bufcmp(key, n.k)
//   return (
//     (c == -1) ? n.L ? lookup(key, n.L) : null :
//     (c == 1) ? n.R ? lookup(key, n.R) : null :
//     (key.length == n.k.length) ? n.v :
//     null
//   )
// }

function lookup<T>(key :ArrayLike<byte>, n :BTreeNode<T>) :T|null {
  while (n) {
    const c = bufcmp(key, n.k)
    if (c == -1) {
      n = n.L as BTreeNode<T>
    } else if (c == 1) {
      n = n.R as BTreeNode<T>
    } else if (key.length == n.k.length) {
      return n.v
    } else {
      break
    }
  }
  return null
}

function bufcmp(a :ArrayLike<byte>, b :ArrayLike<byte>) :int {
  const aL = a.length, bL = b.length, L = (aL < bL ? aL : bL)
  for (let i = 0; i != L; ++i) {
    if (a[i] < b[i]) { return -1 }
    if (b[i] < a[i]) { return 1 }
  }
  return (
    aL < bL ? -1 :
    bL < aL ? 1 :
    0
  )
}
