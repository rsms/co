//
// Produces a human-readable format of an AST, meant for debugging.
//
import * as utf8 from './utf8'
import {
  Node,
  Group,
  Name,
  QualName,
  BasicLit,
  StringLit,
  ImportDecl,
  ConstDecl,
  VarDecl,
  TypeDecl,
  SelectorExpr,
  Operation,
  ParenExpr,
  ListExpr,
} from './ast'
import { tokstr } from './token'


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
  return repr(n, '\n', ctx || globalCtx).trim()
}


function reprv(nv :Node[], newline :string, c :ReprCtx) :string {
  const nl2 = newline + c.ind
  return '(' + nv.map(n => repr(n, nl2, c)).join(' ') + ')'
}


function repr(n :Node, newline :string, c :ReprCtx) :string {

  if (n instanceof BasicLit) {
    let s = JSON.stringify(utf8.decodeToString(n.value))
    s = s.substr(1, s.length-2)
    return '(' + tokstr(n.tok) + ' ' + s + ')'
  }

  if (n instanceof StringLit) {
    return JSON.stringify(utf8.decodeToString(n.value))
  }

  if (n instanceof Name) {
    return utf8.decodeToString(n.value.bytes)
  }

  if (n instanceof QualName) {
    return utf8.decodeToString(n.value.bytes) + '.' + repr(n.next, newline, c)
  }

  let s = '(' + n.constructor.name
  const nl2 = newline + c.ind

  if (n instanceof ImportDecl) {
    s += ' path: ' + repr(n.path, nl2, c)
    if (n.localName) {
      s += newline +
        c.ind + 'localName: ' + repr(n.localName, nl2, c)
    }
    return s + ')'
  }

  if (n instanceof ConstDecl || n instanceof VarDecl) {
    if (n.group) {
      s += ' [#' + c.groupId(n.group) + ']'
    }
    s += newline
    if (n.type) {
      s += c.ind + 'type: ' + repr(n.type, nl2, c) + newline
    }
    s += c.ind +   'names: ' + reprv(n.names, nl2, c) + newline
    if (n.values) {
      s += c.ind + 'values: ' + repr(n.values, nl2, c) + newline
    }
    return s + ')'
  }

  if (n instanceof TypeDecl) {
    if (n.group) {
      s += ' [#' + c.groupId(n.group) + ']'
    }
    s += ' ' + repr(n.name, nl2, c)
    if (n.alias) {
      s += ' ='
    }
    return s + ' ' + repr(n.type, nl2, c) + ')'
  }

  if (n instanceof SelectorExpr) {
    s += newline +
      c.ind + 'expr: ' + repr(n.expr, nl2, c) + newline +
      c.ind + 'sel: ' + repr(n.sel, nl2, c) + newline
    return s + ')'
  }

  if (n instanceof Operation) {
    s += ' ' + tokstr(n.op) + newline +
      c.ind + repr(n.x, nl2, c) + newline
    if (n.y) {
      s += c.ind + repr(n.y, nl2, c) + newline
    }
    return s + ')'
  }

  if (n instanceof ParenExpr) {
    return s + ' ' + repr(n.x, nl2, c) + newline + ')'
  }

  if (n instanceof ListExpr) {
    return s + newline +
      c.ind + reprv(n.exprs, newline, c) + ')'
  }

  return s + ' ?)'
}
