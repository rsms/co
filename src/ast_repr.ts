//
// Produces a human-readable format of an AST, meant for debugging.
//
import * as utf8 from './utf8'
import { tokstr, token } from './token'
import { termColorSupport, style, noStyle } from './termstyle'
import {
  Package,
  File,
  Group,
  Node,

  Field,
  ReturnStmt,
  WhileStmt,
  ForStmt,
  BranchStmt,

  ImportDecl,
  VarDecl,
  TypeDecl,
  MultiDecl,

  Expr,
  Atom,
  Ident,
  NumLit,
  StringLit,
  FunExpr,
  FunSig,
  Block,
  IfExpr,
  Assignment,
  Operation,
  CallExpr,
  CollectionExpr,
  BadExpr,
  TypeExpr,
  BadTypeExpr,
  RestTypeExpr,
  SelectorExpr,
  IndexExpr,
  SliceExpr,
  TypeConvExpr,
} from './ast'

import {
  Type,
  t_nil,
  // BasicType,
  // FloatType,
  // IntType,
  // NumType,
  // SIntType,
  // UIntType,
  // FunType,
  // StrType,
  // UnresolvedType,
  // UnionType,
  // TupleType,
  // RestType,
} from './types'


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


const defaultCtx = new ReprCtx()


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
  if (n instanceof Package) {
    return reprpkg(n, ctx)
  } if (n instanceof File) {
    return reprfile(n, '\n', ctx)
  } else {
    return repr1(n, '\n', ctx).trim()
  }
}


function reprpkg(n :Package, c :ReprCtx) :string {
  let s = `(pkg "${n.name.replace(/"/g,'\\"')}"`
  if (n.files.length) {
    let nl = '\n  '
    for (let f of n.files) {
      s += nl + reprfile(f, nl, c)
    }
    s = s.trimRight() + '\n'
  }
  return s + ')'
}


function reprfile(n :File, nl :string, c :ReprCtx) :string {
  let s = `(file "${n.sfile.name.replace(/"/g,'\\"')}"`
  if (n.decls.length) {
    let nl2 = nl + '  '
    for (let d of n.decls) {
      s += nl2 + repr1(d, nl2, c)
    }
    s = s.trimRight() + nl
  }
  return s + ')'
}


// reprt formats a type
//
function reprt(t :Type|null, _newline :string, c :ReprCtx) :string {
  return c.style.blue(`<${t || 'nil'}>`)
}


function reprv(nv :Node[], newline :string, c :ReprCtx, delims :string='()') :string {
  return (
    (delims[0] || '') +
    nv.map(n => repr1(n, newline, c)).join(' ') +
    (delims[1] || '')
  )
}


// function subscriptnum(n :int) :string {
//   // ASCII 0-9 Unicode range: [U+0030 .. U+0039]
//   // superscript 0-9 Unicode range: [U+2070 .. U+2079]
//   // subscript 0-9 Unicode range: [U+2080 .. U+2089]
//   let s = n.toString(10)
//   let r = ''
//   let ss0 = 0x2080 - 0x30
//   for (let i = 0; i < s.length; ++i) {
//     let c = s.charCodeAt(i) + ss0
//     r += String.fromCharCode(c)
//   }
//   return r
// }


function reprid(id :Ident, _ :ReprCtx) :string {
  return (
    utf8.decodeToString(id.value.bytes)
    // + c.style.pink(subscriptnum(id.ver))
  )
}


function reprcons(n :Node, c :ReprCtx) :string {
  return c.style.grey(n.constructor.name)
}


