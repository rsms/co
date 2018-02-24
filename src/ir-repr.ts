import { Pkg, Fun, Block, BlockKind, Value, Op } from './ir'
import { Style, stdoutStyle, style, noStyle } from './termstyle'

export type LineWriter = (s :string) => any

class IRFmt {
  rarr :string  // " -> "
  larr :string  // " <- "

  constructor(
  public types :bool,
  public style :Style,
  public println :LineWriter,
  ){
    this.rarr = style.grey(' —> ')
    this.larr = style.grey(' <— ')
  }
}

function fmtval(f :IRFmt, v :Value) :string {
  let s = `v${v.id} = `
  s += Op[v.op]
  if (f.types) {
    s += ' ' + f.style.grey(`<${v.type}>`)
  }
  if (v.args) for (let arg of v.args) {
    s += ' ' + arg
  }
  if (v.aux !== null) {
    s += ' [' + v.aux + ']'
  }
  if (v.comment) {
    s += '  // ' + v.comment
  }
  return s
}


function printval(f :IRFmt, v :Value, indent :string) {
  f.println(indent + fmtval(f, v))
}


function printblock(f :IRFmt, b :Block, indent :string) {
  let label = b.toString()
  let preds = ''
  if (b.preds && b.preds.length) {
    preds = f.larr + b.preds.map(b => 
      f.style.lightyellow(b.toString()) ).join(', ')
  }
  let comment = b.comment ? '  // ' + b.comment : ''
  f.println(indent + f.style.lightyellow(label + ':') + preds + comment)

  let valindent = indent + '  '
  for (let v of b.values) {
    printval(f, v, valindent)
  }

  switch (b.kind) {

    case BlockKind.Plain: {
      // check & print successors
      assert(b.succs != null, 'missing successor for plain block')
      assert(b.succs && b.succs.length == 1,
        `b.succs.length = ${b.succs && b.succs.length || 0}; expected 1`)
      let succs = b.succs as Block[]
      let contb = succs[0]
      f.println(
        indent +
        f.style.cyan('cont') + f.rarr +
        f.style.lightyellow(contb.toString())
      )
      break
    }

    case BlockKind.If: {
      // check & print successors
      assert(b.succs != null, 'missing successors for if block')
      assert(b.succs && b.succs.length == 2,
        `b.succs.length = ${b.succs && b.succs.length || 0}; expected 2`)
      assert(b.control, "missing control (condition) value")
      let succs = b.succs as Block[]
      let thenb = succs[0]
      let elseb = succs[1]
      f.println(
        indent +
        f.style.cyan('if') +
        ` ${b.control}${f.rarr}` +
        f.style.lightyellow(thenb.toString()) + ' ' +
        f.style.lightyellow(elseb.toString())
      )
      break
    }

    case BlockKind.Ret: {
      // check successors
      assert(b.succs == null, "can't have successor to return block")
      f.println(
        indent +
        f.style.cyan('ret') + (b.control ? ' ' + b.control : '')
      )
      break
    }

    default:
      assert(false, `unexpected block kind ${BlockKind[b.kind]}`)
  }
}


function printfun(f :IRFmt, fn :Fun) {
  f.println(
    f.style.white(fn.toString()) +
    ' (' + fn.type.inputs.join(' ') + ')->' + fn.type.result
  )
  let first = true
  for (let b of fn.blocks) {
    if (first) {
      first = false
    } else {
      f.println('')
    }
    printblock(f, b, /*indent*/'  ')
  }
}


function printpkg(f :IRFmt, pkg :Pkg) {
  // data :Uint8Array      // data  TODO wrap into some simple linear allocator
  // funs :Fun[] = []      // functions
  // init :Fun|null = null // init functions (merged into one)
  for (let i = 0; i < pkg.funs.length; i++) {
    printfun(f, pkg.funs[i])
    if (i+1 < pkg.funs.length) {
      f.println('')
    }
  }
}


export interface Options {
  noTypes?  :bool  // include type annotations
  colors? :bool
    // true: always generate ANSI-styled output
    // false: never generate ANSI-styled output
    // undefined: generate ANSI-styled output if stdout is a TTY
}

export function printir(v :Fun|Block|Value, w? :LineWriter, o? :Options) {
  let f = new IRFmt(
    /*types*/ !(o && o.noTypes),
    /*style*/ (
      o && o.colors ? style :
      o && o.colors === false ? noStyle :
      stdoutStyle
    ),
    /*println*/ w || console.log.bind(console) as LineWriter,
  )
  if      (v instanceof Pkg) {   printpkg(f, v) }
  else if (v instanceof Fun) {   printfun(f, v) }
  else if (v instanceof Block) { printblock(f, v, /*indent=*/'') }
  else if (v instanceof Value) { printval(f, v, /*indent=*/'') }
  else {
    let o = v as any
    assert(false,
      `unexpected value ${o && typeof o == 'object' ? o.constructor.name : o}`
    )
  }
}

export function fmtir(v :Fun|Block|Value, options? :Options) :string {
  let str = ''
  let w = (s :string) => { str += s + '\n' }
  printir(v, w, options)
  return str
}
