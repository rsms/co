import { SrcFile, Pos } from './pos'
import { token, tokstr, prec } from './token'
import * as scanner from './scanner'
import { ErrorHandler, ErrorCode } from './error'
import { TypeResolver } from './resolve'
import { strings } from './bytestr'
import { Universe } from './universe'
import { DiagHandler, DiagKind } from './diag'
import { SInt64, UInt64 } from './int64'
import { numconv } from './numconv'
import {
  File,
  Scope,
  Ent,
  Group,
  Comment,

  Node,

  Field,
  Stmt,
  ReturnStmt,
  WhileStmt,

  Decl,
  ImportDecl,
  VarDecl,
  TypeDecl,
  MultiDecl,

  Expr,
  Ident,
  RestTypeExpr,
  FunExpr,
  FunSig,
  NumLit,
  IntLit,
  CharLit,
  FloatLit,
  StringLit,
  Block,
  IfExpr,
  Assignment,
  Operation,
  CallExpr,
  TupleExpr,
  BadExpr,
  TypeExpr,
  BadTypeExpr,
  SelectorExpr,
  IndexExpr,
  SliceExpr,
  ListExpr,

  builtInTypes as bitypes,
  GetTypeExpr,
} from './ast'

import {
  Type,
  NativeType,
  IntType,
  NumType,
  FunType,
  UnresolvedType,
  UnionType,
  TupleType,
  ListType,
  RestType,
  GenericType,
  GenericTypeInstance,
  AliasType,

  t_nil,
  t_u32, t_i32, t_u64, t_i64,
  t_f64, t_f32,
  t_int, t_uint,
  t_str0,
  t_list,
} from './types'

import { debuglog as dlog } from './util'
// const dlog = function(..._ :any[]){} // silence dlog

const kEmptyByteArray = new Uint8Array(0) // used for empty string

const str__    = strings.get(new Uint8Array([0x5f])) // "_"
const str_dot  = strings.get(new Uint8Array([0x2e])) // "."
const str_init = strings.get(new Uint8Array([0x69, 0x6e, 0x69, 0x74])) // "init"

const emptyExprList :Expr[] = []

type exprCtx = Type|Assignment|VarDecl|null


export class SyntaxError extends Error {
  pos :Pos

  constructor(msg :string, pos :Pos) {
    super(msg)
    this.name = "SyntaxError"
    this.pos = pos
  }
}


// funInfo contains information about the current function, used for data
// that is really only needed during parsing.
class funInfo {
  inferredReturnType :UnionType|null = null // inferred result types

  constructor(
  public f :FunExpr, // the respective function node
  ){}

  addInferredReturnType(t :Type) {
    if (this.inferredReturnType == null) {
      this.inferredReturnType = new UnionType(new Set<Type>([t]))
    } else {
      this.inferredReturnType.add(t)
    }
  }
}


// Parser scans source code and produces AST.
// It must be initialized via init before use or resue.
//
export class Parser extends scanner.Scanner {
  fnest      :int = 0   // function nesting level (for error handling)
  universe   :Universe
  comments   :Comment[]|null
  scope      :Scope
  filescope  :Scope
  pkgscope   :Scope
  diagh      :DiagHandler|null = null
  initfnest  :int = 0  // tracks if we're inside an init function
  unresolved :Set<Ident>|null   // unresolved identifiers
  funstack   :funInfo[]  // function stack
  types      :TypeResolver
  throwOnSyntaxError :bool = false  // throw SyntaxError instead of reporting

  initParser(
    sfile      :SrcFile,
    sdata      :Uint8Array,
    universe   :Universe,
    pkgscope   :Scope|null,
    typeres    :TypeResolver,
    errh       :ErrorHandler|null = null,
    diagh      :DiagHandler|null = null,
    smode      :scanner.Mode = scanner.Mode.None,
  ) {
    const p = this
    super.init(sfile, sdata, errh, smode)
    p.scope = new Scope(pkgscope)
    p.filescope = p.scope
    p.pkgscope = pkgscope || p.filescope

    p.fnest = 0
    p.universe = universe
    p.comments = null
    p.diagh = diagh
    p.initfnest = 0
    p.unresolved = null
    p.funstack = []
    p.types = typeres
    p.throwOnSyntaxError = false

    if (smode & scanner.Mode.ScanComments) {
      // sub token reader with one that does does not ignore comments
      p.next = p.next_comments
    }

    p.next()
  }

  next_comments() {
    const p = this
    super.next()
    while (p.tok == token.COMMENT) {
      if (!p.comments) {
        p.comments = []
      }
      p.comments.push(new Comment(p.pos, p.takeByteValue()))
      super.next()
    }
    // TODO: Figure out a way to attach comments to nodes
  }

  got(tok :token) :bool {
    const p = this
    if (p.tok == tok) {
      p.next()
      return true
    }
    return false
  }

  // want reports a syntax error if tok is not p.tok.
  // in any case, this function will advance the scanner by one token.
  //
  want(tok :token) {
    const p = this
    if (!p.got(tok)) {
      p.syntaxError(`expecting ${tokstr(tok)}`)
      p.next()
    }
  }

  // inFun() :FunExpr|null {
  //   return this.funstack[0] || null
  // }

  currFun() :funInfo {
    assert(this.funstack.length > 0, 'access current function at file level')
    return this.funstack[0]
  }

  pushFun(f :FunExpr) {
    this.funstack.push(new funInfo(f))
  }

  popFun() {
    assert(this.funstack.length > 0, 'popFun with empty funstack')
    this.funstack.pop()
  }


  pushScope(scope :Scope | null = null) {
    const p = this
    if (scope) {
      assert(scope.outer != null, 'pushing scope without outer scope')
    }
    p.scope = scope || new Scope(p.scope)
    // dlog(`${(p as any).scope.outer.level()} -> ${p.scope.level()}`)
  }

  popScope() :Scope { // returns old ("popped") scope
    const p = this
    const s = p.scope

    assert(s !== p.filescope, "pop file scope")
    assert(s !== p.pkgscope, "pop file scope")
    assert(p.scope.outer != null, 'pop scope at base scope')

    // dlog(` ${(p as any).scope.outer.level()} <- ${p.scope.level()}`)

    p.scope = p.scope.outer as Scope

    // check for unused declarations
    if (s.decls) for (let [name, ent] of s.decls) {
      if (ent.nreads == 0) {
        if (ent.decl instanceof Field) {
          p.diag("warn", `${name} not used`, ent.decl.pos, (
            ent.decl.scope.isFunScope ? 'E_UNUSED_PARAM' :
            'E_UNUSED_FIELD'
          ))
        } else {
          p.diag(
            "warn",
            `${name} declared and not used`,
            ent.decl.pos,
            'E_UNUSED_VAR'
          )
        }
      }
    }

    return s
  }

  // declare registers decl and x in scope identified by name
  //
  declare(scope :Scope, ident: Ident, decl :Node, x: Expr|null) {
    const p = this

    if (ident.value === str__) {
      // "_" is never declared
      return
    }

    assert(ident.ent == null, `redeclaration of ${ident}`)

    const ent = new Ent(ident.value, decl, x)
    if (!scope.declareEnt(ent)) {
      p.syntaxError(`${ident} redeclared`, ident.pos)
    }

    // dlog(`declare ${ident} (val=${x}) at ${decl} in ${scope} [${ent.type}]`)

    ident.ent = ent
    // TODO: in the else branch, we could count locals/registers needed here.
    // For instance, "currFun().local_i32s_needed++"
  }

  // declarev performs multiple declarations at once
  //
  declarev(scope :Scope, idents: Ident[], decl :Node, xs: Expr[]|null) {
    const p = this
    for (let i = 0; i < idents.length; ++i) {
      p.declare(scope, idents[i], decl, xs && xs[i] || null)
    }
  }


  resolveEnt(id :Ident) :Ent|null {
    const p = this
    // if (id.value === str__) {
    //   return null  // "_" never resolves
    // }
    assert(id.ent == null, "already resolved")
    let s :Scope|null = id.scope
    while (s) {
      // dlog(`lookupImm ${id} in ${s}`)
      const ent = s.lookupImm(id.value)
      if (ent) {
        // dlog(`${id} found in scope#${s.level()}`)
        id.refEnt(ent)
        return ent
      }
      s = s.outer
    }
    // dlog(`${id} not found`)
    // all local scopes are known, so any unresolved identifier
    // must be found either in the file scope, package scope
    // (perhaps in another file), or universe scope --- collect
    // them so that they can be resolved later
    if (!p.unresolved) {
      p.unresolved = new Set<Ident>([id])
    } else {
      p.unresolved.add(id)
    }
    return null
  }


  resolveType(x :Ident) :Ident {
    const p = this
    let ent = p.resolveEnt(x)
    if (ent) {
      if (ent.decl instanceof TypeExpr || ent.decl instanceof TypeDecl) {
        // identifier names a value or is not yet known
        x.type = ent.type || p.types.markUnresolved(x)
        if (x.type instanceof UnresolvedType) {
          // references something that itself is undefined
          x.type.addRef(x)
        }
      } else {
        p.syntaxError(`${x} is not a type`, x.pos)
      }
    }
    return x
  }


  resolveVal<N extends Expr>(x :N) :N {
    if (!(x instanceof Ident) || x.value === str__) { // ignore "_"
      return x
    }
    const p = this
    let ent = p.resolveEnt(x)
    if (ent) {
      if (ent.decl instanceof TypeExpr) {
        // identifier names a type
        // x.type = new TypeType(ent.decl.type)
        x.type = ent.decl.type
      } else {
        // identifier names a value or is not yet known
        x.type = ent.type || p.types.markUnresolved(x)
        if (x.type instanceof UnresolvedType) {
          // references something that itself is undefined
          x.type.addRef(x)
        }
      }
    }
    return x
  }