function repr1(n :Node, newline :string, c :ReprCtx, flag :int = 0) :string {
  assert(n)

  if (n instanceof Atom) {
    return c.style.purple(c.style.bold(n.name))
  }

  if (n instanceof NumLit) {
    return reprt(n.type, newline, c) + c.style.green(n.value.toString())
  }

  if (n instanceof StringLit) {
    let s = JSON.stringify(utf8.decodeToString(n.value))
    return reprt(n.type, newline, c) + c.style.green(s)
  }

  if (n instanceof Ident) {
    return (c.typedepth ? '' : reprt(n.type, newline, c)) + reprid(n, c)
  }

  if (n instanceof RestTypeExpr) {
    return '...' + repr1(n.expr, newline, c)
  }

  if (n instanceof TypeExpr) {
    return `(type ${c.style.blue(`${n.type || "nil"}`)})`
    // return reprt(n.type, newline, c)
  }

  if (n instanceof BadExpr) {
    return 'BAD'
  }

  if (n instanceof BadTypeExpr) {
    return 'BAD_TYPE'
  }

  if (n instanceof Type) {
    return c.style.blue(n.toString())
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
        newline + '(' + reprt(n.type, newline, c) + 'block ' +
        n.list.map(n => nl2 + repr1(n, nl2, c).trim()).join('') +
        newline + ')' :
        '(block)'
    )
  }

  if (n instanceof ForStmt) {
    if (n instanceof WhileStmt) {
      //
      return (
        "(while " +
        (n.cond ? repr1(n.cond, nl2, c) + " " : "") +
        repr1(n.body, nl2, c) + newline + ')'
      )
    }
    return (
      "(for " +
      (n.init ? repr1(n.init, nl2, c) + " " : "() ") +
      (n.cond ? repr1(n.cond, nl2, c) + " " : "() ") +
      (n.incr ? repr1(n.incr, nl2, c) + " " : "() ") +
      repr1(n.body, nl2, c) + newline + ")"
    )
  }

  if (n instanceof BranchStmt) {
    return (
      `(${tokstr(n.tok)}` +
      (n.label ? " " + repr1(n.label, nl2, c) : "") +
      ")"
    )
  }

  if (n instanceof ReturnStmt) {
    if (n.result) {
      return newline + `(return ${repr1(n.result, nl2, c)})`
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
    const restype = n.result ? n.result.type : t_nil
    return reprv(n.params, nl2, c) + ' -> ' + reprt(restype, nl2, c)
  }

  if (n instanceof Assignment) {
    let s = newline + "(assign "
    if (n.lhs.length > 1) { s += "(" }
    for (let i = 0; i < n.lhs.length; i++) {
      let n2 = n.lhs[i]
      s += repr1(n.lhs[i], nl2, c)
      if (n.decls[i]) {
        s += "*"
      }
      if (i < n.lhs.length-1) {
        s += " "
      }
    }
    if (n.lhs.length > 1) { s += ")" }

    //   s += repr1(n.lhs[0], nl2, c)
    // } else {
    //   s += reprv(n.lhs, nl2, c)
    // }
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

  if (n instanceof Operation) {
    let ts = c.typedepth ? '' : reprt(n.type, newline, c)
    let s = '(' + ts + c.style.orange(token[n.op]) + ' ' + repr1(n.x, nl2, c)
    if (n.y) {
      s += ' ' + repr1(n.y, nl2, c)
    }
    return s + ')'
  }


  // --------

  let s = '('
  if (n instanceof Expr && !c.typedepth) {
    s += reprt(n.type, newline, c)
  }


  if (n instanceof FunExpr) {
    s += 'fun '
    if (n.isInit) {
      s += 'init '
    } else if (n.name) {
      s += reprid(n.name, c) + ' '
    }
    s += repr1(n.sig, newline, c)
    if (n.body) {
      s += ' ' + repr1(n.body, nl2, c)
    }
    return s + ')'
  }

  if (n instanceof CallExpr) {
    s += 'call ' + repr1(n.receiver, newline, c) + ' ('
    s += reprv(n.args, nl2, c, '')
    if (n.hasRest) {
      s += '...'
    }
    return s + '))'
  }

  if (n instanceof VarDecl) {
    s += "var "
    // if (n.group) {
    //   s += '[#' + c.groupId(n.group) + '] '
    // }
    if (n.idents.length == 1) {
      s += reprt(n.idents[0].type, newline, c) + reprid(n.idents[0], c)
    } else {
      s += '(' + n.idents.map(id =>
        reprt(id.type, newline, c) + reprid(id, c)
      ).join(' ') + ')'
    }
    // if (n.type) {
    //   s += reprt(n.type.type, newline, c) + ' ' + reprv(n.idents, nl2, c)
    // } else {
    //   s += ' (' + n.idents.map(id =>
    //     reprt(id.type, newline, c) + reprid(id, c)
    //   ).join(' ') + ')'
    // }
    if (n.values) {
      s += ' ' + reprv(n.values, nl2, c)
    }
    return s + ')'
  }

  // --------

  s += reprcons(n, c)

  if (n instanceof ImportDecl) {
    s += ' path: ' + repr1(n.path, nl2, c)
    if (n.localIdent) {
      s += newline +
        c.ind + 'localIdent: ' + repr1(n.localIdent, nl2, c)
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

  // if (n instanceof ParenExpr) {
  //   return s + ' ' + repr1(n.x, newline, c) + ')'
  // }

  if (n instanceof TypeConvExpr) {
    return s + ' ' + repr1(n.expr, newline, c) + ')'
  }

  if (n instanceof CollectionExpr) {
    return s + ' ' + reprv(n.entries, nl2, c, '') + ')'
  }

  // if (n.constructor === NoOpStmt) {
  //   return 'noop'
  // }

  return '(???'+ reprcons(n, c) + ' ' + repr(n) + ')'
}
