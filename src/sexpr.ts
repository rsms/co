import { assertEq } from "./test"

//
// simple s-expressions parser made for arch rewrite rules DSL,
// but is generic and can be used independently.
// Do remember than changing this requires testing of the generator
// program in the arch directory.
//
const char = (s :string) => s.charCodeAt(0)
const chr = (code :int) => String.fromCharCode(code)

const lparen = char("(")
    , rparen = char(")")
    , lbrack = char("[")
    , rbrack = char("]")
    , lbrace = char("{")
    , rbrace = char("}")
    , lt     = char("<")
    , gt     = char(">")
    , sp     = char(" ")
    , tab    = char("\t")
    , cr     = char("\r")
    , lf     = char("\n")
    , slash  = char("/")
    , bslash = char("\\")
    , pipe   = char("|")
    , squote = char("'")
    , dquote = char('"')
    , semic  = char(';')
    , ch_r   = char("r")
    , ch_n   = char("n")
    , ch_t   = char("t")

export type Value = Sym|Pre|List|Union
export type ListType = "" | "(" | "<" | "[" | "{"
export type PreType = "'" | '"' | "<" | "[" | "{"

interface IValue {
  line   :int  // 1-based
  col    :int  // 1-based

  isList() : this is List
  isUnion() : this is Union
  isSym() : this is Sym
  isPre() : this is Pre  // note: Pre is a type of Sym
  toString(ln? :string) :string
}

export class List extends Array<Value> implements IValue {
  line :int
  col  :int
  type :ListType

  _keycache? :Map<string,List>

  constructor(line :int, col :int, type :ListType) {
    super()
    this.line = line
    this.col  = col
    this.type = type
  }

  static create(line :int, col :int, ...v :Value[]) :List {
    let l = new List(line, col, "(")
    l.splice(0, 0, ...v)
    return l
  }

  isList() : this is List { return true }
  isUnion() : this is Union { return false }
  isSym() : this is Sym { return false }
  isPre() : this is Pre { return false }

  toString(ln :string = "") :string {
    let ln2 = ln.charCodeAt(0) == 0xA ? ln + "  " : ln
    let s = "("
    for (let i = 0; i < this.length; i++) {
      let v = this[i]
      let s2 = v.toString(ln2)
      if (v instanceof List) {
        s += (ln2 || i == 0 ? ln2 : " ") + s2
      } else {
        s += (i == 0 || s2.charCodeAt(0) == 0xA) ? s2 : " " + s2
      }
    }
    return s + ")"
  }

  asMap() :Map<string,List> {
    if (!this._keycache) {
      this._keycache = new Map<string,List>()
      for (let v of this) {
        if (v instanceof List && v.length > 1) {
          let s = v[0]
          if (s instanceof Sym) {
            this._keycache.set(s.value, v)
          }
        }
      }
    }
    return this._keycache
  }

  get(key :string) :List|null {
    return this.asMap().get(key) || null
  }
}

export class Union extends Array<Sym> implements IValue {
  line   :int
  col    :int
  prefix :string

  constructor(line :int, col :int, prefix :string) {
    super()
    this.line = line
    this.col  = col
    this.prefix = prefix
  }

  isList() : this is List { return false }
  isUnion() : this is Union { return true }
  isSym() : this is Sym { return false }
  isPre() : this is Pre { return false }

  toString() {
    return `${this.prefix}(${this.map(s => s.value.substr(this.prefix.length)).join("|")})`
  }
}

export class Sym implements IValue {
  line  :int
  col   :int
  value :string

  constructor(line :int, col :int, value :string) {
    this.line  = line
    this.col   = col
    this.value = value
  }

  isList() : this is List { return false }
  isUnion() : this is Union { return false }
  isSym() : this is Sym { return true }
  isPre() : this is Pre { return false }

  toString() { return this.value }

  asMaybeNum() :int|null {
    let n = Number(this.value)
    return isNaN(n) ? null : n
  }

  asNum() :int {
    let n = this.asMaybeNum()
    if (n === null) {
      panic(`${this.value} is not a number (${this.line}:${this.col})`)
      return 0
    }
    return n
  }

  asBool() :bool {
    if (this.value === "true") {
      return true
    }
    if (this.value !== "false") {
      panic(`${this.value} is not a boolean (${this.line}:${this.col})`)
    }
    return false
  }
}

export const nil = new Sym(0,0,"nil")

