import { Fun, Block, BlockKind, Id, Tac, Value } from './ir'
import { tokstr } from './token'
import { Style, stdoutStyle, style, noStyle } from './termstyle'
import { asciistr } from './util'
import * as ast from './ast'

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

function fmttype(f :IRFmt, t :ast.Type) :string {
  return f.types ? f.style.grey('<'+t+'>') : ''
}

function fmtval(f :IRFmt, v :Value) :string {
  let name = v.toString()
  if (v instanceof Id) {
    return (
      ( name[0] == '%' ? f.style.italic('t'+name.substr(1)) :
        f.style.white(name)
      ) +
      fmttype(f, v.type)
    )
  } else {
    // const
    return f.style.pink(asciistr(v.value)) + fmttype(f, v.type)
  }
}


function printtac(f :IRFmt, c :Tac, indent :string) {
  if (c.dst) {
    if (c.dst instanceof Block) {
      // branch, e.g. "if x goto dst; else goto y"
      f.println(
        indent +
        tokstr(c.op) + fmtval(f, c.x) + fmtval(f, c.dst) +
        (c.y ? ' ' + fmtval(f, c.y) : '')
      )
    } else {
      // assignment, e.g. "x = y", "x = y + 3"
      f.println(
        indent +
        fmtval(f, c.dst) + ' = ' + fmtval(f, c.x) +
        ( c.y ? ' ' + tokstr(c.op) + ' ' + fmtval(f, c.y) : '')
      )
    }
  } else {
    assert(c.op, "no op or dest")
    f.println(
      indent +
      tokstr(c.op) + fmtval(f, c.x) + (c.y ? ' ' + fmtval(f, c.y) : '')
    )
  }
}


function printblock(
  f :IRFmt,
  b :Block,
  indent :string,
) :Block|null
{
  let label = b.toString()
  let preds = ''
  if (b.preds && b.preds.length) {
    preds = f.larr + b.preds.map(b => 
      f.style.lightyellow(b.toString()) ).join(', ')
  }
  f.println(indent + f.style.lightyellow(label + ':') + preds)

  for (let c of b.code) {
    printtac(f, c, /*indent=*/indent + '  ')
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
      return contb
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
        ' ' + fmtval(f, b.control as Value) + f.rarr +
        f.style.lightyellow(thenb.toString()) + ' ' +
        f.style.lightyellow(elseb.toString())
      )
      return elseb
    }

    case BlockKind.Ret: {
      // check successors
      assert(b.succs == null, "can't have successor to return block")
      assert(b.control, "missing control (return) value")
      f.println(
        indent +
        f.style.cyan('ret ') + fmtval(f, b.control as Value)
      )
      return null
    }

    default:
      assert(false, `unexpected block kind ${BlockKind[b.kind]}`)
  }

  return null
}


function printfun(f :IRFmt, fn :Fun) {
  f.println(
    f.style.white(fn.toString()) +
    '(' + fn.params.map(p => p.toString()).join(', ') + ')' +
    fmttype(f, fn.restype)
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


export interface Options {
  types?  :bool  // include type annotations
  colors? :bool
    // true: always generate ANSI-styled output
    // false: never generate ANSI-styled output
    // undefined: generate ANSI-styled output if stdout is a TTY
}

export function irrepr(v :Fun|Block|Tac, w? :LineWriter, o? :Options) {
  let f = new IRFmt(
    /*types*/ !!(o && !!o.types),
    /*style*/ (
      o && o.colors ? style :
      o && o.colors === false ? noStyle :
      stdoutStyle
    ),
    /*println*/ w || console.log.bind(console) as LineWriter,
  )
  if (v instanceof Fun) {        printfun(f, v) }
  else if (v instanceof Block) { printblock(f, v, /*indent=*/'') }
  else if (v instanceof Tac) {   printtac(f, v, /*indent=*/'') }
  else { assert(false, `unexpected value ${v}`) }
}

export function irreprstr(v :Fun|Block|Tac, options? :Options) :string {
  let str = ''
  let w = (s :string) => { str += s }
  irrepr(v, w, options)
  return str
}