  // ctxType returns the type of the context, or null if the type is not known
  // or if the type can't be reliably inferred, in which case it should be
  // resolved later on.
  //
  ctxType(ctx :exprCtx) :Type|null {
    const p = this
    if (ctx) {
      if (ctx instanceof Type) {
        return ctx
      }
      if (ctx instanceof VarDecl) {
        return ctx.type && p.types.maybeResolve(ctx.type) || null
      }
      if (ctx instanceof Assignment) {
        // common case: single assignment
        // we handle multi assignments later, in p.assignment()
        return (
          ctx.type ||
          ( ctx.lhs && ctx.lhs.length == 1 ?
              p.types.maybeResolve(ctx.lhs[0]) :
              null
          )
        )
      }
    }
    return null
  }

  parseFile() :File {
    const p = this
    const imports = p.parseImports()
    const decls = p.parseFileBody()

    return new File(
      p.sfile,
      p.scope,
      imports,
      decls,
      p.unresolved,
    )
  }

  parseImports() :ImportDecl[] {
    const p = this
    //
    // Imports     = ImportDecl? | ImportDecl (";" ImportDecl)*
    // ImportDecl  = "import" ( ImportSpec | "(" { ImportSpec ";" } ")" )
    // ImportSpec  = [ "." | PackageName ] ImportPath
    // ImportPath  = string_lit
    //
    let imports = [] as ImportDecl[]
    while (p.got(token.IMPORT)) {
      p.appendGroup(imports, p.importDecl)
      p.want(token.SEMICOLON)
    }
    return imports
  }

  importDecl = (_ :Group|null) :ImportDecl => {
    const p = this
    let localIdent :Ident|null = null
    let hasLocalIdent = false

    switch (p.tok) {
      case token.NAME:
        localIdent = p.ident()
        hasLocalIdent = true
        break

      case token.DOT:
        localIdent = new Ident(p.pos, p.scope, str_dot)
        p.next()
        break
    }

    let path :StringLit
    if (p.tok == token.STRING) {
      path = p.strlit()
    } else {
      p.syntaxError("missing import path; expecting quoted string")
      path = new StringLit(p.pos, p.scope, kEmptyByteArray, t_str0)
      p.advanceUntil(token.SEMICOLON, token.RPAREN)
    }

    const d = new ImportDecl(p.pos, p.scope, path, localIdent)

    if (hasLocalIdent && localIdent) {
      p.declare(p.filescope, localIdent, d, null)
    }

    return d
  }

  parseFileBody() :Decl[] {
    const p = this
    const decls = [] as Decl[]

    // { TopLevelDecl ";" }
    while (p.tok != token.EOF) {
      switch (p.tok) {

        case token.TYPE:
          p.next() // consume "type"
          p.appendGroup(decls, p.typeDecl)
          break

        case token.NAME:
          const pos = p.pos
          const idents = p.identList(p.ident())
          decls.push(p.varDecl(pos, idents))
          break

        case token.FUN:
          decls.push(p.funExpr(null))
          break

        // TODO: token.TYPE

        default: {
          if (
            p.tok == token.LBRACE &&
            decls.length > 0 &&
            isEmptyFunExpr(decls[decls.length-1])
          ) {
            // opening { of function declaration on next line
            p.syntaxError("unexpected semicolon or newline before {")
          } else {
            p.syntaxError("non-declaration statement outside function body")
          }

          p.error(`TODO file-level token \`${tokstr(p.tok)}\``); p.next()

          p.advanceUntil(/*token.CONST, */token.TYPE, token.FUN)
          continue
        }
      }

      if ((p.tok as token) != token.EOF && !p.got(token.SEMICOLON)) {
        p.syntaxError("after top level declaration")
        p.advanceUntil(/*token.CONST, */token.TYPE, token.FUN)
      }
    }

    return decls
  }

  // checkDeclLen verifies that idents.length == nvalues, and if not,
  // reports a syntax error.
  // Returns true if lengths matches.
  //
  checkDeclLen(idents :Ident[], nvalues: number, kind :string) :bool {
    const p = this
    if (nvalues != idents.length) {
      p.syntaxError(
        `cannot assign ${nvalues} values to ${idents.length} ${kind}`,
        idents[0].pos
      )
      return false
    }
    return true
  }

  typeDecl = (group :Group|null, _ :int) :TypeDecl => {
    // TypeSpec = "type" identifier [ "=" ] Type
    const p = this
    const pos = p.pos
    const id = p.ident()
    const alias = p.got(token.ASSIGN)

    let t = p.maybeType()
    if (!t) {
      t = p.badTypeExpr()
      p.syntaxError("in type declaration")
      p.advanceUntil(token.SEMICOLON, token.RPAREN)
    }

    // create new alias type
    t.type = new AliasType(id.value, t.type)

    // ids at the file level are declared in the package scope
    const scope = p.scope === p.filescope ? p.pkgscope : p.scope

    const d = new TypeDecl(pos, scope, id, alias, t, group)

    p.declare(scope, id, d, d.type)

    return d
  }

  varDecl(pos :Pos, idents :Ident[]) :VarDecl|Assignment {
    // VarDecl = IdentifierList
    //           ( Type [ "=" ExpressionList ] | "=" ExpressionList )
    const p = this
    const typ = p.maybeType()
    let isError = false

    // ids at the file level are declared in the package scope
    const scope = p.scope === p.filescope ? p.pkgscope : p.scope

    // if (p.scope !== p.filescope && p.tok == token.ASSIGN) {
    //   // produce Assignment instead
    //   return p.assignment(idents, typ ? p.types.resolve(typ) : null)
    // }

    const d = new VarDecl(pos, scope, idents, null, typ, null)

    if (p.got(token.ASSIGN)) {
      // e.g. x, y = 1, 2
      d.values = p.exprList(/*ctx=*/d)
      isError = !p.checkDeclLen(idents, d.values.length, 'constants')
    } else if (!typ) {
      // e.g. `x` -- missing type or values
      p.syntaxError("unexpected identifier", pos)
      isError = true
      d.values = [p.bad()]
      p.advanceUntil(token.SEMICOLON)
    }

    if (isError) {
      return d
    }

    const reqt = d.type ? p.types.resolve(d.type) : null
    p.processAssign(d.idents, d.values, d, reqt, /*onlyDef=*/true)

    return d
  }

  funExpr(ctx :exprCtx) :FunExpr {
    //
    // FunExpr  = "fun" FunName? Signature? FunBody?
    // FunName  = identifier
    // FunBody  = ( Block | "->" Stmt )
    //
    // Note: FunName is required at file level in "fun" declarations
    //
    const p = this
    const pos = p.pos
    p.want(token.FUN)

    const isTopLevel = p.scope === p.filescope

    let name :Ident|null
    let isInitFun = false

    if (isTopLevel && !ctx) {
      // case: statement(!ctx) at top-level
      name = p.ident()
      // functions called "init" at the file level are special
      isInitFun = p.scope === p.filescope && name.value.equals(str_init)
    } else {
      name = p.maybeIdent()
    }

    // scope in which we will declare the function's name.
    // declarations at the top-level are declared in the package scope.
    const scope = isTopLevel ? p.pkgscope : p.scope

    // new scope for parameters, signature and body
    p.pushScope(new Scope(p.scope, null, /*isFunScope*/true))

    // parse signature.
    //
    // Note: we use the default and special type constant "auto" for all
    // functions but initi functions. This allows us to track multiple return
    // sites and do type checking as we go.
    //
    // Additionally, p.funSig may find an explicit return type in which case
    // it will use that instead. Whenever we encounter a return statement, we
    // will check the expected return type with the actual return type.
    //
    const sig = p.funSig(isInitFun ? bitypes.nil : null)

    const f = new FunExpr(pos, p.scope, name, sig, isInitFun)

    if (isInitFun) {
      // check initfun signature (should be empty)
      if (sig.params.length > 0) {
        p.syntaxError(`init function with parameters`, sig.pos)
      }
      if (sig.result !== bitypes.nil) {
        p.syntaxError(`init function with result ${sig.result}`, sig.pos)
      }
    } else {
      if (sig.result) {
        // an explicit result type was provided -- resolve its type
        p.types.resolve(sig.result)
      }

      if (name && !ctx) {
        // The function itself is declared in its outer scope, so that its body
        // can refer to the function, but also so that "funname = x" declares a
        // new variable rather than replacing the function.
        //
        // The check for !ctx is to make sure that decorative names in
        // expressions are not declared in the scope.
        // E.g. the statement "x = fun y(){}" should only declare x in the scope,
        // but not y.
        p.declare(scope, name, f, f)
      }
    }

    // parse body
    if (!isTopLevel || isInitFun || ctx || p.tok != token.SEMICOLON) {

      // Note: the following code can be enabled to disallow type-only param
      // signatures for functions with bodies.
      // e.g. "fun foo(int, f32) {}"
      // if (sig.params.length > 0 && !sig.params[0].name) {
      //   p.syntaxError(
      //     `type-only parameters for function with body`,
      //     sig.pos
      //   )
      // }

      if (isInitFun) { p.initfnest++ }
      p.pushFun(f)

      f.body = p.funBody(name)
      const fi = p.currFun()

      p.popFun()
      if (isInitFun) { p.initfnest-- }

      // pop function body scope before resolving types.
      // otherwise we would run the risk of resolving a type to something
      // that's defined in the function body itself which may shadow outer
      // definitions.
      p.popScope()

      if (f.body instanceof Block) {
        if (!sig.result) {
          // auto result of block = nil
          //
          // e.g.  fun foo() { ... }
          //   =>  fun foo() nil { ... }
          //
          sig.result = bitypes.nil
        } else if (!isInitFun && sig.result !== bitypes.nil) {
          // convert implicit return to explicit return
          //
          // e.g.  fun foo() i32 { 3 }
          //   =>  fun foo() i32 { return 3 }
          //
          let lastindex = f.body.list.length - 1
          let result = f.body.list[lastindex]
          if (result instanceof Expr) {
            let x = result as Expr
            let xtype = p.types.resolve(x)
            let rettype = sig.result.type
            if (!(xtype instanceof UnresolvedType) && !xtype.equals(rettype)) {
              // attempt type conversion; rettype -> x.type
              const convexpr = p.types.convertLossless(rettype, x)
              if (convexpr) {
                x = convexpr as Expr
              } else {
                p.syntaxError(
                  x instanceof Ident ?
                    `cannot use ${x} (type ${xtype}) as return type ${rettype}` :
                    `cannot use ${xtype} as return type ${rettype}`,
                  x.pos
                )
              }
            }
            let ret = new ReturnStmt(x.pos, x.scope, x, sig.result.type)
            f.body.list[lastindex] = ret
          }
        }
      } else if (!sig.result) {
        // expression body with auto result type
        //
        // e.g.  fun foo() -> 3
        //   =>  fun foo() i32 -> 3
        //
        // inferred result type
        if (!fi.inferredReturnType) {
          // no return statements encountered.
          // set result type to same as the body
          sig.result = GetTypeExpr(p.types.resolve(f.body))
        } else if (fi.inferredReturnType.types.size == 1) {
          // single return type (note: may be void if found `return;`)
          sig.result = GetTypeExpr(fi.inferredReturnType.types.values().next().value)
        } else {
          // union type
          sig.result = GetTypeExpr(fi.inferredReturnType)
        }
      }
    } else {
      if (sig.result === null) {
        // auto
        // for functions without a body and that is missing an explicit
        // result type, nil/void is assumed.
        sig.result = bitypes.nil
      }
      p.popScope()
    }

    if (sig.result instanceof UnresolvedType) {
      sig.result.addRef(sig)
    }

    const funtype = p.types.resolve(f) as FunType
    assert(funtype.constructor === FunType) // funtype always resolves

    if (name && name.value !== str__ && !isInitFun) {
      // since we declared the name of the function, the name now represents
      // the function and thus its type.
      name.type = funtype
      if (name.ent && !name.ent.type) {
        // assign type to declaration
        name.ent.type = funtype
      }
    }

    return f
  }

