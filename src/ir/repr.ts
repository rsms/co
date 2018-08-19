import { Style, stdoutStyle, style, noStyle } from '../termstyle'
import { Pkg, Fun, Block, BlockKind, Value, BranchPrediction } from './ssa'

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
  assert(v.op, `value ${v} without .op`)
  let s = `v${v.id} = `
  s += v.op.name
  if (f.types) {
    s += ' ' + f.style.grey(`<${v.type}>`)
  }
  for (let arg of v.args) {
    s += ' ' + arg
  }
  if (v.aux !== null) {
    s += ` [${v.aux}]`
  }
  // if (v.reg != noReg) {
  //   s += ` {${style.orange(v.reg.toString())}}`
  // }
  if (v.reg) {
    s += ` {${style.orange(v.reg.name)}}`
  }
  // s += ` : ${style.pink(v.uses.toString())}`
  if (v.comment) {
    s += f.style.grey('  // ' + v.comment)
  }
  return s
}


function printval(f :IRFmt, v :Value, indent :string) {
  f.println(indent + fmtval(f, v))
}


function printblock(f :IRFmt, b :Block, indent :string) {
  let label = b.toString()
  let preds = ''
  let meta = ''

  if (b.preds.length) {
    preds = f.larr + b.preds.map(b => 
      f.style.lightyellow(b.toString())
    ).join(', ')

    f.println('')
  } // else: entry block

  let comment = b.comment ? f.style.grey('  // ' + b.comment) : ''
  f.println(indent + f.style.lightyellow(label + ':') + preds + meta + comment)

  let valindent = indent + '  '
  for (let v of b.values) {
    printval(f, v, valindent)
  }

  const fmtsucc = (b :Block) => {
    let s = f.style.lightyellow(b.toString())
    switch (b.likely) {
      case BranchPrediction.Likely:
        s += f.style.grey(' (likely)')
        break
      case BranchPrediction.Unlikely:
        s += f.style.grey(' (unlikely)')
        break
    }
    return s
  }

  switch (b.kind) {

    case BlockKind.Plain: {
      // check & print successors
      // assert(b.succs.length == 1,
      //   `b.succs.length = ${b.succs && b.succs.length || 0}; expected 1`)
      let contb = b.succs[0]
      if (contb) {
        f.println(
          indent +
          f.style.cyan('cont') + f.rarr +
          fmtsucc(contb)
        )
      }
      break
    }

    case BlockKind.First:
    case BlockKind.If: {
      // check & print successors
      // assert(b.succs.length == 2,
      //   `b.succs.length = ${b.succs && b.succs.length || 0}; expected 2`)
      let thenb = b.succs[0]
      let elseb = b.succs[1]
      if (thenb && elseb) {
        assert(b.control, "missing control (condition) value")
        f.println(
          indent +
          f.style.cyan(b.kind == BlockKind.If ? 'if' : 'first') +
          ` ${b.control}${f.rarr}` +
          fmtsucc(thenb) + ', ' + fmtsucc(elseb)
        )
      }
      break
    }

    case BlockKind.Ret: {
      // check successors
      assert(b.succs.length == 0, "can't have successor to return block")
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
    ' (' + fn.type.args.join(' ') + ')->' + fn.type.result
  )
  for (let b of fn.blocks) {
    printblock(f, b, /*indent*/'  ')
  }
}


function printpkg(f :IRFmt, pkg :Pkg) {
  // data :Uint8Array      // data  TODO wrap into some simple linear allocator
  // funs :Fun[] = []      // functions
  // init :Fun|null = null // init functions (merged into one)
  let isFirst = true
  for (let fn of pkg.funs.values()) {
    printfun(f, fn)
    if (isFirst) {
      isFirst = false
    } else {
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
  return str.replace(/\r?\n$/, '')
}
