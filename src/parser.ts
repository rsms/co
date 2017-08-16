import { File, Position } from './pos'
import { token, tokstr, prec } from './token'
import * as scanner from './scanner'
import { ByteStrSet } from './bytestr'
import {
  Group,
  Comment,
  StringLit,
  Name,
  QualName,
  Decl,
  ImportDecl,
  ConstDecl,
  VarDecl,
  TypeDecl,
  FuncDecl,
  Expr,
  SelectorExpr,
  Operation,
  ParenExpr,
  BadExpr,
  BasicLit,
  ListExpr,
} from './ast'

const kEmptyByteArray = new Uint8Array(0)

// A Scanner holds the scanner's internal state while processing a given text.
// It must be initialized via init before use or resue.
//
export class Parser extends scanner.Scanner {
  fnest    :int = 0   // function nesting level (for error handling)
  strSet   :ByteStrSet
  comments :Comment[]|null = null

  initParser(
    file   :File,
    src    :Uint8Array,
    strSet :ByteStrSet,
    errh   :scanner.ErrorHandler|null = null,
    m      :scanner.Mode = scanner.Mode.None
  ) {
    const p = this
    super.init(file, src, errh, m)
    p.fnest = 0
    p.strSet = strSet
    p.comments = null

    if (m & scanner.Mode.ScanComments) {
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

  parseImports() :ImportDecl[] {
    const p = this
    //
    // Imports     = ImportDecl? | ImportDecl (";" ImportDecl)*
    // ImportDecl  = "import" ( ImportSpec | "(" { ImportSpec ";" } ")" )
    // ImportSpec  = [ "." | PackageName ] ImportPath
    // ImportPath  = string_lit
    //
    let decls = [] as ImportDecl[]
    while (p.got(token.IMPORT)) {
      p.appendGroup(decls, p.importDecl)
      p.want(token.SEMICOLON)
    }
    return decls
  }

  importDecl = (group :Group|null) :ImportDecl => {
    const p = this
    let localName :Name|null = null
  
    switch (p.tok) {
      case token.NAME:
        localName = p.name()
        break

      case token.DOT:
        // TODO: make this more efficient
        const s = p.strSet.emplace(new Uint8Array([0x2e])) // 0x2e '.'
        const n = new Name(p, s)
        localName = n
        p.next()
        break
    }

    let path :StringLit
    if (p.tok == token.STRING) {
      path = p.strlit()
    } else {
      p.syntaxError("missing import path; expecting quoted string")
      path = new StringLit(p, kEmptyByteArray)
      p.advanceUntil(token.SEMICOLON, token.RPAREN)
    }

    return new ImportDecl(p, path, localName)
    // d.Group = group
  }

  parseBody() :Decl[] {
    const p = this
    const decls = [] as Decl[]

    // { TopLevelDecl ";" }
    while (p.tok != token.EOF) {
      switch (p.tok) {
        case token.CONST:
          p.next()
          p.appendGroup(decls, p.constDecl)
          break

        case token.VAR:
          p.next()
          p.appendGroup(decls, p.varDecl)
          break

        case token.TYPE:
          p.next()
          p.appendGroup(decls, p.typeDecl)
          break

        // TODO: token.TYPE

        default: {
          if (
            p.tok == token.LBRACE &&
            decls.length > 0 &&
            isEmptyFuncDecl(decls[decls.length-1])
          ) {
            // opening { of function declaration on next line
            p.syntaxError("unexpected semicolon or newline before {")
          } else {
            p.syntaxError("non-declaration statement outside function body")
          }

          p.error(`TODO file-level token \`${tokstr(p.tok)}\``); p.next()

          p.advanceUntil(token.CONST, token.TYPE, token.VAR, token.FUNC)
          continue
        }
      }

      if ((p.tok as token) != token.EOF && !p.got(token.SEMICOLON)) {
        p.syntaxError("after top level declaration")
        p.advanceUntil(token.CONST, token.TYPE, token.VAR, token.FUNC)
      }
    }

    return decls
  }


  typeDecl = (group :Group|null, nth :int) :TypeDecl => {
    // TypeSpec = identifier [ "=" ] Type
    const p = this
    const pos = p.pos
    const name = p.name()
    const alias = p.got(token.ASSIGN)

    let t = p.maybeType()
    if (!t) {
      t = p.bad()
      p.syntaxError("in type declaration")
      p.advanceUntil(token.SEMICOLON, token.RPAREN)
    }

    return new TypeDecl(pos, name, alias, t, group)
  }


  constDecl = (group :Group|null, nth :int) :ConstDecl => {
    // ConstSpec = IdentifierList [ Type ] "=" ExpressionList
    const p = this

    const names = p.nameList(p.name())
    const d = new ConstDecl(p, names, group)

    if (nth == 0) {
      d.type = p.maybeType()
      if (p.got(token.ASSIGN)) {
        d.values = p.exprList()
      } else {
        if (d.type) {
          // e.g. `const x int;`
          p.syntaxError("const declaration cannot have type without value")
        } else {
          // e.g. `const x;`
          p.syntaxError("missing value in const declaration")
        }
        p.next()
      }
    } else if (
      p.tok != token.EOF &&
      p.tok != token.SEMICOLON &&
      p.tok != token.RPAREN
    ) {
      d.type = p.maybeType()
      if (p.got(token.ASSIGN)) {
        d.values = p.exprList()
      }
    }

    return d
  }

  varDecl = (group :Group|null, nth :int) :VarDecl => {
    // VarSpec = IdentifierList
    //   ( Type [ "=" ExpressionList ] | "=" ExpressionList )
    const p = this
    const names = p.nameList(p.name())
    const d = new VarDecl(p, names, group)

    if (p.got(token.ASSIGN)) {
      d.values = p.exprList()
    } else {
      let t = p.maybeType()
      if (t) {
        d.type = t
      } else {
        d.type = p.bad()
        p.syntaxError("missing type or value in var declaration")
        p.next()
      }
      if (p.got(token.ASSIGN)) {
        d.values = p.exprList()
      }
    }
  
    return d
  }

  exprList() :Expr {
    // ExpressionList = Expression { "," Expression }
    const p = this
    let x = p.expr()
    if (p.got(token.COMMA)) {
      const list :Expr[] = [x, p.expr()]
      while (p.got(token.COMMA)) {
        list.push(p.expr())
      }
      x = new ListExpr(x.pos, list)
    }
    return x
  }

  expr() :Expr {
    const p = this
    return p.binaryExpr(prec.LOWEST)
  }

  binaryExpr(pr :prec) :Expr {
    // Expression = UnaryExpr | Expression binary_op Expression
    const p = this
    let x = p.unaryExpr()
    while (
      (token.operator_beg < p.tok && p.tok < token.operator_end) &&
      p.prec > pr
    ) {
      const pos = p.pos, tprec = p.prec
      p.next()
      x = new Operation(pos, p.tok, x, p.binaryExpr(tprec))
    }
    return x
  }

  unaryExpr() :Expr {
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
        return new Operation(pos, t, p.unaryExpr())
      }

      case token.AND: {
        p.next()
        // unaryExpr may have returned a parenthesized composite literal
        // (see comment in operand) - remove parentheses if any
        return new Operation(pos, t, unparen(p.unaryExpr()))
      }

      // TODO: case token.ARROWL; `<-x`, `<-chan E`
    }

    // TODO(mdempsky): We need parens here so we can report an
    // error for "(x) := true". It should be possible to detect
    // and reject that more efficiently though.
    return p.primExpr(true)
  }