  // TODO: maybeFunExpr() :Expr -- FunExpr or some other expr
  // FunExpr = "fun" FunName? Signature FunBody
  // FunName = identifier
  // FunBody  = ( Block | "->" Stmt )

  // funSig parses a function signature
  //
  // Signature = ( Parameters Result? | Type )?
  //
  funSig(defaultType :TypeExpr | null): FunSig {
    const p = this
    const pos = p.pos
    const params = p.tok == token.LPAREN ? p.parameters() : []
    let result = defaultType
    if (p.tok != token.LBRACE) {
      result = p.maybeType() || defaultType
    }
    return new FunSig(pos, p.scope, params, result)
  }

  // parameters parses a parameter list
  //
  // This is a pretty complicated function since parameter lists
  // has complex semantics.
  // Three syntax modes are supported:
  //   type, type
  //   OR
  //   ( name type, name type
  //     AND
  //     name, name type )
  //
  // Parameters    = "(" [ ParameterList [ "," ] ] ")"
  // ParameterList = ParameterDecl ("," ParameterDecl)*
  // ParameterDecl = [ NameList ] [ "..." ] Type
  //
  parameters() :Field[] {
    // examples:
    //
    // (T)
    // (x T)
    // (x, y, z T)
    // (... T)
    // (x  ... T)
    // (x, y, z  ... T)
    // (T1, T2, T3)
    // (T1, T2, ... T3)
    //
    const p = this
    p.want(token.LPAREN)

    let named = 0   // parameters that have an explicit name and type
    let seenRestTypeExpr = false
    const paramsPos = p.pos
    const fields = [] as Field[]
    const scope = p.scope

    while (p.tok != token.RPAREN) {
      let pos = p.pos
      // let f = new Field(p.pos, scope, t_nil, p.ident())

      let typ :Expr|null = null
      let name :Ident|null = null

      // parse type or name
      if (p.tok == token.NAME) {
        typ = p.dotident(null, p.ident())
      } else {
        // Note: No need to check for ";" or ")" since the "while" condition
        // checks for ")" and an empty parameter set with linebreaks never
        // produces a semicolon implicitly. I.e. "foo(<LF><LF>)" == "foo()"
        // However, it's a syntax error to write "foo(;)"
        let isRest = false
        if (p.tok == token.ELLIPSIS) {
          // ...T
          isRest = true
          p.next()
        }
        const x = p.maybeType()
        if (x) {
          typ = x
          if (isRest) {
            // typ = new RestTypeExpr(pos, x.scope, x, p.types.getRestType(x.type))
            x.type = p.types.getRestType(x.type)
          }
        } else {
          typ = p.badTypeExpr()
          p.syntaxError("expecting name or type", pos)
        }
      }

      if (p.tok != token.COMMA &&
          p.tok != token.SEMICOLON &&
          p.tok as token != token.RPAREN)
      {
        // e.g. func(T), func(... T)

        // move typ -> name as we are about to parse the actual type
        if (typ) {
          // e.g. func(name T)
          if (typ instanceof Ident) {
            name = typ
            named++
          } else {
            // e.g. func(a.b.c T)
            p.syntaxError("illegal parameter name", pos)
          }
        }

        // parse type
        if (p.got(token.ELLIPSIS)) {
          const x = p.maybeType()
          if (x) {
            let t = p.types.getRestType(p.types.resolve(x))
            typ = new RestTypeExpr(pos, scope, x, t)
          } else {
            typ = p.badTypeExpr()
            p.syntaxError("expecting type after ...")
          }
          if (seenRestTypeExpr) {
            p.syntaxError("can only use ... with final parameter")
            continue  // skip this field
          } else {
            seenRestTypeExpr = true
          }
        } else {
          typ = p.type()
        }
      } // else if (typ instanceof Ident) {}

      // restType() :RestTypeExpr {
      //   // RestType = "..." Expr?
      //   const p = this
      //   const pos = p.pos
      //   p.want(token.ELLIPSIS)
      //   const rt = new RestTypeExpr(pos, p.scope, p.type())
      //   p.types.resolve(rt)
      //   return rt
      // }

      // parse optional comma, or break on error
      if (!p.ocomma(token.RPAREN)) {
        // error: unexpected SOMETHING, expecting comma, or )
        // e.g. "fun foo(a, b<LF>)" fix -> "fun foo(a, b,<LF>)"
        //                                              ^
        break
      }

      // Note: OK that typ is an Ident here. We may edit this later
      // TODO: cleaner way of doing this
      fields.push(new Field(pos, scope, typ as TypeExpr, name))
    }

    p.want(token.RPAREN)

    // distribute parameter types
    if (named == 0) {
      // none named -- types only
      for (let f of fields) {
        if (f.type instanceof Ident) {
          p.resolveType(f.type)
        }
      }
    } else {

      if (named < fields.length) {
        // All named, some has types, e.g. func(a, b B, c ...C)
        // some named => all must be named
        let ok = true
        let typ :TypeExpr|null = null
        let t :Type = t_nil

        for (let i = fields.length - 1; i >= 0; --i) {
          const f = fields[i]

          if (!f.name) {
            // is a single-name param (name is actually on .type)
            if (f.type instanceof Ident) {
              f.name = f.type
              if (typ) {
                f.type = typ
                f.name.type = t
              } else {
                // f.type == nil && typ == null => we only have a f.name
                ok = false
                f.type = p.badTypeExpr(f.type.pos)
              }
            } else {
              p.syntaxError("illegal parameter name", f.type.pos)
            }
          } else if (f.type) {
            p.resolveVal(f.type)
            t = p.types.resolve(f.type)
            typ = f.type
            if (typ instanceof RestTypeExpr) {
              // unbox rest type, e.g. "...typ" -> "typ"
              const tx = typ.expr
              assert(tx.type, 'unresolved type')
              typ = new TypeExpr(tx.pos, tx.scope, tx.type as Type)
            }
            if (f.name) {
              f.name.type = t
            } else {
              ok = false
              f.name = p.fallbackIdent(typ.pos)
            }
          }

          if (!ok) {
            p.syntaxError(
              "mixed named and unnamed function parameters",
              paramsPos
            )
            break
          }

          // declare name in function scope
          assert(f.name != null)
          p.declare(scope, f.name as Ident, f, null)
        }
      } else {
        // All named, all have types
        // declare names in function scope
        for (let f of fields) {
          assert(f.name != null)
          if (f.type instanceof Ident) {
            p.resolveType(f.type)
          }
          ;(f.name as Ident).type = p.types.resolve(f.type)
          p.declare(scope, f.name as Ident, f, null)
        }
      }
    }

    return fields
  }

  funBody(funcname :Ident|null) :Expr {
    // FunBody = ( Block | "->" Expr )
    const p = this

    if (p.tok == token.LBRACE) {
      // Block
      return p.block()
      // let b = p.block()
      // if (b.list.length > 0) {
      //   let laststmt = b.list[b.list.length-1]
      //   if (laststmt instanceof ReturnExpr) {
      //     // unwrap "return" when it is the last statement in a function, since
      //     // last statement is implicit.
      //     b.list[b.list.length-1] = laststmt.result
      //   }
      // }
      // return b
    }

    if (p.got(token.ARROWR)) {
      // "->" Expr
      return p.expr(/*ctx=*/null)
      // let x = p.expr(/*ctx=*/null)
      // if (x instanceof ReturnExpr) {
      //   // unwrap "return" when it is the last statement in a function, since
      //   // last statement is implicit.
      //   return x.result
      // }
      // return x
    }

    // error
    const pos = p.pos
    if (funcname) {
      p.syntaxError(`${funcname} is missing function body`, pos)
    } else {
      p.syntaxError("missing function body", pos)
    }
    return p.bad(pos)
  }

