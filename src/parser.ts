import { SrcFile, Position, Pos } from './pos'
import { token, tokstr, prec } from './token'
import * as scanner from './scanner'
import { ByteStr, ByteStrSet } from './bytestr'
import {
  Universe,
  u_t_void,
  u_t_auto,
  u_t_usize,
  u_t_i64,
  u_t_u32,
} from './universe'
// import { debuglog } from './util'
import {
  File,
  Scope,
  Ent,
  Node,
  Group,
  Comment,
  Ident,
  RestExpr,
  Field,
  Decl,
  ImportDecl,
  VarDecl,
  TypeDecl,
  FunDecl,
  FunSig,
  Expr,
  // LiteralExpr,
  BasicLit,
  StringLit,
  Stmt,
  BlockStmt,
  ExprStmt,
  SimpleStmt,
  ReturnStmt,
  AssignStmt,
  DeclStmt,
  Operation,
  CallExpr,
  ParenExpr,
  TupleExpr,
  BadExpr,
  SelectorExpr,
  TypeConversionExpr,
  Type,
  UnresolvedType,
  RestType,
  ConstStringType,
  TupleType,
  FunType,
} from './ast'

// type of diagnostic
export enum DiagKind {
  INFO,
  WARN,
}

// A DiagHandler may be provided to Parser.init. If a diagnostic message is
// produces and a handler was installed, the handler is called with a
// position, kind of diagnostic and a message.
// The position points to the beginning of the related source code.
//
export type DiagHandler = (p :Position, msg :string, k :DiagKind) => void

const kEmptyByteArray = new Uint8Array(0)
const kBytes__ = new Uint8Array([0x5f]) // '_'
const kBytes_dot = new Uint8Array([0x2e]) // '.'
const kBytes_init = new Uint8Array([0x69, 0x6e, 0x69, 0x74]) // 'init'

const emptyExprList :Expr[] = []

type exprCtx = AssignStmt|VarDecl|null


// Parser scans source code and produces AST.
// It must be initialized via init before use or resue.
//
export class Parser extends scanner.Scanner {
  fnest      :int = 0   // function nesting level (for error handling)
  universe   :Universe
  strSet     :ByteStrSet
  comments   :Comment[]|null
  scope      :Scope
  filescope  :Scope
  pkgscope   :Scope
  unresolved :Set<Ident>  // unresolved identifiers
  diagh      :DiagHandler|null
  initfnest  :int = 0  // tracks if we're inside an init function

  _id__      :ByteStr
  _id_dot    :ByteStr
  _id_init   :ByteStr

