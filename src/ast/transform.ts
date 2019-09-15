import * as ast from "./nodes"
import { Node } from "./nodes"
import { NodeVisitor } from "./visit"

export type Visitor = <T extends Node>(n:T)=>T
export type Transformer = <T extends Node>(n:T, visitChildren :Visitor)=>Node

// transform walks as AST, calling trfun to optionally transform nodes.
//
// trfun should not mutate nodes, instead, it should return new nodes
// when it wants to transform a node. This is important since nodes are
// referenced across a parse tree, thus modifying a node in one place may
// affect other places referencing the same node. i.e. transformation uses
// structural sharing to avoid unnecessary copies.
//
// Example of a simple transformation on the source text:
//   the_answer = answer_to_everything
//
// input AST:
//   (VarDecl
//     (idents (Ident "the_answer")
//     (values (Ident "answer_to_everything")))
//
// transformation:
//   let output = ast.transform(input, (n, visitChildren) => {
//     if (n.isIdent() && n.toString() == "answer_to_everything") {
//       return new ast.IntLit(n.pos, 42, ast.types.int, token.INT)
//     }
//     return visitChildren(n)
//   })
//
// output AST:
//   (VarDecl
//     (idents (Ident "the_answer")
//     (values (IntLit 42 int)))
//
//
export function transform<T extends Node, R extends Node=Node>(n :T, f :Transformer) :R {
  return f<T>(n, ((n :Node) :Node => {
    if (n instanceof ast.UnresolvedType) {
      // never visit UnresolvedType as it references itself
      return n
    }
    // let newNode = { __proto__: n.constructor.prototype } as any as Node
    let newNode = Object.create(n.constructor.prototype) as any as Node
    let v = newNodeTransformer(newNode, f)
    // let v = new NodeTransformer(newNode, f)
    n.visit(v)
    if (v.changed) {
      // pos and _scope are never visited over the NodeVisitor protocol, so copy them now.
      let n2 = v.newNode
      n2.pos = n.pos // n2 takes the position of n

      // TODO: Remap scope.
      //   Currently we assign a possibly-unrelated scope to transformed nodes.
      //   Example:
      //     type Foo<T> { x T }
      //   In this case, we have (StructType' Foo (VarDecl' x TemplateVar))
      //   which has a scope
      //     { x => (VarDecl' x TemplateVar) }
      //   Now, we transform this template into an instance:
      //     x Foo<int>
      //   The resulting (StructType'' Foo<int> (VarDecl'' x int))
      //   has a scope
      //     { x => (VarDecl' x TemplateVar) }
      //   but really it should have a scope:
      //     { x => (VarDecl'' x int) }
      //   Now, this is not a big issue because the scope of an expanded template
      //   is never used, but it could be at some point in the future, and then we
      //   would experience unexpected results.
      //   Note: We can use Scope.copy to get a modifiable copy of a scope.
      //

      if (n2._scope === undefined) {
        n2._scope = n._scope
      }
      n = n2
    }
    freeNodeTransformer(v)
    return n
  }) as Visitor) as R
}


class NodeTransformer implements NodeVisitor {
  f       :Transformer
  newNode :Node  // clone being populated
  changed = false
  seenNodes = new Set<Node>()  // for breaking cycles

  constructor(newNode :Node, f :Transformer) {
    this.f = f
    this.newNode = newNode
  }

  set(name :string, v1 :any, v2 :any) {
    if (v1 !== v2) {
      v1 = v2
      this.changed = true
    }
    ;(this.newNode as any)[name] = v1
  }

  transformVal(v :any) :any {
    if (typeof v == "object") {
      if (v instanceof Node) {
        if (this.seenNodes.has(v)) { return v }  // break cycle
        this.seenNodes.add(v)
        let n = transform(v, this.f)
        this.seenNodes.delete(v)
        return n
      }
      if (Array.isArray(v))  { return this.transformArray(v) }
      if (v instanceof Set)  { return this.transformSet(v) }
      if (v instanceof Map)  { return this.transformMap(v) }
    }
    return v
  }

  transformMap(m :Map<any,any>) :Map<any,any> {
    let changed = false
    let m2 = new Map<any,any>()
    for (let [k,v] of m) {
      let k2 = this.transformVal(k)
      let v2 = this.transformVal(v)
      if (k !== k2 || v !== v2) {
        changed = true
      }
      m2.set(k2, v2)
    }
    return changed ? m2 : m
  }

  transformSet(s :Set<any>) :Set<any> {
    let changed = false
    let s2 = new Set<any>()
    for (let v of s) {
      let v2 = this.transformVal(v)
      if (v !== v2) {
        changed = true
      }
      s2.add(v2)
    }
    return changed ? s2 : s
  }

  transformArray(a :any[]) :any[] {
    let changed = false
    let a2 = a.map(v => {
      let v2 = this.transformVal(v)
      if (v !== v2) {
        changed = true
      }
      return v2
    })
    return changed ? a2 : a
  }

  transformNodeArray(a :any[]) :any[] {
    let changed = false
    let a2 = a.map(n => {
      let n2 = transform(n, this.f)
      if (n !== n2) {
        changed = true
      }
      return n2
    })
    return changed ? a2 : a
  }

  // ast.NodeVisitor interface
  visitFieldN(name: string, n :Node) :void {
    this.set(name, n, transform(n, this.f))
  }
  visitFieldNA(name: string, a :Node[]) :void {
    this.set(name, a, this.transformNodeArray(a))
  }
  visitField(name: string, v :any) :void {
    this.set(name, v, this.transformVal(v))
  }
  visitFieldA(name: string, a :any[]) :void {
    this.set(name, a, this.transformArray(a))
  }
  visitFieldE(name: string, v :number, _enum :{[k:number]:string}) {
    ;(this.newNode as any)[name] = v
  }
  visitNode(n :Node) :void { assert(false,"unused") }
}



// transformer context pool
// allocation pattern is: alloc, alloc, alloc, free, free, free, alloc, ...
let nodeTransformerPool :NodeTransformer[] = []
function newNodeTransformer(newNode :Node, f :Transformer) :NodeTransformer {
  let v = nodeTransformerPool.pop()
  if (!v) {
    v = new NodeTransformer(newNode, f)
  } else {
    v.changed = false
    v.newNode = newNode
    v.f = f
    assert(v.seenNodes.size == 0, `seenNodes not empty; transformVal failed to delete node`)
  }
  return v
}
function freeNodeTransformer(v :NodeTransformer) {
  // make sure we unassociate from potentially-heavy objects so they can get GC'd
  ;(v as any).newNode = undefined
  ;(v as any).f = undefined
  nodeTransformerPool.push(v)
}