  // block parses a block expression.
  // The caller manages scope (push/pop if required)
  //
  block() :Block {
    // Block = "{" StatementList "}" | Stmt
    const p = this
    const pos = p.pos
    p.want(token.LBRACE)
    const list = p.stmtList()
    p.want(token.RBRACE)
    return new Block(pos, p.scope, list)
  }

  multiDecl<D extends Decl>(f :(g:Group|null, i:int)=>D) :MultiDecl {
    const p = this
    const pos = p.pos
    p.next() // e.g. TYPE
    const decls :Decl[] = []
    p.appendGroup(decls, f)
    return new MultiDecl(pos, p.scope, decls)
  }

  stmtList() :Stmt[] {
    // StatementList = { Statement ";" }
    const p = this
    const list = [] as Stmt[]

    while (p.tok != token.EOF &&
           p.tok != token.RBRACE &&
           // p.tok != token.CASE &&
           p.tok != token.DEFAULT)
    {
      const s = p.maybeStmt()
      if (!s) {
        break
      }
      list.push(s)
      // customized version of osemi:
      // ';' is optional before a closing ')' or '}'
      if (p.tok == token.RPAREN || p.tok as token == token.RBRACE) {
        continue
      }
      if (!p.got(token.SEMICOLON)) {
        p.syntaxError("at end of statement")
        p.advanceUntil(token.SEMICOLON, token.RBRACE)
      }
    }

    return list
  }

  // shouldStoreToEnt returns true if ent is within atScope in such a way
  // that "ent = value" means "store value to ent".
  //
  shouldStoreToEnt(ent :Ent, atScope :Scope) :bool {
    const p = this
    return (
      ent.scope === atScope  // same scope
      ||
      ( ent.scope !== p.filescope &&
        ( ( ent.scope === p.pkgscope &&
            atScope.fun && atScope.fun.isInit )
          ||
          ent.scope.funScope() === atScope.funScope()
        )
      )
    )
  }


  // convertType tries to fit expression x into type t.
  // May return a new conversion expression or x verbatim if x is
  // already compatible with t.
  //
  convertType(t :Type, x :Expr) :Expr {
    const p = this
    if (
      x.type === t ||
      x.type instanceof UnresolvedType ||
      t instanceof UnresolvedType
    ) {
      return x
    }
    const convertedx = p.types.convert(t, x)
    if (convertedx) {
      // if (convertedx !== x) {
      //   // no error and conversion is needed.
      //   // replace original expression with conversion expression
      // }
      return convertedx
    }
    if (!(x.type instanceof UnresolvedType)) {
      p.error(`cannot convert "${x}" (type ${x.type}) to type ${t}`, x.pos)
    }
    return x
  }


  processAssign(
    lhs :Expr[],
    rhs :Expr[]|null,
    decl :Node,
    reqt :Type|null,
    onlyDef :bool,
  ) {
    const p = this

    // // TODO refactor this and move this function (that has a closure)
    // function maybeConvRVal(typ :Type, rval :Expr, index :int) {
    //   if (
    //     !(rval.type instanceof UnresolvedType) &&
    //     !(typ instanceof UnresolvedType)
    //   ) {
    //     const convx = p.types.convert(typ, rval)
    //     if (!convx) {
    //       if (rval.type instanceof UnresolvedType) {
    //         // unresolved
    //         return
    //       }
    //       p.error(
    //         (rval.type instanceof UnresolvedType ?
    //           `cannot convert "${rval}" to type ${typ}` :
    //           `cannot convert "${rval}" (type ${rval.type}) to type ${typ}`
    //         ),
    //         rval.pos
    //       )
    //     } else if (convx !== rval) {
    //       // no error and conversion is needed.
    //       // replace original expression with conversion expression
    //       assert(rhs != null)
    //       ;(rhs as any)[index] = convx
    //     }
    //   }
    // }

    // Check each left-hand identifier against scope and unresolved.
    // Note that exprList already has called p.resolve on all ids.
    //
    // If an id has an ent (i.e. was resolved to something), then we simply
    // register the assignment with it so that we can later bind.
    //
    // If an id is unresolved (doesn't have an ent), the semantics are:
    // - assume it's a constant definition and declare it as such
    // - register the assignment so that if we later find a var in the outer
    //   scope, we can convert the declaration to an assignment.
    //
    for (let i = 0; i < lhs.length; ++i) {
      const id = lhs[i]

      if (!(id instanceof Ident)) {
        dlog(`TODO LHS is not an id (type is ${id.constructor.name})`)
        continue
      }

      // Decide to store to an existing ent, or declare a new one
      if (!onlyDef && rhs && id.ent && p.shouldStoreToEnt(id.ent, id.scope)) {
        const rval = rhs[i]

        id.incrWrite()

        let typ = id.ent.type
        if (!typ) {
          const typexpr = id.ent.getTypeExpr()
          assert(typexpr != null, 'null ent (internal parser error)')
          typ = p.types.resolve(typexpr as Expr)
        }

        // const typexpr = id.ent.getTypeExpr()
        // assert(typexpr != null)
        // const typ = p.types.resolve(typexpr as Expr)

        // check & resolve type, converting rval if needed
        id.type = typ

        rhs[i] = p.convertType(typ, rval) // maybeConvRVal(typ, rval, i)

        continue
      }

      id.ent = null

      // new declaration
      //
      // since we are about to redeclare, clear any "unresolved" mark for
      // this identifier expression.
      const rval = rhs ? rhs[i] : null

      if (reqt) {
        id.type = reqt
        if (rval) {
          // see if we need to convert the rval to fit the destination type
          rhs![i] = p.convertType(reqt, rval) // maybeConvRVal(reqt, rval, i)
        }
      } else {
        assert(rval, "processAssign called with no reqt and no rvals")
        id.type = p.types.resolve(rval as Expr)
      }

      if (p.unresolved) { p.unresolved.delete(id) } // may be noop
      p.declare(id.scope, id, decl, rval)

      if (id.type instanceof UnresolvedType) {
        id.type.addRef(id)
      }

    } // end for loop
  }


  assignment(lhs :Expr[], reqt :Type|null = null) :Assignment {
    // Assignment = ExprList "=" ExprList
    const p = this
    p.want(token.ASSIGN) // "="

    const s = new Assignment(lhs[0].pos, p.scope, token.ASSIGN, lhs, [])

    // parse right-hand side in context of the function
    s.rhs = p.exprList(/*ctx=*/s)

    p.processAssign(s.lhs, s.rhs, s, /*reqt=*/reqt, /*onlyDef=*/false)

    p.types.resolve(s)

    return s
  }

  // simpleStmt = EmptyStmt | ExpressionStmt | SendStmt | IncDecStmt
  //            | Assignment | VarDecl
  simpleStmt(lhs :Expr[]) :Stmt {
    const p = this

    // Note: token.SET_ASSIGN ":=" is currently unused
    // we could use it to allow shadowing in same scope, e.g.
    //   "b = 4; b := true" where "b :=" redeclares b.

    if (p.tok == token.ASSIGN) {
      // e.g.  "a = 1"  "a, b = 1, 2"  "a[1], b.f = 1, 2"  etc
      return p.assignment(lhs)
    }

    if (p.tok == token.NAME && lhs.every(x => x instanceof Ident)) {
      // var definition
      // e.g. "a T", "a, b, c T" -- declare var with type T

      // first, revert either bindings or unresolved mark of LHS idents
      for (let i = 0; i < lhs.length; i++) {
        let x = lhs[i] as Ident
        if (x.ent) {
          x.unrefEnt()
        } else if (x.value !== str__) {
          assert(p.unresolved != null)
          ;(p.unresolved as Set<Ident>).delete(x)
        }
      }

      // now, form a var declaration (next up may be assignment and values)
      return p.varDecl(lhs[0].pos, lhs as Ident[])
    }

    const pos = lhs[0].pos

    if (lhs.length != 1) {
      p.syntaxError('expecting "=" or ","')
      p.advanceUntil(token.SEMICOLON, token.RBRACE)
      return lhs[0]
    }

    // single expression

    let t = p.types.resolve(lhs[0])

    if (token.assignop_beg < p.tok && p.tok < token.assignop_end) {
      // lhs op= rhs;  e.g. "x += 2"
      let op = p.tok
      p.next() // consume operator

      // map assign ops to regular ops.
      // e.g. "(assign += x 2)" => "(assign + x 2)"
      switch (op) {
        case token.ADD_ASSIGN:     op = token.ADD; break  // +
        case token.SUB_ASSIGN:     op = token.SUB; break  // -
        case token.MUL_ASSIGN:     op = token.MUL; break  // *
        case token.QUO_ASSIGN:     op = token.QUO; break  // /
        case token.REM_ASSIGN:     op = token.REM; break  // %
        case token.AND_ASSIGN:     op = token.AND; break  // &
        case token.OR_ASSIGN:      op = token.OR;  break  // |
        case token.XOR_ASSIGN:     op = token.XOR; break  // ^
        case token.SHL_ASSIGN:     op = token.SHL; break  // <<
        case token.SHR_ASSIGN:     op = token.SHR; break  // >>
        case token.AND_NOT_ASSIGN: op = token.AND_NOT; break // &^
        default:
          assert(false, `unexpected operator token ${token[op]}`)
      }

      const s = new Assignment(pos, p.scope, op, lhs, [])
      s.rhs = p.exprList(/*ctx=*/s)
      p.types.resolve(s)
      return s
    }

    if (p.tok == token.INC || p.tok == token.DEC) {
      // lhs++ or lhs--
      const op = p.tok
      p.next() // consume operator

      if (!(t instanceof IntType) && !(t instanceof UnresolvedType)) {
        // lhs is not a mutable type. For instance, it might be str.
        this.syntaxError(`cannot mutate ${lhs[0]} of type ${t}`, lhs[0].pos)
      }

      let s = new Assignment(pos, p.scope, op, lhs, emptyExprList)
      p.types.resolve(s)
      return s
    }

    if (p.tok == token.ARROWL) {
      // lhs <- rhs
      p.syntaxError("TODO simpleStmt ARROWL")
    }

    if (p.tok == token.ARROWR) {
      // params -> result
      p.syntaxError("TODO simpleStmt ARROWR")
    }

    // else: expr
    return lhs[0]
  }


