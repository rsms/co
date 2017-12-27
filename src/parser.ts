import { SrcFile, Position, Pos } from './pos'
import { token, tokstr, prec } from './token'
import * as scanner from './scanner'
import { ByteStr, ByteStrSet } from './bytestr'
import {
  Scope,
  Obj,
  Node,
  Group,
  Comment,
  StringLit,
  Ident,
  Field,
  Decl,
  ImportDecl,
  ConstDecl,
  VarDecl,
  TypeDecl,
  FunDecl,
  FunSig,
  Expr,
  Operation,
  CallExpr,
  ParenExpr,
  TupleExpr,
  BadExpr,
  SelectorExpr,
  BasicLit,
  DotsType,
  Stmt,
  BlockStmt,
  ExprStmt,
  SimpleStmt,
  ReturnStmt,
  AssignStmt,
  DeclStmt,
  File,
} from './ast'
// import { astRepr } from './ast-repr'

const kEmptyByteArray = new Uint8Array(0)
const kBytes__ = new Uint8Array([0x5f]) // 0x5f '_'
const kBytes_dot = new Uint8Array([0x2e]) // 0x2e '.'

// Parser scans source code and produces AST.
// It must be initialized via init before use or resue.
//
export class Parser extends scanner.Scanner {
  fnest      :int = 0   // function nesting level (for error handling)
  strSet     :ByteStrSet
  comments   :Comment[]|null
  scope      :Scope
  filescope  :Scope
  pkgscope   :Scope
  unresolved :Set<Ident>  // unresolved identifiers

  _id__      :ByteStr
  _id_dot    :ByteStr

  initParser(
    sfile    :SrcFile,
    sdata    :Uint8Array,
    strSet   :ByteStrSet,
    pkgscope :Scope|null,
    errh     :scanner.ErrorHandler|null = null,
    smode    :scanner.Mode = scanner.Mode.None
  ) {
    const p = this
    super.init(sfile, sdata, errh, smode)
    p.scope = new Scope(pkgscope)
    p.filescope = p.scope
    p.pkgscope = pkgscope || p.filescope
    p.fnest = 0
    p.strSet = strSet
    p.comments = null
    p.unresolved = new Set<Ident>()
    p._id__ = p.strSet.emplace(kBytes__)
    p._id_dot = p.strSet.emplace(kBytes_dot)

    if (smode & scanner.Mode.ScanComments) {
      p.next = p.next_comments
    } else {
      p.next = super.next
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
    p.scope = scope || new Scope(p.scope)
  }

  popScope() :Scope { // returns old ("popped") scope
    const p = this
    const s = p.scope
    if (p.scope.outer != null) {
      p.scope = p.scope.outer
    } else {
      panic('pop scope at base scope')
    }
    return s
  }

  declare(scope :Scope, ident: Ident, decl :Node, x: Expr|null) :Obj|null {
    const p = this
    const obj = scope.declare(ident.value, decl, x)
    if (!obj) {
      p.syntaxError(`${ident} redeclared`, ident.pos)
    }
    // else console.log(`[declare] ${ident} in ${scope}`)
    return obj
  }

  declarev(scope :Scope, idents: Ident[], decl :Node, xs: Expr[]|null) {
    const p = this
    for (let i = 0; i < idents.length; ++i) {
      p.declare(scope, idents[i], decl, xs && xs[i] || null)
    }
  }

  // If x is an identifier, resolve attempts to resolve x by looking up
  // the object it denotes. If no object is found and collectUnresolved is
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

    assert(x.obj == null, "identifier already declared or resolved")
    if (x.value === p._id__) {
      return x
    }

    // try to resolve the identifier
    let s :Scope|null = x.scope
    while (s) {
      const obj = s.lookupImm(x.value)
      if (obj) {
        // console.log(`[resolve] ${x} found in ${s}`)
        x.obj = obj
        return x
      }
      s = s.outer
    }
    // if (obj) {
    //   console.log(`[resolve] ${x} found in ${obj.decl.scope}`)
    //   x.obj = obj
    // } else 
    if (collectUnresolved) {
      // console.log(`[resolve] ${x} not found`)
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
    const decls = p.parseBody()

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
      p.declare(p.filescope, localIdent, d, d)
    }
    
    return d
  }

