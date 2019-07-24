import { debuglog as dlog } from "./util"
import { ByteStr, strings } from "./bytestr"
import { Num } from "./num"
import { SInt64, UInt64 } from "./int64"
import { NoPos } from "./pos"
import { Type, BasicType, t_nil } from "./types"
import * as utf8 from "./utf8"
import * as ast from "./ast"
import * as sexpr from "./sexpr"
import {
  Package,
  File,
  Node,
} from "./ast"


function getFilledBuffer(ch :string, n :int) {
  let b = new Uint8Array(n)
  b.fill(ch.charCodeAt(0))
}

const char = (s :string) => s.charCodeAt(0)

const SP     = char(" ")
const LF     = char("\n")
const HYPHEN = char("-")
const RPAREN = char(")")

const linestr = "\n                                                             "


interface Scope {
}


class Encoder1 implements ast.Encoder1 {
  buf = ""
  stack :Scope[] = []
  types = new Map<Type,string>()

  write(s :string) {
    this.buf += s
  }

  newline() {
    this.write(linestr.substr(0, 1 + (this.stack.length * 2)))
  }

  stackPush() {
    this.stack.push({})
  }

  stackPop() :Scope {
    assert(this.stack.length > 0)
    return this.stack.pop()!
  }

  startNode(n :Node) {
    this.newline()
    this.write("(" + n.constructor.name)
    this.stackPush()
  }

  endNode() {
    this.stackPop()
    this.write(")")
  }

  nullNode() {
    this.newline()
    this.write("null")
  }

  encodeValue(v :any) :string {
    if (v === null || v === undefined) {
      return "null"
    }

    if (v instanceof Type) {
      let typeid = this.types.get(v)
      if (typeid === undefined) {
        if (v instanceof BasicType) {
          // basic types have good, well-recognized names like "i32"
          typeid = String(v)
        } else {
          typeid = "t" + this.types.size
        }
        this.types.set(v, typeid)
      }
      return typeid
    }

    if (v instanceof Array) {
      return "[" + v.map(v2 => this.encodeValue(v2)).join(" ") + "]"
    }

    if (typeof v == "object") {
      if (v instanceof Uint8Array) {
        v = utf8.decodeToString(v)
      } else {
        v = String(v)
      }
    }
    if (typeof v == "string") {
      v = JSON.stringify(v.toString())
    }

    return String(v)
  }

  writeField(name :string, v :any) {
    this.write(` [${name}`)
    this.write(" " + this.encodeValue(v))
    this.write(`]`)
  }

  writeGroup(name :string, cont: ()=>any) {
    this.newline()
    this.write("(" + name)
    this.stackPush()
    cont()
    this.stackPop()
    this.write(")")
  }

  writeMetadata() {
    // write metadata to header
    let buf = this.buf
    this.buf = ""
    this.writeGroup("meta", () => {
      this.newline()
      this.write(`(version ${VERSION} ${VERSION_TAG})`)
      this.writeGroup("types", () => this.writeTypes())
    })
    this.buf += buf
  }

  writeTypes() {
    // sort types by name a-z
    let types = Array.from(this.types).sort((a, b) =>
      a[1] < b[1] ? -1 :
      b[1] < a[1] ? 1 :
      0
    )
    for (let [t, typeid] of types) {
      this.newline()
      this.write(`(${typeid} ${t.constructor.name} ${JSON.stringify(t.toString())}`)
      // TODO: write type
      this.write(`)`)
    }
  }

}


class NodeDecoder implements ast.Decoder {
  _props    :Map<string,sexpr.Value>
  _children :(Node|null)[]
  _getType  :(id:string)=>Type|null

  init(props :Map<string,sexpr.Value>, children :(Node|null)[], getType :(id:string)=>Type|null) {
    this._props = props
    this._children = children
    this._getType = getType
  }

  // field access that throws

  num(name :string) :Num {
    let v = this.maybeNum(name)
    if (v === null) { throw new Error(`expected Num for field ${name}`) }
    return v
  }

  num32(name :string) :number {
    let v = this.maybeNum32(name)
    if (v === null) { throw new Error(`expected number for field ${name}`) }
    return v
  }

  int32(name :string) :int {
    let v = this.maybeInt32(name)
    if (v === null) { throw new Error(`expected int for field ${name}`) }
    return v
  }