  initParser(
    sfile    :SrcFile,
    sdata    :Uint8Array,
    universe :Universe,
    pkgscope :Scope|null,
    errh     :scanner.ErrorHandler|null = null,
    diagh    :DiagHandler|null = null,
    smode    :scanner.Mode = scanner.Mode.None
  ) {
    const p = this
    super.init(sfile, sdata, errh, smode)
    p.scope = new Scope(pkgscope)
    p.filescope = p.scope
    p.pkgscope = pkgscope || p.filescope
    
    p.fnest = 0
    p.universe = universe
    p.strSet = universe.strSet
    p.comments = null
    p.unresolved = new Set<Ident>()
    p.diagh = diagh
    p.initfnest = 0

    p._id__ = p.strSet.emplace(kBytes__)
    p._id_dot = p.strSet.emplace(kBytes_dot)
    p._id_init = p.strSet.emplace(kBytes_init)

    if (smode & scanner.Mode.ScanComments) {
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
  
  want(tok :token) {
    const p = this
    if (!p.got(tok)) {
      p.syntaxError(`expecting ${tokstr(tok)}`)
      p.next()
    }
  }

  pushScope(scope :Scope | null = null) {
    const p = this
    if (scope) {
      assert(scope.outer != null, 'pushing scope without outer scope')
    }
    p.scope = scope || new Scope(p.scope)
    // debuglog(`${(p as any).scope.outer.level()} -> ${p.scope.level()}`)
  }

  popScope() :Scope { // returns old ("popped") scope
    const p = this
    const s = p.scope
    assert(p.scope.outer != null, 'pop scope at base scope')
    // debuglog(` ${(p as any).scope.outer.level()} <- ${p.scope.level()}`)
    p.scope = p.scope.outer as Scope
    return s
  }

  declare(scope :Scope, ident: Ident, decl :Node, x: Expr|null) :Ent|null {
    const p = this
    const ent = new Ent(ident.value, decl, x)
    if (!scope.declareEnt(ent)) {
      p.syntaxError(`${ident} redeclared`, ident.pos)
    }
    // else { debuglog(`${ident} in scope#${scope.level()}`) }
    return ent
  }

  declarev(scope :Scope, idents: Ident[], decl :Node, xs: Expr[]|null) {
    const p = this
    for (let i = 0; i < idents.length; ++i) {
      p.declare(scope, idents[i], decl, xs && xs[i] || null)
    }
  }

  // If x is an identifier, resolve attempts to resolve x by looking up
  // the entity it denotes. If no entity is found and collectUnresolved is
  // set, x is marked as unresolved and collected in the list of unresolved
  // identifiers.
  // Returns the input expression
  //
  resolve<N extends Expr>(x :N, collectUnresolved :bool = true) :N {
    const p = this
    // nothing to do if x is not an identifier or the blank identifier
    if (!(x instanceof Ident)) {
      return x
    }

    assert(x.ent == null, "identifier already declared or resolved")
    if (x.value === p._id__) {
      return x
    }

    // try to resolve the identifier
    let s :Scope|null = x.scope
    while (s) {
      const ent = s.lookupImm(x.value)
      if (ent) {
        // debuglog(`${x} found in scope#${s.level()}`)
        x.ent = ent
        return x
      }
      s = s.outer
    }
    // debuglog(`${x} not found`)
    if (collectUnresolved) {
      // all local scopes are known, so any unresolved identifier
      // must be found either in the file scope, package scope
      // (perhaps in another file), or universe scope --- collect
      // them so that they can be resolved later
      p.unresolved.add(x)
    }

    return x
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

  importDecl = (group :Group|null) :ImportDecl => {
    const p = this
    let localIdent :Ident|null = null
    let hasLocalIdent = false
  
    switch (p.tok) {
      case token.NAME:
        localIdent = p.ident()
        hasLocalIdent = true
        break

      case token.DOT:
        const s = p._id_dot
        localIdent = new Ident(p.pos, p.scope, s)
        p.next()
        break
    }

    let path :StringLit
    if (p.tok == token.STRING) {
      path = p.strlit()
    } else {
      p.syntaxError("missing import path; expecting quoted string")
      path = new StringLit(p.pos, p.scope, kEmptyByteArray)
      p.advanceUntil(token.SEMICOLON, token.RPAREN)
    }

    const d = new ImportDecl(p.pos, p.scope, path, localIdent)
    // d.Group = group

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
        case token.VAR:
          p.next() // consume "var"
          p.appendGroup(decls, p.varDeclExplicit)
          break

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
          decls.push(p.funDecl())
          break

        // TODO: token.TYPE

        default: {
          if (
            p.tok == token.LBRACE &&
            decls.length > 0 &&
            isEmptyFunDecl(decls[decls.length-1])
          ) {
            // opening { of function declaration on next line
            p.syntaxError("unexpected semicolon or newline before {")
          } else {
            p.syntaxError("non-declaration statement outside function body")
          }

          p.error(`TODO file-level token \`${tokstr(p.tok)}\``); p.next()

          p.advanceUntil(/*token.CONST, */token.TYPE, token.VAR, token.FUN)
          continue
        }
      }

      if ((p.tok as token) != token.EOF && !p.got(token.SEMICOLON)) {
        p.syntaxError("after top level declaration")
        p.advanceUntil(/*token.CONST, */token.TYPE, token.VAR, token.FUN)
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

  typeDecl = (group :Group|null, nth :int) :TypeDecl => {
    // TypeSpec = "type" identifier [ "=" ] Type
    const p = this
    const pos = p.pos
    const ident = p.ident()
    const alias = p.got(token.ASSIGN)

    let t = p.maybeType()
    if (!t) {
      t = p.bad()
      p.syntaxError("in type declaration")
      p.advanceUntil(token.SEMICOLON, token.RPAREN)
    }

    const d = new TypeDecl(pos, p.scope, ident, alias, t, group)
    // TODO: declare in scope
    return d
  }

  // resolveType attempts to resolve or infer the type of n.
  // Returns UnresolvedType if the type refers to an undefined identifier.
  // May mutate n.type
  //
  maybeResolveType(n :Expr) :Type|null {
    const p = this

    if (n instanceof Type) {
      return n
    }

    if (n.type) {
      return p.resolveType(n.type)
    }

    if (n instanceof Ident) {
      if (n.ent) {
        if (n.ent.value) {
          return p.maybeResolveType(n.ent.value)
        }
        if (n.ent.decl instanceof Expr) {
          return p.maybeResolveType(n.ent.decl)
        }
      }
      // else: unresolved -- unknown type
      return null
    }

    if (n instanceof FunDecl) {
      const s = n.sig
      return new FunType(
        s.pos,
        s.scope,
        s.params.map(field => p.resolveType(field.type)),
        p.resolveType(s.result),
      )
    }

    if (n instanceof TupleExpr) {
      let types :Type[] = []
      for (const x1 of n.exprs) {
        const t = p.resolveType(x1)
        if (!t) {
          return null
        }
        types.push(t)
      }
      return new TupleType(n.pos, n.scope, types)
    }

    if (n instanceof RestExpr) {
      let t = n.expr && p.resolveType(n.expr) || u_t_auto
      return new RestType(n.pos, n.scope, t)
    }


    return null  // unknown type
  }

  // resolveType attempts to resolve or infer the type of n.
  // Returns UnresolvedType if the type refers to an undefined identifier.
  // May mutate n.type
  //
  resolveType(n :Expr) :Type {
    const p = this

    if (n instanceof Type) {
      return n
    }

    if ((n as any).type instanceof Type) {
      return (n as any).type
    }

    let t = p.maybeResolveType(n)

    if (!t) {
      t = new UnresolvedType(n.pos, n.scope, n)
      if (
        n instanceof SelectorExpr &&
        n.lhs instanceof Ident &&
        n.lhs.ent
      ) {
        // Partially resolved selector
        // "a.B undefined (type <typeof(a)> has no field or method B)"
        p.syntaxError(`${n} undefined`, n.pos)
      }
    }

    n.type = t

    return t
  }

  // resolveTypes calls resolveType on each of the input expressions.
  //
  resolveTypes(xs :Expr[]) {
    const p = this
    for (let x of xs) {
      p.resolveType(x)
    }
  }

  convertType(t :Type, x :Expr) :Expr { // TypeConversionExpr or input
    const p = this
    if (t === u_t_i64 && x.type === u_t_u32) {
      return new TypeConversionExpr(x.pos, x.scope, x, t)
    }
    p.syntaxError(`cannot convert "${x}" to type ${t}`, x.pos)
    return x
  }

  // fitType compares the type of the expression against targettyp.
  // If x's type is directly compatible with targettyp, x is returned.
  // If x's type can be converted to targettyp, a conversion expression is
  // returned, containing x.
  // Otherwise null is returned.
  //
  // fitType(targettyp :Type, x :Expr, ctx :exprCtx) :Expr|null {
  //   const p = this

  //   p.resolveType(x)

  //   if (!x.type) {
  //     // unable to infer type (may be resolved in post-resolve)
  //     return null
  //   }

  //   if (x.type === targettyp) {
  //     return x
  //   }

  //   return p.convertType(targettyp, x)
  // }

  // // fitTypes compares the type of each expression against typ.
  // // Returns a list of expressions which might contains conversion expressions.
  // //
  // fitTypes(targettyp :Type, xs :Expr[], ctx :exprCtx) :Expr[] {
  //   const p = this
  //   let xs2 :Expr[] | null = null

  //   for (let x of xs) {
  //     let x2 = p.fitType(targettyp, x, ctx) || x
  //     if (x2 !== x) {
  //       if (!xs2) { xs2 = [x2] } else { xs2.push(x2) }
  //     }
  //   }

  //   return xs2 || xs
  // }

  varDecl(pos :Pos, idents :Ident[]) :VarDecl {
    // VarDecl = IdentifierList
    //           ( Type [ "=" ExpressionList ] | "=" ExpressionList )
    const p = this
    const typ = p.maybeType()
    let isError = false

    // vars at the file level are declared in the package scope
    const scope = p.scope === p.filescope ? p.pkgscope : p.scope

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

    if (d.type) {
      // e.g. "var x, y int = 1, 0x3"
      const t = p.resolveType(d.type)
      d.type = t
      d.idents.forEach(ident => { ident.type = t })
    } else {
      assert(d.values, "no type and no vals")
      let vals = d.values as Expr[]
      // e.g. "var x, y = 1, 0x3"
      p.resolveTypes(vals)
      // copy types of values to names
      vals.forEach((v, i) => {
        let ident = d.idents[i] as Ident // we have checked len already
        ident.type = v.type
      })
    }

    p.declarev(d.scope, idents, d, d.values)

    return d
  }

  varDeclExplicit = (group :Group|null, nth :int) :VarDecl => {
    // VarDeclEx = "var" IdentifierList
    //             ( Type [ "=" ExpressionList ] | "=" ExpressionList )
    const p = this
    const pos = p.pos
    const idents = p.identList(p.ident())

    // vars at the file level are declared in the package scope
    const scope = p.scope === p.filescope ? p.pkgscope : p.scope

    const d = new VarDecl(pos, scope, idents, group)

    if (p.got(token.ASSIGN)) {
      d.values = p.exprList(/*ctx=*/d)
    } else {
      let t = p.maybeType()
      if (t) {
        d.type = t
      } else {
        d.type = p.bad()
        p.syntaxError("missing type or value in var declaration", d.pos)
      }
      if (p.got(token.ASSIGN)) {
        d.values = p.exprList(/*ctx=*/d)
      }
    }

    if (d.values) {
      p.checkDeclLen(idents, d.values.length, 'variables')
    }

    p.declarev(d.scope, idents, d, d.values)

    return d
  }

  funDecl() :FunDecl {
    // FunDecl  = "fun" FunName Signature? FunBody?
    // FunName  = identifier
    // FunBody  = ( Block | "->" Stmt )
    const p = this
    const pos = p.pos
    p.want(token.FUN)
    const name = p.ident()

    // functions called "init" at the file level are special
    const isInitFun = p.scope === p.filescope && name.value.equals(p._id_init)

    // vars at the file level are declared in the package scope
    const scope = p.scope === p.filescope ? p.pkgscope : p.scope

    // new scope for parameters, signature and body
    p.pushScope(new Scope(p.scope))
    const d = new FunDecl(pos, p.scope, name, p.funSig(u_t_void), isInitFun)

    if (isInitFun) {
      // check initfun signature (should be empty)
      if (d.sig.params.length > 0) {
        p.syntaxError(`init function with parameters`, d.sig.pos)
      }
      if (d.sig.result) {
        p.syntaxError(`init function with result`, d.sig.result.pos)
      }
    } else {
      // The function itself is declared in its outer scope, so that its body
      // can refer to the function, but also so that "funname = x" declares a
      // new variable rather than replacing the function.
      p.declare(scope, name, d, d)
    }

    // parse body
    if (isInitFun || p.tok != token.SEMICOLON) {
      
      if (isInitFun) { p.initfnest++ }

      d.body = p.funBody(name)

      if (isInitFun) { p.initfnest-- }
    }

    p.popScope()

    if (d.sig.result === u_t_void) {
      // no result type specified
      // - if the body is a single expression, result is that expression
      // - otherwise void (no result)
      d.sig.result = d.body instanceof ExprStmt ? d.body.expr : u_t_void
    }

    p.resolveType(d)

    return d
  }

  // TODO: maybeFunExpr() :Expr -- FunDecl or some other expr

  funStmt(ctx :exprCtx) :FunDecl {
    // FunStmt = "fun" FunName? Signature FunBody
    // FunBody  = ( Block | "->" Stmt )

    // FunExpr = "fun" FunName? Signature FunBody
    // FunName = identifier
    // FunBody  = ( Block | "->" Stmt )
    const p = this
    const pos = p.pos

    p.want(token.FUN)

    // "fun foo(...) { ... }"
    // "fun foo(...) -> ..."
    // "fun (...) { ... }"
    // "fun (...) -> ..."
    // "fun -> ..."
    const name = p.maybeIdent()

    const scope = p.scope
    p.pushScope(new Scope(scope)) // parmeters and body

    // declare in outer scope, before we parse the body, so that the body can
    // refer to the function's name
    const d = new FunDecl(pos, scope, name, p.funSig(u_t_void))
    if (name && !ctx) {
      // declare the function's name when it's not on the right-hand side of an
      // assignment.
      // e.g. "fun foo ..."
      p.declare(name.scope, name, d, d)
    }

    d.body = p.funBody(name)

    p.popScope()

    if (d.sig.result === u_t_void) {
      // no result type specified
      // - if the body is a single expression, result is that expression
      // - otherwise void (no result)
      d.sig.result = d.body instanceof ExprStmt ? d.body.expr : u_t_void
    }

    p.resolveType(d)

    return d
  }

  funSig(defaultType :Type): FunSig {
    // Signature = ( Parameters Result? | Type )?
    const p = this
    const pos = p.pos
    const params = p.tok == token.LPAREN ? p.parameters() : []
    const result = p.maybeType() || defaultType
    return new FunSig(pos, p.scope, params, result)
  }

  parameters() :Field[] {
    // Parameters    = "(" [ ParameterList [ "," ] ] ")"
    // ParameterList = ParameterDecl ("," ParameterDecl)*
    // ParameterDecl = Ident [ [ "..." ] Type ]
    //
    const p = this
    p.want(token.LPAREN)

    const fields = [] as Field[]
    let seenRestExpr = false

    while (p.tok != token.RPAREN) {
      let f = new Field(p.pos, p.scope, u_t_auto, null)

      f.ident = p.ident()
      p.declare(f.ident.scope, f.ident, f, null) // in function scope

      if (p.tok == token.ELLIPSIS) {
        // e.g. "fun foo(ident ... type)"
        f.type = p.restExpr(u_t_auto)
        if (seenRestExpr) {
          p.syntaxError("can only use ... with final parameter in list")
          continue  // skip this field
        } else {
          seenRestExpr = true
        }
      } else if (
        p.tok != token.COMMA &&
        p.tok != token.SEMICOLON &&
        p.tok as token != token.RPAREN)
      {
        // e.g. "fun foo(ident type)"
        f.type = p.type()
      }

      if (!p.ocomma(token.RPAREN)) {
        // error: unexpected ;, expecting comma, or )
        // e.g. "fun foo(a, b<LF>)" fix -> "fun foo(a, b,<LF>)"
        //                                              ^
        break
      }

      fields.push(f)
    }

    p.want(token.RPAREN)

    return fields
  }

  funBody(funcname :Ident|null) :Stmt {
    // FunBody  = ( "->" Stmt | Block )
    const p = this
    if (p.tok == token.LBRACE) {
      // Block
      return p.block()
    }
    const pos = p.pos
    if (p.got(token.ARROWR)) {
      // "->" Stmt
      const s = p.maybeStmt()
      if (s) {
        return s
      }
    }
    // error
    if (funcname) {
      p.syntaxError(`${funcname} is missing function body`, pos)
    } else {
      p.syntaxError("missing function body", pos)
    }
    return new SimpleStmt(pos, p.scope)
  }

  block() :BlockStmt {
    // Block = "{" StatementList "}"
    const p = this
    const pos = p.pos
    p.want(token.LBRACE)
    const list = p.stmtList()
    p.want(token.RBRACE)
    return new BlockStmt(pos, p.scope, list)
  }

  declStmt<D extends Decl>(f :(g:Group|null, i:int)=>D) :DeclStmt {
    const p = this
    const pos = p.pos
    p.next() // TYPE, or VAR
    const decls :Decl[] = []
    p.appendGroup(decls, f)
    return new DeclStmt(pos, p.scope, decls)
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

  // shouldStoreToEnt returns true if entis within atScope in such a way
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

  assignment(lhs :Expr[]) :AssignStmt {
    // Assignment = ExprList "=" ExprList
    const p = this
    p.want(token.ASSIGN) // "="

    const s = new AssignStmt(lhs[0].pos, p.scope, token.ASSIGN, lhs, [])

    // parse right-hand side in context of the function
    s.rhs = p.exprList(/*ctx=*/s)

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
      if (id instanceof Ident) {
        assert(s.rhs[i])

        // Decide declare a new ent, or store to existing one
        if (id.ent && p.shouldStoreToEnt(id.ent, id.scope)) {
          // debuglog(`store ${id}`)
          id.ent.nstores++  // increment Nth store counter
        } else {
          // debuglog(`declare ${id}`)
          // since we are about to redeclare, clear any "unresolved" mark for
          // this identifier expression.
          p.unresolved.delete(id)  // may be noop
          p.declare(id.scope, id, s, s.rhs[i])
        }
      }
    }

    return s
  }

  // SimpleStmt = EmptyStmt | ExpressionStmt | SendStmt | IncDecStmt
  //            | Assignment | ShortVarDecl .
  simpleStmt(lhs :Expr[]) :SimpleStmt {
    const p = this

    // Note: token.SET_ASSIGN ":=" is currently unused
    // we could use it to allow shadowing in same scope, e.g.
    //   "b = 4; b := true" where "b :=" redeclares b.

    if (p.tok == token.ASSIGN) {
      // e.g.  "a = 1"  "a, b = 1, 2"  "a[1], b.f = 1, 2"  etc
      return p.assignment(lhs)
    }

    const pos = lhs[0].pos

    if (lhs.length == 1) {
      // expr
      if (token.assignop_beg < p.tok && p.tok < token.assignop_end) {
        // lhs op= rhs;  e.g. "x += 2"
        const op = p.tok
        p.next() // consume operator
        const s = new AssignStmt(pos, p.scope, op, lhs, [])
        s.rhs = p.exprList(/*ctx=*/s)
        return s
      }

      if (p.tok == token.INC || p.tok == token.DEC) {
        // lhs++ or lhs--
        const op = p.tok
        p.next() // consume operator
        // check operand type
        const operand = lhs[0]
        if (operand instanceof Ident &&
            operand.ent &&
            !(operand.ent.decl instanceof VarDecl)
        ) {
          p.syntaxError(`cannot mutate ${operand}`, operand.pos)
        }
        return new AssignStmt(pos, p.scope, op, lhs, emptyExprList)
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
      return new ExprStmt(lhs[0].pos, p.scope, lhs[0])
    }

    p.syntaxError("expecting := or = or comma")
    p.advanceUntil(token.SEMICOLON, token.RBRACE)
    return new ExprStmt(lhs[0].pos, p.scope, lhs[0])
  }


  maybeStmt() :Stmt|null {
    // Statement =
    //   Declaration | LabeledStmt | SimpleStmt |
    //   GoStmt | ReturnStmt | BreakStmt | ContinueStmt | GotoStmt |
    //   FallthroughStmt | Block | IfStmt | SwitchStmt | SelectStmt | ForStmt |
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

      case token.VAR:
        return p.declStmt(p.varDeclExplicit)

      case token.TYPE:
        return p.declStmt(p.typeDecl)

      case token.ADD:
      case token.SUB:
      case token.MUL:
      case token.AND:
      case token.NOT:
      case token.XOR: // unary operators
      case token.FUN:
      case token.LPAREN: // operands
      case token.LBRACK:
      // case token.STRUCT:
      // case token.CHAN:
      case token.INTERFACE: // composite types
      // case token.ARROW: // receive operator
        return p.simpleStmt(p.exprList(/*ctx=*/null))

      // case _For:
      //   return p.forStmt()

      // case _Switch:
      //   return p.switchStmt()

      // case _Select:
      //   return p.selectStmt()

      // case _If:
      //   return p.ifStmt()

      // case _Fallthrough:
      //   s := new(BranchStmt)
      //   s.pos = p.pos()
      //   p.next()
      //   s.Tok = _Fallthrough
      //   return s

      // case _Break, _Continue:
      //   s := new(BranchStmt)
      //   s.pos = p.pos()
      //   s.Tok = p.tok
      //   p.next()
      //   if p.tok == _Name {
      //     s.Label = p.name()
      //   }
      //   return s

      // case _Go, _Defer:
      //   return p.callStmt()

      // case _Goto:
      //   s := new(BranchStmt)
      //   s.pos = p.pos()
      //   s.Tok = _Goto
      //   p.next()
      //   s.Label = p.name()
      //   return s

      case token.RETURN:
        const pos = p.pos
        let result :Expr|null = null
        p.next()
        if (p.tok as token != token.SEMICOLON &&
            p.tok as token != token.RBRACE)
        {
          const xs = p.exprList(/*ctx=*/null) // ?: maybe pass TupleExpr?
          if (xs.length == 1) {
            // e.g. "return 1", "return (1, 2)"
            result = xs[0]
          } else {
            // Support paren-less tuple return
            // e.g. "return 1, 2" == "return (1, 2)"
            result = new TupleExpr(xs[0].pos, xs[0].scope, xs)
          }
        }
        return new ReturnStmt(pos, p.scope, result)

      // case _Semi:
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
    let x = p.unaryExpr(ctx)
    while (
      (token.operator_beg < p.tok && p.tok < token.operator_end) &&
      p.prec > pr)
    {
      const pos = p.pos
      const tprec = p.prec
      const op = p.tok
      p.next()
      x = new Operation(pos, p.scope, op, x, p.binaryExpr(tprec, ctx))
    }
    return x
  }

  unaryExpr(ctx :exprCtx) :Expr {
    // UnaryExpr = PrimaryExpr | unary_op UnaryExpr
    const p = this
    const t = p.tok
    const pos = p.pos

    switch (t) {
      case token.MUL:
      case token.ADD:
      case token.SUB:
      case token.NOT:
      case token.XOR: {
        p.next()
        return new Operation(pos, p.scope, t, p.unaryExpr(ctx))
      }

      case token.AND: {
        p.next()
        // unaryExpr may have returned a parenthesized composite literal
        // (see comment in operand) - remove parentheses if any
        return new Operation(pos, p.scope, t, unparen(p.unaryExpr(ctx)))
      }

      // TODO: case token.ARROWL; `<-x`, `<-chan E`
    }

    return p.primExpr(/*keepParens*/true, ctx)
  }


  primExpr(keepParens :bool, ctx :exprCtx) :Expr {
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
    const p = this
    let x = p.operand(keepParens, ctx)

    // TODO: what follows an operand, if any

    loop:
    while (true) {
      // const pos = p.pos
      switch (p.tok) {
        case token.LPAREN:
          x = p.call(x, ctx)
          break
        default:
          break loop
      }
    }

    return x
  }


  call(fun :Expr, ctx :exprCtx) :CallExpr {
    // Arguments = "(" [
    //     ( ExpressionList | Type [ "," ExpressionList ] )
    //     [ "..." ] [ "," ]
    //   ] ")"
    const p = this

    // call or conversion
    // convtype '(' expr ocomma ')'
    const pos = p.pos
    const argList = [] as Expr[]
    let hasDots = false

    p.want(token.LPAREN)
    // p.xnest++

    while (p.tok != token.EOF && p.tok != token.RPAREN) {
      argList.push(p.expr(ctx))
      hasDots = p.got(token.ELLIPSIS)
      if (!p.ocomma(token.RPAREN) || hasDots) {
        break
      }
    }

    // p.xnest--
    p.want(token.RPAREN)

    return new CallExpr(pos, p.scope, fun, argList, hasDots)
  }


  operand(keepParens :bool, ctx :exprCtx) :Expr {
    // Operand   = Literal | OperandName | MethodExpr | "(" Expression ")" .
    // Literal   = BasicLit | CompositeLit | FunctionLit .
    // BasicLit  = int_lit | float_lit | imaginary_lit | rune_lit | string_lit
    // OperandName = identifier | QualifiedIdent.
    const p = this

    switch (p.tok) {
      case token.NAME:
      case token.NAMEAT:
        return p.dotident(p.resolve(p.ident()))

      case token.LPAREN:
        return p.parenOrTupleExpr(keepParens, ctx)

      case token.FUN:
        return p.funStmt(ctx)

      // case _Lbrack, _Chan, _Map, _Struct, _Interface:
      //   return p.type_() // othertype

      case token.STRING:
        return p.strlit()

      default: {
        if (token.literal_beg < p.tok && p.tok < token.literal_end) {
          const x = new BasicLit(p.pos, p.scope, p.tok, p.takeByteValue())
          x.type = p.universe.basicLitType(
            x,
            (ctx && ctx instanceof VarDecl && ctx.type ?
              p.maybeResolveType(ctx.type) : null
            ),
            p.basicLitErrH
          )
          p.next() // consume literal
          return x
        }

        const x = p.bad()
        p.syntaxError("expecting expression")
        p.next()
        return x
      }
    }
  }


  basicLitErrH = (msg :string, pos :Pos) => {
    this.syntaxError(msg, pos)
  }


  strlit() :StringLit {
    const p = this
    assert(p.tok == token.STRING)
    const n = new StringLit(p.pos, p.scope, p.takeByteValue())
    n.type = new ConstStringType(u_t_usize.bitsize, n.value.length)
    p.next()
    return n
  }


  parenOrTupleExpr(keepParens :bool, ctx :exprCtx) :Expr {
    // TupleExpr = "(" Expr ("," Expr)+ ","? ")"
    // ParenExpr = "(" Expr ","? ")"
    const p = this
    const pos = p.pos
    p.want(token.LPAREN)

    const l = []
    while (true) {
      l.push(p.expr(ctx))
      if (!p.ocomma(token.RPAREN)) {
        break  // error: unexpected ;, expecting comma, or )
      }
      if (p.tok == token.RPAREN) {
        break
      }
    }
    p.want(token.RPAREN)

    return (
      l.length == 1 ? (
        keepParens ? new ParenExpr(pos, p.scope, l[0]) :
        l[0]
      ) :
      new TupleExpr(pos, p.scope, l)
    )
  }


  bad(pos? :Pos) :BadExpr {
    const p = this
    return new BadExpr(pos === undefined ? p.pos : pos, p.scope)
  }


  // maybeType is like type but it returns null if there was no type
  // instead of reporting an error.
  //
  // Type     = TypeName | TypeLit | "(" Type ")" .
  // TypeName = identifier | QualifiedIdent .
  // TypeLit  = ArrayType | StructType | PointerType | FunctionType
  //          | InterfaceType | SliceType | MapType | Channel_Type
  maybeType() :Expr|null {
    const p = this
    let x :Expr|null = null

    switch (p.tok) {

      // TODO: all other types

      case token.NAME:
        x = p.dotident(p.resolve(p.ident()))
        break

      case token.LPAREN:
        const t = p.tupleType()
        x = (
          t.exprs.length == 0 ? null :        // "()"  => null
          t.exprs.length == 1 ? t.exprs[0] :  // "(a)" => "a"
          t                                   // "(a, b)"
        )
        break

      default:
        return null
    }

    return x && p.resolveType(x) || null
  }

  type() :Expr {
    const p = this
    let t = p.maybeType()
    if (!t) {
      t = p.bad()
      p.syntaxError("expecting type")
      p.next()
    }
    return t
  }

  restExpr(defaultType :Type) :RestExpr {
    // RestExpr = "..." Expr?
    const p = this
    const pos = p.pos
    p.want(token.ELLIPSIS)
    const rt = new RestExpr(pos, p.scope, p.maybeType() || defaultType)
    p.resolveType(rt)
    return rt
  }

  tupleType() :TupleExpr {
    // TupleType = "(" Type ("," Type)+ ","? ")"
    const p = this
    p.want(token.LPAREN)
    const pos = p.pos
    const l = []
    while (p.tok != token.RPAREN) {
      l.push(p.type())
      if (!p.ocomma(token.RPAREN)) {
        // error: unexpected ;, expecting comma, or )
        break
      }
    }
    p.want(token.RPAREN)
    return new TupleExpr(pos, p.scope, l)
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

  dotident(ident :Ident) :Expr {
    const p = this
    if (p.tok == token.DOT) {
      const pos = p.pos
      p.next()
      const rhs = p.dotident(p.ident())
      return new SelectorExpr(pos, p.scope, ident, rhs)
    }
    return ident
  }

  ident() :Ident {
    const p = this
    const pos = p.pos
    if (p.tok == token.NAME) {
      const s = p.strSet.emplace(p.takeByteValue(), p.hash)
      p.next()
      return new Ident(pos, p.scope, s)
    }
    p.syntaxError("expecting identifier", pos)
    p.advanceUntil()
    return new Ident(pos, p.scope, p._id__)
  }

  maybeIdent() :Ident|null {
    const p = this
    return (p.tok == token.NAME) ? p.ident() : null
  }

  fallbackIdent(pos? :Pos) :Ident {
    const p = this
    return new Ident(pos === undefined ? p.pos : pos, p.scope, p._id__)
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
          case token.VAR:
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

  // syntax_error reports a syntax error at the current line.
  syntaxError(msg :string, pos :Pos = this.pos) {
    const p = this
    p.syntaxErrorAt(p.sfile.position(pos), msg)
  }

  syntaxErrorAt(position :Position, msg :string) {
    const p = this

    // if (p.tok == token.EOF) {
    //   return // avoid meaningless follow-up errors
    // }

    // add punctuation etc. as needed to msg
    if (msg == "") {
      // nothing to do
    } else if (
      msg.startsWith("in ") ||
      msg.startsWith("at ") ||
      msg.startsWith("after "))
    {
      msg = " " + msg
    } else if (msg.startsWith("expecting ")) {
      msg = ", " + msg
    } else {
      // plain error - we don't care about current token
      p.errorAt(position, msg)
      return
    }

    p.errorAt(position, "unexpected " + tokstr(p.tok) + msg)
  }


  // diag reports a diagnostic message
  //
  diag(k :DiagKind, msg :string, p :Pos = this.pos) {
    const s = this
    s.reportDiag(s.sfile.position(p), k, msg)
  }

  reportDiag(position :Position, k :DiagKind, msg :string) {
    const s = this
    if (s.diagh) {
      s.diagh(position, msg, k)
    }
  }


}

// unparen removes all parentheses around an expression.
function unparen(x :Expr) :Expr {
  while (x instanceof ParenExpr) {
    x = x.x
  }
  return x
}

function isEmptyFunDecl(d :Decl) :bool {
  return d instanceof FunDecl && !d.body
}