export class Pre extends Sym {
  type :PreType
  constructor(line :int, col :int, value :string, type :PreType) {
    super(line, col, value)
    this.type  = type
  }
  toString() {
    return (
      this.type == "'" ? `'${this.value}'` :
      this.type == '"' ? `"${this.value}"` :
      this.type == "<" ? `<${this.value}>` :
      this.type == "[" ? `[${this.value}]` :
      this.type == "{" ? `{${this.value}}` :
      this.value
    )
  }
  isPre() : this is Pre { return true }
}



// -------------------------------------------------------------
// parse

// InterpretAs is used for options to the parser, indicating how to interpret certain syntax.
export enum InterpretAs {
  Default = 0,
  Sym,
  Pre,
}
export const DEFAULT = InterpretAs.Default
           , AS_SYM = InterpretAs.Sym
           , AS_PRE = InterpretAs.Pre

export class SyntaxError extends Error {
  line :int
  col  :int
  file :string
}

export interface ParseOptions {
  filename?   :string
  lineOffset? :int  // offset source location lines by N

  brack? :InterpretAs
  brace? :InterpretAs
  ltgt? :InterpretAs
}

export function parse(src :string, options? :ParseOptions) :List
export function parse(src :string, filename? :string) :List
export function parse(src :string, arg1? :string|ParseOptions) :List {
  let options :ParseOptions = (
    typeof arg1 == "string" ? {filename:arg1} :
    arg1 ? arg1 :
    {}
  )

  let i = 0
    , c = 0
    , nextc = 0
    , line = (options.lineOffset || 0) + 1
    , lineStart = 0
    , symstart = -1

  function readRestOfLine() {
    while (i < src.length) {
      c = src.charCodeAt(i++)
      nextc = src.charCodeAt(i) || 0
      if (c == lf) {
        return
      }
      if (c == cr) {
        if (nextc == lf) {
          // CRLF
          i++
        }
        return
      }
    }
  }

  const newLine = () => {
    lineStart = i
    line++
  }

  const syntaxErr = (msg :string) => {
    let col = i - lineStart
    let file = options.filename || "<input>"
    let e = new SyntaxError(`${file}:${line}:${col}: ${msg}`)
    e.name = "SyntaxError"
    e.file = file
    e.line = line
    e.col = col
    throw e
  }

  const startSym = () => {
    if (symstart == -1) {
      symstart = i - 1
    }
  }

  function flushSym<T extends Union|List>(dst :T, prefix? :string) {
    if (symstart != -1) {
      let s = src.substring(symstart, i - 1)
      if (prefix) {
        s = prefix + s
      }
      dst.push(new Sym(line, symstart - lineStart + 1, s))
      symstart = -1
      return true
    }
    return false
  }

  const parseUnion = () => {
    let expectingPipe = false
    let prefix = src.substring(symstart, i - 1)
    symstart = -1

    let u = new Union(line, i - lineStart, prefix)

    while_loop: while (i < src.length) {
      c = src.charCodeAt(i++)
      switch (c) {
        case sp:
        case tab:
          if (flushSym(u, prefix)) {
            expectingPipe = true
          }
          break

        case pipe:
          if (!expectingPipe) {
            syntaxErr(`unexpected "|"`)
          }
          flushSym(u, prefix)
          expectingPipe = false
          break

        case rparen:
          if (!flushSym(u, prefix) && !expectingPipe) {
            // case: foo(bar|) => foobar, foo
            u.push(new Sym(line, i - lineStart, prefix))
          }
          break while_loop

        case cr:
        case lf:
        case lbrack:
        case lbrace:
        case rbrack:
        case rbrace:
          syntaxErr(`unexpected ${repr(chr(c))} in union`)
          break

        default:
          if (symstart == -1) {
            if (expectingPipe) {
              syntaxErr(`expected "|" or ")" but found ${repr(chr(c))}`)
            }
            expectingPipe = true
          }
          startSym()
      }
    }
    return u
  }

  const parsePre = (startc :int, endc :int, type :PreType) :Pre => {
    let buf :int[] = []
    let value :string|null = null
    let startindex = i
    let startline = line
    while_loop: while (i < src.length) {
      c = src.charCodeAt(i++)
      switch (c) {
        case bslash:
          switch (c = src.charCodeAt(i++)) {
            case ch_r:   buf.push(cr); break
            case ch_n:   buf.push(lf); break
            case ch_t:   buf.push(tab); break
            case bslash: buf.push(bslash); break

            case startc:
            case endc:
              buf.push(c)
              break

            default:
              // instead or causing error on unknown escape, interpret vanilla.
              buf.push(bslash)
              buf.push(c)
              // syntaxErr(`invalid string escape seq "\\${chr(c)}"`)
              break
          }
          break

        case endc:
          value = String.fromCharCode.apply(String, buf)
          break while_loop

        default:
          buf.push(c)
      }
    }
    if (value === null) {
      syntaxErr(`unterminated string`)
    }
    return new Pre(startline, startindex - lineStart, value as string, type)
  }

  type PreOrListParser = (startc :int, endc :int, type :ListType&PreType)=>Value

  const parseBrack :PreOrListParser = (
    options.brack == AS_PRE ? parsePre : (_ :int, endc :int, type :ListType&PreType) :Value => {
      return parseList(endc, type)
    }
  )

  const parseBrace :PreOrListParser = (
    options.brace == AS_PRE ? parsePre : (_ :int, endc :int, type :ListType&PreType) :Value => {
      return parseList(endc, type)
    }
  )

  const parseLtgt :PreOrListParser = (
    options.ltgt == AS_PRE ? parsePre : (_ :int, endc :int, type :ListType&PreType) :Value => {
      return parseList(endc, type)
    }
  )

  function parseList(endchar :int, type :ListType) :List {
    let list = new List(line, i - lineStart, type)

    while_loop: while (i < src.length) {
      c = src.charCodeAt(i++)
      nextc = src.charCodeAt(i) || 0
      switch (c) {
        case lparen:
          if (symstart != -1) {
            // expansion e.g. foo(bar|baz) => foobar foobaz
            list.push(parseUnion())
          } else {
            list.push(parseList(rparen, "("))
          }
          break

        case endchar:
          flushSym(list)
          break while_loop

        case rparen:
        case rbrack:
        case rbrace:
          syntaxErr(`unbalanced ${repr(chr(c))}`)
          break

        case semic:
          flushSym(list)
          // let commentStart = ++i
          readRestOfLine()
          // print(`comment: ${repr(src.substring(commentStart, i-1))}`)
          newLine()
          break

        case slash:
          if (nextc == slash) {
            flushSym(list)
            // let commentStart = ++i
            readRestOfLine()
            // print(`comment: ${repr(src.substring(commentStart, i-1))}`)
            newLine()
          } else {
            startSym()
          }
          break

        case cr:
          flushSym(list)
          if (nextc == lf) {
            // consume LF after CR
            i++
          }
          newLine()
          break

        case sp:
        case tab:
        case lf:
          flushSym(list)
          if (c == lf) {
            newLine()
          }
          break

        case squote: // '...'
          flushSym(list)
          list.push(parsePre(c, squote, "'"))
          break

        case dquote: // "..."
          flushSym(list)
          list.push(parsePre(c, dquote, '"'))
          break

        case lbrack: // [...]
          if (options.brack == AS_SYM) {
            startSym()
          } else {
            flushSym(list)
            list.push(parseBrack(c, rbrack, "["))
          }
          break

        case lbrace: // {...}
          if (options.brace == AS_SYM) {
            startSym()
          } else {
            flushSym(list)
            list.push(parseBrace(c, rbrace, "{"))
          }
          break

        case lt: // <...>
          if (options.ltgt == AS_SYM) {
            startSym()
          } else {
            flushSym(list)
            list.push(parseLtgt(c, gt, "<"))
          }
          break

        default:
          // any other character is part of a token
          startSym()
      }
    }
    return list
  }

  return parseList(0, "")
}

