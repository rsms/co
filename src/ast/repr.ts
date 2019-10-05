import * as utf8 from "../utf8"
import { StrWriter } from "../util"
import * as termstyle from "../termstyle"
import { Position } from "../pos"
import { NodeVisitor } from "./visit"
import { Scope } from "./scope"
import { Node, Type, PrimType, StrType, Ident, NumLit, StringLit, TemplateVar } from "./nodes"

interface ReprScope {
  sep :string
}

export interface ReprOptions {
  colors? :bool            // default: false
  sep?    :string          // default: "\n"
  w?      :StrWriter|null  // defaults to internal buffering; read via toString
}

export class ReprVisitor implements NodeVisitor {
  sep   :string
  w     :StrWriter
  _buf  :string = ""
  stack :ReprScope[] = []
  seen = new Map<any,int>()
  nextid = 0
  style :termstyle.Style

  constructor(options? :ReprOptions) {
    this.sep = (options && options.sep) || "\n"
    this.w   = (options && options.w) || ((s :string) => { this._buf += s })
    if (options && options.colors) {
      this.style = termstyle.style
    } else {
      this.style = termstyle.noStyle
    }
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

  markSeen(v :any) :[bool,int] {
    let id = this.seen.get(v)
    if (id !== undefined) {
      return [true, id]
    }
    id = ++this.nextid
    this.seen.set(v, id)
    return [false, id]
  }

  fmtid(seen :bool, id :int) :string {
    // unseen id represents definition. e.g. "#5"
    // seen id represents a reference. e.g. "&5"
    let s = (seen ? "&" : "#") + id.toString(36)
    if (this.style === termstyle.noStyle) {
      return s
    }
    let styles = [
      this.style.blue,
      this.style.cyan,
      this.style.green,
      this.style.magenta,
      this.style.purple,
      this.style.pink,
      this.style.red,
      this.style.yellow,
    ]
    return styles[id % (styles.length-1)](s)
  }

  visitNode(n :Node) {
    if (n instanceof PrimType) {
      this.w(this.style.bold(n.name))
    } else if (n instanceof StrType) {
      this.w(this.style.bold(n.repr()))
    } else if (n instanceof Ident) {
      this.w(`(${this.style.bold("id")} ${n.value}`)
      if (n.type) {
        this.w(" ")
        this.visitNode(n.type)
      }
      this.w(")")
    } else if (n instanceof NumLit) {
      // note: NumLit.toString includes base prefix, e.g. "0x" for 16.
      this.w(`(${n.constructor.name} ${n} `)
      this.visitNode(n.type)
      this.w(")")
    } else if (n instanceof StringLit) {
      // (StringLit "foo" str<3>)
      this.w("(StringLit ")
      this.visitValue(n.value)
      this.w(" " + n.type.repr() + ")")
    } else {
      let [seen, id] = this.markSeen(n)
      this.w(`(${this.style.bold(n.constructor.name)}`)
      if (seen || n.isType()) {
        this.w(` ${this.fmtid(seen, id)}`)
      }
      if (!seen) {
        this.pushScope()
        if (!(n instanceof TemplateVar)) {
          let scope = (n as any)._scope as Scope|null
          if (scope && scope.decls && scope.decls.size > 0) {
            this.visitScope(scope)
          }
        }
        n.visit(this)
        this.popScope()
      }
      this.w(")")
    }
  }

  visitScope(s :Scope) {
    let [seen, id] = this.markSeen(s)
    this.w(`${this.sep}(scope ${this.fmtid(seen, id)}`)
    if (!seen && s.decls) {
      assert(s instanceof Scope)
      this.pushScope()
      for (let [k,v] of s.decls) {
        this.w(`${this.sep}${k} ${v.decl}`)
        // this.visitNode(v.decl)
        // this.visitValue(v)
      }
      this.popScope()
    }
    this.w(")")
  }

  visitFieldN(name: string, n :Node) {
    this.w(`${this.sep}(${name} `)
    this.visitNode(n)
    this.w(")")
  }

  visitFieldNA(name: string, nv :Node[]) {
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

  visitFieldE(name: string, v :number, enum_ :{[k:number]:string}) {
    this.w(`${this.sep}(${name} ${String(enum_[v])})`)
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
    this.w("(Set")
    this.pushScope()
    for (let v of s) {
      this.w(this.sep)
      this.visitValue(v)
    }
    this.popScope()
    this.w(")")
  }

  visitMap(m :Map<any,any>) {
    this.w("(Map")
    this.pushScope()
    for (let [k,v] of m) {
      this.w(this.sep)
      this.visitValue(k)
      this.w(" ")
      this.pushScope()
      this.visitValue(v)
      this.popScope()
    }
    this.popScope()
    this.w(")")
  }

  visitPosition(p :Position) {
    this.w("(Position ")
    this.w([p.filename, p.offset, p.line, p.column].join(" "))
    this.w(")")
  }

  visitValue(v :any) {
    if (v === null || v === undefined) {
      this.w("null")
      return
    }

    let t = typeof v
    if (t == "object") {
      if (Array.isArray(v)) {
        this.visitArray(v)
      } else if (v instanceof Set) {
        this.visitSet(v)
      } else if (v instanceof Map) {
        this.visitMap(v)
      } else if (v instanceof Uint8Array) {
        this.w(JSON.stringify(utf8.decodeToString(v)))
      } else if (v instanceof Node) {
        this.visitNode(v)
      } else if (v instanceof Position) {
        this.visitPosition(v)
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

export function printAst(n :Node) {
  if (typeof process != "undefined" && process.stdout) {
    n.repr({
      colors: process.stdout.isTTY,
      w: s => process.stdout.write(s),
    })
    process.stdout.write("\n")
  } else {
    console.log(n.repr())
  }
}
