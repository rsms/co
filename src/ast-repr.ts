//
// Produces a human-readable format of an AST, meant for debugging.
//
import * as utf8 from './utf8'
import {
  Node,
  Group,
  Ident,
  RestExpr,
  Field,
  BasicLit,
  StringLit,
  ImportDecl,
  // ConstDecl,
  VarDecl,
  TypeDecl,
  FunDecl,
  FunSig,
  SimpleStmt,
  BlockStmt,
  ReturnStmt,
  ExprStmt,
  AssignStmt,
  DeclStmt,
  Operation,
  Expr,
  CallExpr,
  ParenExpr,
  TupleExpr,
  BadExpr,
  SelectorExpr,
  TypeConversionExpr,
  Type,
  UnresolvedType,
  RestType,
  IntrinsicType,
  ConstStringType,
  TupleType,
  FunType,
} from './ast'
import { tokstr, token } from './token'


class ReprCtx {
  // This is a hack for creating printable group identifiers
  groupIds = new Map<Group,int>()
  nextGroupId = 0
  ind :string = '  '
  typedepth = 0

  groupId(g :Group) :string {
    let gid = (g as any).id || this.groupIds.get(g)
    if (gid === undefined) {
      gid = this.nextGroupId++
      this.groupIds.set(g, gid)
    }
    return gid.toString(36)
  }
}


const globalCtx = new ReprCtx()


export function astRepr(n :Node, ctx: ReprCtx|null = null) :string {
  return repr1(n, '\n', ctx || globalCtx).trim()
}


function _reprt(t :Type, nl :string, c :ReprCtx) :string {
  if (t instanceof ConstStringType) {
    return `${t.name}[${t.length}]`
  }
  if (t instanceof IntrinsicType) {
    return `${t.name}`
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
      '->' + _reprt(t.output, nl, c)
    )
  }
  if (t instanceof UnresolvedType) {
    return '~' + repr1(t.expr, nl, c)
  }
  return `???${t.constructor.name}`
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
  return `<${reprt0(tx, newline, c)}>`
}


function reprv(nv :Node[], newline :string, c :ReprCtx, delims :string='()') :string {
  return (
    (delims[0] || '') +
    nv.map(n => repr1(n, newline, c)).join(' ') +
    (delims[1] || '')
  )
}


function reprid(id :Ident) :string {
  return utf8.decodeToString(id.value.bytes)
}


function repr1(n :Node, newline :string, c :ReprCtx) :string {
  if (n instanceof IntrinsicType) {
    return n.name
  }

  if (n instanceof BasicLit || n instanceof StringLit) {
    let s = JSON.stringify(utf8.decodeToString(n.value))
    if (!(n instanceof StringLit)) {
      // trim "
      s = s.substr(1, s.length-2)
    }
    return reprt(n.type, newline, c) + s
  }

  if (n instanceof Ident) {
    return reprid(n)
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
    if (n.ident) {
      s = '(' + repr1(n.ident, nl2, c) + ' ' + s + ')'
    }
    return s
  }

  if (n instanceof BlockStmt) {
    return (
      n.list.length ?
        newline + '{' + reprv(n.list, nl2, c, '') + newline + '}' :
        '{}'
    )
  }

  if (n instanceof ReturnStmt) {
    if (n.result) {
      return newline + '(return ' + repr1(n.result, nl2, c) + ')'
    }
    return newline + 'return'
  }

  if (n instanceof ExprStmt) {
    return newline + `(ExprStmt ${repr1(n.expr, nl2, c)})`
  }

  if (n instanceof FunSig) {
    return reprv(n.params, nl2, c) + ' -> ' + reprt(n.result, nl2, c)
  }

  if (n instanceof AssignStmt) {
    let s = newline + '(AssignStmt '
    s += reprv(n.lhs, nl2, c)
    if (n.op == token.ILLEGAL) {
      s += ' = '
    } else {
      s += ' ' + tokstr(n.op) + ' '
    }
    s += reprv(n.rhs, nl2, c)
    return s + ')'
  }

  if (n instanceof DeclStmt) {
    return newline + '(DeclStmt' + ' ' + reprv(n.decls, nl2, c, '') + ')'
  }

  if (n instanceof UnresolvedType) {
    return repr1(n.expr, newline, c)
  }

  if (n instanceof SelectorExpr) {
    return (
      '(SEL ' +
      repr1(n.lhs, newline, c) + '.' +
      repr1(n.rhs, newline, c) + ')'
    )
  }


  // --------


  let s = '('
  if (n instanceof Expr && !c.typedepth) {
    s += reprt(n.type, newline, c)
  }
  s += n.constructor.name

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
        reprt(id, newline, c) + reprid(id)
      ).join(' ') + ')'
    }
    if (n.values) {
      s += ' ' + reprv(n.values, nl2, c)
    }
    return s + ' )'
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
    s += ' ' + tokstr(n.op) + ' ' + repr1(n.x, nl2, c)
    if (n.y) {
      s += ' ' + repr1(n.y, nl2, c)
    }
    return s + ')'
  }

  if (n instanceof CallExpr) {
    s += ' ' + repr1(n.fun, newline, c) + ' ('
    s += reprv(n.argList, nl2, c, '')
    if (n.hasDots) {
      s += '...'
    }
    return s + '))'
  }

  if (n instanceof ParenExpr) {
    return s + ' ' + repr1(n.x, newline, c) + ')'
  }

  if (n instanceof TypeConversionExpr) {
    return s + ' ' + repr1(n.expr, newline, c) + ')'
  }

  if (n instanceof FunDecl) {
    s += ' '
    if (n.name) {
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

  if (n.constructor === SimpleStmt) {
    return 'noop'
  }

  return '(???'+ n.constructor.name + ' ' + repr(n) + ')'
}