// ----------------------------------------------------------

let ind = ""
// const diffprint = print
// const indincr = () => ind += "  "
// const inddecr = () => ind = ind.substr(0, ind.length-2)
const diffprint = (...v:any[])=>{}
const indincr = () => {}
const inddecr = () => {}

// diff computes the set difference of right compared to left.
//
// Difference is not uniform, but:
// - left subset of or equal to right
// - right superset of or equal to left
//
// i.e. left ⊆ right ⊇ left
//
export function diff(L :Value, R :Value|null) :List|null {
  // print(`${ind}diff  ${L}  ⊆  ${R}`)
  // try {indincr()
  let c = L.constructor
  return c == List  ? diffList(L as List, R)[1] :
         c == Sym   ? diffSym(L as Sym, R) :
         c == Pre   ? diffPre(L as Pre, R) :
         c == Union ? diffUnion(L as Union, R) :
         null
  // }finally{inddecr()}
}

function diffList(left :List, right :Value|null) :[bool,List|null] {
  // This is a total mess. Sorry.
  if (!right) {
    return [false, List.create(left.line, left.col, left, nil)]
  }
  if (
    !(right instanceof List) ||
    right.type != left.type ||
    left.length == 0 ||
    right.length == 0 ||
    (!(left[0] instanceof List) && diff(left[0], right[0])) // (a x) (b x)
  ) {
    return [false, List.create(left.line, left.col, left, right)]
  }

  diffprint(`${ind}diffList  ${left}  ⊆  ${right}`)

  let partialMatchIndex = -1
  let bestMatch :Value|null = null

  function find(L :Value, minIndex :int) :int {
    let index = 0
    partialMatchIndex = -1
    bestMatch = null
    for (let R of right as List) {
      if (R.constructor === L.constructor && index > minIndex) {
        let d :List|null
        if (L instanceof List)  {
          let [partial, d2] = diffList(L, R)
          d = d2
          if (partial) {
            partialMatchIndex = index
          }
        } else {
          d = diff(L, R)
        }
        if (!d) {
          return index
        }
        if (R.constructor === L.constructor) {
          bestMatch = R
        }
        diffprint(`${ind}res   ${L}  ⊆  ${R}  ⇒  ${d}`)
      }
      index++
    }
    return -1
  }

  let d :List|null = null
  let lastIndex = -1
  let nmatches = 0
  let isIdList = !(left[0] instanceof List)

  for (let li = isIdList ? 1 : 0; li < left.length; li++) {
    let L = left[li]
    diffprint(`${ind}find  ${L}`)
    indincr()
    let i = find(L, lastIndex)
    inddecr()
    if (i == -1) {
      // if (partialMatchIndex != -1) {
      //   diffprint(`${ind}PARTIAL match  ${right[partialMatchIndex]}`)
      // }
      if (!d) {
        d = new List(left.line, left.col, "(")
        if (isIdList) {
          d.push(left[0])
        }
      }
      let R = right[partialMatchIndex == -1 ? li : partialMatchIndex]
      if (!R || R instanceof Sym) {
        if (bestMatch && !((bestMatch as any) instanceof Sym)) {
          let R2 = bestMatch as any as Value
          if (isIdList && R2 instanceof List && diff(left[0], R2[0])) {
            // don't use best-match lists unless they match on arg0
            diffprint(`${ind}R2 erasure  ${R2}  <${R2.constructor.name}>`)
            R = nil
          } else {
            R = bestMatch
          }
        } else {
          // if (bestMatch) {
          //   diffprint(`${ind}ignoring bestMatch  ${bestMatch}`)
          // }
          R = nil
        }
      }
      diffprint(`${ind}not found; select substitute  ${R}`)
      d.push(List.create(L.line, L.col, L, R))
    } else {
      diffprint(`${ind}found at ${i}`)
      lastIndex = i
      nmatches++
    }
  }

  let partial = !!d && nmatches > 0

  if (!partial && !(left[0] instanceof List)) {
    // diffprint(`${ind}•• not partial but is id list`)
    partial = true
  }

  return [partial, d]
}

