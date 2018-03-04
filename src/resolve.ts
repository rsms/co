import { SrcFileSet, Pos, NoPos } from './pos'
import { TypeCompat, basicTypeCompat, Universe } from './universe'
import { ErrorCode, ErrorReporter, ErrorHandler } from './error'
import { debuglog, asciibuf } from './util'
import { token } from './token'
import {
  Scope,
  Ent,
  ReturnStmt,

  Expr,
  Ident,
  BasicLit,
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
  // SliceExpr,
  
  Type,
  UnresolvedType,
  BasicType,
  IntType,
  StrType,
  RestType,
  TupleType,
  FunType,
  OptionalType,
  UnionType,

  u_t_nil, // u_t_void,
  u_t_bool,
  u_t_str,
  u_t_optstr,
} from './ast'



type Evaluator = (op :token, x :EvalArg, y? :EvalArg) => EvalArg|null

type EvalArg = LiteralExpr | EvalConst

// EvalConst is a simple struct for holding evaluator results
//
class EvalConst {}
class IntEvalConst extends EvalConst {
  constructor(
    public value :int,
  ) { super() }
}


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

  // resolve attempts to resolve or infer the type of n.
  // Returns UnresolvedType if the type refers to an undefined identifier.
  // May mutate n.type, and may call ErrorHandler for undefined fields.
  //
  resolve(n :Expr) :Type {
    if (n instanceof Type) {
      return n
    }

    if (n.type instanceof Type /*&& (n.type.constructor !== UnresolvedType)*/) {
      return n.type
    }

    const r = this
    let t = r.maybeResolve(n)

    if (!t) {
      // if (n.type) {
      //   if (n.type instanceof UnresolvedType) {
      //     n.type.addRef(n)
      //   }
      //   return n.type
      // }

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
      // debuglog(`TODO handle Block with declaration at end`)
      return u_t_nil //u_t_void
    }

    if (n instanceof FunExpr) {
      const s = n.sig
      let t = r.universe.internType(new FunType(
        s.pos,
        s.scope,
        s.params.map(field => r.resolve(field.type)),
        r.resolve(s.result),
      ))
      if (t.result instanceof UnresolvedType) {
        t.result.addRef(t)
      }
      return t
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
      const xt = r.resolve(n.x)
      if (!n.y) {
        // unary, e.g. x++
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
      return r.maybeResolveTupleType(n.pos, n.scope, n.lhs)
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

    debuglog(`TODO handle ${n.constructor.name}`)
    return null  // unknown type
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
        r.error(`mixing ${thentyp} and optional type`, n.pos, 'E_CONV')
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
        r.error(`mixing optional and ${eltyp} type`, n.pos, 'E_CONV')
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


  // resolveIndex attempts to resolve the type of an index expression.
  // returns x as a convenience.
  //
  resolveIndex(x :IndexExpr) :IndexExpr {
    const r = this

    // resolve operand type
    let opt = r.resolve(x.operand)

    if (opt instanceof UnresolvedType) {
      // defer to bind stage
      debuglog(`[index type] deferred to bind stage`)
    } else if (opt instanceof TupleType) {
      r.resolveTupleIndex(x, opt)
    } else {
      debuglog(`TODO [index type] operand is not a tuple; opt = ${opt}`)
    }

    return x
  }

  // resolveTupleIndex attempts to resolve the type of an index expression
  // on a tuple.
  //
  resolveTupleIndex(x :IndexExpr, opt :TupleType) {
    const r = this

    let it = r.resolve(x.index)
    if (it instanceof UnresolvedType) {
      debuglog(`index resolution deferred to post-resolve`)
      x.type = r.markUnresolved(x)
      return
    }

    const ix = x.index

    // index must be constant for tuple access
    let index = r.resolveLitConstant(ix, intEvaluator)
    if (index == null) {
      // TODO: somehow track this and complete the check during bind
      r.syntaxError('non-constant tuple index', ix.pos)
      return
    }

    if (index instanceof EvalConst) {
      assert(index instanceof IntEvalConst, "there is not other kind")
      x.indexv = (index as IntEvalConst).value
    } else {
      let index2 = index as LiteralExpr
      assert(index2 instanceof LiteralExpr)
      // check type to make sure index is an integer
      if (
        index2.type && !(index2.type instanceof IntType) ||
        !(index2 instanceof BasicLit) ||
        !index2.isInt()
      ) {
        r.syntaxError(`invalid index type ${index2.type || index2}`, ix.pos)
        return
      }

      // parse the integer; returns -1 on failure
      // TODO: deal directly with int32 and Int64 values
      x.indexv = (
        typeof index2.value == 'number' ? index2.value :
        index2.value.toFloat64()
      )
      if (x.indexv == -1) {
        r.syntaxError(`invalid index ${index2}`, ix.pos)
        return
      }
    }

    if (x.indexv < 0 || x.indexv >= opt.types.length) {
      r.syntaxError(
        `out-of-bounds tuple index ${x.indexv} on type ${opt}`,
        ix.pos
      )
      return
    }

    // success -- type of IndexExpr found
    x.type = opt.types[x.indexv]

    // since we folded the constant, replace x.index if it's not already
    // a constant
    if (!(x.index instanceof BasicLit)) {
      // Note: Simply skip this branch to disable on-the-fly optimizations
      const bl = new BasicLit(
        x.index.pos,
        x.index.scope,
        token.INT,
        x.indexv
      )
      bl.type = r.universe.basicLitType(bl)
      x.index = bl
    }
  }


  // resolveLitConstant attempts to resolve the constant value of x, expected
  // to be a LiteralExpr. If x or anything x might refer to is not constant,
  // null is returned.
  //
  resolveLitConstant(x :Expr, evaluator :Evaluator) :EvalArg|null {
    const r = this

    if (x instanceof LiteralExpr) {
      return x
    }

    if (x instanceof Ident) {
      if (x.ent && x.ent.writes == 0 && x.ent.value) {
        // Note: we check `x.ent.writes == 0` to make sure that x is a constant
        // i.e. that there are no potential conditional branches that might
        // change the value of x.
        return r.resolveLitConstant(x.ent.value, evaluator)
      }
    } else if (x instanceof IndexExpr) {
      let opt = r.resolve(x.operand)

      if (opt instanceof TupleType) {
        let tuple :TupleExpr
        if (x.operand instanceof Ident) {
          assert(x.operand.ent != null) // should have been resolved
          const ent = x.operand.ent as Ent
          assert(ent.value instanceof TupleExpr)
          tuple = ent.value as TupleExpr
        } else {
          // TODO: handle selectors to fields
          assert(x.operand instanceof TupleExpr)
          tuple = x.operand as TupleExpr
        }

        if (x.indexv >= 0) {
          assert(x.indexv < tuple.exprs.length) // bounds checked when resolved
          return r.resolveLitConstant(tuple.exprs[x.indexv], evaluator)
        } else {
          debuglog(`x.indexv < 0 for IndexExpr ${x}`)
        }
      } else {
        debuglog(`TODO ${x.constructor.name} operand ${opt}`)
      }
    } else if (x instanceof Operation) {
      const lval = r.resolveLitConstant(x.x, evaluator)
      if (lval) {
        if (!x.y) {
          // unary operation
          return evaluator(x.op, lval)
        } else {
          const rval = r.resolveLitConstant(x.y, evaluator)
          if (rval) {
            // attempt evaluation
            return evaluator(x.op, lval, rval)
          }
        }
      }
    } else {
      debuglog(`TODO ${x.constructor.name}`)
    }

    return null
  }


  // registerUnresolved registers expr as having an unresolved type.
  // Does NOT set expr.type but instead returns an UnresolvedType object.
  //
  markUnresolved(expr :Expr) :UnresolvedType {
    const t = new UnresolvedType(expr.pos, expr.scope, expr)
    debuglog(`expr ${expr} as ${this.fset.position(expr.pos)}`)
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

    debuglog(`TODO conversion of ${x} into type ${t}`)

    // TODO: figure out a scalable type conversion system
    // TODO: conversion of other types

    return null
  }
}


// intEvaluator is an Evaluator that can perform operations on integers
//
function intEvaluator(op :token, x  :EvalArg, y? :EvalArg) :EvalArg|null {
  if (!(x instanceof BasicLit) || !x.isInt()) {
    return null
  }

  //
  // TODO: rewrite this to deal with Int64 values in x and y
  //

  // interpret x
  // const xs = x.isSignedInt()
  // let xv = xs ? x.parseSInt() : x.parseUInt()
  // // const xneg = x.op == token.SUB
  // if ((!xs && xv < 0) || isNaN(xv)) {
  //   return null
  // }
  const xv = typeof x.value == 'number' ? x.value : x.value.toFloat64()

  if (y) {
    // binary operation
    if (!(y instanceof BasicLit) || !y.isInt()) {
      return null
    }

    // interpret y
    // const ys = y.isSignedInt()
    // let yv = ys ? y.parseSInt() : y.parseUInt()
    // // const yneg = y.op == token.SUB
    // if ((!ys && yv < 0) || isNaN(yv)) {
    //   return null
    // }
    const yv = (
      typeof y.value == 'number' ? y.value :
      y.value.toFloat64()
    )

    switch (op) {
      case token.ADD: return new IntEvalConst(xv + yv)
      case token.SUB: return new IntEvalConst(xv - yv)
      case token.OR:  return new IntEvalConst(xv | yv)
      case token.XOR: return new IntEvalConst(xv ^ yv)
      case token.MUL: return new IntEvalConst(Math.round(xv * yv))
      case token.QUO: return new IntEvalConst(Math.round(xv / yv))
      case token.REM: return new IntEvalConst(xv % yv)
      case token.AND: return new IntEvalConst(xv & yv)
      default:
        debuglog(`TODO eval binary op (${token[op]} ${x} (${xv}) ${y})`)
    }

  } else {
    // unary operation
    switch (op) {
      case token.ADD: return new IntEvalConst(+xv)
      case token.SUB: return new IntEvalConst(-xv)
      case token.INC: return new IntEvalConst(xv + 1)
      case token.DEC: return new IntEvalConst(xv + 1)
      default:
        debuglog(`TODO eval unary op (${token[op]} ${x})`)
    }
  }

  return null  // error
}

