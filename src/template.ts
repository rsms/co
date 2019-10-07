import { Pos, NoPos } from "./pos"
import { strings } from "./bytestr"
import { PathMap } from "./pathmap"
import * as utf8 from "./utf8"
import * as ast from "./ast"
import { Node, Template, TemplateInvocation, TemplateVar } from "./ast"
import { debuglog as dlog } from "./util"

const DEBUG_EXPANSION = false // DEBUG
let ind = ""
let dbg = DEBUG_EXPANSION ? (...args :any[]) :void => {
  print(ind + args.map(v =>
    typeof v == "string" ? v.replace(/\n/m, "\n" + ind) : v
  ).join(" "))
} : (...args :any[]) :void => {}


export type ErrorCallback = (message :string, pos :Pos) => any


class CacheEnt {
  key   :Node[]
  value :Node|null

  constructor(key :Node[], value: Node|null) {
    this.key = key
    this.value = value
  }
}

const instanceCache = new class {
  tmap = new Map<Template<Node>,CacheEnt[]>()

  get(t :Template<Node>, args :Node[]) :Node|null {
    let entries = this.tmap.get(t)
    if (!entries) {
      return null
    }

    // TODO: replace this with something more efficient, like a trie.

    let nargs = args.length

    ent_loop:
    for (let ent of entries) {
      if (ent.key.length == nargs) {
        for (let i = 0; i < nargs; i++) {
          let arg = args[i]
          if (!this.equals(args[i], ent.key[i])) {
            continue ent_loop
          }
        }
        return ent.value
      }
    }

    return null
  }

  set(t :Template<Node>, args :Node[], value :Node) {
    let ent = new CacheEnt(args, value)
    let v = this.tmap.get(t)
    if (!v) {
      this.tmap.set(t, [ent])
    } else {
      v.push(ent)
    }
  }

  equals(a :Node, b :Node) :bool {
    if (a === b) {
      return true
    }
    if (a.isType() && b.isType()) {
      return a.equals(b)
    }
    if (a.isIdent() && b.isIdent()) {
      return a.ent === b.ent
    }
    return false
  }
}