function diffSym(L :Sym, R :Value|null) :List|null {
  return !R ? List.create(L.line, L.col, L, nil) :
         (R instanceof Sym && R.value === L.value) ? null :
         List.create(L.line, L.col, L, R)
}

function diffPre(L :Pre, R :Value|null) :List|null {
  let d = diffSym(L, R)
  return d === null && R instanceof Pre && L.type !== R.type ?
         List.create(L.line, L.col, L, R) : d
}

function diffUnion(L :Union, R :Value|null) :List|null {
  if (!R) { return List.create(L.line, L.col, L, nil) }
  if (!(R instanceof Union) || L.prefix !== R.prefix || L.length !== R.length) {
    return List.create(L.line, L.col, L, R)
  }
  // unions must match exactly (unlike lists)
  for (let i = 0; i < L.length; i++) {
    let D = diffSym(L[i], R[i])
    if (D) {
      return List.create(L.line, L.col, L, R)
    }
  }
  return null
}

// ----------------------------------------------------------
// test

function assertS(v :any, value :string) {
  assert(v.constructor === Sym)
  assert(v.value == value, `${v.value} == ${value}`)
}
function assertP(v :any, value :string, type :PreType) {
  assert(v.constructor === Pre)
  assert(v.value == value, `${v.value} == ${value}`)
  assert(v.type == type, `${v.type} == ${type}`)
}
function assertL(v :any, type :ListType, length :int) {
  assert(v.constructor === List)
  assert(v.type == type, `${v.type} == ${type}`)
  assert(v.length == length, `${v.length} == ${length}`)
}

