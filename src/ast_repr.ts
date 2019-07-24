import * as utf8 from "./utf8"
import { StrWriter } from "./util"
import { Visitor, Visitable } from "./ast_visit"
import { Node, PrimType, StrType, Ident } from "./ast_nodes"

interface Scope {
  sep :string
}

export class ReprVisitor implements Visitor {
  sep   :string
  w     :StrWriter
  _buf  :string = ""
  stack :Scope[] = []
  seen = new Map<any,int>()
  nextid = 0

  constructor(sep :string = "\n", w? :StrWriter|null) {
    this.sep = sep
    this.w   = w || ((s :string) => { this._buf += s })
  }

  toString() :string {
    return this._buf
    // let s = this._buf
    // return s.charCodeAt(0) == 10 ? s.substr(1) : s
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
      this.w(n.name)
    } else if (n instanceof StrType) {
      this.w(n.len == -1 ? "str" : `str<${n.len}>`)
    } else if (n instanceof Ident) {
      this.w(`(Ident ${JSON.stringify(n.value.toString())}`)
      if (n.type) {
        this.w(" ")
        this.visitNode(n.type)
      }
      this.w(")")
    } else {
      this.w(`(${n.constructor.name}`)
      let id = this.getSeenId(n)
      if (id) {
        this.w(id)
      } else {
        this.pushScope()
        n.visit(this)
        this.popScope()
      }
      this.w(")")
    }
  }

  visitFieldN(name: string, n :Visitable) {
    this.w(`${this.sep}(${name} `)
    this.visitNode(n)
    this.w(")")
  }

  visitFieldNA(name: string, nv :Visitable[]) {
    this.w(`${this.sep}(${name}`)
    this.pushScope()
    nv.forEach(n => {
      this.w(this.sep)
      this.visitNode(n)
    })
    this.popScope()
    this.w(")")
  }

  visitFieldA(name: string, value :any[]) {
    this.w(`${this.sep}(${name} `)
    this.visitArray(value)
    this.w(")")
  }

  visitFieldS(name: string, s :any) {
    this.w(`${this.sep}(${name} ${String(s)})`)
  }

  visitField(name: string, value :any) {
    this.w(`${this.sep}(${name} `)
    this.visitValue(value)
    this.w(")")
  }

  visitArray(v :any[]) {
    this.w("[")
    this.pushScope()
    v.forEach((v, i) => {
      this.w((i == 0) ? " " : this.sep)
      this.visitValue(v)
    })
    this.popScope()
    this.w("]")
  }

  visitSet(s :Set<any>) {
    this.w("(set")
    this.pushScope()
    for (let v of s) {
      this.w(this.sep)
      this.visitValue(v)
    }
    this.popScope()
    this.w(")")
  }

  // reprMap(sep :string, m :Map<any,any>) :string {
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

  visitValue(v :any) {
    if (v === null || v === undefined) {
      this.w("null")
      return
    }

    let t = typeof v
    if (t == "object") {
      // if (v instanceof Map) { return reprMap(sep, v) }
      if (Array.isArray(v)) {
        this.visitArray(v)
      } else if (v instanceof Set) {
        this.visitSet(v)
      } else if (v instanceof Uint8Array) {
        this.w(JSON.stringify(utf8.decodeToString(v)))
      } else if (v instanceof Node) {
        this.visitNode(v)
      } else if (v.toString !== Object.prototype.toString) {
        this.w(v.toString())
      } else {
        this.w(v.constructor.name)
      }
      return
    }

    let s = String(v)
    if (t != "number" && t != "boolean") {
      s = JSON.stringify(s)
    }
    this.w(s)
  }

}
