import { SrcFileSet, Pos, NoPos } from './pos'
import { Universe } from './universe'
import { TypeCompat, basicTypeCompat } from './typecompat'
import { ErrorCode, ErrorReporter, ErrorHandler } from './error'
import { debuglog as dlog } from './util'
import { token } from './token'
import { Num } from './num'
import { numEvalU32 } from './numeval'
import { PathMap } from './pathmap'
import * as ast from './ast'
import {
  ReturnStmt,
  Expr,
  Ident,
  NumLit,
  LiteralExpr,
  SelectorExpr,
  TypeConvExpr,
  IndexExpr,
  SliceExpr,
} from './ast'

import {
  Type,

  UnresolvedType,
  BasicType,
  NumType,
  StrType,
  RestType,
  ListType,
  TupleType,
  FunType,
  TypeType,
  OptionalType,
  UnionType,
  GenericType,
  GenericTypeInstance,

  t_f32,
  t_nil, t_bool,
  t_str0, t_str, t_stropt,
} from './types'


function isResolvedType(t :Type|null) :t is Type {
  return t ? t.constructor !== UnresolvedType : false
}


// Type resolver is a reusable resource for resolving types from AST.
// It is allocated on a per-package basis.
//
export class TypeResolver extends ErrorReporter {
  fset       :SrcFileSet
  universe   :Universe
  unresolved :Set<UnresolvedType>

  genericInstanceCache = new PathMap<Type,GenericTypeInstance>()
    // maintains a collection of generic type instances

  constructor() {
    super('E_RESOLVE')
    this.setupResolvers()
  }

  getGenericInstance(t :GenericType, types :Type[]) :GenericTypeInstance {
    const r = this
    assert(t.rest || types.length == t.vars.length)
    let path = [t, ...types]
    let ti = r.genericInstanceCache.get(path)
    if (ti) {
      return ti
    }
    // cache miss
    ti = t.newInstance(types)
    r.genericInstanceCache.set(path, ti)
    return ti
  }