TEST("parse", () => {
  let xs = parse(`
    (a
      (b c
        [d e])
      <f g>  // comment
      "h i"
      'j k')
  `) as any
  assertL(xs, "", 1)  // parse returns an anonymous list of lists
  assertL(xs[0], "(", 5)
  assertS(xs[0][0], "a")
  assertL(xs[0][1], "(", 3)
  assertS(xs[0][1][0], "b")
  assertS(xs[0][1][1], "c")
  assertL(xs[0][1][2], "[", 2)
  assertL(xs[0][2], "<", 2)
  assertS(xs[0][2][0], "f")
  assertS(xs[0][2][1], "g")
  assertP(xs[0][3], "h i", '"')
  assertP(xs[0][4], "j k", "'")
})

TEST("toString", () => {
  let xs = parse(`(a (b c [d e]) <f g> "h i" 'j k')`)[0]
  assertEq(xs.toString(), `(a (b c (d e)) (f g) "h i" 'j k')`)
  assertEq(xs.toString("\n"), `
    (a
      (b c
        (d e))
      (f g) "h i" 'j k')
  `.trim().replace(/\n    /g, "\n"))
  // note that toString only really supports "\n" and " " as the provided
  // string is inserted at list starting points, as illustrated here:
  assertEq(xs.toString("•"), `(a•(b c•(d e))•(f g) "h i" 'j k')`)
})


TEST('diff', () => {
  assertEq(diff(parse("(a c)")[0],
                parse("(a b c d)")[0])+"",
           "null") // no difference

  assertEq(diff(parse("(a (x y))")[0],
                parse("(a b (x y)")[0])+"",
           "null")

  assertEq(diff(parse("(a c x)")[0],
                parse("(a b c d e)")[0])+"",
           "(a (x nil))")  // x not found

  assertEq(diff(parse("(a c x y)")[0],
                parse("(a b c d e)")[0])+"",
           "(a (x nil) (y nil))")  // x and y not found

  assertEq(diff(parse("(a b (c (d x)))")[0],
                parse("(a b (c k (d z)))")[0])+"",
           "(a ((c (d x)) (c k (d z))))") // list "c" is different

  assertEq(diff(parse("(a (c (d x)) (g h))")[0],
                parse("(a (b 1) (c k (d z)) p (g h))")[0])+"",
           "(a ((c (d x)) (c k (d z))))") // list "c" is different

  assertEq(diff(parse("(a (x y))")[0],
                parse("(a b (y x)")[0])+"",
           "(a ((x y) nil))")  // y out-of order

  assertEq(diff(parse("(a u(x|y))")[0],
                parse("(a b u(x|y)")[0])+"",
           "null")  // unions

  assertEq(diff(parse("(a u(x|y))")[0],
                parse("(a b u(x|y|z)")[0])+"",
           "(a (u(x|y) u(x|y|z)))") // unions must match exactly

  assertEq(diff(parse("(a k(x|y))")[0],
                parse("(a b z(x|y)")[0])+"",
           "(a (k(x|y) z(x|y)))") // unions with different prefix

  assertEq(diff(parse(`
    (a
      (b b1)
      a1
      (b b2
        (c c1
          (d d1)))
      a2)
    `)[0], parse(`
    (a
      (b b1)
      a1
      (b b2
        (c c1
          (d d1)))
      a2)
    `)[0])+"",
    "null")

  diffprint("----------------------------")
  assertEq(diff(parse(`
    (a
      (b
        (c d)))
    `)[0], parse(`
    (a
      x
      (b
        y
        (c k)))
    `)[0])+"",
    "(a ((b (c d)) (b y (c k))))")

  assertEq(diff(parse(`
    (a
      (b b1 matches)
      a1
      (b
        (c c1
          (d d1)))
      a2)
    `)[0], parse(`
    (a
      (b b1 matches)
      a1
      ignored
      (b
        included
        (c c1
          (d dx)))
      a2)
    `)[0])+"",
    "(a ((b (c c1 (d d1))) (b included (c c1 (d dx)))))")

  // // source location
  // { let d = diff(parse(
  //     `         // line 1
  //     (a        // line 2
  //       (b b1)  // line 3
  //       a2)     // line 4
  //     `)[0], parse(
  //     `         // line 1
  //     (a        // line 2
  //       x       // line 3
  //       y       // line 4
  //       (b bx)  // line 5
  //       a2)     // line 6
  //   `)[0]) as any
  //   assertEq(d+"", "(((b1 bx)))")
  //   assertEq(d[0][0][0].line, 3)  // b1
  //   assertEq(d[0][0][1].line, 5)  // bx
  //   assertEq(d[0].line, 3) // synthetic lists inherit location of left side
  // }
})
