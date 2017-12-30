//
// Produces a human-readable format of an AST, meant for debugging.
//
import * as utf8 from './utf8'
import {
  Node,
  Group,
  Ident,
  Field,
  BasicLit,
  StringLit,
  ImportDecl,
  ConstDecl,
  VarDecl,
  TypeDecl,
  DotsType,
  FunDecl,
  FunSig,
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
  IntrinsicType,
  StringLitType,
} from './ast'
import { tokstr, token } from './token'


class ReprCtx {
  // This is a hack for creating printable group identifiers
  groupIds = new Map<Group,int>()
  nextGroupId = 0
  ind :string = '  '

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


function reprv(nv :Node[], newline :string, c :ReprCtx, delims :string='()') :string {
  return (
    (delims[0] || '') +
    nv.map(n => repr1(n, newline, c)).join(' ') +
    (delims[1] || '')
  )
}


function reprt(n :Expr, newline :string, c :ReprCtx) :string {
  const t = n.type
  return (
    !t ? '<?>' :
    (t instanceof StringLitType) ? `${t.name}<${t.length}>` :
    `<${repr1(t, newline, c)}>`
  )
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
    return reprt(n, newline, c) + s
  }

  if (n instanceof Ident) {
    return utf8.decodeToString(n.value.bytes)
  }

  if (n instanceof DotsType) {
    return '...' + (n.type ? repr1(n.type, newline, c) : 'auto')
  }

  if (n instanceof BadExpr) {
    return 'BAD'
  }

  const nl2 = newline + c.ind

  if (n instanceof Field) {
    let s = n.type ? repr1(n.type, nl2, c) : 'auto'
    if (n.ident) {
      s = '(' + repr1(n.ident, nl2, c) + ' ' + s + ')'
    }
    return s
  }

  if (n instanceof BlockStmt) {
    return (
      n.list.length ?
       '{' + reprv(n.list, newline, c, '') + newline + '}' :
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
    let s = reprv(n.params, nl2, c) + ' -> '
    if (n.result) {
      s += repr1(n.result, nl2, c)
    } else {
      s += 'auto'
    }
    return s
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


  // --------


  let s = '('
  if (n instanceof Expr) {
    s += reprt(n, newline, c)
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

  if (n instanceof ConstDecl || n instanceof VarDecl) {
    if (n instanceof VarDecl && n.group) {
      s += ' [#' + c.groupId(n.group) + ']'
    }
    if (n.type) {
      s += reprt(n, newline, c)
    }
    s += ' ' + reprv(n.idents, nl2, c)
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

  if (n instanceof SelectorExpr) {
    return (
      s + ' ' + repr1(n.lhs, newline, c) +
      ' . ' + repr1(n.rhs, newline, c) + ')'
    )
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
    s += reprv(n.exprs, nl2, c, '') + ')'
  }

  return '(?'+ n.constructor.name + ' ' + repr(n) + ')'
}