  parseBody() :Decl[] {
    const p = this
    const decls = [] as Decl[]

    // { TopLevelDecl ";" }
    while (p.tok != token.EOF) {
      switch (p.tok) {
        case token.VAR:
          p.next() // consume "var"
          p.appendGroup(decls, p.varDecl)
          break

        case token.TYPE:
          p.next() // consume "type"
          p.appendGroup(decls, p.typeDecl)
          break

        case token.NAME:
          decls.push(p.constDecl())
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

  checkDeclLen(idents :Ident[], nvalues: number, kind :string) {
    const p = this
    if (nvalues != idents.length) {
      p.syntaxError(
        `cannot assign ${nvalues} values to ${idents.length} ${kind}`,
        idents[0].pos
      )
    }
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
    return d
  }

  constDecl() :ConstDecl {
    // ConstSpec = IdentifierList [ Type ] "=" ExpressionList
    const p = this
    const pos = p.pos
    const idents = p.identList(p.ident())
    const typ = p.maybeType()
    let valexprs :Expr[]
    let values :Expr[]|null = null
    let isError = false

    if (p.got(token.ASSIGN)) {
      valexprs = p.exprList(/*isRhs=*/true)
      p.checkDeclLen(idents, valexprs.length, 'constants')
    } else {
      if (p.got(token.SET_ASSIGN)) {
        // e.g. `x := 4`
        p.syntaxError("variable assignment at top level", pos)
      } else if (typ) {
        // e.g. `x int`
        p.syntaxError("const declaration cannot have type without value", pos)
      } else {
        // e.g. `x`
        p.syntaxError("unexpected identifier", pos)
      }
      isError = true
      valexprs = [p.bad()]
      p.advanceUntil(token.SEMICOLON)
    }

    const d = new ConstDecl(pos, p.scope, idents, typ, valexprs)

    if (!isError) {
      const scope = p.scope === p.filescope ? p.pkgscope : p.scope
      p.declarev(scope, idents, d, values)
    }

    return d
  }

  varDecl = (group :Group|null, nth :int) :VarDecl => {
    // VarSpec = IdentifierList
    //   ( Type [ "=" ExpressionList ] | "=" ExpressionList )
    const p = this
    const pos = p.pos
    const idents = p.identList(p.ident())
    const d = new VarDecl(pos, p.scope, idents, group)

    if (p.got(token.ASSIGN)) {
      d.values = p.exprList(/*isRhs=*/true)
    } else {
      let t = p.maybeType()
      if (t) {
        d.type = t
      } else {
        d.type = p.bad()
        p.syntaxError("missing type or value in var declaration", d.pos)
      }
      if (p.got(token.ASSIGN)) {
        d.values = p.exprList(/*isRhs=*/true)
      }
    }

    if (d.values) {
      p.checkDeclLen(idents, d.values.length, 'variables')
    }

    const scope = p.scope === p.filescope ? p.pkgscope : p.scope
    p.declarev(scope, idents, d, d.values)

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

    // declare in outer scope, before we parse the body, so that the body can
    // refer to the function's name
    const d = new FunDecl(pos, p.scope, name, p.funSig(), null)
    const scope = p.scope === p.filescope ? p.pkgscope : p.scope
    p.declare(scope, name, d, d)

    if (p.tok != token.SEMICOLON) {
      // restore function's scope, in which parameters are already declared
      p.pushScope(d.sig.scope)
      d.body = p.funBody(name)
      p.popScope()
    }

    return d
  }

  // TODO: maybeFunExpr() :Expr -- FunDecl or some other expr

  funExpr(isRhs :bool) :FunDecl {
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

    // declare in outer scope, before we parse the body, so that the body can
    // refer to the function's name
    const d = new FunDecl(pos, p.scope, name, p.funSig(), null)
    if (name && !isRhs) {
      // declare the function's name when it's not on the right-hand side of an
      // assignment.
      // e.g. "fun foo ..."
      p.declare(name.scope, name, d, d)
    }

    p.pushScope(d.sig.scope)
    d.body = p.funBody(name)
    p.popScope()

    return d
  }

  funSig(): FunSig {
    // Signature = ( Parameters Result? | Type )?
    const p = this
    const pos = p.pos
    // new scope in which parameter names will be declared
    p.pushScope()
    const params = p.tok == token.LPAREN ? p.parameters() : []
    const scope = p.popScope()
    const result = p.maybeType()
    return new FunSig(pos, scope, params, result)
  }

  parameters() :Field[] {
    // Parameters    = "(" [ ParameterList [ "," ] ] ")"
    // ParameterList = ParameterDecl ("," ParameterDecl)*
    // ParameterDecl = Ident [ [ "..." ] Type ]
    //
    const p = this
    p.want(token.LPAREN)

    const fields = [] as Field[]
    let seenDotsType = false

    while (p.tok != token.RPAREN) {
      let f = new Field(p.pos, p.scope, null, null)

      f.ident = p.ident()
      p.declare(f.ident.scope, f.ident, f, null) // in function scope

      if (p.tok == token.ELLIPSIS) {
        // e.g. "fun foo(ident ... type)"
        f.type = p.dotsType()
        if (seenDotsType) {
          p.syntaxError("can only use ... with final parameter in list")
          continue  // skip this field
        } else {
          seenDotsType = true
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
    if (funcname) {
      p.syntaxError(`${funcname} is missing function body`)
    } else {
      p.syntaxError("missing function body")
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

  // SimpleStmt = EmptyStmt | ExpressionStmt | SendStmt | IncDecStmt
  //            | Assignment | ShortVarDecl .
  simpleStmt(lhs :Expr[]) :SimpleStmt {
    const p = this
    const pos = p.pos

    if (p.tok == token.ASSIGN || p.tok == token.SET_ASSIGN) {
      // e.g.  "a = 1"  "a, b = 1, 2"  "a[1], b.f = 1, 2"  etc
      const op = p.tok
      p.next() // consume "=" or ":="
      const rhs = p.exprList(/*isRhs=*/true)
      const s = new AssignStmt(pos, p.scope, op, lhs, rhs)

      // Check each left-hand identifier against scope and unresolved.
      // Note that exprList already has called p.resolve on all ids.
      //
      // If an id has an obj (i.e. was resolved to something), then we simply
      // register the assignment with it so that we can later bind.
      //
      // If an id is unresolved (doesn't have an obj), the semantics are:
      // - assume it's a constant definition and declare it as such
      // - register the assignment so that if we later find a var in the outer
      //   scope, we can convert the declaration to an assignment.
      //
      for (let i = 0; i < lhs.length; ++i) {
        const x = lhs[i]
        if (x instanceof Ident) {
          if (op == token.SET_ASSIGN) {
            // e.g. "x := 3"
            if (x.obj && !(x.obj.decl instanceof VarDecl)) {
              // target object is not a variable
              p.syntaxError(`cannot assign to ${x}`, x.pos)
            }
          } else {
            if (!x.obj ||
              !(x.obj.decl instanceof VarDecl) ||
              x.obj.decl.scope !== x.scope
            ) {
              // constant declaration, e.g "x = 3"
              p.declare(x.scope, x, s, s.rhs[i])
              p.unresolved.delete(x)
            }
          }
        }
      }

      return s
    }

    if (lhs.length == 1) {
      // expr
      if (token.assignop_beg < p.tok && p.tok < token.assignop_end) {
        // lhs op= rhs  --  e.g. "x += 2"
        const op = p.tok
        p.next() // consume operator
        const rhs = p.exprList(/*isRhs=*/true)
        return new AssignStmt(pos, p.scope, op, lhs, rhs)
      }

      if (p.tok == token.INC || p.tok == token.DEC) {
        // lhs++ or lhs--
        p.syntaxError("TODO simpleStmt INC/DEC")
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
        return p.simpleStmt(p.exprList(/*isRhs=*/false))

      case token.LBRACE:
        p.pushScope()
        const s = p.block()
        p.popScope()
        return s

      case token.VAR:
        return p.declStmt(p.varDecl)

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
        return p.simpleStmt(p.exprList(/*isRhs=*/false))

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
          const xs = p.exprList(/*isRhs=*/false)
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
          return p.simpleStmt(p.exprList(/*isRhs=*/false))
        }
    }

    return null
  }

  exprList(isRhs :bool) :Expr[] {
    // ExpressionList = Expression ( "," Expression )*
    const p = this
    const list = [p.expr(isRhs)]
    while (p.got(token.COMMA)) {
      list.push(p.expr(isRhs))
    }
    return list
  }

  expr(isRhs :bool) :Expr {
    const p = this
    return p.binaryExpr(prec.LOWEST, isRhs)
  }

  binaryExpr(pr :prec, isRhs :bool) :Expr {
    // Expression = UnaryExpr | Expression binary_op Expression
    const p = this
    let x = p.unaryExpr(isRhs)
    while (
      (token.operator_beg < p.tok && p.tok < token.operator_end) &&
      p.prec > pr)
    {
      const pos = p.pos
      const tprec = p.prec
      const op = p.tok
      p.next()
      x = new Operation(pos, p.scope, op, x, p.binaryExpr(tprec, isRhs))
    }
    return x
  }

  unaryExpr(isRhs :bool) :Expr {
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
        return new Operation(pos, p.scope, t, p.unaryExpr(isRhs))
      }

      case token.AND: {
        p.next()
        // unaryExpr may have returned a parenthesized composite literal
        // (see comment in operand) - remove parentheses if any
        return new Operation(pos, p.scope, t, unparen(p.unaryExpr(isRhs)))
      }

      // TODO: case token.ARROWL; `<-x`, `<-chan E`
    }

    return p.primExpr(/*keepParens*/true, isRhs)
  }


  primExpr(keepParens :bool, isRhs :bool) :Expr {
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
    let x = p.operand(keepParens, isRhs)

    // TODO: what follows an operand, if any

    loop:
    while (true) {
      // const pos = p.pos
      switch (p.tok) {
        case token.LPAREN:
          x = p.call(x, isRhs)
          break
        default:
          break loop
      }
    }

    return x
  }


  call(fun :Expr, isRhs :bool) :CallExpr {
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
      argList.push(p.expr(isRhs))
      hasDots = p.got(token.ELLIPSIS)
      if (!p.ocomma(token.RPAREN) || hasDots) {
        break
      }
    }

    // p.xnest--
    p.want(token.RPAREN)

    return new CallExpr(pos, p.scope, fun, argList, hasDots)
  }


  operand(keepParens :bool, isRhs :bool) :Expr {
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
        return p.parenOrTupleExpr(keepParens, isRhs)

      case token.FUN:
        return p.funExpr(isRhs)

      // case _Lbrack, _Chan, _Map, _Struct, _Interface:
      //   return p.type_() // othertype

      case token.STRING:
        return p.strlit()

      default: {
        if (token.literal_beg < p.tok && p.tok < token.literal_end) {
          const x = new BasicLit(p.pos, p.scope, p.tok, p.takeByteValue())
          p.next()
          return x
        }

        const x = p.bad()
        p.syntaxError("expecting expression")
        p.next()
        return x
      }
    }
  }


  parenOrTupleExpr(keepParens :bool, isRhs :bool) :Expr {
    // TupleExpr = "(" Expr ("," Expr)+ ","? ")"
    // ParenExpr = "(" Expr ","? ")"
    const p = this
    p.want(token.LPAREN)

    const pos = p.pos
    const x = p.expr(isRhs)

    if (p.got(token.RPAREN)) {
      // ParenExpr
      return keepParens ? new ParenExpr(pos, p.scope, x) : x
    }

    const l = []
    while (true) {
      l.push(p.expr(isRhs))
      if (!p.ocomma(token.RPAREN)) {
        break  // error: unexpected ;, expecting comma, or )
      }
      if (p.tok == token.RPAREN) {
        break
      }
    }
    p.want(token.RPAREN)

    return (
      l.length == 1 ? new ParenExpr(pos, p.scope, l[0]) :
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
    switch (p.tok) {

      // TODO: all other types

      case token.NAME:
        return p.dotident(p.ident())

      case token.LPAREN:
        const t = p.tupleType()
        return (
          t.exprs.length == 0 ? null :        // "()"  => null
          t.exprs.length == 1 ? t.exprs[0] :  // "(a)" => "a"
          t                                   // "(a, b)"
        )

      default:
        return null
    }
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

  dotsType() :DotsType {
    // DotsType = "..." Type?
    const p = this
    const pos = p.pos
    p.want(token.ELLIPSIS)
    return new DotsType(pos, p.scope, p.maybeType())
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

  strlit() :StringLit {
    const p = this
    assert(p.tok == token.STRING)
    const n = new StringLit(p.pos, p.scope, p.takeByteValue())
    p.next()
    return n
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
    if (p.tok == token.EOF) {
      return // avoid meaningless follow-up errors
    }

    // add punctuation etc. as needed to msg
    if (msg == "") {
      // nothing to do
    } else if (
      msg.startsWith("in") ||
      msg.startsWith("at") ||
      msg.startsWith("after"))
    {
      msg = " " + msg
    } else if (msg.startsWith("expecting")) {
      msg = ", " + msg
    } else {
      // plain error - we don't care about current token
      p.errorAt(position, msg)
      return
    }

    p.errorAt(position, "unexpected " + tokstr(p.tok) + msg)
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
