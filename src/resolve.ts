import { SrcFileSet, Pos, NoPos } from './pos'
import { u_t_auto, TypeCompat, basicTypeCompat, Universe } from './universe'
import { ErrorCode, ErrorReporter, ErrorHandler } from './error'
import { debuglog } from './util'
import {
  Ident,
  RestExpr,
  FunDecl,
  Expr,
  LiteralExpr,
  TupleExpr,
  SelectorExpr,
  TypeConvExpr,
  CallExpr,
  Type,
  IntrinsicType,
  UnresolvedType,
  RestType,
  TupleType,
  FunType,
} from './ast'


export class TypeResolver extends ErrorReporter {
  fset       :SrcFileSet
  universe   :Universe
  unresolved :Set<UnresolvedType>

  constructor() {
    super('E_RESOLVE')
  }

  init(fset :SrcFileSet, universe :Universe, errh :ErrorHandler|null) {
    // note: normally initialized per package (not per file)
    const r = this
    r.errh = errh
    r.fset = fset
    r.universe = universe
    r.unresolved = new Set<UnresolvedType>()
  }

  error(msg :string, pos :Pos = NoPos, typ? :ErrorCode) {
    const r = this
    r.errorAt(msg, r.fset.position(pos), typ)
  }

  // resolve attempts to resolve or infer the type of n.
  // Returns UnresolvedType if the type refers to an undefined identifier.
  // May mutate n.type, and may call ErrorHandler for undefined fields.
  //
  resolve(n :Expr) :Type {
    if (n instanceof Type) {
      return n
    }

    if (n.type instanceof Type && n.type.constructor !== UnresolvedType) {
      return n.type
    }

    const r = this
    let t = r.maybeResolve(n)

    if (!t) {
      if (n.type) {
        return n.type
      }

      t = r.markUnresolved(n)

      // error failing to resolve field of known type
      if (
        n instanceof SelectorExpr &&
        n.lhs instanceof Ident &&
        n.lhs.ent
      ) {
        // Partially resolved selector, e.g.
        // "a.B undefined (type <typeof(a)> has no field or method B)"
        r.error(`${n} undefined`, n.pos)
      }
    }

    n.type = t

    return t
  }

  // maybeResolve attempts to resolve or infer the type of n.
  // Returns null if the type can't be resolved or inferred.
  // May mutate n.type and may call ErrorHandler.
  //
  maybeResolve(n :Expr) :Type|null {
    const r = this

    if (n instanceof Type) {
      return n
    }

    if (n.type && n.type.constructor !== UnresolvedType) {
      return r.resolve(n.type)
    }

    if (n instanceof Ident) {
      if (n.ent) {
        if (n.ent.value) {
          return r.maybeResolve(n.ent.value)
        }
        if (n.ent.decl instanceof Expr) {
          return r.maybeResolve(n.ent.decl)
        }
      }
      // else: unresolved -- unknown type
      return null
    }

    if (n instanceof FunDecl) {
      const s = n.sig
      return r.universe.internType(new FunType(
        s.pos,
        s.scope,
        s.params.map(field => r.resolve(field.type)),
        r.resolve(s.result),
      ))
    }

    if (n instanceof TupleExpr) {
      let types :Type[] = []
      for (const x1 of n.exprs) {
        const t = r.resolve(x1)
        if (!t) {
          return null
        }
        types.push(t)
      }
      return r.universe.internType(new TupleType(n.pos, n.scope, types))
    }

    if (n instanceof RestExpr) {
      let t = n.expr && r.resolve(n.expr) || u_t_auto
      return r.universe.internType(new RestType(n.pos, n.scope, t))
    }

    if (n instanceof CallExpr) {
      const funtype = r.resolve(n.fun)
      for (let arg of n.args) {
        r.resolve(arg)
      }
      if (funtype instanceof FunType) {
        return funtype.output
      }
      return null  // unknown
    }

    debuglog(`TODO handle ${n.constructor.name}`)
    return null  // unknown type
  }

  // registerUnresolved registers expr as having an unresolved type.
  // Does NOT set expr.type but instead returns an UnresolvedType object.
  //
  markUnresolved(expr :Expr) :UnresolvedType {
    const t = new UnresolvedType(expr.pos, expr.scope, expr)
    debuglog(`expr ${expr}`)
    this.unresolved.add(t)
    return t
  }

  // isConstant returns true if the expression is a compile-time constant
  //
  isConstant(x :Expr) :bool {
    return (
      x instanceof LiteralExpr ||
      (x instanceof Ident && x.ent != null && x.ent.isConstant)
    )
    // TODO: expand
  }

  // convertType attempts to convert expression x to type t.
  // If x is already of type t, x is returned unchanged.
  // If conversion is needed, a TypeConvExpr is returned,
  // encapsulating x.
  // If conversion is impossible, null is returned to indicate error.
  //
  convert(t :Type, x :Expr) :Expr|null {
    const xt = this.resolve(x)

    if (xt.equals(t)) {
      return x
    }

    if (
      this.isConstant(x) &&
      t instanceof IntrinsicType &&
      xt instanceof IntrinsicType
    ) {
      // constant expression with basic types
      switch (basicTypeCompat(t, xt)) { // TypeCompat
        case TypeCompat.NO: break
        case TypeCompat.LOSSY: {
          this.error(`constant ${x} truncated to ${t}`, x.pos, 'E_CONV')
          // TODO: ^ use diag instead with DiagKind.ERROR as the default, so
          // that user code can override this error into a warning instead, as
          // it's still valid to perform a lossy conversion.
          return new TypeConvExpr(x.pos, x.scope, x, t)
        }
        case TypeCompat.LOSSLESS: {
          return new TypeConvExpr(x.pos, x.scope, x, t)
        }
      }
    }

    // TODO: figure out a scalable type conversion system
    // TODO: conversion of other types

    return null
  }

}
