//
// Produces a human-readable format of an AST, meant for debugging.
//
import * as utf8 from './utf8'
import { tokstr, token } from './token'
import { termColorSupport, style, noStyle } from './termstyle'
import {  
  Group,
  Node,

  Field,

  // Decl,
  ImportDecl,
  VarDecl,
  TypeDecl,
  MultiDecl,

  Expr,
  Ident,
  RestExpr,
  BasicLit,
  StringLit,
  FunExpr,
  FunSig,
  NoOpStmt,
  Block,
  ReturnExpr,
  IfExpr,
  Assignment,
  Operation,
  CallExpr,
  ParenExpr,
  TupleExpr,
  BadExpr,
  SelectorExpr,
  IndexExpr,
  SliceExpr,
  TypeConvExpr,

  Type,
  UnresolvedType,
  BasicType,
  StrType,
  RestType,
  TupleType,
  FunType,
  UnionType,
} from './ast'


class ReprCtx {
  // This is a hack for creating printable group identifiers
  groupIds = new Map<Group,int>()
  nextGroupId = 0
  ind :string = '  '
  typedepth = 0
  style = termColorSupport ? style : noStyle

  groupId(g :Group) :string {
    let gid = (g as any).id || this.groupIds.get(g)
    if (gid === undefined) {
      gid = this.nextGroupId++
      this.groupIds.set(g, gid)
    }
    return gid.toString(36)
  }
}


export interface ReprOptions {
  colors?: bool
}


export function astRepr(n :Node, options? :ReprOptions) :string {
  let ctx = defaultCtx
  if (options) {
    ctx = new ReprCtx()
    if (options.colors !== undefined) {
      ctx.style = options.colors ? style : noStyle
    }
  }
  return repr1(n, '\n', ctx).trim()
}


const defaultCtx = new ReprCtx()


function _reprt(t :Type, nl :string, c :ReprCtx) :string {
  if (t instanceof BasicType) {
    return c.style.bold(t.name)
  }
  if (t instanceof TupleType) {
    return '(' + t.types.map(t => _reprt(t, nl, c)).join(', ') + ')'
  }
  if (t instanceof RestType) {
    return '...' + _reprt(t.type, nl, c)
  }
  if (t instanceof FunType) {
    return (
      '(' + t.inputs.map(it => _reprt(it, nl, c)).join(', ') + ')' +
      '->' + _reprt(t.result, nl, c)
    )
  }
  if (t instanceof UnresolvedType) {
    return '~'
  }
  return t.toString()
}


function reprt0(tx :Expr|null, nl :string, c :ReprCtx) :string {
  if (!tx) {
    return '?'
  }

  let t :Type|null = (
    tx instanceof Type ? tx :
    tx.type && tx.type !== tx && tx.type instanceof Type ? tx.type :
    null
  )

  if (t) {
    c.typedepth++
    const v = _reprt(t, nl, c)
    c.typedepth--
    return v
  }

  // unresolved
  return '~' + repr1(tx, nl, c)
}

function reprt(tx :Expr|null, newline :string, c :ReprCtx) :string {
  return c.style.blue(`<${reprt0(tx, newline, c)}>`)
}


function reprv(nv :Node[], newline :string, c :ReprCtx, delims :string='()') :string {
  return (
    (delims[0] || '') +
    nv.map(n => repr1(n, newline, c)).join(' ') +
    (delims[1] || '')
  )
}


function subscriptnum(n :int) :string {
  // ASCII 0-9 Unicode range: [U+0030 .. U+0039]
  // superscript 0-9 Unicode range: [U+2070 .. U+2079]
  // subscript 0-9 Unicode range: [U+2080 .. U+2089]
  let s = n.toString(10)
  let r = ''
  let ss0 = 0x2080 - 0x30
  for (let i = 0; i < s.length; ++i) {
    let c = s.charCodeAt(i) + ss0
    r += String.fromCharCode(c)
  }
  return r
}


function reprid(id :Ident, c :ReprCtx) :string {
  return (
    utf8.decodeToString(id.value.bytes) +
    c.style.pink(subscriptnum(id.ver))
  )
}


function reprcons(n :Node, c :ReprCtx) :string {
  return c.style.grey(n.constructor.name)
}


