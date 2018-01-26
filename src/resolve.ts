import { SrcFileSet, Pos, NoPos } from './pos'
import { TypeCompat, basicTypeCompat, Universe } from './universe'
import { ErrorCode, ErrorReporter, ErrorHandler } from './error'
import { debuglog } from './util'
import {
  Scope,
  Ident,

  Expr,
  RestExpr,
  FunExpr,
  LiteralExpr,
  TupleExpr,
  Block,
  SelectorExpr,
  TypeConvExpr,
  Assignment,
  CallExpr,
  Operation,
  ReturnExpr,
  IfExpr,
  
  Type,
  UnresolvedType,
  BasicType,
  StrType,
  RestType,
  TupleType,
  FunType,
  OptionalType,
  UnionType,

  u_t_void,
  u_t_nil,
  u_t_str,
  u_t_optstr,
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

  maybeResolveTupleType(pos :Pos, scope :Scope, exprs :Expr[]) :TupleType|null {
    const r = this
    let types :Type[] = []
    for (const x of exprs) {
      const t = r.resolve(x)
      if (!t) {
        return null
      }
      types.push(t)
    }
    return r.universe.internType(new TupleType(pos, scope, types)) as TupleType
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
        const tx = n.ent.getTypeExpr()
        return tx && r.maybeResolve(tx) || null
      }
      // else: unresolved -- unknown type
      return null
    }

    if (n instanceof Block) {
      // type of block is the type of the last statement, or in the case
      // of return, the type of the returned value.
      if (n.list.length == 0) {
        // empty block
        return u_t_void
      }
      let s = n.list[n.list.length-1]
      if (s instanceof Expr) {
        return r.resolve(s)
      }
      // last statement is a declaration
      debuglog(`TODO handle Block with declaration at end`)
      return u_t_void
    }

    if (n instanceof FunExpr) {
      const s = n.sig
      return r.universe.internType(new FunType(
        s.pos,
        s.scope,
        s.params.map(field => r.resolve(field.type)),
        r.resolve(s.result),
      ))
    }

    if (n instanceof TupleExpr) {
      return r.maybeResolveTupleType(n.pos, n.scope, n.exprs)
    }

    if (n instanceof RestExpr) {
      if (n.expr) {
        let t = r.resolve(n.expr)
        return r.universe.internType(new RestType(n.pos, n.scope, t))
      }
      return null
    }

    if (n instanceof CallExpr) {
      const funtype = r.resolve(n.fun)
      for (let arg of n.args) {
        r.resolve(arg)
      }
      if (funtype instanceof FunType) {
        return funtype.result
      }
      return null  // unknown
    }

    if (n instanceof Operation) {
      // type Operation {
      //   Expr
      //   op    :token
      //   x     :Expr
      //   y     :Expr? // nil means unary expression
      // }
      const xt = r.resolve(n.x)
      if (!n.y) {
        // unary, e.g. x++
        return xt
      } else {
        const yt = r.resolve(n.y)

        if (xt instanceof UnresolvedType || yt instanceof UnresolvedType) {
          // operation's effective type not yet know
          return null
        }

        if (xt.equals(yt)) {
          // both operands types are equivalent
          return xt
        }

        r.error(`invalid operation (mismatched types ${xt} and ${yt})`, n.pos)
      }
      return null
    }

    if (n instanceof Assignment) {
      if (n.lhs.length == 1) {
        // single assignment (common case)
        return r.resolve(n.lhs[0])
      }
      // multi-assignment yields tuple
      // E.g.
      //   a i32
      //   b f64
      //   t = a, b = 1, 2.3
      //   typeof(t)  // => (i32, f64)
      //
      return r.maybeResolveTupleType(n.pos, n.scope, n.lhs)
    }

    if (n instanceof ReturnExpr) {
      // return expressions always represents type of its results, if any
      return n.result ? r.resolve(n.result) : u_t_void
    }

    if (n instanceof IfExpr) {
      return r.maybeResolveIfExpr(n)
    }

    debuglog(`TODO handle ${n.constructor.name}`)
    return null  // unknown type
  }


  // joinOptional takes two types, one of them optional and the other not,
  // and considers them as two branches that are merging into one type, thus
  // this function returns an optional for t. The returned optional may be
  // incompatible with `opt`, or it might be t in the case of a union type.
  //
  joinOptional(pos :Pos, opt :OptionalType, t :Type) :Type {
    const r = this

    if (opt.type.equals(t)) {
      // return optional type since underlying type == t
      return opt
    }

    if (opt.type instanceof StrType && t instanceof StrType) {
      assert(opt.type.length != t.length,
        "str type matches but StrType.equals failed")
      // if the optional type is a string and the compile-time length
      // differs, return an optional string type with unknown length.
      return u_t_optstr
    }

    if (t instanceof UnionType) {
      let ut = new UnionType(new Set<Type>([opt]))
      for (let t1 of t.types) {
        if (!(t1 instanceof OptionalType)) {
          if (t1 instanceof BasicType) {
            this.error(`mixing optional and ${t1} type`, pos, 'E_CONV')
          } else {
            t1 = (
              t1 instanceof StrType ? u_t_optstr :
              r.universe.internType(new OptionalType(t1))
            )
          }
        }
        ut.add(t1)
      }
      return ut
    }

    if (t instanceof BasicType) {
      this.error(`mixing optional and ${t} type`, pos, 'E_CONV')
      return t
    }

    // t is different than opt -- return optional of t
    return (
      t instanceof StrType ? u_t_optstr :
      r.universe.internType(new OptionalType(t))
    )
  }


  mergeOptionalUnions(a :UnionType, b :UnionType) :UnionType {
    const r = this
    let ut = new UnionType(new Set<Type>())
    for (let t of a.types) {
      if (!(t instanceof OptionalType)) {
        t = (
          t instanceof StrType ? u_t_optstr :
          r.universe.internType(new OptionalType(t))
        )
      }
      ut.add(t)
    }
    for (let t of b.types) {
      if (!(t instanceof OptionalType)) {
        t = (
          t instanceof StrType ? u_t_optstr :
          r.universe.internType(new OptionalType(t))
        )
      }
      ut.add(t)
    }
    return r.universe.internType(ut)
  }


  mergeUnions(a :UnionType, b :UnionType) :UnionType {
    const r = this
    let ut = new UnionType(new Set<Type>())
    for (let t of a.types) {
      if (t instanceof OptionalType) {
        return r.mergeOptionalUnions(a, b)
      }
      ut.add(t)
    }
    for (let t of b.types) {
      if (t instanceof OptionalType) {
        return r.mergeOptionalUnions(a, b)
      }
      ut.add(t)
    }
    return r.universe.internType(ut)
  }


  makeOptionalUnionType2(l :OptionalType, r :OptionalType) :UnionType {
    return this.universe.internType(
      new UnionType(new Set<Type>([
        l.type instanceof StrType && l.type.length != -1 ? u_t_optstr : l,
        r.type instanceof StrType && r.type.length != -1 ? u_t_optstr : r,
      ]))
    )
  }

  makeUnionType2(l :Type, r :Type) :UnionType {
    return this.universe.internType(
      new UnionType(new Set<Type>([
        l instanceof StrType && l.length != -1 ? u_t_str : l,
        r instanceof StrType && r.length != -1 ? u_t_str : r,
      ]))
    )
  }


  maybeResolveIfExpr(n :IfExpr) :Type|null {
    const r = this

    // resolve "then" branch type
    let thentyp = r.resolve(n.then)

    if (!n.els_) {
      // e.g. `if x A => A`

      // with only a single then branch, the result type is that branch.
      // if the branch is not taken, the result is a zero-initialized T.

      // special case: if thentyp is a string constant, we must resolve to
      // just "str" (length only known at runtime) since if the branch is
      // not taken, a zero-initialized string is returned, which is zero.
      if (thentyp instanceof StrType && thentyp.length != 0) {
        return u_t_str
      }

      return thentyp
    }

    // resolve "else" branch type
    let eltyp = r.resolve(n.els_)
    
    if (eltyp.equals(thentyp)) {
      // e.g. `if x A else A => A`
      // e.g. `if x A? else A? => A?`
      return thentyp
    }

    if (eltyp === u_t_nil) {
      if (thentyp === u_t_nil) {
        // both branches are nil/void
        // e.g. `if x nil else nil => nil`
        return u_t_nil
      }
      // e.g. `if x A else nil => A?`
      if (thentyp instanceof BasicType) {
        // e.g. `if x int else nil`
        this.error(`mixing ${thentyp} and optional type`, n.pos, 'E_CONV')
      }
      // makes the type optional
      return (
        thentyp instanceof OptionalType ? thentyp :
        thentyp instanceof StrType ? u_t_optstr :
        r.universe.internType(new OptionalType(thentyp))
      )
    }

    if (thentyp === u_t_nil) {
      // e.g. `if x nil else A => A?`
      if (eltyp instanceof BasicType) {
        // e.g. `if x nil else int`
        this.error(`mixing optional and ${eltyp} type`, n.pos, 'E_CONV')
      }
      return (
        eltyp instanceof OptionalType ? eltyp :
        eltyp instanceof StrType ? u_t_optstr :
        r.universe.internType(new OptionalType(eltyp))
      )
    }

    if (eltyp instanceof OptionalType) {
      if (thentyp instanceof OptionalType) {
        // e.g. `if x A? else B? => A?|B?`
        //
        // Invariant: NOT eltyp.type.equals(thentyp.type)
        //   since we checked that already above with eltyp.equals(thentyp)
        //

        if (eltyp.type instanceof StrType &&
            thentyp.type instanceof StrType
        ) {
          // e.g. `a str?; b str?; if x a else b => str`
          assert(eltyp.type.length != thentyp.type.length,
            "str type matches but StrType.equals failed")
          return u_t_optstr
        }

        return r.makeOptionalUnionType2(thentyp, eltyp)
      }
      // e.g. `if x A else B? => A?|B?`
      // e.g. `if x A else A? => A?`
      // e.g. `if x A|B else A? => A?|B?`
      return r.joinOptional(n.pos, eltyp, thentyp)
    }

    if (thentyp instanceof OptionalType) {
      // e.g. `if x A? else B => A?|B?`
      // e.g. `if x A? else B|C => A?|B?|C?`
      return r.joinOptional(n.pos, thentyp, eltyp)
    }

    if (eltyp instanceof StrType && thentyp instanceof StrType) {
      // e.g. `if x "foo" else "x" => str`
      return u_t_str
    }

    if (eltyp instanceof UnionType) {
      if (thentyp instanceof OptionalType) {
        // e.g. `if x A? else B|C => A?|B?|C?`
        return r.joinOptional(n.pos, thentyp, eltyp)
      }
      if (thentyp instanceof UnionType) {
        // e.g. `if x A|B else A|C => A|B|C`
        // e.g. `if x A|B? else A|C => A?|B?|C?`
        return r.mergeUnions(thentyp, eltyp)
      }
      // else: e.g. `if x A else B|C => B|C|A`
      eltyp.add(thentyp)
      return eltyp
    }

    if (thentyp instanceof UnionType) {
      // e.g. `if x A|B else C => A|B|C`
      thentyp.add(eltyp)
      return thentyp
    }

    // e.g. `if x A else B => A|B`
    return r.makeUnionType2(thentyp, eltyp)
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
      t instanceof BasicType &&
      xt instanceof BasicType
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