  primExpr(keepParens :bool) :Expr {
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
    //   [ (  ExpressionList | Type [ "," ExpressionList ] ) [ "..." ] [ "," ] ]
    //   ")" .
    const p = this
    let x = p.operand(keepParens)

    // TODO: what follows an operand, if any

    return x
  }


  operand(keep_parens :bool) :Expr {
    // Operand     = Literal | OperandName | MethodExpr | "(" Expression ")" .
    // Literal     = BasicLit | CompositeLit | FunctionLit .
    // BasicLit    = int_lit | float_lit | imaginary_lit | rune_lit | string_lit
    // OperandName = identifier | QualifiedIdent.
    const p = this

    switch (p.tok) {
      case token.NAME:
        return p.qualname()

      // case _Lparen:
      //   pos := p.pos()
      //   p.next()
      //   p.xnest++
      //   x := p.expr()
      //   p.xnest--
      //   p.want(_Rparen)

      //   // Optimization: Record presence of ()'s only where needed
      //   // for error reporting. Don't bother in other cases; it is
      //   // just a waste of memory and time.

      //   // Parentheses are not permitted on lhs of := .
      //   // switch x.Op {
      //   // case ONAME, ONONAME, OPACK, OTYPE, OLITERAL, OTYPESW:
      //   //   keep_parens = true
      //   // }

      //   // Parentheses are not permitted around T in a composite
      //   // literal T{}. If the next token is a {, assume x is a
      //   // composite literal type T (it may not be, { could be
      //   // the opening brace of a block, but we don't know yet).
      //   if p.tok == _Lbrace {
      //     keep_parens = true
      //   }

      //   // Parentheses are also not permitted around the expression
      //   // in a go/defer statement. In that case, operand is called
      //   // with keep_parens set.
      //   if keep_parens {
      //     px := new(ParenExpr)
      //     px.pos = pos
      //     px.X = x
      //     x = px
      //   }
      //   return x

      // case _Func:
      //   pos := p.pos()
      //   p.next()
      //   t := p.funcType()
      //   if p.tok == _Lbrace {
      //     p.xnest++

      //     f := new(FuncLit)
      //     f.pos = pos
      //     f.Type = t
      //     f.Body = p.blockStmt("")
      //     if p.mode&CheckBranches != 0 {
      //       checkBranches(f.Body, p.errh)
      //     }

      //     p.xnest--
      //     return f
      //   }
      //   return t

      // case _Lbrack, _Chan, _Map, _Struct, _Interface:
      //   return p.type_() // othertype

      case token.STRING:
        return p.strlit()

      default: {
        if (token.literal_beg < p.tok && p.tok < token.literal_end) {
          const x = new BasicLit(p, p.tok, p.takeByteValue())
          p.next()
          return x
        }

        const x = p.bad()
        p.syntaxError("(expecting expression)")
        p.next()
        return x
      }
    }
  }