  maybeStmt() :Stmt|null {
    // Statement =
    //   Declaration | LabeledStmt | simpleStmt |
    //   GoStmt | ReturnStmt | BreakStmt | ContinueStmt | GotoStmt |
    //   FallthroughStmt | Block | IfExpr | SwitchStmt | SelectStmt | ForStmt |
    //   DeferStmt .
    const p = this

    switch (p.tok) {
      // Most statements (assignments) start with an identifier;
      // look for it first before doing anything more expensive.
      case token.NAME:
      case token.NAMEAT:
        return p.simpleStmt(p.exprList(/*ctx=*/null))

      case token.LBRACE:
        p.pushScope()
        const s = p.block()
        p.popScope()
        return s

      case token.TYPE:
        return p.multiDecl(p.typeDecl)

      case token.ADD:
      case token.SUB:
      case token.MUL:
      case token.AND:
      case token.NOT:
      case token.XOR: // unary operators
      case token.FUN:
      case token.LPAREN: // operands
      case token.LBRACKET:
      // case token.STRUCT:
      // case token.CHAN:
      case token.INTERFACE: // composite types
      // case token.ARROW: // receive operator
        return p.simpleStmt(p.exprList(/*ctx=*/null))

      // case token.FOR:
      //   return p.forStmt()

      // case token.SWITCH:
      //   return p.switchStmt()

      // case token.SELECT:
      //   return p.selectStmt()

      case token.WHILE:
        return p.whileStmt()

      case token.IF:
        return p.ifExpr(/*ctx=*/null)

      // case token.FALLTHROUGH:
      //   s := new(BranchStmt)
      //   s.pos = p.pos()
      //   p.next()
      //   s.Tok = _Fallthrough
      //   return s

      // case token.BREAK, token.CONTINUE:
      //   s := new(BranchStmt)
      //   s.pos = p.pos()
      //   s.Tok = p.tok
      //   p.next()
      //   if p.tok == _Name {
      //     s.Label = p.name()
      //   }
      //   return s

      // case token.GO, token.DEFER:
      //   return p.callStmt()

      // case token.GOTO:
      //   s := new(BranchStmt)
      //   s.pos = p.pos()
      //   s.Tok = _Goto
      //   p.next()
      //   s.Label = p.name()
      //   return s

      case token.RETURN:
        return p.returnStmt()

      // case token.SEMI:
      //   s := new(EmptyStmt)
      //   s.pos = p.pos()
      //   return s

      default:
        if (token.literal_beg < p.tok && p.tok < token.literal_end) {
          return p.simpleStmt(p.exprList(/*ctx=*/null))
        }
    }

    return null
  }

  whileStmt() :WhileStmt {
    //
    // WhileStmt = "while" Expression Block
    //
    const p = this
    const pos = p.pos
    const scope = p.scope

    p.want(token.WHILE)

    const cond = p.expr(/*ctx=*/null)
    p.types.resolve(cond)

    const body = p.expr(/*ctx=*/null)

    return new WhileStmt(pos, scope, cond, body)
  }

  ifExpr(ctx :exprCtx) :IfExpr {
    //
    // IfExpr = "if" Expression Block
    //          [ "else" ( IfExpr | Block ) ]
    //
    // e.g. `if x > 1 "large" else "small"`
    // e.g. `if x = size() > 1 print("large number: $x")`
    //
    const p = this

    // push a scope for conditions to support e.g. capture of x in
    //   if x = a() > 0 print("$x > 0") else print("$x < 0")
    //
    p.pushScope()
    const s = p.ifExpr2(ctx)
    p.popScope()

    return s
  }

  ifExpr2(ctx :exprCtx) :IfExpr {
    // used by ifExpr
    const p = this
    const pos = p.pos
    const scope = p.scope

    p.want(token.IF)

    const cond = p.expr(ctx)
    p.types.resolve(cond)

    const then = p.expr(ctx)

    const s = new IfExpr(pos, scope, cond, then, null)

    if (p.got(token.ELSE)) {
      if (p.tok == token.IF) {
        s.els_ = p.ifExpr2(ctx)
      } else {
        p.pushScope()
        s.els_ = p.expr(ctx)
        p.popScope()
      }
    }

    return s
  }

  returnStmt() :ReturnStmt {
    const p = this
    const pos = p.pos

    p.want(token.RETURN)

    // expected return type (may be null (auto); bitypes.nil for init)
    const fi = p.currFun()
    const frtype = fi.f.sig.result

    assert(
      !frtype || frtype.type instanceof Type,
      "currFun sig.result type not resolved"
    )

    const n = new ReturnStmt(pos, p.scope, bitypes.nil, t_nil)

    if (p.tok == token.SEMICOLON || p.tok == token.RBRACE) {
      // no result; just "return"
      if (frtype !== bitypes.nil) {
        if (frtype === null && fi.inferredReturnType == null) {
          // patch current function's signature: nil result type
          fi.f.sig.result = bitypes.nil
        } else {
          // if `fi.inferredReturnType != null` that means the block returns
          // both some type and nothing, which is invalid.
          p.syntaxError(
            `missing return value; expecting ${fi.inferredReturnType || frtype}`
          )
        }
      }
      return n
    }

    // expecting one or more results to follow "return"

    const xs = p.exprList(/*ctx=*/null) // ?: maybe pass TupleExpr as ctx?

    let rval = (
      xs.length == 1 ? xs[0] :
        // e.g. "return 1", "return (1, 2)"

      new TupleExpr(xs[0].pos, xs[0].scope, xs, null)
        // Support paren-less tuple return
        // e.g. "return 1, 2" == "return (1, 2)"
    )

    if (frtype === bitypes.nil) {
      p.syntaxError("function does not return a value", rval.pos)
      return n
    }

    const rtype = p.types.resolve(rval)
    n.result = rval
    n.type = rtype

    if (frtype === null) {
      // return type is auto -- register inferred result type
      fi.addInferredReturnType(rtype)

    } else {
      assert(frtype.type)
      const funResType = frtype.type as Type
      if (
        !(rtype instanceof UnresolvedType) && // type is known, and
        !rtype.equals(funResType) // type is different than function's ret type
      ) {
        // attempt type conversion; rtype -> frtype.type
        const convexpr = p.types.convert(funResType, rval)
        if (convexpr) {
          n.result = convexpr
          n.type = funResType
        } else {
          // error: type mismatch
          p.syntaxError(
            (rval.type instanceof UnresolvedType ?
              `cannot use "${rval}" as return type ${frtype}` :
              `cannot use "${rval}" (type ${rval.type}) as return type ${frtype}`
            ),
            rval.pos
          )
        }
      }
    }

    return n
  }

  exprList(ctx :exprCtx) :Expr[] {
    // ExpressionList = Expression ( "," Expression )*
    const p = this
    const list = [p.expr(ctx)]
    while (p.got(token.COMMA)) {
      list.push(p.expr(ctx))
    }
    return list
  }

  expr(ctx :exprCtx) :Expr {
    const p = this
    return p.binaryExpr(prec.LOWEST, ctx)
  }

  binaryExpr(pr :prec, ctx :exprCtx) :Expr {
    // Expression = UnaryExpr | Expression binary_op Expression
    const p = this
    let x = p.unaryExpr(pr, ctx)

    // if (ctx && !ctx.type && ctx instanceof Assignment) {
    //   let ctxt = p.ctxType(ctx)
    //   if (!ctxt) {
    //     // in assignment context without type, assume type of first value
    //     ctx.type = p.types.resolve(x)
    //   }
    // }

    return p.maybeBinaryExpr(x, pr, ctx)
  }


  // Call after parsing an expression which might be part of a binary expression.
  // If the next token is a binary-expression operator, then return an Operator,
  // otherwise x is returned verbatim.
  //
  maybeBinaryExpr(x :Expr, pr :prec, ctx :exprCtx) :Expr {
    const p = this
    while (token.operator_beg < p.tok && p.tok < token.operator_end && p.prec > pr) {
      // save operator info and parse next token
      const pos = p.pos
      const pr2 = p.prec
      const op = p.tok
      p.next()

      // expect some expression to follow
      let y = p.binaryExpr(pr2, ctx)
      x = new Operation(pos, p.scope, op, x, y)

      // Note: We need to resolve types here rather than outside this
      // loop since x may be an identifier in the left-hand-side of an
      // assignment operation, which would cause type resolution to fail,
      // which is slow.
      p.types.resolve(x)
    }
    return x
  }


  // maybeGenericTypeInstance parses either a "less than" binop, e.g. "x<y",
  // or a generic type instance expression, e.g. "type<arg>".
  //
  // LtBinOp         = Expr "<" Expr
  // GenericTypeExpr = TypeExpr "<" ExprList ","? ">"
  //
  maybeGenericTypeInstance(lhs :Expr, pr :prec, ctx :exprCtx) :Expr {
    const p = this
    assert(p.tok == token.LSS)  // enter at token.LSS "<"
    return p.tryWithBacktracking(

      // try to parse as generic type, e.g. "x<y>"
      () => {
        let t = p.types.resolve(lhs)
        let tx = new TypeExpr(lhs.pos, lhs.scope, t)
        return p.genericTypeInstance(tx)
      },

      // else, parse as binary expression, e.g. "x < y"
      () => p.maybeBinaryExpr(lhs, pr, ctx),
    )
  }