  bool(name :string) :bool {
    let v = this.maybeBool(name)
    if (v === null) { throw new Error(`expected bool for field ${name}`) }
    return v
  }

  str(name :string) :string {
    let v = this.maybeStr(name)
    if (v === null) { throw new Error(`expected string for field ${name}`) }
    return v
  }

  byteStr(name :string) :ByteStr {
    let v = this.maybeByteStr(name)
    if (v === null) { throw new Error(`expected ByteStr for field ${name}`) }
    return v
  }

  bytes(name :string) :Uint8Array {
    let v = this.maybeBytes(name)
    if (v === null) { throw new Error(`expected Uint8Array for field ${name}`) }
    return v
  }

  type(name :string) :Type {
    let v = this.maybeType(name)
    if (v === null) { throw new Error(`expected type for field ${name}`) }
    return v
  }

  ident(name :string) :ast.Ident {
    let v = this.maybeIdent(name)
    if (v === null) { throw new Error(`expected ident for field ${name}`) }
    return v
  }

  enumVal<T>(name :string, e :Record<string,any>) :T {
    let v = this.maybeEnumVal<T>(name, e)
    if (v === null) { throw new Error(`expected enum value for field ${name}`) }
    return v
  }



  // field access that never throws

  maybeStr(name :string) :string|null {
    let v = this._props.get(name)
    return v instanceof sexpr.Sym ? v.value : null
  }

  maybeNum(name :string) :Num|null {
    let v = this.maybeStr(name)
    if (v === null) {
      return null
    }
    // Number.MAX_SAFE_INTEGER = 9007199254740991
    if (v.length < 16 || v.indexOf(".") != -1 || v.indexOf("e") != -1 || v.indexOf("E") != -1) {
      let n = Number(v)
      return isNaN(n) ? null : n
    }
    try {
      return v[0] == "-" ? SInt64.fromStr(v, 10) : UInt64.fromStr(v, 10)
    } catch (_) {
      return null
    }
  }

  maybeNum32(name :string) :number|null {
    let v = Number(this.maybeStr(name))
    return isNaN(v) ? null : v
  }

  maybeInt32(name :string) :int|null {
    let s = this.maybeStr(name)
    if (
      s === null ||
      (s.charCodeAt(0) == HYPHEN ? s.length > 17 : s.length > 16)
    ) {
      // Number.MAX_SAFE_INTEGER = 9007199254740991
      // Number.MIN_SAFE_INTEGER = -9007199254740991
      return null
    }
    let v = Number(s)
    let i = v | 0
    return (isNaN(i) || i !== v || i > Number.MAX_SAFE_INTEGER) ? null : i
  }

  maybeBool(name :string) :bool|null {
    let v = this.maybeStr(name)
    return v === "true" ? true : v === "false" ? false : null
  }

  maybeByteStr(name :string) :ByteStr|null {
    let v = this.maybeStr(name)
    return v !== null ? strings.get(utf8.encodeString(v)) : null
  }

  maybeBytes(name :string) :Uint8Array|null {
    let v = this.maybeStr(name)
    return v !== null ? utf8.encodeString(v) : null
  }

  maybeType(name :string) :Type|null {
    let v = this.maybeStr(name)
    return v ? this._getType(v) : null
  }

  maybeIdent(name :string) :ast.Ident|null {
    let s = this.maybeByteStr(name)
    if (!s) { return null }
    return new ast.Ident(NoPos, ast.nilScope, s)
  }

  maybeEnumVal<T>(name :string, e :Record<string,any>) :T|null {
    let s = this.maybeStr(name)
    if (s === null) {
      return null
    }
    let v = (e as any as {[k:string]:T})[s]
    return v === undefined ? null : v
  }



  // field access for arrays/lists
  strArray(name :string) :string[] {
    let v = this._props.get(name)
    return (v instanceof sexpr.List) ? v.map(String) : []
  }

  int32Array(name :string) :int[] {
    let v = this._props.get(name)
    return v instanceof sexpr.List ? v.map(v => Number(v) | 0) : []
  }

  num32Array(name :string) :number[] {
    let v = this._props.get(name)
    return v instanceof sexpr.List ? v.map(Number) : []
  }

  boolArray(name :string) :bool[] {
    let v = this._props.get(name)
    return v instanceof sexpr.List ? v.map(s => s.toString() === "true") : []
  }