function repr1(n :Node, newline :string, c :ReprCtx, flag :int = 0) :string {
  assert(n)

  if (n instanceof BasicType) {
    return c.style.purple(c.style.bold(n.name))
  }

  if (n instanceof BasicLit || n instanceof StringLit) {
    let s = JSON.stringify(utf8.decodeToString(n.value))
    if (!(n instanceof StringLit)) {
      // trim "
      s = s.substr(1, s.length-2)
    }
    return reprt(n.type, newline, c) + c.style.green(s)
  }

  if (n instanceof Ident) {
    return (c.typedepth ? '' : reprt(n.type, newline, c)) + reprid(n, c)
  }

  if (n instanceof RestExpr) {
    return '...' + repr1(n.expr, newline, c)
  }

  if (n instanceof BadExpr) {
    return 'BAD'
  }

  const nl2 = newline + c.ind

  if (n instanceof Field) {
    let s = repr1(n.type, nl2, c)
    if (n.name) {
      s = '(' + repr1(n.name, nl2, c) + ' ' + s + ')'
    }
    return s
  }

  if (n instanceof Block) {
    return (
      n.list.length ?
        newline + '{' +
        n.list.map(n => nl2 + repr1(n, nl2, c).trim()).join('') +
        newline + '}' :
        '{}'
    )
  }

  if (n instanceof ReturnExpr) {
    if (n.result) {
      return newline + `(${reprcons(n, c)} ${repr1(n.result, nl2, c)})`
    }
    return newline + reprcons(n, c)
  }

  if (n instanceof IfExpr) {
    // flag=1 means "else if" branch
    let s = (
      ( flag ? '' :
        newline + '(' + reprt(n.type, newline, c)
      ) +
      'if ' + repr1(n.cond, nl2, c) +
      repr1(n.then, newline, c)
    )
    if (n.els_) {
      s += newline + 'else ' + repr1(n.els_, newline, c, /*flag*/1)
    }
    return flag ? s : s + ')'
  }

  // if (n instanceof ExprStmt) {
  //   return newline + `(${reprcons(n, c)} ${repr1(n.expr, nl2, c)})`
  // }

  if (n instanceof FunSig) {
    return reprv(n.params, nl2, c) + ' -> ' + reprt(n.result, nl2, c)
  }

  if (n instanceof Assignment) {
    let s = newline + `(${reprcons(n, c)} `
    s += reprv(n.lhs, nl2, c)
    if (n.op == token.ILLEGAL) {
      s += ' = '
    } else {
      s += ' ' + tokstr(n.op) + ' '
    }
    s += reprv(n.rhs, nl2, c)
    return s + ')'
  }

  if (n instanceof MultiDecl) {
    return newline + `(${reprcons(n, c)}` + ' ' + reprv(n.decls, nl2, c, '') + ')'
  }

  // if (n instanceof UnresolvedType) {
  //   return '<~>'
  // }

  if (n instanceof SelectorExpr) {
    return (
      '(SEL ' +
      repr1(n.lhs, newline, c) + '.' +
      repr1(n.rhs, newline, c) + ')'
    )
  }

  if (n instanceof IndexExpr) {
    return (
      `(${reprt(n.type, newline, c)}index ` +
      repr1(n.operand, newline, c) + ' ' +
      repr1(n.index, newline, c) +
      ')'
    )
  }

  if (n instanceof SliceExpr) {
    return (
      `(${reprt(n.type, newline, c)}slice ` +
      repr1(n.operand, newline, c) + ' ' +
      (n.start ? repr1(n.start, newline, c) : 'nil') + ' ' +
      (n.end ? repr1(n.end, newline, c) : 'nil') +
      ')'
    )
  }


  // --------


  let s = '('
  if (n instanceof Expr && !c.typedepth) {
    s += reprt(n.type, newline, c)
  }
  s += reprcons(n, c)

  if (n instanceof ImportDecl) {
    s += ' path: ' + repr1(n.path, nl2, c)
    if (n.localIdent) {
      s += newline +
        c.ind + 'localIdent: ' + repr1(n.localIdent, nl2, c)
    }
    return s + ' )'
  }

  if (n instanceof VarDecl) {
    if (n.group) {
      s += ' [#' + c.groupId(n.group) + ']'
    }
    if (n.type) {
      s += reprt(n.type, newline, c) + ' ' + reprv(n.idents, nl2, c)
    } else {
      s += ' (' + n.idents.map(id =>
        reprt(id, newline, c) + reprid(id, c)
      ).join(' ') + ')'
    }
    if (n.values) {
      s += ' ' + reprv(n.values, nl2, c)
    }
    return s + ')'
  }

  if (n instanceof TypeDecl) {
    if (n.group) {
      s += ' [#' + c.groupId(n.group) + ']'
    }
    s += ' ' + repr1(n.ident, nl2, c)
    if (n.alias) {
      s += ' ='
    }
    return s + ' ' + repr1(n.type, nl2, c) + ')'
  }

  if (n instanceof Operation) {
    s += ' ' + c.style.orange(tokstr(n.op)) + ' ' + repr1(n.x, nl2, c)
    if (n.y) {
      s += ' ' + repr1(n.y, nl2, c)
    }
    return s + ')'
  }

  if (n instanceof CallExpr) {
    s += ' ' + repr1(n.fun, newline, c) + ' ('
    s += reprv(n.args, nl2, c, '')
    if (n.hasDots) {
      s += '...'
    }
    return s + '))'
  }

  if (n instanceof ParenExpr) {
    return s + ' ' + repr1(n.x, newline, c) + ')'
  }

  if (n instanceof TypeConvExpr) {
    return s + ' ' + repr1(n.expr, newline, c) + ')'
  }

  if (n instanceof FunExpr) {
    s += ' '
    if (n.isInit) {
      s += 'init '
    } else if (n.name) {
      s += repr1(n.name, newline, c) + ' '
    }
    s += repr1(n.sig, newline, c)
    if (n.body) {
      s += ' ' + repr1(n.body, nl2, c)
    }
    return s + ')'
  }

  if (n instanceof TupleExpr) {
    return s + ' ' + reprv(n.exprs, nl2, c, '') + ')'
  }

  if (n.constructor === NoOpStmt) {
    return 'noop'
  }

  return '(???'+ reprcons(n, c) + ' ' + repr(n) + ')'
}