  unaryExpr(pr :prec, ctx :exprCtx) :Expr {
    // UnaryExpr = PrimaryExpr | unary_op UnaryExpr
    const p = this
    const t = p.tok
    const pos = p.pos

    switch (t) {
      case token.ADD:
      case token.SUB:
      case token.NOT:
      case token.XOR: {
        p.next()
        // unaryExpr may have returned a parenthesized composite literal
        // (see comment in operand)
        let x = new Operation(pos, p.scope, t, p.unaryExpr(pr, ctx))
        p.types.resolve(x)

        let isint = x.type instanceof IntType
        if (!isint && t != token.ADD && t != token.SUB) {
          p.syntaxError(
            `invalid operation ${tokstr(t)} ${p.types.resolve(x.x)}`
          )
        }

        return x
        // legacy: unparen(p.unaryExpr(ctx)) to unwrap ParenExpr.
      }

      // TODO: case token.ARROWL; `<-x`, `<-chan E`
    }

    return p.primExpr(pr, ctx)
  }


  primExpr(pr :prec, ctx :exprCtx) :Expr {
    // PrimaryExpr =
    //   Operand |
    //   Conversion |
    //   PrimaryExpr Selector |
    //   PrimaryExpr Index |
    //   PrimaryExpr Slice |
    //   PrimaryExpr TypeAssertion |
    //   PrimaryExpr Arguments .
    //
    // Selector       = "." identifier .
    // Index          = "[" Expression "]" .
    // Slice          = "[" ( [ Expression ] ":" [ Expression ] ) |
    //                      ( [ Expression ] ":" Expression ":" Expression )
    //                  "]" .
    // TypeAssertion  = "." "(" Type ")" .
    // Arguments      = "("
    //   [ (  ExpressionList | Type [ "," ExpressionList ] ) [ "..." ] [ "," ]]
    //   ")" .
    let p = this
    let x = p.operand(ctx)

    loop:
    while (true) switch (p.tok) {

      case token.LPAREN:
        x = p.call(x, ctx)
        break  // may be more calls, e.g. foo()()()

      case token.LBRACKET:
        x = p.bracketExpr(x, ctx)
        break

      case token.DOT:
        x = p.selectorExpr(x, ctx)
        break

      case token.LSS:
        // could be either x<y (LT x y) or x<y> (type x y)
        x = p.maybeGenericTypeInstance(x, pr, ctx)
        break

      default:
        break loop
    }

    return x
  }


  // TODO: callNativeType(fun :Expr, t :NativeType) :CallExpr {
  // }


  call(receiver :Expr, _ :exprCtx) :CallExpr {
    // Arguments = "(" [
    //     ( ExpressionList | Type [ "," ExpressionList ] )
    //     [ "..." ] [ "," ]
    //   ] ")"
    const p = this

    // expected arguments from potentially known function type
    let argtypes :Type[] = []

    // do we know the function type?
    if (receiver instanceof TypeExpr) {
      dlog(`calling a type ${receiver.type} (via receiver is TypeExpr)`)
      if (receiver.type instanceof NativeType) {
        // TODO: fast path for common case: conversion to native type
        // return p.callNativeType(receiver, receiver.type.type)
      }
      argtypes = [ receiver.type ]
    } else if (receiver.type instanceof FunType) {
      argtypes = receiver.type.args
    } else {
      assert(
        receiver.type == null,
        `resolved, unexpected receiver=${receiver} .type=${receiver.type} ` +
        `(${receiver.type && receiver.type.constructor.name})`
      )
    }

    // call or conversion
    // convtype '(' expr ocomma ')'
    const pos = p.pos
    const args = [] as Expr[]
    let hasDots = false

    p.want(token.LPAREN)

    if (receiver.type && !receiver.type.isUnresolved) {
      // parse expected arguments with type information
      let i = 0  // index into argtypes
      let restType :Type|null = null  // set when we encounter ...
      while (p.tok != token.EOF && p.tok != token.RPAREN) {
        // parse arg with expected argtype as context
        let argtype :Type|null = restType
        if (!argtype) {
          argtype = argtypes[i++] || null
          if (argtype instanceof RestType) {
            restType = argtype
          }
        }
        // parse arg with context set to the expected argument type
        args.push(p.expr(argtype))
        hasDots = p.got(token.ELLIPSIS)
        if (!p.ocomma(token.RPAREN) || hasDots) {
          break
        }
      }
      // Note: Actual verification and conversion of argument types is done
      // by the resolver.
    } else {
      // The function type is unknown.
      // Parse any arguments until we encounter a closing ")"
      while (p.tok != token.EOF && p.tok != token.RPAREN) {
        args.push(p.expr(null))
        hasDots = p.got(token.ELLIPSIS)
        if (!p.ocomma(token.RPAREN) || hasDots) {
          break
        }
      }
    }

    p.want(token.RPAREN)

    return new CallExpr(pos, p.scope, receiver, args, hasDots)
  }


  operand(ctx :exprCtx) :Expr {
    // Operand   = Literal | OperandName | MethodExpr | "(" Expression ")" .
    // Literal   = NumLit | string_lit | CompositeLit | FunctionLit .
    // NumLit    = int_lit | float_lit
    // OperandName = identifier | QualifiedIdent.
    const p = this

    switch (p.tok) {
      case token.NAME:
      case token.NAMEAT:
        return p.dotident(ctx, p.resolveVal(p.ident()))

      case token.LPAREN:
        return p.parenExpr(ctx)

      case token.FUN:
        return p.funExpr(ctx)

      case token.LBRACE:
        p.pushScope()
        const b = p.block()
        p.popScope()
        return b

      case token.IF:
        return p.ifExpr(ctx)

      // case _Lbrack, _Chan, _Map, _Struct, _Interface:
      //   return p.type_() // othertype

      case token.LBRACKET:
        return p.listExpr(ctx)

      case token.STRING:
        return p.strlit()

      case token.INT:
      case token.INT_BIN:
      case token.INT_OCT:
      case token.INT_HEX:
        return p.intLit(ctx, p.tok)

      case token.CHAR:
        return p.charLit(ctx)

      case token.FLOAT:
        return p.floatLit(ctx)

      default: {
        const x = p.bad()
        p.syntaxError("expecting expression")
        return x
      }
    }
  }


  charLit(ctx :exprCtx) :NumLit {
    const p = this
    assert(p.int32val >= 0, 'negative character value')
    const x = new CharLit(p.pos, p.scope, p.int32val)
    p.next() // consume literal token
    return p.numLitConv(x, p.ctxType(ctx))
  }


  floatLit(ctx :exprCtx) :NumLit {
    const p = this
    assert(!isNaN(p.floatval), 'scanner produced invalid number')
    const x = new FloatLit(p.pos, p.scope, p.floatval, t_f64)
    p.next() // consume literal token
    let dstt = p.ctxType(ctx)
    if (dstt) {
      if (dstt === t_f32) {
        // common case: context is f32 and we parsed a float literal.
        // attempt to fit the literal into f32.
        let [, lossless] = numconv(x.value, t_f32)
        if (lossless) {
          x.type = t_f32
        } else {
          p.syntaxError(`constant ${x} overflows ${t_f32}`, x.pos)
        }
      } else if (dstt !== x.type) {
        return p.numLitConv(x, dstt)
      }
    }
    return x
  }


  intLit(
    ctx :exprCtx,
    tok :token.INT | token.INT_BIN | token.INT_OCT | token.INT_HEX,
  ) :NumLit {
    const p = this
    let x :IntLit

    // prefer signed integer types when the value fits
    if (p.int64val) {
      if (p.int64val.isSigned || p.int64val.lte(SInt64.MAX)) {
        x = new IntLit(p.pos, p.scope, p.int64val.toSigned(), t_i64, tok)
      } else {
        assert(p.int64val instanceof UInt64)
        x = new IntLit(p.pos, p.scope, p.int64val, t_u64, tok)
      }
    } else {
      const t = p.int32val <= 0x7fffffff ? t_int : t_uint
      x = new IntLit(p.pos, p.scope, p.int32val, t, tok)
    }

    p.next() // consume literal token

    // return possibly-converted number literal
    return p.numLitConv(x, p.ctxType(ctx))
  }


  // numLitConv may convert x (in-place) to a different type as requested by reqt.
  //
  numLitConv(x :NumLit, reqt :Type|null) :NumLit {
    if (!reqt) {
      return x
    }
    const p = this
    // unwrap rest type. e.g. ...u32 => u32
    if (reqt instanceof RestType) {
      reqt = reqt.types[0]
    }
    if (reqt instanceof NumType) {
      // capture refs to current type and value before converting, as
      // convertToType may change these properties.
      let xv = x.value
      let xt = x.type
      if (!x.convertToType(reqt)) {
        if ((xt instanceof IntType) == (reqt instanceof IntType)) {
          p.syntaxError(`constant ${xv} overflows ${reqt.name}`, x.pos)
        } else {
          p.syntaxError(`constant ${xv} (type ${xt}) truncated to ${reqt.name}`, x.pos)
        }
      }
    } else {
      // reqt is not a number type
      p.syntaxError(`invalid value ${x.value} for type ${reqt}`, x.pos)
    }
    return x
  }


  numLitErrH = (msg :string, pos :Pos) => {
    this.syntaxError(msg, pos)
  }


  strlit() :StringLit {
    const p = this
    assert(p.tok == token.STRING)
    const bytes = p.takeByteValue()
    const t = p.types.getStrType(bytes.length)
    const n = new StringLit(p.pos, p.scope, bytes, t)
    p.next()
    return n
  }