  identArray(name :string) :ast.Ident[] {
    let v = this._props.get(name)
    return v instanceof sexpr.List ? v.map(v => {
      let str = v instanceof sexpr.Sym ? v.value : String(v)
      let s = strings.get(utf8.encodeString(str))
      return new ast.Ident(NoPos, ast.nilScope, s)
    }) : []
  }


  // children
  maybeChild<T extends Node=Node>() :T|null {
    return (this._children.shift() || null) as T|null
  }

  maybeChildOfType<T extends Node = Node>(ctor: { new (...args: any[]): T; }): T|null {
    for (let i = 0; i < this._children.length; i++) {
      let c = this._children[i]
      if (c instanceof ctor) {
        this._children.splice(i, 1)
        return c as T
      }
    }
    return null
  }

  children<T extends Node=Node>() :T[] {
    let v = this._children as T[]
    this._children = []
    return v
  }

  maybeChildren<T extends Node=Node>() :T[]|null {
    let v = this.children<T>()
    return v.length == 0 ? null : v
  }

  child<T extends Node=Node>() :T {
    let c = this.maybeChild<T>()
    if (c === null) { throw new Error(`expected child`) }
    return c
  }

  childOfType<T extends Node = Node>(ctor: { new (...args: any[]): T; }): T {
    let c = this.maybeChildOfType<T>(ctor)
    if (c === null) { throw new Error(`expected child of type ${ctor.name}`) }
    return c
  }

  childrenOfType<T extends Node=Node>(ctor:{new(...args:any[]):T}): T[] {
    // TODO: move matches out of this._children
    return this._children.filter(n => n instanceof ctor) as T[]
  }

  childrenOfTypes<T extends Node=Node>(...ctor:{new(...args:any[]):T}[]): T[] {
    // TODO: move matches out of this._children
    return this._children.filter(n => {
      for (let c of ctor) {
        if (n instanceof c) {
          return true
        }
      }
      return false
    }) as T[]
  }

  maybeChildrenOfType<T extends Node=Node>(ctor:{new(...args:any[]):T}): T[]|null {
    let v = this.childrenOfType(ctor)
    return v.length == 0 ? null : v
  }

  maybeChildrenOfTypes<T extends Node=Node>(...ctor:{new(...args:any[]):T}[]): T[]|null {
    let v = this.childrenOfTypes(...ctor)
    return v.length == 0 ? null : v
  }
}


class Decoder {
  intypes  :Map<string,sexpr.List>|null = null
  nodedecs :NodeDecoder[] = [] // free list

  getType = (id :string) :Type|null => {
    // TODO
    return t_nil // FIXME
  }

  decode(s :string, filename? :string) :Node[] {
    // parse as s-expressions
    let xs = sexpr.parse(s, {
      filename,
      brackAsList: true, // [...] are lists
    })

    // find types and nodes in the tree we parsed
    let innodes :sexpr.List[] = []
    this.intypes = null
    for (let [name, ls] of xs.asMap()) {
      if (name == "meta") {
        let v = ls.get('types')
        if (v) {
          this.intypes = v.asMap()
        }
      } else {
        innodes.push(ls)
      }
    }
    // print('intypes:', this.intypes)
    // print('innodes:', innodes)

    // decode nodes
    let nodes :Node[] = []
    for (let ls of innodes) {
      let n = this.decodeNode(ls)
      if (n) {
        nodes.push(n)
      }
    }

    return nodes
  }

  decodeField(field :sexpr.List) :[string,sexpr.Value] {
    let namev = field[0]
    if (!namev || !namev.isSym()) {
      throw new Error(`missing field name ${field}`)
    }
    return [namev.value, field[1]]
  }