  init(fset :SrcFileSet, universe :Universe, errh :ErrorHandler|null) {
    // note: normally initialized per package (not per file)
    const r = this
    r.errh = errh
    r.fset = fset
    r.universe = universe
    r.unresolved = new Set<UnresolvedType>()
    r.genericInstanceCache.clear()
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
        l.type instanceof StrType && l.type.length != -1 ? t_stropt : l,
        r.type instanceof StrType && r.type.length != -1 ? t_stropt : r,
      ]))
    )
  }

  getUnionType2(l :Type, r :Type) :UnionType {
    return this.universe.internType(
      new UnionType(new Set<Type>([
        l instanceof StrType && l.length != -1 ? t_str : l,
        r instanceof StrType && r.length != -1 ? t_str : r,
      ]))
    )
  }

  getFunType(args :Type[], result :Type) :FunType {
    return this.universe.internType(new FunType(args, result))
  }

  getOptionalType(t :Type) {
    return (
      t instanceof OptionalType ? t :
      t instanceof StrType ? t_stropt :
      this.universe.internType(new OptionalType(t))
    )
  }

  getStrType(length :int) :StrType {
    return (
      length < 0 ? t_str :
      length == 0 ? t_str0 :
      this.universe.internType(new StrType(length))
    )
  }

  // resolve attempts to resolve or infer the type of n.
  // Returns UnresolvedType if the type refers to an undefined identifier.
  //
  // This function may mutate n.type, and may call ErrorHandler for undefined
  // fields.
  //
  resolve(n :Expr) :Type {
    if (n.type instanceof Type /*&& (n.type.constructor !== UnresolvedType)*/) {
      if (n.type instanceof UnresolvedType && n !== n.type.def) {
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
        // "a.b undefined (type <typeof(a)> has no field or function b)"
        r.error(`${n} undefined`, n.pos)
      }
      n.type = t
    }

    return t
  }


  // maybeResolve attempts to resolve or infer the type of n.
  // Returns null if the type can't be resolved or inferred.
  // May mutate n.type and may call ErrorHandler.
  //
  maybeResolve(n :Expr|ReturnStmt) :Type|null {
    const r = this

    if (isResolvedType(n.type)) {
      // already resolved
      return n.type
    }

    // map node type to resolver function
    const resolver = r.resolvers.get(n.constructor)
    if (resolver) {
      return n.type = resolver(n)
    }

    dlog(`TODO handle ${n.constructor.name}`)
    return null  // unknown type
  }


  resolvers = new Map<Function,(n:any)=>Type|null>()

  // setupResolvers defines all resolvers.
  // Called by constructor
  //
  setupResolvers() {
    const r = this

    // nodes which has a TypeExpr "type" field
    r.resolvers.set(ast.Field,    r.maybeResolveNodeWithTypeExpr)
    r.resolvers.set(ast.VarDecl,  r.maybeResolveNodeWithTypeExpr)
    r.resolvers.set(ast.TypeDecl, r.maybeResolveNodeWithTypeExpr)

    r.resolvers.set(ast.Ident, r.maybeResolveIdent)
    r.resolvers.set(ast.Block, r.maybeResolveBlock)
    r.resolvers.set(ast.FunExpr, r.maybeResolveFunExpr)
    r.resolvers.set(ast.TupleExpr, r.maybeResolveTupleExpr)
    r.resolvers.set(ast.RestTypeExpr, r.maybeResolveRestTypeExpr)
    r.resolvers.set(ast.CallExpr, r.maybeResolveCallExpr)
    r.resolvers.set(ast.Assignment, r.maybeResolveAssignment)
    r.resolvers.set(ast.Operation, r.maybeResolveOperation)
    r.resolvers.set(ast.IndexExpr, r.maybeResolveIndexExpr)
    r.resolvers.set(ast.IfExpr, r.maybeResolveIfExpr)

    r.resolvers.set(ast.BadExpr, r.neverResolve)

    // r.resolvers.set(ast.ReturnStmt, r.maybeResolveReturnStmt)
  }


  // maybeResolveReturnStmt = (n :ast.ReturnStmt) => {
  //   // return expressions always represents type of its results, if any
  //   const r = this
  //   return n.result ? r.resolve(n.result) : t_nil
  // }


  neverResolve = (n :ast.Expr) => {
    return null
  }


  maybeResolveNodeWithTypeExpr = (n :ast.Field|ast.VarDecl|ast.TypeDecl) => {
    // nodes which has a TypeExpr "type" field
    return n.type ? n.type.type : null
  }


  maybeResolveIdent = (n :ast.Ident) => {
    const r = this
    if (n.ent) {
      if (isResolvedType(n.ent.type)) {
        return n.ent.type
      }
      const tx = n.ent.getTypeExpr()
      if (tx) {
        return r.maybeResolve(tx)
      }
    }
    return null
  }


  maybeResolveBlock = (n :ast.Block) => {
    const r = this
    // type of block is the type of the last statement, or in the case
    // of return, the type of the returned value.
    if (n.list.length == 0) {
      // empty block
      return t_nil
    }
    let s = n.list[n.list.length-1]
    if (s instanceof Expr) {
      return r.resolve(s)
    }
    // last statement is a declaration
    // dlog(`TODO handle Block with declaration at end`)
    return t_nil
  }


  maybeResolveFunExpr = (n :ast.FunExpr) => {
    const r = this

    const s = n.sig
    let restype :Type = t_nil
    if (s.result) {
      restype = r.resolve(s.result)
    } else {
      // automatic result type
      if (n.body) {
        restype = r.resolve(n.body)
      } // else: leave restype as t_nil
    }

    let argtypes = s.params.map(field => r.resolve(field.type))
    let t = r.getFunType(argtypes, restype)

    if (t.result instanceof UnresolvedType) {
      t.result.addRef(t)
    }
    return t
  }


  maybeResolveTupleExpr = (n :ast.TupleExpr) => {
    return this.maybeResolveTupleType(n.entries)
  }

  maybeResolveTupleType(entries :Expr[]) {
    const r = this
    let types :Type[] = []
    for (const x of entries) {
      // Note: We don't check for unresolved types
      //
      // TODO: when x is unresolved, register the tuple _type_ as a dependency
      // for that unresolved type, so that laste-bind can wire it up.
      //
      types.push(r.resolve(x))
    }
    return r.getTupleType(types)
  }


  maybeResolveRestTypeExpr = (n :ast.RestTypeExpr) => {
    const r = this
    let t = r.maybeResolve(n.expr)
    return isResolvedType(t) ? r.getRestType(t) : t
  }


  maybeResolveCallExpr = (n :ast.CallExpr) => {
    const r = this
    const funtype = r.resolve(n.receiver)

    if (!isResolvedType(funtype)) {
      // unresolved
      return funtype
    }

    if (funtype instanceof TypeType) {
      // call is a type call
      dlog(`TODO type call on ${funtype.type}`)
      return funtype.type
    }

    if (!(funtype instanceof FunType)) {
      // call is a type call
      dlog(`TODO type call on ${funtype}`)
      return funtype
    }

    // unless TypeType, the only possible type is FunType
    // assert(funtype instanceof FunType, `unexpected funtype ${funtype} (${funtype.constructor.name})`)
    let wantArgs = (funtype as FunType).args

    // resolve and verify arguments
    let argcount = n.args.length // wantArgs.length
    let wantLast = wantArgs[wantArgs.length - 1]
    let wantRest = wantLast instanceof RestType ? wantLast.types[0] : null
    let argdelta = argcount - wantArgs.length

    dlog({ wantRest: `${wantRest}`, hasRest: n.hasRest, argdelta })

    if (argdelta < 0 && (argdelta < -1 || !wantRest || n.hasRest)) {
      r.syntaxError(
        `not enough arguments in call to ${n.receiver}\n` +
        `  got  (${n.args.map(a => a.type).join(", ")})\n` +
        `  want (${wantArgs.join(", ")})`,
        n.pos
      )
    } else if (argdelta > 0 && (!wantRest || n.hasRest)) {
      r.syntaxError(
        `too many arguments in call to ${n.receiver}\n` +
        `  got  (${n.args.map(a => a.type).join(", ")})\n` +
        `  want (${wantArgs.join(", ")})`,
        n.pos
      )
    }

    // want (A, B, ...C)
    //
    // ok:
    // got  (A, B, ...C)  =>  (A, B, [*]C)
    // got  (A, B, C, C)  =>  (A, B, [2]C)
    // got  (A, B, []C)   =>  (A, B, [*]C)
    // got  (A, B, C)     =>  (A, B, [1]C)
    // got  (A, B)        =>  (A, B, [0]C)
    //
    // error:
    // got  (A) Not enough arguments
    // got  (A) Invalid type

    const convarg = (x :Expr, t :Type) :Expr => {
      if (x.type !== t) {
        let x2 = r.convert(t, x)
        if (x2) {
          return x2
        }
        r.error(
          x.isIdent ?
            `passing ${x} (type ${x.type}) as argument where ${t} is expected` :
            `passing ${x.type} as argument where ${t} is expected`,
          x.pos
        )
      }
      return x
    }

    let i = 0

    // endPosArgs denotes the end of regular postional args
    let endPosArgs = wantRest ? wantArgs.length-2 : wantArgs.length-1

    while (i <= endPosArgs) {
      let want = wantArgs[i]
      let x = n.args[i]
      let t = r.maybeResolve(x)

      if (!t) {
        return null  // at least one argument is unresolved
      }
      // dlog(`arg #${i} want ${want} got ${x} (${t})`)

      // convert type of value if needed
      n.args[i] = convarg(x, want)

      i++
    }

    // parse rest
    if (wantRest) {
      if (n.hasRest) {
        // rest forwarding or spread of array
        assert(argcount - i == 1, `more than one arg remaining (rest -> rest)`)
        let x = n.args[i]
        let t = r.maybeResolve(x)
        if (!t) {
          return null // unresolved
        }
        // TODO: check for collection type and convert to rest.
        // e.g.
        //    a int[] = [3, 4, 5]
        //    foo(a...)
        //
        if (
          !(x.type instanceof ListType) ||
          x.type.types[0] !== wantRest
        ) {
          // dlog({type0: (x.type as any).types[0], type1: wantRest})
          r.error(
            `passing ${x.type} as argument where ${wantRest} is expected`,
            x.pos
          )
        }
        // ok. done
      } else {
        // synthetic rest
        dlog(`parsing synthetic rest`)
        let rest :Expr[] = []
        for (; i < argcount; i++) {
          let x = n.args[i]
          let t = r.maybeResolve(x)
          if (!t) {
            return null  // unresolved
          }
          dlog(`rest arg #${i} want ${wantRest} got ${x} (${t})`)
          x = convarg(x, wantRest)
          rest.push(x)
        }
        if (rest.length == 0) {
          // nil denotes empty rest
          n.args.push(ast.builtInValues.nil)
        }
      }
    }

    return (funtype as FunType).result
  }


  maybeResolveAssignment = (n :ast.Assignment) => {
    const r = this
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


  maybeResolveOperation = (n :ast.Operation) => {
    const r = this
    const xt = r.resolve(n.x)
    if (!n.y) {
      // unary
      return xt
    } else {
      const yt = r.resolve(n.y)

      if (n.op > token.cmpop_beg && n.op < token.cmpop_end) {
        // Comparison operations always yield boolean values.
        if (n.op == token.ANDAND || n.op == token.OROR) {
          // Make sure operands are booleans -- convert as needed.
          if (xt !== t_bool) {
            n.x = new TypeConvExpr(n.x.pos, n.x.scope, n.x, t_bool)
          }
          if (yt !== t_bool) {
            n.y = new TypeConvExpr(n.y.pos, n.y.scope, n.y, t_bool)
          }
        }
        return t_bool
      }

      if (xt instanceof UnresolvedType || yt instanceof UnresolvedType) {
        // operation's effective type not yet know
        return null
      }

      if (xt === yt || xt.equals(yt)) {
        // both operands types are equivalent
        return xt
      }

      // operator that needs same-type operands
      if (n.op == token.ADD ||
          n.op == token.SUB ||
          n.op == token.MUL ||
          n.op == token.QUO
      ) {
        if (xt.isFloat && !yt.isFloat) {
          let cx = r.convert(xt, n.y)
          if (cx) {
            n.y = cx
            return xt
          }
        } else if (!xt.isFloat && yt.isFloat) {
          let cx = r.convert(yt, n.x)
          if (cx) {
            n.x = cx
            return yt
          }
        } else if (xt.size >= yt.size) {
          let cx = r.convert(xt, n.y)
          if (cx) {
            n.y = cx
            return xt
          }
        } else {
          let cx = r.convert(yt, n.x)
          if (cx) {
            n.x = cx
            return yt
          }
        }
      }

      // try converting RHS operand to same type as LHS operand
      let x = r.convert(xt, n.y)
      if (x) {
        return x === n.y ? yt : r.resolve(x)
      }

      r.error(`invalid operation (mismatched types ${xt} and ${yt})`, n.pos)
    }
    return null
  }


  // resolveIndex attempts to resolve the type of an index expression.
  //
  maybeResolveIndexExpr = (n :ast.IndexExpr) => {
    const r = this

    // resolve operand type
    let opt = r.resolve(n.operand)

    if (opt instanceof UnresolvedType) {
      // defer to bind stage
      dlog(`[index type] deferred to bind stage`)
    } else if (opt instanceof TupleType) {
      r.maybeResolveTupleAccess(n)
    } else {
      dlog(`[index type] operand is not a tuple; opt = ${opt}`)
    }

    return n.type
  }


  maybeResolveIfExpr = (n :ast.IfExpr) => {
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
        return t_str
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

    if (eltyp === t_nil) {
      if (thentyp === t_nil) {
        // both branches are nil/void
        // e.g. `if x nil else nil => nil`
        return t_nil
      }
      // e.g. `if x A else nil => A?`
      if (thentyp instanceof BasicType) {
        // e.g. `if x int else nil`
        r.error(`mixing ${thentyp} and optional type`, n.pos, 'E_CONV')
      }
      // makes the type optional
      return r.getOptionalType(thentyp)
    }

    if (thentyp === t_nil) {
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
          return t_stropt
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
      return t_str
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
      return t_stropt
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
      r.maybeResolveTupleAccess(x)
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

  // maybeResolveTupleAccess attempts to evaluate a tuple access.
  // x.index must be constant.
  // Return true if resolution succeeded.
  //
  maybeResolveTupleAccess(x :IndexExpr) :bool {
    const p = this

    let tupletype = (x.operand.type as Type).canonicalType() as TupleType
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
    const t = new UnresolvedType(expr)
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


  // getLiteralExpr returns the literal expression for x, resolving
  // constant idenfifiers as needed.
  // Returns null if there's no literal expression at the end of x.
  //
  getLiteralExpr(x :Expr) :LiteralExpr|null {
    if (x instanceof LiteralExpr) {
      return x
    }
    let id :Expr|null = x
    while (id instanceof ast.Ident && id.ent && id.ent.isConstant()) {
      id = id.ent.value
      if (id instanceof LiteralExpr) {
        return id
      }
    }
    return null
  }


  // convertType attempts to convert expression x to type t.
  // If x is already of type t, x is returned unchanged.
  // If conversion is needed, a TypeConvExpr is returned,
  // encapsulating x.
  // If conversion is impossible, null is returned to indicate error.
  //
  convert(t :Type, x :Expr) :Expr|null {
    return this._convert(t, x, /*losslessOnly=*/false)
  }


  // convertLossless does the same thing as convert but returns null if the
  // conversion would be lossy.
  //
  convertLossless(t :Type, x :Expr) :Expr|null {
    return this._convert(t, x, /*losslessOnly=*/true)
  }


  _convert(t :Type, x :Expr, losslessOnly :bool) :Expr|null {
    const r = this
    const xt = r.resolve(x)

    if (xt === t || xt.equals(t)) {
      // no conversion needed; already same type
      return x
    }

    if (t instanceof BasicType && xt instanceof BasicType) {
      return r.convertBasic(t, x, losslessOnly)
    }

    dlog(`TODO conversion of ${x} into type ${t}`)

    // TODO: figure out a scalable type conversion system
    // TODO: conversion of other types

    return null
  }


  convertBasic(t :BasicType, x :Expr, losslessOnly :bool) :Expr|null {
    const r = this

    // literal
    let litx = r.getLiteralExpr(x)
    if (litx instanceof ast.NumLit) {
      let x2 = r.convertNumLit(t, litx, losslessOnly)
      if (x2) {
        return x2
      }
    }

    assert(x.type instanceof BasicType)

    switch (basicTypeCompat(t, x.type as BasicType)) { // TypeCompat

      case TypeCompat.NO: {
        return null  // Caller should report error
      }

      case TypeCompat.LOSSY: {
        if (losslessOnly) {
          return null  // Caller should report error
        }
        r.error(
          x.isIdent ?
            `${x} (type ${x.type}) converted to ${t}` :
            `${x.type} converted to ${t}`,
          x.pos,
          'E_CONV'
        )
        // TODO: ^ use diag instead with DiagKind.ERROR as the default, so
        // that user code can override this error into a warning instead, as
        // it's still valid to perform a lossy conversion.
        return new TypeConvExpr(x.pos, x.scope, x, t)
      }

      case TypeCompat.LOSSLESS: {
        // complex conversion
        return new TypeConvExpr(x.pos, x.scope, x, t)
      }

    }
  }


  convertNumLit(t :NumType, x :NumLit, losslessOnly :bool) :NumLit|null {
    const r = this
    // Type hierarchy:
    //   BasicType
    //     NumType
    //       FloatType
    //       IntType
    //         SIntType
    //         UIntType
    //
    if (t.isFloat) {
      // attempt simple type rewrites for trivial conversions
      // e.g. 3.2 + 5 => (+ (f64 3.2) (i32 5)) => (+ (f64 3.2) (f64 5))
      if (x instanceof ast.FloatLit) {
        // float -> float
        if (t === t_f32 && x.value > 0xffffff) {
          if (losslessOnly) {
            return null  // Caller should report error
          }
          r.error(`constant ${x} truncated to ${t}`, x.pos, 'E_CONV')
        }
        x.type = t
        return x
      } else if (x instanceof ast.IntLit) {
        // int -> float
        // Note: IEEE-754 f32 has 24 significant bits, f64 has 53 bits.
        let f = typeof x.value == "number" ? x.value : x.value.toFloat64()
        if (f > (t_f32 ? 0xffffff : 0x1fffffffffffff)) {
          if (losslessOnly) {
            return null  // Caller should report error
          }
          r.error(`constant ${x} truncated to ${t}`, x.pos, 'E_CONV')
        }
        return new ast.FloatLit(x.pos, x.scope, f, t)
      } else if (x instanceof ast.CharLit) {
        // char -> float
        return new ast.FloatLit(x.pos, x.scope, x.value, t)
      }
    } else { // t instanceof IntType
      if (x instanceof ast.IntLit || x instanceof ast.CharLit) {
        // int -> int
        x.type = t
        return x
      }
    }
    return null
  }
}