  // SelectorExpr = Expr "." ( Ident | IntLit )
  //
  selectorExpr(operand :Expr, ctx :exprCtx) :SelectorExpr|IndexExpr {
    const p = this
    p.want(token.DOT)
    const pos = p.pos  // pos is after "."

    let rhs :Expr

    switch (p.tok) {

    case token.NAME:
      // e.g. "a.b"
      rhs = p.dotident(ctx, p.ident())
      break

    case token.INT:
    case token.INT_BIN:
    case token.INT_OCT:
    case token.INT_HEX:
      // e.g. "t.3"
      let x = new IndexExpr(pos, p.scope, operand, p.intLit(ctx, p.tok))
      let optype = operand.type ? operand.type.canonicalType() : null
      if (optype instanceof TupleType) {
        if (!p.types.maybeResolveTupleAccess(x)) {
          x.type = p.types.markUnresolved(x)
        }
      } else {
        // numeric access on something that's not a tuple
        x.type = p.types.markUnresolved(x)
        p.syntaxError(
          `numeric field access on non-tuple type ${optype}`,
          pos
        )
      }
      return x

    default:
      p.syntaxError('expecting name or integer after "."')
      rhs = p.bad(pos)
      break
    }

    return new SelectorExpr(pos, p.scope, operand, rhs)
  }


  // dotident = Ident | SelectorExpr
  //
  dotident(ctx :exprCtx, ident :Ident) :Ident|SelectorExpr|IndexExpr {
    const p = this
    return p.tok == token.DOT ? p.selectorExpr(ident, ctx) : ident
  }


  // ListExpr = "[" ExprList [("," | ";")] "]"
  //
  listExpr(ctx :exprCtx) :ListExpr {
    const p = this
    const pos = p.pos
    p.want(token.LBRACKET)

    let l :Expr[] = []
    let ctxt = p.ctxType(ctx)
    let t :ListType|null = ctxt instanceof ListType ? ctxt : null
    let itemtype :Type|null = t ? t.types[0] : null

    while (p.tok != token.RBRACKET) {
      let x = p.expr(itemtype)
      if (!t) {
        if (x.type && !x.type.isUnresolved) {
          t = new ListType(x.type)
        }
      } else {
        x = p.types.convert(t.types[0], x) || x
      }
      l.push(x)
      if (p.tok as token != token.RBRACKET && !p.ocomma(token.RBRACKET)) {
        break  // error: unexpected ;, expecting comma, or )
      }
    }
    p.want(token.RBRACKET)

    if (l.length == 0 && !t) {
      p.syntaxError(`unable to infer type of empty list`, pos)
    }

    return new ListExpr(pos, p.scope, l, t)
  }


  typedListExpr(operand :TypeExpr) :ListExpr {
    return this.listExpr(operand.type)
  }


  // bracketExpr = ListExpr | TypeExpr | IndexExpr | SliceExpr
  // IndexExpr   = Expr "[" Expr "]"
  // SliceExpr   = Expr "[" Expr? ":" Expr? "]"
  //
  bracketExpr(operand :Expr, ctx :exprCtx) :ListExpr|TypeExpr|IndexExpr|SliceExpr|BadExpr {
    const p = this

    if (operand instanceof TypeExpr) {
      // operand is type, e.g. int[][...
      //                       ~~~~~
      return p.typedListExpr(operand)
    }

    // Note on case where operand.type instanceof TypeType
    //
    // operand is type, e.g. int[...
    //                       ~~~
    // This syntax is a little tricky as it only works when the type has been
    // resolved already.
    // It means that the following cases are different:
    //
    // Case 1:
    //   type foo int
    //   a = foo[1, 2]  // ok as foo's type is resolved here
    //
    // Case 2:
    //   a = foo[1, 2]  // error, as foo's type is unknown here
    //   type foo int
    //
    // We could work around this by looking for commas when parsing the
    // brackets, but single-item expressions would become ambiguous. e.g.
    //
    //   int[2, 3] would be parsed as ListExpr
    //   int[2]    would be parsed as IndexExpr !
    //   int[2,]   would be parsed as ListExpr
    //   int[][2]  would be parsed as ListExpr
    //
    // So, it would be a very small benefit (not having to add "[]" at end of
    // list type expr) but introduce unintuitive syntax, which isn't worth it.

    const pos = p.pos
    p.want(token.LBRACKET)

    if (p.got(token.RBRACKET)) {
      // list type expression. e.g. x[]
      let opt :Type = p.types.resolve(operand).canonicalType()
      let lt = p.types.getGenericInstance(t_list, [opt])
      return new TypeExpr(pos, p.scope, lt)
    }

    let x1 :Expr|null = null
    if (p.tok != token.COLON) {
      x1 = p.expr(ctx)
    }

    if (p.got(token.COLON)) {
      // slice, e.g. "x[1:3]", "x[:3]", "x[1:]", "x[:]"
      let endx :Expr|null = null

      if (!p.got(token.RBRACKET)) {
        // explicit end, e.g. "x[1:3]", "x[:3]
        endx = p.expr(ctx)
        p.want(token.RBRACKET)
      } // else: implicit end, e.g. "x[1:]", "x[:]"

      let x = new SliceExpr(pos, p.scope, operand, x1, endx)

      if (operand.type instanceof TupleType) {
        // non-uniform operand type
        // we need to resolve indexes to find type
        if (!p.types.tupleSlice(x)) {
          x.type = p.types.markUnresolved(x)
        }
      } else dlog(`TODO handle uniform slice operand ${operand.type}`)

      return x
    }

    // index
    if (!p.got(token.RBRACKET)) {
      p.syntaxError(`in index expression; expecting ]`)
      if (p.tok == token.COMMA) {
        // common mistake: int[1,2] -- really want int[][1,2]
        p.diag("info", `Did you mean ${operand}[] here?`, pos, "E_SUGGESTION")
      }
      p.advanceUntil(token.RBRACKET) // avoids superfluous errors in common cases
      p.next()
      return p.bad(pos)
    }

    assert(x1 != null)
    assert(x1 instanceof Expr)

    let x = new IndexExpr(pos, p.scope, operand, x1 as Expr)

    if (operand.type instanceof TupleType) {
      // non-uniform operand type
      // we need to resolve index to find type
      if (!p.types.maybeResolveTupleAccess(x)) {
        x.type = p.types.markUnresolved(x)
      }
      return x
    }

    // else: operand is unitype or unknown
    dlog(`TODO resolve item type for uniform operand of type ${operand.type}`)
    x.type = p.types.markUnresolved(x)
    return x
    // return p.types.resolveIndex(x)
  }


  // ParenExpr = "(" Expr ","? ")" | TupleExpr | Assignment
  // TupleExpr = "(" Expr ("," Expr)+ ","? ")"
  //
  parenExpr(ctx :exprCtx) :Expr {
    const p = this
    const pos = p.pos
    p.want(token.LPAREN)

    const l :Expr[] = []
    while (true) {
      l.push(p.expr(ctx))
      if (p.tok == token.ASSIGN) {
        // e.g. "(a, b = 1, 2)"
        const x = p.assignment(l)
        p.want(token.RPAREN)
        return x
      }
      if (!p.ocomma(token.RPAREN)) {
        break  // error: unexpected ;, expecting comma, or )
      }
      if (p.tok == token.RPAREN) {
        break
      }
    }
    p.want(token.RPAREN)

    return (
      // l.length == 1 ? (
      //   p.keepParens ? new ParenExpr(pos, p.scope, l[0]) :
      //   l[0]
      // ) :
      l.length == 1 ? l[0] :
      new TupleExpr(pos, p.scope, l, /*type*/null)
    )
  }


  bad(pos? :Pos) :BadExpr {
    const p = this
    return new BadExpr(pos === undefined ? p.pos : pos, p.scope)
  }


  badTypeExpr(pos? :Pos) :BadTypeExpr {
    const p = this
    return new BadTypeExpr(pos === undefined ? p.pos : pos, p.scope)
  }


  // maybeType parses a type.
  // Returns null if there was no type.
  //
  // If you expect a type, use type() instead which repors an error if no
  // type is found.
  //
  // Type     = TypeName | TypeLit | "(" Type ")" .
  // TypeName = identifier | QualifiedIdent .
  // TypeLit  = ArrayType | StructType | PointerType | FunctionType
  //          | InterfaceType | SliceType | MapType | Channel_Type
  //
  maybeType() :TypeExpr|null {
    const p = this
    let tx :TypeExpr|null = null

    switch (p.tok) {

      case token.NAME: {
        let x = p.dotident(null, p.resolveType(p.ident()))
        tx = new TypeExpr(x.pos, x.scope, p.types.resolve(x))
        break
      }

      case token.LPAREN:
        tx = p.tupleType()
        break

      case token.LBRACE:
        dlog(`TODO: parse struct type`)
        break

      // case token.LBRACKET:
      //   dlog(`TODO: parse list type`)
      //   break //p.tupleType()

      // TODO: all other types
    }

    if (tx) {
      // generic use. e.g. T<A,B>
      if (p.tok == token.LSS) {
        tx = p.genericTypeInstance(tx)
      }

      // list. e.g. T[][]
      while(p.tok == token.LBRACKET) {
        tx = p.listType(tx)
      }
    }

    return tx
  }