// expand a template, possibly returning a partially expanded template.
//
// restype is a Node constructor representing the expected result type.
// For instance, for a template used as a type, restype==ast.Type.
//
// Note on type arguments for this function:
//   restype R can be a supertype or same type as the template type T.
//   The reason for this is that a template must always produce a type
//   compatible with the expected result type R.
//
// env, if provided, describes the outer/parent envionment in which
// tvar lookups can be resolved.
//
// onerr, if provided, is invoked when an error occurs. The causing node
// is the first argument and the error message the second argument.
// For example, used for failing constraints.
//
export function expand<R extends Node, T extends R>(
  restype :Constructor<R>,
  ti      :TemplateInvocation<T>,
  env     :Env|null,
  onerr   :ErrorCallback|null,
) :T|Template<T> {
  // TODO: instance cache.
  // e.g. instanceCache.get([ti.template, ti.args])
  // We can use PathMap for this.

  let cached = instanceCache.get(ti.template, ti.args)
  if (cached) {
    return cached as T|Template<T>
  }

  let tp = ti.template

  // expansion state
  let hasUnresolvedTvars = false
  let lookupCache = new Map<TemplateVar,Node>()
  env = new Env(env, ti)

  if (DEBUG_EXPANSION) {
    if (ind == "") {
      ast.print(ti)
    }
    dbg(`expand ${tp} as ${restype.name}`)
    tp.aliases().forEach(t => dbg(`  alias for ${t}`))
    dbg(`env:\n` + Array.from(env.bindings).map(p => `  ${p[0].name} => ${p[1]}`).join("\n"))
  }

  function expandVar(tvar :TemplateVar, visitChildren :ast.Visitor) :Node {
    let tvar2 :TemplateVar = visitChildren(tvar)

    // lookup tvar in environment
    let val :Node|null = lookupCache.get(tvar) as Node|null
    if (val) {
      dbg(`lookup cache hit for ${tvar} -> ${val}`)
      return val
    }

    val = env!.lookup(tvar)
    // unwind tvar->tvar chains
    if (!DEBUG_EXPANSION) {
      while (val instanceof TemplateVar) {
        val = env!.lookup(val)
      }
    } else {
      let prevtvar :TemplateVar = tvar // only for debug print
      while (val instanceof TemplateVar) {
        // unwind tvar->tvar chains
        dbg(`○ RESOLVE  ${prevtvar} -> ${val}`); prevtvar = val
        val = env!.lookup(val)
      }
      dbg(`● RESOLVE  ${tvar} -> ${val}`)
    }

    if (!val) {
      hasUnresolvedTvars = true
      val = tvar2
    } else {
      let pos = val.pos
      if (val.isIdent() && val.ent && val.ent.value.isType()) {
        // val is a name of a type
        val = val.ent.value
      }
      // check constraint on tvar
      assert(!tvar2.constraint == !tvar.constraint)
      if (tvar2.constraint && onerr) {
        let constraint :Node = tvar2.constraint
        dbg(`check constraint ${constraint} <- ${val}`)
        let msg = validateConstraint(constraint, val)
        if (msg) {
          if (tvar.constraint && tvar.constraint.isTemplateVar()) {
            // The constraint is based on another tvar. e.g.
            //   type Point<T int|i32|i64, Y T> {}
            //   x Point<int,i64>
            msg += ` (inferred from ${tvar.constraint.name})`
          }
          onerr(msg, pos)
        }
      }
    }

    lookupCache.set(tvar, val)
    return val
  }

  // hide template vars during transformation to avoid unnecessary substitution
  let vars = tp.vars  // save vars
  tp.vars = []        // clear vars

  // apply transformation to expand template
  let expanded :Template<Node> = ast.transform(tp, (n, visitChildren) => {
    // Pipe through nodes which can never contain a TemplateVar
    if (n instanceof ast.LiteralExpr || n instanceof ast.PrimType || n instanceof ast.Atom) {
      return n
    }

    let dbgexit :<T>(v:T)=>T = DEBUG_EXPANSION ? (
      dbg(`enter ${n.constructor.name} (${n})`), ind += "  ", v => {
      ind = ind.substr(0, ind.length-2)
      dbg(`exit ${n.constructor.name} (${n})`)
      return v
    }) : function<T>(v:T):T{return v}

    if (n instanceof TemplateInvocation) {
      return dbgexit(expand(Node, n, env, onerr))  // FIXME restype (Node for now to allow any)
    } else if (n instanceof TemplateVar) {
      return dbgexit(expandVar(n, visitChildren))
    }
    return dbgexit(visitChildren(n))
  })

  // unhide vars
  tp.vars = vars

  // template was either not expanded at all, or partially expanded, where the latter
  // produces a new derivative template, which is what we test for.
  if (hasUnresolvedTvars) {
    if (expanded !== tp) {
      // partially expanded
      dbg(`partially expanded`)
      // patch newly-created template to only define unexpanded tvars.
      // copy & filter scope to only include unexpanded vars
      expanded.vars = []
      expanded._scope = expanded._scope.filter((name, ent) => {
        let tvar = ent.value as TemplateVar
        assert(tvar.isTemplateVar(), `non-tvar in template scope: ${tvar}`)
        if (lookupCache.get(tvar) === tvar) {
          expanded.vars.push(tvar)
          return true
        }
        return false
      })
    } else {
      // not expanded at all
      dbg(`not expanded at all`)
    }

    // TODO: consider if it makes sense to allow/support zero expansion.
    // i.e. TemplateInvocation without args. It may not make sense and we
    // might be able to simplify some of this code. However, at the moment
    // we essentially get it for free (no special logic).

    // return visitChildren(expanded) // maybe we need a second pass..?
    instanceCache.set(ti.template, ti.args, expanded)
    return expanded as Template<T>
  }

  // if we get here, the template was fully expanded (all tvars were resolved).
  // this does NOT mean that the expansion result is not a template -- it may very well
  // be a template, i.e. for templates of templates.
  assert(expanded !== tp, `${tp} not expanded even though args were provided`)

  dbg(`fully expanded`)
  let n = expanded.base as T

  // check expanded vs restype
  if (onerr && !(n instanceof restype)) {
    onerr(`expected ${ti} to expand to ${restype.name} but got ${n.constructor.name}`, ti.pos)
  }

  // if we get a struct back, rename it to e.g. "Foo<A,B>".
  if (n.isStructType()) {
    let base = tp.bottomBase()
    if (base !== tp) {
      // TODO: efficiency of string creation
      let str = strings.get(utf8.encodeString(`${base}<${ti.args.join(",")}>`))
      n.name = new ast.Ident(base.pos, ti._scope, str)
    } else {
      // TODO: efficiency of string creation
      let str = strings.get(utf8.encodeString(`<${ti.args.join(",")}>`))
      n.name = new ast.Ident(ti.pos, ti._scope, str)
    }
  }

  // if (n.isType()) {
  //   // erase own type
  //   n.type = null
  // }

  instanceCache.set(ti.template, ti.args, n)

  if (DEBUG_EXPANSION) {
    ast.print(n)
    if (ind == "") { process.exit(0) }
  }

  return n
}