  decodeNode(info :sexpr.List) :Node|null {
    // find node constructor name
    let consnamev = info[0]
    if (!consnamev || !consnamev.isSym()) {
      panic(`missing typename in node def ${info}`)
    }
    let consname = (consnamev as sexpr.Sym).value

    // collect props and children
    let props = new Map<string,sexpr.Value>()
    let children :(Node|null)[] = []
    for (let i = 1; i < info.length; i++) {
      let v = info[i]
      if (v.isList()) {
        if (v.type == "[") {
          let [name, value] = this.decodeField(v)
          props.set(name, value)
        } else {
          children.push(this.decodeNode(v))
        }
      } else if (v.isSym()) {
        if (v.value != "null") {
          print('v:', v)
          panic(`unexpected sym when expecting node or null`)
        }
        children.push(null)
      }
    }

    // create a new node without calling its constructor
    let cons = (ast as {[k:string]:any})[consname]
    if (typeof cons != "function") {
      panic(`unknown node type ${consname}`)
    }
    let n = Object.create(cons.prototype) as Node

    // allocate a NodeDecoder
    let dec = this.nodedecs.pop() || new NodeDecoder()
    dec.init(props, children, this.getType)

    // restore the node
    try {
      n.restore(dec)
    } catch (err) {
      print(
        `${err} (when calling ${consname}.restore())\n` +
        `node data:`, {props, children, parsed: info}
      )
      throw err
    }

    // free the NodeDecoder
    this.nodedecs.push()

    return n as Node
  }
}


export function encode(...nodes :Node[]) :string {
  let buf = ""
  let stack :Scope[] = []
  let types = new Map<Type,string>()
  let wantSpace = false

  type GroupType = "()" | "[]"

  function write(s :string) {
    if (!wantSpace) {
      wantSpace = true
    } else {
      buf += " "
    }
    buf += s
  }

  function newline() {
    buf += linestr.substr(0, 1 + (stack.length * 2))
    wantSpace = false
  }

  function stackPush() { stack.push({}) }
  function stackPop() :Scope { assert(stack.length > 0) ; return stack.pop()! }

  function startGroup(openstr :string, name? :string) {
    newline()
    buf += openstr
    if (name) {
      buf += name
      wantSpace = true
    } else {
      wantSpace = false
    }
    stackPush()
  }

  function endGroup(closestr :string) {
    stackPop()
    buf += closestr
  }

  function group(type :GroupType, name :string, c :()=>void) {
    newline()
    buf += type[0] + name
    wantSpace = name.length > 0
    stackPush()
    c()
    stackPop()
    buf += type[1]
  }


  function eAny(v :any, inGroup :bool = false) {
    if (v === null || v === undefined) {
      return write("null")
    }

    let t = typeof v

    if (t == "object") {
      if (v instanceof Node) { return eNode(v) }
      if (v instanceof Type) { return eType(v) }
      if (v instanceof Array) { return eIterable(v, inGroup) }
      if (v instanceof Set) { return eIterable(v, inGroup) }
    }

    if (typeof v == "object") {
      if (v instanceof Uint8Array) {
        v = utf8.decodeToString(v)
      } else {
        v = String(v)
      }
    }
    if (typeof v == "string") {
      v = JSON.stringify(v.toString())
    }

    write(String(v))
  }


  function eIterable(v :Iterable<any>, inGroup :bool) {
    const f = () => {
      for (let v2 of v) {
        eAny(v2)
      }
    }
    if (!inGroup) {
      group("[]", "", f)
    } else {
      f()
    }
  }


  function eType(v :Type) {
    let typeid = types.get(v)
    if (typeid === undefined) {
      if (v instanceof BasicType) {
        // basic types have good, well-recognized names like "i32"
        typeid = String(v)
      } else {
        typeid = "t" + types.size
      }
      types.set(v, typeid)
    }
    write(typeid)
  }


  function eNode(n :Node) {
    group("()", n.constructor.name, () => n.encode(e))
  }


  function e(...args :any[]) {
    assert(args.length % 2 == 0, `uneven number of args (missing a key or value?)`)
    for (let i = 0; i < args.length; i += 2) {
      let name = String(args[i])
      group("()", name, () => eAny(args[i + 1], true))
    }
  }


  for (let n of nodes) {
    eNode(n)
  }
  //e.writeMetadata()
  return buf
}


export function encode1(...nodes :Node[]) :string {
  let e = new Encoder1()
  for (let n of nodes) {
    n.encode1(e)
  }
  e.writeMetadata()
  return e.buf
}


export function decode(s :string, filename? :string) :Node[] {
  let d = new Decoder()
  return d.decode(s, filename)
}



// export function write(n :Node) :Uint8Array
// export function write(n :Node, w :AppendBuffer) :Uint8Array
// export function write(n :Node, w :ByteWriter) :null
// export function write(n :Node, _w? :ByteWriter) :Uint8Array|null {
//   let e = new Encoder()
//   n.encode(e)
//   e.writeMetadata()
//   return utf8.encodeString(e.buf)
// }