  // GenericTypeInstance = Type "<" (TypeArgs ","? )? ">"
  // TypeArgs            = Type ("," Type)*
  //
  genericTypeInstance(tx :TypeExpr) :TypeExpr {
    const p = this
    const pos = p.pos
    const args :Type[] = []

    p.want(token.LSS)  // consume "<"

    read_loop: while (p.tok != token.GTR) {
      let tx2 = p.type()
      assert(tx2.type, 'null type')
      args.push(tx2.type)
      if (p.tok == token.COMMA) {
        p.next() // consume optional comma
      } else {
        // end of type def
        if (p.tok == token.SHR) {
          // convert token ">>" to ">", effectively creating the appearance
          // that there are a token ">" followed by a token ">".
          // This happens because the scanner is unable to distinguish between
          // ">>" and ">".
          p.tok = token.GTR
        } else {
          if (p.tok as token != token.GTR) {
            p.syntaxError(`expecting comma or >`)
            p.advanceUntil(token.GTR)
          }
          p.next() // consume ">"
        }
        break
      }
    }

    let proto = tx.type.canonicalType()
    let alias = (tx.type instanceof AliasType) ? tx.type : null
    if (proto instanceof GenericType) {
      tx.type = p.types.getGenericInstance(proto, args)
    } else if (proto instanceof UnresolvedType) {
      tx.type = new GenericTypeInstance(proto, args)
    } else {
      p.syntaxError(`instantiating non-generic type ${proto}`, pos)
    }

    if (alias) {
      tx.type = new AliasType(alias.name, tx.type)
    }

    return tx
  }


  listType(tx :TypeExpr) :TypeExpr {
    const p = this
    p.want(token.LBRACKET)
    p.want(token.RBRACKET)
    tx.type = new ListType(tx.type)
    return tx
  }


  // type parses a type
  //
  type() :TypeExpr {
    const p = this
    let t = p.maybeType()
    if (t) {
      return t
    }
    t = p.badTypeExpr()
    p.syntaxError("expecting type")
    p.next()
    return t
  }


  // TupleType = "(" Type ("," Type)+ ","? ")"
  // Returns null for empty tuples, i.e. "()"
  // Returns the inner type for single-type tuples, i.e. "(Type)"
  //
  tupleType() :TypeExpr|null {
    const p = this
    p.want(token.LPAREN)
    const pos = p.pos
    let tx :TypeExpr | null = null
    const types = [] as Type[]

    while (p.tok != token.RPAREN) {
      tx = p.type()
      assert(tx.type, 'null type')
      types.push(tx.type as Type)
      if (!p.ocomma(token.RPAREN)) {
        // error: unexpected ;, expecting comma, or )
        break
      }
    }
    p.want(token.RPAREN)

    if (!tx) {
      return null  // "()"  => null
    }

    if (types.length == 1) {
      return tx as TypeExpr  // "(a)" => "a"
    }

    const tupleType = p.types.getTupleType(types)
    return new TypeExpr(pos, p.scope, tupleType)
  }


  // IdentifierList = identifier { "," identifier } .
  // The first identifier must be provided.
  identList(first :Ident) :Ident[] {
    const p = this
    const l = [first]
    while (p.got(token.COMMA)) {
      l.push(p.ident())
    }
    return l
  }

  ident() :Ident {
    const p = this
    const pos = p.pos
    if (p.tok == token.NAME) {
      const s = strings.get(p.takeByteValue(), p.hash)
      p.next()
      return new Ident(pos, p.scope, s)
    }
    p.syntaxError("expecting identifier", pos)
    p.advanceUntil()
    return new Ident(pos, p.scope, str__)
  }

  maybeIdent() :Ident|null {
    const p = this
    return (p.tok == token.NAME) ? p.ident() : null
  }

  fallbackIdent(pos? :Pos) :Ident {
    const p = this
    return new Ident(pos === undefined ? p.pos : pos, p.scope, str__)
  }

  // osemi parses an optional semicolon.
  osemi(follow :token) :bool {
    const p = this

    switch (p.tok) {
      case token.SEMICOLON:
        p.next()
        return true

      case token.RPAREN:
      case token.RBRACE:
        // semicolon is optional before ) or }
        return true
    }

    p.syntaxError("expecting semicolon, newline, or " + tokstr(follow))
    p.advanceUntil(follow)
    return false
  }

  // ocomma parses an optional comma.
  //
  // Note: If you are looking for optionally parsing a comma, without
  // error reporting, then simply the following would be enough:
  //
  //   if (p.tok == token.COMMA) {
  //     p.next()
  //   }
  //
  ocomma(follow :token) :bool {
    const p = this

    switch (p.tok) {
      case token.COMMA:
        p.next()
        return true

      case token.RPAREN:
      case token.RBRACE:
        // comma is optional before ) or }
        return true
    }

    p.syntaxError("expecting comma, or " + tokstr(follow))
    p.advanceUntil(follow)
    return false
  }

  // appendGroup(f) = f | "(" { f ";" } ")" .
  appendGroup<D extends Decl>(list :D[], f :(g:Group|null, i:int)=>D) {
    const p = this
    let i = 0
    if (p.got(token.LPAREN)) {
      const g = new Group()
      while (p.tok != token.EOF && p.tok != token.RPAREN) {
        list.push(f(g, i++))
        if (!p.osemi(token.RPAREN)) {
          break
        }
      }
      p.want(token.RPAREN)
    } else {
      list.push(f(null, i))
    }
  }


  // tryWithBacktracking takes two or more functions which represents
  // different possiblities, or branches, of ambiguous syntax which requires
  // backtracking. In case one function fails to parse, then the parser
  // "backtracks" to where it started and tries the next function.
  //
  // The following steps are performed, starting with the first function:
  //
  //   1. Record a snapshot of the scanner state
  //   2. If this is the last function, simply call the function and
  //      return its value, else...
  //   3. wrap the function call in a try-catch block
  //   4. Setup the syntax error handler to throw an error instead of
  //      reporting errors.
  //   5. Call the function and return its value
  //      - If the function executed without throwing an exception, then
  //        its return value is returned from this function and we are done.
  //      - If a SyntaxError was thrown, advance to the next function and
  //        continue with step 1.
  //      - Any other error thrown will propagate.
  //
  tryWithBacktracking<R>(...f :(()=>R)[]) :R {
    // make sure syntax errors cause exceptions
    let origRaiseOnSyntaxError = this.throwOnSyntaxError
    this.throwOnSyntaxError = true
    let s = this.allocSnapshot()
    let i = 0
    try {
      this.recordSnapshot(s)
      while (i < f.length-1) {
        try {
          return f[i]()
        } catch (e) {
          if (!(e instanceof SyntaxError)) { throw e }
          // fall through and try next function
        }
        i++
        this.restoreSnapshot(s)
      }
    } finally {
      // restore throwOnSyntaxError and free snapshot
      this.throwOnSyntaxError = origRaiseOnSyntaxError
      this.freeSnapshot(s)
    }
    // last function is called without a "harness"
    return f[i]()
  }


  // advanceUntil consumes tokens until it finds a token of the followlist.
  // The stopset is only considered if we are inside a function (p.fnest > 0).
  // The followlist is the list of valid tokens that can follow a production;
  // if it is empty, exactly one token is consumed to ensure progress.
  //
  // Not speed critical, advance is only called in error situations.
  //
  advanceUntil(...followlist :token[]) {
    const p = this

    if (followlist.length == 0) {
      p.next()
      return
    }

    // TODO: improve performance of this, especially followlist.includes

    if (p.fnest > 0) {
      // The stopset contains keywords that start a statement.
      // They are good synchronization points in case of syntax
      // errors and (usually) shouldn't be skipped over.
      loop1:
      while (!followlist.includes(p.tok)) {
        switch (p.tok) {
          case token.EOF:
          case token.BREAK:
          // case token.CONST:
          case token.CONTINUE:
          case token.DEFER:
          case token.FALLTHROUGH:
          case token.FOR:
          case token.FUN:
          case token.GO:
          // case token.GOTO:
          case token.IF:
          case token.RETURN:
          case token.SELECT:
          case token.SWITCH:
          case token.TYPE:
            break loop1
        }
        p.next()
      }
    } else {
      while (!(p.tok == token.EOF || followlist.includes(p.tok))) {
        p.next()
      }
    }
  }

  // syntaxError reports a syntax error
  // If a BadExpr then no error was reported and backtracking should follow,
  // by the caller to this function returning the BadExpr object.
  //
  syntaxError(msg :string, pos :Pos = this.pos) :BadExpr|null {
    const p = this

    if (p.throwOnSyntaxError) {
      throw new SyntaxError(msg, pos)
    }

    let position = p.sfile.position(pos)

    // if (p.tok == token.EOF) {
    //   return // avoid meaningless follow-up errors
    // }

    // add punctuation etc. as needed to msg
    if (msg == "") {
      // msg is empty; ok
    } else if (
      msg.startsWith("in ") ||
      msg.startsWith("at ") ||
      msg.startsWith("after ") ||
      msg.startsWith("expecting ")
    ) {
      msg = " " + msg
    } else {
      // plain error - we don't care about current token
      p.errorAt(msg, position)
      return null
    }

    let cond = (
      p.tok == token.EOF ? 'unexpected end of input' :
      `unexpected ${tokstr(p.tok)}`
    )
    p.errorAt(cond + msg, position)
    if (DEBUG) {
      // print token state when compiled in debug mode
      console.error(`  p.tok = ${token[p.tok]} ${tokstr(p.tok)}`)
    }
    return null
  }

  // diag reports a diagnostic message, or an error if k is ERROR
  //
  diag(k :DiagKind, msg :string, pos :Pos = this.pos, code? :ErrorCode) {
    const p = this
    // if (code !== undefined) {
    //   // level overridden?
    //   k = p.diagConfig[code] || k
    // }
    if (k == "error") {
      p.error(msg, pos, code)
    } else if (p.diagh) {
      p.diagh(p.sfile.position(pos), msg, k)
    }
  }

}

// unparen removes all parentheses around an expression.
// function unparen(x :Expr) :Expr {
//   while (x instanceof ParenExpr) {
//     x = x.x
//   }
//   return x
// }

function isEmptyFunExpr(d :Decl) :bool {
  return d instanceof FunExpr && !d.body
}
