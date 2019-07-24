import * as utf8 from "./utf8"
import { Visitor, Visitable } from "./ast_visit"
import { Node, PrimType, StrType, Ident } from "./ast_nodes"

interface Scope {
  sep :string
}

export class ReprVisitor implements Visitor {
  s     :string = ""
  sep   :string
  stack :Scope[] = []
  seen = new Map<any,int>()
  nextid = 0

  constructor(sep :string = "\n") {
    this.sep = sep
  }

  toString() :string {
    let s = this.s
    return s.charCodeAt(0) == 10 ? s.substr(1) : s
  }

  pushScope() {
    this.stack.push({ sep: this.sep })
    if (this.sep.charCodeAt(0) == 10) {
      this.sep = this.sep + "  "
    }
  }

  popScope() {
    let s = this.stack.pop()
    if (s) {
      this.sep = s.sep
    }
  }

  getSeenId(v :any) :string|null {
    let id = this.seen.get(v)
    if (id !== undefined) {
      return `#${id}`
    }
    this.seen.set(v, this.nextid++)
    return null
  }

  visitNode(n :Visitable) {
    if (n instanceof PrimType) {
      this.s += n.name
    } else if (n instanceof StrType) {
      this.s += n.len == -1 ? "str" : `str<${n.len}>`
    } else if (n instanceof Ident) {
      this.s += `(Ident ${JSON.stringify(n.value.toString())}`
      if (n.type) {
        this.s += " "
        this.visitNode(n.type)
      }
      this.s += ")"
    } else {
      this.s += `(${n.constructor.name}`
      let id = this.getSeenId(n)
      if (id) {
        this.s += id
      } else {
        this.pushScope()
        n.visit(this)
        this.popScope()
      }
      this.s += `)`
    }
  }

  visitFieldN(name: string, n :Visitable) {
    this.s += `${this.sep}(${name} `
    this.visitNode(n)
    this.s += `)`
  }

  visitFieldNA(name: string, nv :Visitable[]) {
    this.s += `${this.sep}(${name}`
    this.pushScope()
    nv.forEach((n, i) => {
      this.s += this.sep
      this.visitNode(n)
    })
    this.popScope()
    this.s += `)`
  }

  visitFieldA(name: string, value :any[]) {
    this.s += `${this.sep}(${name} `
    this.visitArray(value)
    this.s += ")"
  }

  visitField(name: string, value :any) {
    this.s += `${this.sep}(${name} `
    this.visitValue(value)
    this.s += ")"
  }

  visitArray(v :any[]) {
    this.s += '['
    this.pushScope()
    v.forEach((v, i) => {
      this.s += (i == 0) ? " " : this.sep
      this.visitValue(v)
    })
    this.popScope()
    this.s += ']'
  }

  visitValue(v :any) {
    if (v === null || v === undefined) {
      this.s += "null"
      return
    }

    let t = typeof v
    if (t == "object") {
      // if (Array.isArray(v)) { return reprArray(sep, v) }
      // if (v instanceof Set) { return reprSet(sep, v) }
      // if (v instanceof Map) { return reprMap(sep, v) }
      if (v instanceof Uint8Array) {
        this.s += JSON.stringify(utf8.decodeToString(v))
      } else if (v instanceof Node) {
        this.visitNode(v)
      } else if (v.toString !== Object.prototype.toString) {
        this.s += v.toString()
      } else {
        this.s += v.constructor.name
      }
      return
    }

    let s = String(v)
    if (t != "number" && t != "boolean") {
      s = JSON.stringify(s)
    }
    this.s += s
  }

}

// export interface ReprAble {
//   repr(sep :string) :string
// }

// function reprAny(sep :string, v :any) :string {
//   if (v === null) { return "null" }
//   if (v === undefined) { return "null" }
//   let t = typeof v
//   let s = ""
//   if (t == "object") {
//     if (Array.isArray(v)) { return reprArray(sep, v) }
//     if (v instanceof Set) { return reprSet(sep, v) }
//     if (v instanceof Map) { return reprMap(sep, v) }
//     if (v instanceof Uint8Array) { return JSON.stringify(utf8.decodeToString(v)) }
//     if (v.toString !== Object.prototype.toString) {
//       s = v.toString()
//     } else {
//       return v.constructor.name
//     }
//   } else {
//     s = String(v)
//   }
//   if (t == "number" || t == "boolean") { return s }
//   return JSON.stringify(s)
// }

// export function reprArray(sep :string, v :any[]) :string {
//   let sep2 = sep.charCodeAt(0) == 0xA ? sep + "  " : sep
//   return ["["].concat(v.map(v => reprAny(sep2, v))).join(sep) + "]"
// }

// export function reprNodeArray(sep :string, v :ReprAble[]) :string {
//   let sep2 = sep.charCodeAt(0) == 0xA ? sep + "  " : sep
//   return ["["].concat(v.map(v => v.repr(sep2))).join(sep) + "]"
// }

// export function reprSet(sep :string, s :Set<any>) :string {
//   let sep2 = sep.charCodeAt(0) == 0xA ? sep + "  " : sep
//   return ["(set"].concat(Array.from(s).map(v => v.repr(sep2))).join(sep) + ")"
// }

// export function reprMap(sep :string, m :Map<any,any>) :string {
//   let sep3 = sep
//   let sep2 = sep
//   if (sep.charCodeAt(0) == 0xA) {
//     sep2 = sep + "  "
//     sep3 = sep2 + "  "
//   }
//   return ["(map"].concat(Array.from(m).map(v =>
//     `(${reprAny(sep3, v[0])}${sep2}${reprAny(sep3, v[1])})`
//   )).join(sep) + ")"
// }
