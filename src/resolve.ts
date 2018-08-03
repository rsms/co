import { SrcFileSet, Pos, NoPos } from './pos'
import { Universe } from './universe'
import { TypeCompat, basicTypeCompat } from './typecompat'
import { ErrorCode, ErrorReporter, ErrorHandler } from './error'
import { debuglog as dlog } from './util'
import { token } from './token'
import { Num, numEvalU32 } from './num'
import {
  ReturnStmt,

  Expr,
  Ident,
  // NumLit,
  // ParenExpr,
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
  IfExpr,
  IndexExpr,
  SliceExpr,
  
  Type,
  UnresolvedType,
  BasicType,
  // IntType,
  StrType,
  RestType,
  TupleType,
  FunType,
  OptionalType,
  UnionType,

  u_t_nil,
  u_t_bool,
  u_t_str,
  u_t_optstr,
} from './ast'



// type Evaluator = (op :token, x :EvalArg, y? :EvalArg) => EvalArg|null

// type EvalArg = LiteralExpr | EvalConst

// // EvalConst is a simple struct for holding evaluator results
// //
// class EvalConst {}
// class IntEvalConst extends EvalConst {
//   constructor(
//     public value :int,
//   ) { super() }
// }


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

  // error resports an error
  //
  error(msg :string, pos :Pos = NoPos, typ? :ErrorCode) {
    const r = this
    r.errorAt(msg, r.fset.position(pos), typ)
  }

  // syntaxError reports a syntax error.
  // Interface is compatible with that of Parser.syntaxError
  //
  syntaxError(msg :string, pos :Pos = NoPos) {
    this.error(msg, pos, 'E_SYNTAX')
  }


  getTupleType(types :Type[]) :TupleType {
    return this.universe.internType(new TupleType(types))
  }

  getRestType(t :Type) :RestType {
    return this.universe.internType(new RestType(t))
  }

  getOptionalUnionType2(l :OptionalType, r :OptionalType) :UnionType {
    return this.universe.internType(
      new UnionType(new Set<Type>([
        l.type instanceof StrType && l.type.length != -1 ? u_t_optstr : l,
        r.type instanceof StrType && r.type.length != -1 ? u_t_optstr : r,
      ]))
    )
  }

  getUnionType2(l :Type, r :Type) :UnionType {
    return this.universe.internType(
      new UnionType(new Set<Type>([
        l instanceof StrType && l.length != -1 ? u_t_str : l,
        r instanceof StrType && r.length != -1 ? u_t_str : r,
      ]))
    )
  }

  getFunType(inputs :Type[], result :Type) :FunType {
    return this.universe.internType(new FunType(inputs, result))
  }

  getOptionalType(t :Type) {
    return (
      t instanceof OptionalType ? t :
      t instanceof StrType ? u_t_optstr :
      this.universe.internType(new OptionalType(t))
    )
  }

  // resolve attempts to resolve or infer the type of n.
  // Returns UnresolvedType if the type refers to an undefined identifier.
  // May mutate n.type, and may call ErrorHandler for undefined fields.
  //
  resolve(n :Expr) :Type {
    if (n instanceof Type) {
      return n
    }

    if (n.type instanceof Type /*&& (n.type.constructor !== UnresolvedType)*/) {
      if (n.type instanceof UnresolvedType) {
        n.type.addRef(n)
      }
      return n.type
    }

    const r = this
    let t = r.maybeResolve(n)

    if (!t) {
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
  maybeResolve(n :Expr|ReturnStmt) :Type|null {
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

    // if (n instanceof ParenExpr) {
    //   return r.resolve(n.x)
    // }

    if (n instanceof Block) {
      // type of block is the type of the last statement, or in the case
      // of return, the type of the returned value.
      if (n.list.length == 0) {
        // empty block
        return u_t_nil //u_t_void
      }
      let s = n.list[n.list.length-1]
      if (s instanceof Expr) {
        return r.resolve(s)
      }
      // last statement is a declaration
      // dlog(`TODO handle Block with declaration at end`)
      return u_t_nil //u_t_void
    }

    if (n instanceof FunExpr) {
      const s = n.sig
      let t = r.getFunType(
        s.params.map(field => r.resolve(field.type)),
        r.resolve(s.result)
      )
      if (t.result instanceof UnresolvedType) {
        t.result.addRef(t)
      }
      return t
    }

    if (n instanceof TupleExpr) {
      return r.maybeResolveTupleType(n.exprs)
    }

    if (n instanceof RestExpr) {
      if (n.expr) {
        let t = r.resolve(n.expr)
        return r.getRestType(t)
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
      const xt = r.resolve(n.x)
      if (!n.y) {
        // unary
        return xt
      } else {
        const yt = r.resolve(n.y)

        if (n.op > token.cmpop_beg && n.op < token.cmpop_end) {
          // comparison operations always yield boolean values
          return u_t_bool
        }

        if (xt instanceof UnresolvedType || yt instanceof UnresolvedType) {
          // operation's effective type not yet know
          return null
        }

        if (xt === yt || xt.equals(yt)) {
          // both operands types are equivalent
          return xt
        }

        let x = r.convert(xt, n.y)
        if (x) {
          return x === n.y ? yt : r.resolve(x)
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
      return r.maybeResolveTupleType(n.lhs)
    }

    if (n instanceof ReturnStmt) {
      // return expressions always represents type of its results, if any
      return n.result ? r.resolve(n.result) : u_t_nil //u_t_void
    }

    if (n instanceof IfExpr) {
      return r.maybeResolveIfExpr(n)
    }

    if (n instanceof IndexExpr) {
      r.resolveIndex(n)
      return n.type
    }

    dlog(`TODO handle ${n.constructor.name}`)
    return null  // unknown type
  }


  maybeResolveTupleType(exprs :Expr[]) :TupleType|null {
    const r = this
    let types :Type[] = []
    for (const x of exprs) {
      // Note: We don't check for unresolved types
      //
      // TODO: when x is unresolved, register the tuple _type_ as a dependency
      // for that unresolved type, so that laste-bind can wire it up.
      //
      types.push(r.resolve(x))
    }
    return r.getTupleType(types)
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
            t1 = r.getOptionalType(t1)
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
    return r.getOptionalType(t)
  }


  mergeOptionalUnions(a :UnionType, b :UnionType) :UnionType {
    const r = this
    let ut = new UnionType(new Set<Type>())
    for (let t of a.types) {
      if (!(t instanceof OptionalType)) {
        t = r.getOptionalType(t)
      }
      ut.add(t)
    }
    for (let t of b.types) {
      if (!(t instanceof OptionalType)) {
        t = r.getOptionalType(t)
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
        r.error(`mixing ${thentyp} and optional type`, n.pos, 'E_CONV')
      }
      // makes the type optional
      return r.getOptionalType(thentyp)
    }

    if (thentyp === u_t_nil) {
      // e.g. `if x nil else A => A?`
      if (eltyp instanceof BasicType) {
        // e.g. `if x nil else int`
        r.error(`mixing optional and ${eltyp} type`, n.pos, 'E_CONV')
      }
      return r.getOptionalType(eltyp)
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

        return r.getOptionalUnionType2(thentyp, eltyp)
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
    return r.getUnionType2(thentyp, eltyp)
  }

  // resolveIndex attempts to resolve the type of an index expression.
  // returns x as a convenience.
  //
  resolveIndex(x :IndexExpr) :IndexExpr {
    const r = this

    // resolve operand type
    let opt = r.resolve(x.operand)

    if (opt instanceof UnresolvedType) {
      // defer to bind stage
      dlog(`[index type] deferred to bind stage`)
    } else if (opt instanceof TupleType) {
      r.tupleAccess(x)
    } else {
      dlog(`TODO [index type] operand is not a tuple; opt = ${opt}`)
    }

    return x
  }


  tupleSlice(x :SliceExpr) :bool {
    const p = this

    let tupletype = x.operand.type as TupleType
    assert(tupletype, 'unresolved operand type')
    assert(tupletype instanceof TupleType)
    assert(tupletype.types.length > 0, 'empty tuple')

    let tuplelen = tupletype.types.length
    let starti = 0
    let endi = tuplelen

    if (x.start) {
      starti = numEvalU32(x.start)
      if (starti < 0) {
        p.syntaxError(`invalid index into type ${tupletype}`, x.start.pos)
        return false
      }
      if (starti >= tuplelen) {
        p.outOfBoundsAccess(starti, tupletype, x.start.pos)
        return false
      }
    }

    if (x.end) {
      endi = numEvalU32(x.end)
      if (endi < 0) {
        p.syntaxError(`invalid index into type ${tupletype}`, x.end.pos)
        return false
      }
      if (endi >= tuplelen) {
        p.outOfBoundsAccess(endi, tupletype, x.end.pos)
        return false
      }
    }

    if (starti >= endi) {
      if (starti == endi) {
        p.syntaxError(`invalid empty slice: ${starti} == ${endi}`, x.pos)
      } else {
        p.syntaxError(`invalid slice index: ${starti} > ${endi}`, x.pos)
      }
      return false
    }

    let len = endi - starti

    if (len == 1) {
      p.syntaxError(
        `invalid single-element slice into type ${tupletype}`,
        x.pos,
        // `Instead of slicing a single element from a tuple, ` +
        // `access it directly with a subscript operation: ` +
        // `${x.operand}[${x.start || x.end}]`,
      )
      return false
    }

    x.startnum = starti
    x.endnum = endi

    if (len == tuplelen) {
      // e.g. `(1,2,3)[:] => (1,2,3)`
      x.type = tupletype
    } else {
      x.type = p.getTupleType(tupletype.types.slice(starti, endi))
    }

    return true
  }

  // tupleAccess attempts to evaluate a tuple access.
  // x.index must be constant.
  //
  tupleAccess(x :IndexExpr) :bool {
    const p = this

    let tupletype = x.operand.type as TupleType
    assert(tupletype, 'unresolved operand type')
    assert(tupletype instanceof TupleType)
    assert(tupletype.types.length > 0, 'empty tuple')

    let i = numEvalU32(x.index)

    if (i < 0) {
      if (i == -1) {
        p.outOfBoundsAccess(i, tupletype, x.index.pos)
      } else {
        p.syntaxError(`invalid index into type ${tupletype}`, x.index.pos)
      }
      return false
    }

    let memberTypes = tupletype.types
    if (i as int >= memberTypes.length) {
      p.outOfBoundsAccess(i, tupletype, x.index.pos)
      return false
    }

    x.indexnum = i
    x.type = memberTypes[i as int]

    return true
  }

  // outOfBoundsAccess reports an error for out-of-bounds access
  //
  outOfBoundsAccess(i :Num, t :Type, pos :Pos) {
    this.syntaxError(`out-of-bounds index ${i} on type ${t}`, pos)
  }


  // registerUnresolved registers expr as having an unresolved type.
  // Does NOT set expr.type but instead returns an UnresolvedType object.
  //
  markUnresolved(expr :Expr) :UnresolvedType {
    const t = new UnresolvedType(expr.pos, expr.scope, expr)
    dlog(`expr ${expr} at ${this.fset.position(expr.pos)}`)
    this.unresolved.add(t)
    return t
  }

  // isConstant returns true if the expression is a compile-time constant
  //
  isConstant(x :Expr) :bool {
    return (
      x instanceof LiteralExpr ||
      (x instanceof Ident && x.ent != null && x.ent.isConstant())
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
    const r = this
    const xt = r.resolve(x)

    if (xt === t || xt.equals(t)) {
      return x
    }

    if (
      r.isConstant(x) &&
      t instanceof BasicType &&
      xt instanceof BasicType
    ) {
      // expression with basic types
      switch (basicTypeCompat(t, xt)) { // TypeCompat
        case TypeCompat.NO: {
          // Note: caller should report error
          return null
        }
        case TypeCompat.LOSSY: {
          r.error(`constant ${x} truncated to ${t}`, x.pos, 'E_CONV')
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

    dlog(`TODO conversion of ${x} into type ${t}`)

    // TODO: figure out a scalable type conversion system
    // TODO: conversion of other types

    return null
  }
}