// Env holds bindings for a template expansion.
// Envs can be nested.
//
export class Env {
  outer :Env|null
  bindings = new Map<TemplateVar,Node>()

  constructor(outer :Env|null, ti :TemplateInvocation) {
    this.outer = outer
    let vars = ti.template.vars
    let i = 0
    for (let z = Math.min(vars.length, ti.args.length); i < z; i++) {
      let arg :Node = ti.args[i]
      if (arg.isIdent() && arg.type && arg.type.isTemplateVar()) {
        arg = arg.type
      }
      this.bindings.set(vars[i], arg)
    }
    // append default vars after we finish adding explicit args
    for (; i < vars.length; i++) {
      let v = vars[i]
      if (!v.def) {
        break
      }
      this.bindings.set(vars[i], v.def)
    }
  }

  lookup(tv :TemplateVar) :Node|null {
    let n = this.bindings.get(tv)
    return n || (this.outer ? this.outer.lookup(tv) : null)
  }
}


function validateConstraint(constraint :Node, n :Node) :string|null {
  // TODO: expand this
  if (constraint.isType()) {
    if (n.isType()) {
      if (!constraint.accepts(n)) {
        return `Type ${n} does not satisfy the constraint ${constraint}`
      }
    } else if (n.isExpr()) {
      return `${n} (expression of type ${n.type}) does not satisfy the constraint ${constraint}`
    } else {
      return `${n} does not satisfy the constraint ${constraint}`
    }
  } else {
    dlog(`TODO: add support for non-type constraints`)
  }
  return null
}


// // IDEA: use memoization when visiting the AST.
// // Do some testing to see if this would provide any significant
// // performance upside.
// //
// // This function acts as a substitute for visitChildren:
// //   visitChildren(n) == memoizedVisit(n, visitChildren)
// //
// let memo = new Map<Node,Node>()
// function memoizedVisit<T extends Node>(n :T, visitChildren :ast.Visitor) :T {
//   let mn = memo.get(n)
//   if (mn) {
//     print(`memo hit ${n.constructor.name}(${n}) -> ${mn.constructor.name}(${mn})`)
//     return mn as T
//   }
//   let n2 = visitChildren(n)
//   memo.set(n, n2)
//   if (n !== n2) {
//     memo.set(n2, n2)
//   }
//   return n2
// }