  bad() :BadExpr {
    const p = this
    return new BadExpr(p.pos)
  }


  // maybeType is like type but it returns nil if there was no type
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
        return p.qualname()

      default:
        return null
    }
  }

  type() :Expr {
    const p = this
    let t = p.maybeType()
    if (!t) {
      t = p.bad()
      p.syntaxError("(expecting type)")
      p.next()
    }
    return t
  }

  // IdentifierList = identifier { "," identifier } .
  // The first name must be provided.
  nameList(first :Name) :Name[] {
    const p = this
    const l = [first]
    while (p.got(token.COMMA)) {
      l.push(p.name())
    }
    return l
  }

  dotname(name :Name) :Name|SelectorExpr {
    // Note: We probably want to use qualname() instead
    const p = this
    if (p.got(token.DOT)) {
      return new SelectorExpr(p, name, p.qualname())
    }
    return name
  }

  qualname() :Name|QualName {
    const p = this
    if (p.tok != token.NAME) {
      return p.name() // handle error
    }
    const s = p.strSet.emplace(p.takeByteValue(), p.hash)
    p.next()
    if (p.got(token.DOT)) {
      return new QualName(p, s, p.qualname())
    }
    return new Name(p, s)
  }

  name() :Name {
    const p = this

    if (p.tok == token.NAME) {
      const s = p.strSet.emplace(p.takeByteValue(), p.hash)
      const n = new Name(p, s)
      p.next()
      return n
    }

    const s = p.strSet.emplace(new Uint8Array([0x5f])) // 0x5f '_'
    const n = new Name(p, s)
    p.syntaxError("expecting name")
    p.next()
    return n
  }

  strlit() :StringLit {
    const p = this
    assert(p.tok == token.STRING)
    const n = new StringLit(p, p.takeByteValue())
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
          case token.CONST:
          case token.CONTINUE:
          case token.DEFER:
          case token.FALLTHROUGH:
          case token.FOR:
          case token.FUNC:
          case token.GO:
          case token.GOTO:
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
  syntaxError(msg :string) {
    const p = this
    p.syntaxErrorAt(p.file.position(p.pos), msg)
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
      p.errorAt(position, "syntax error: " + msg)
      return
    }

    p.errorAt(position, "syntax error: unexpected " + tokstr(p.tok) + msg)
  }


}

// unparen removes all parentheses around an expression.
function unparen(x :Expr) :Expr {
  while (x instanceof ParenExpr) {
    x = x.x
  }
  return x
}

function isEmptyFuncDecl(d :Decl) :bool {
  return d instanceof FuncDecl && !d.body
}
