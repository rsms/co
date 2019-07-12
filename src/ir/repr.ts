import { Style, stdoutStyle, style, noStyle } from '../termstyle'
import { Pkg, Fun, Block, BlockKind, Value, BranchPrediction } from './ssa'
import { fmtop, opinfo } from "./ops"
import { OpInfo, AuxType } from "./op"

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

function fmtaux(_f :IRFmt, v :Value, opi :OpInfo) :string {
  let auxInt = false
  let aux = false
  switch (opi.aux) {

  case AuxType.Bool:          // auxInt is 0/1 for false/true
  case AuxType.Int8:          // auxInt is an 8-bit integer
  case AuxType.Int16:         // auxInt is a 16-bit integer
  case AuxType.Int32:         // auxInt is a 32-bit integer
  case AuxType.Int64:         // auxInt is a 64-bit integer
  case AuxType.Float32:       // auxInt is a float32 (encoded with math.Float64bits)
  case AuxType.Float64:       // auxInt is a float64 (encoded with math.Float64bits)
    auxInt = true
    break

  case AuxType.String:        // aux is a string
  case AuxType.Sym:           // aux is a symbol (a *gc.Node for locals or an *obj.LSym for globals)
  case AuxType.Type:          // aux is a type
  case AuxType.CCop:          // aux is a ssa.Op that represents a flags-to-bool conversion (e.g. LessThan)
    aux = true
    break

  case AuxType.SymOff:        // aux is a symbol, auxInt is an offset
  case AuxType.SymValAndOff:  // aux is a symbol, auxInt is a ValAndOff
  case AuxType.SymInt32:      // aux is a symbol, auxInt is a 32-bit integer
  case AuxType.TypeSize:      // aux is a type, auxInt is a size, must have Aux.(Type).Size() == AuxInt
    auxInt = true
    aux = true
    break

  }
  let s = ""
  if (auxInt) {
    s += ` [${v.auxInt}]`
  }
  if (aux && v.aux !== null) {
    s += ` {${v.aux}}`
  }
  return s
}

function fmtval(f :IRFmt, v :Value) :string {
  let s = `v${v.id} = `
  assert(v.op !== undefined, `value ${v} missing operator v=${repr(v)}`)
  let opi = opinfo[v.op]
  s += fmtop(v.op)
  if (f.types) {
    s += ' ' + f.style.purple(`<${v.type}>`)
  }
  for (let i = 0, z = v.args.length; i < z; i++) {
    s += ' ' + v.args[i]
  }
  if (opi.aux != AuxType.None) {
    s += fmtaux(f, v, opi)
  }
  if (v.reg) {
    s += ` : ${style.orange(v.reg.name)}`
  }
  let usecomment = (
    v.uses == 0 ? "unused" :
    v.uses == 1 ? "1 use" :
    `${v.uses} uses`
  )
  s += f.style.grey(
    v.comment ? `  // ${v.comment}; ${usecomment}` :
    `  // ${usecomment}`
  )
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
  } // else: entry block

  f.println('')

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
