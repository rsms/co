import * as Path from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import * as ts from "../../node_modules/typescript/lib/typescript"


declare function print(msg :any, ...v :any[]) :void

const rootdir = Path.normalize(__dirname + "/../..")


function main() {
  let infile = __dirname + "/ast.ts"
  let outfile = Path.resolve(__dirname + "/../ast_nodes.ts")
  let f = parse(infile)
  f = transform(f)
  let output = gencode(f)
  print(output.substr(0,100)+"...")
  // print(output)
  output = (
    `// generated from ${Path.relative(Path.dirname(outfile), infile)}` +
    ` by ${Path.relative(Path.dirname(outfile), Path.dirname(infile))}/run.sh` +
    ` -- do not edit.\n` +
    output
  )
  print(`write ${outfile}`)
  writeFileSync(outfile, output, "utf8")
}

function parse(filename :string) :ts.SourceFile {
  let src = readFileSync(filename, "utf8")
  let f :ts.SourceFile = ts.createSourceFile(
    filename,
    src,
    ts.ScriptTarget.ESNext,
    /*setParentNodes*/ false, // add "parent" property to nodes
    ts.ScriptKind.TS
  )

  let diagnostics = (f as any).parseDiagnostics as ts.DiagnosticWithLocation[]|null
  if (diagnostics) {
    if (printDiagnostics(diagnostics, filename) > 0) {
      process.exit(1)
    }
  }

  // print(f)
  return f
}

function gencode(f :ts.SourceFile) :string {
  let p = ts.createPrinter({
    removeComments: false,
    newLine: ts.NewLineKind.LineFeed,
    omitTrailingSemicolon: true,
    noEmitHelpers: true,
  })
  // return p.printNode(ts.EmitHint.SourceFile, f, f)
  return p.printFile(f)
}


class NodeInfo {
  name       :string
  n          :ts.ClassDeclaration
  members    :ts.ClassElement[]
  fields     :FieldInfo[]
  parentName :string = ""
  parent     :NodeInfo|null = null

  unusedParentFields = new Set<string>()

  constructor(name :string, n :ts.ClassDeclaration) {
    this.name = name
    this.n = n
    this.members = n!.members as any as ts.ClassElement[]
  }

  addMember(n :ts.ClassElement) {
    if (n.name && ts.isIdentifier(n.name)) {
      let name = n.name.escapedText.toString()
      if (this.hasMember(name)) {
        throw new Error(`duplicate class member ${this.name}.${name}`)
      }
    }
    this.members.push(n)
  }

  hasMember(name :string) :boolean {
    for (let m of this.members) {
      if (m.name && ts.isIdentifier(m.name) && m.name.escapedText.toString() == name) {
        return true
      }
    }
    return false
  }

  hasParent(name :string) :boolean {
    if (this.parent) {
      if (this.parent.name == name) {
        return true
      }
      return this.parent.hasParent(name)
    }
    return false
  }

  heritageChain() :NodeInfo[] {
    let v = this.parent ? this.parent.heritageChain() : []
    v.push(this)
    return v
  }

  // allFields returns all fields for the node in order without duplicates
  //
  allFields() :Map<string,FieldInfo> {
    let m = new Map<string,FieldInfo>()
    this.collectFields(m, null)
    return m
  }
  collectFields(m :Map<string,FieldInfo>, skip :Set<string>|null) {
    if (this.parent) {
      this.parent.collectFields(m, this.unusedParentFields)
    }
    for (let f of this.fields) {
      if (skip && skip.has(f.name)) {
        m.delete(f.name)
      } else {
        m.set(f.name, f)
      }
    }
  }
  // allFields1() :FieldInfo[] {
  //   if (!this.parent) {
  //     return this.fields
  //   }
  //   let fields :FieldInfo[] = []
  //   let names = new Set<string>(this.fields.map(f => f.name))
  //   for (let p of this.parent.heritageChain()) {
  //     for (let f of p.fields) {
  //       if (!names.has(f.name) && !this.unusedParentFields.has(f.name)) {
  //         names.add(f.name)
  //         fields.push(f)
  //       }
  //     }
  //   }
  //   return fields.length > 0 ? fields.concat(this.fields) : this.fields
  // }

  getField(name :string) :FieldInfo|null {
    for (let f of this.fields) {
      if (f.name == name) {
        return f
      }
    }
    return null
  }
}


class ArrayNode {
  // represents an array node type, e.g. Expr[]
  constructor(
  public n :ArrayNode|NodeInfo,
  ) {}
}


class FieldInfo {
  nodeType :NodeInfo|ArrayNode|null = null  // non-null if type is a AST node

  constructor(
  public name :string,
  public type :ts.TypeNode|null,
  public init :ts.Expression|null,
  public isNullable :boolean,
  public definedBy :NodeInfo,
  ){}
}


const reprMethodName = "repr"

// name of primitive types that skip careful string repr
const directToStringTypenames = new Set<string>(`
  int number float bool boolean
  Pos Num Int64 SInt64 UInt64
`.trim().split(/[\s\r\n]+/))


class Transformer<T extends ts.Node> {
  context       :ts.TransformationContext
  classToFields = new Map<string,ts.ParameterDeclaration[]>()
  nodeInfo      = new Map<string,NodeInfo>() // classname => info
  baseNode     :NodeInfo|null = null

  constructor(context: ts.TransformationContext) {
    this.context = context
  }

  createMethod(name :string, params :ts.ParameterDeclaration[], t :ts.TypeNode|null, ...body :ts.Statement[]) {
    return ts.createMethod(
      undefined, // decorators
      undefined, // modifiers
      undefined, // asteriskToken
      name,
      undefined, // questionToken
      undefined, // typeParameters
      params,
      t || undefined,
      body ? ts.createBlock(body, /*multiline*/body.length > 1) : undefined
    )
  }

  createMethod0(name :string, t :ts.TypeNode|null, ...body :ts.Statement[]) {
    return this.createMethod(name, [], t, ...body)
  }

  generateTypeTestMethod(classname :string) :ts.MethodDeclaration {
    // isTYPE() :this is TYPE { return this instanceof classname }
    let t = ts.createTypePredicateNode(
      ts.createThisTypeNode(),
      ts.createTypeReferenceNode(classname, undefined)
    )
    return this.createMethod0(
      "is" + classname,
      t, // type
      ts.createReturn(
        ts.createBinary(
          ts.createThis(),
          ts.SyntaxKind.InstanceOfKeyword,
          ts.createIdentifier(classname)
        )
      )
    )
  }

  // generateToStringMethod(c :NodeInfo) :ts.MethodDeclaration {
  //   return this.createMethod0(
  //     "toString",
  //     ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
  //     ts.createReturn(ts.createStringLiteral(c.name)),
  //   )
  // }

  generateReprMethod(c :NodeInfo) :ts.MethodDeclaration {
    // all public field names
    let fields = c.allFields()
    for (let name of Array.from(fields.keys())) {
      // hide "pos" field as it is very noisy and rarely helpful in repr
      if (name[0] == "_" || name == "pos") {
        fields.delete(name)
      }
    }
    // if (c.name == "RestType") {
    //   // info.unusedParentFields
    //   print({ fields, unusedParentFields: c.unusedParentFields })
    // }

    const sepArgName = "sep"

    const makeMethod = (body :ts.Statement[]) => this.createMethod(
      reprMethodName,
      [
        ts.createParameter(
          undefined,
          undefined,
          undefined,
          sepArgName,
          undefined,
          ts.createTypeReferenceNode("string", undefined),
          ts.createStringLiteral("\n  ")
        )
      ],
      ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ...body,
    )

    if (fields.size == 0) {
      return makeMethod([
        ts.createReturn(ts.createStringLiteral(`(${c.name})`))
      ])
    }

    let fieldnames = Array.from(fields.keys())
    let body :ts.Statement[] = []
    let ret :ts.Expression
    let sepArgName2 = sepArgName + "2"

    let addedSep2 = false
    const setNeedsSep2 = () => {
      if (addedSep2) { return }
      addedSep2 = true
      // var sep2 = ln.charCodeAt(0) == 0xA ? sep + "  " : sep
      body.unshift(
        ts.createVariableStatement(
          undefined,
          [ts.createVariableDeclaration(
            sepArgName2,
            undefined,
            ts.createConditional(
              ts.createBinary(
                ts.createCall(
                  ts.createPropertyAccess(ts.createIdentifier(sepArgName), "charCodeAt"),
                  undefined,
                  [ts.createNumericLiteral("0")]
                ),
                ts.createToken(ts.SyntaxKind.EqualsEqualsToken),
                ts.createNumericLiteral("10", ts.TokenFlags.HexSpecifier)
              ),
              ts.createBinary(
                ts.createIdentifier(sepArgName),
                ts.createToken(ts.SyntaxKind.PlusToken),
                ts.createStringLiteral("  ")
              ),
              ts.createIdentifier(sepArgName)
            )
          )]
        )
      )
    }


    // fieldReprExpr generates an expression that produces the most suitable
    // "representation" of the field's value.
    const fieldReprExpr = (f :FieldInfo) => {
      assert(f)
      let prop = ts.createPropertyAccess(ts.createThis(), f.name)
      if (f.nodeType) {
        setNeedsSep2()
        if (f.nodeType instanceof ArrayNode) {
          return ts.createCall(
            ts.createIdentifier("reprNodeArray"),
            undefined,
            [ ts.createIdentifier(sepArgName2), prop ]
          )
        }
        return ts.createCall(
          ts.createPropertyAccess(prop, reprMethodName),
          undefined,
          [ ts.createIdentifier(sepArgName2) ]
        )
      }
      if (f.type && ts.isTypeReferenceNode(f.type) && ts.isIdentifier(f.type.typeName)) {
        let typename = f.type.typeName.escapedText.toString()
        if (directToStringTypenames.has(typename)) {
          // simple implicit string conversion
          return prop
        }
      }
      setNeedsSep2()
      return ts.createCall(
        ts.createIdentifier("reprAny"),
        undefined,
        [ ts.createIdentifier(sepArgName2), prop ]
      )
    }

    // find longest span of fields that are non-nullable
    let firstNullableField :FieldInfo|null = null  // non-null if we encountered one
    let lastNonNullableFieldIndex = -1
    for (let f of fields.values()) {
      if (f.isNullable) {
        firstNullableField = f
        break
      }
      lastNonNullableFieldIndex++
    }

    // initial string with node name and non-null fields
    let sinit :ts.Expression
    if (lastNonNullableFieldIndex > -1) {
      let head = ts.createTemplateHead(`(${c.name}`)
      let spans :ts.TemplateSpan[] = []
      spans.push(ts.createTemplateSpan(
        ts.createIdentifier(sepArgName),
        ts.createTemplateMiddle(`(${fieldnames[0]} `)
      ))
      let i = 0
      for (; i < lastNonNullableFieldIndex; i++) {
        let left = fieldnames[i]
        let right = fieldnames[i + 1]
        spans.push(ts.createTemplateSpan(
          fieldReprExpr(fields.get(left)!),
          ts.createTemplateMiddle(`)`)
        ))
        spans.push(ts.createTemplateSpan(
          ts.createIdentifier(sepArgName),
          ts.createTemplateMiddle(`(${right} `)
        ))
      }
      spans.push(ts.createTemplateSpan(
        fieldReprExpr(fields.get(fieldnames[i])!),
        ts.createTemplateTail(firstNullableField ? ")" : "))")
      ))
      sinit = ts.createTemplateExpression(head, spans)
    } else {
      sinit = ts.createStringLiteral(`(${c.name}`)
    }

    // var s = <sinit>
    body.push(
      ts.createVariableStatement(
        undefined,
        [ts.createVariableDeclaration(
          "s",
          undefined,
          sinit
        )]
      )
    )

    // conditionally add nullable fields
    if (firstNullableField) {
      let foundCont = false
      for (let f of fields.values()) {
        if (!foundCont) {
          if (f === firstNullableField) {
            foundCont = true
          } else {
            continue
          }
        }
        // v.push(this.field)
        let reprExpr = ts.createExpressionStatement(
          ts.createBinary(
            ts.createIdentifier("s"),
            ts.SyntaxKind.PlusEqualsToken,
            ts.createBinary(
              ts.createBinary(
                ts.createBinary(
                  ts.createIdentifier("sep"),
                  ts.SyntaxKind.PlusToken,
                  ts.createStringLiteral(`(${f.name} `)
                ),
                ts.SyntaxKind.PlusToken,
                fieldReprExpr(f)
              ),
              ts.SyntaxKind.PlusToken,
              ts.createStringLiteral(`)`)
            )
          )
        )
        if (f.isNullable) {
          body.push(
            // if (this.field) v.push(this.field)
            ts.createIf(ts.createPropertyAccess(ts.createThis(), f.name), reprExpr)
          )
        } else {
          body.push(reprExpr)
        }
      }
    }

    // finally,
    if (firstNullableField) {
      ret = ts.createBinary(
        ts.createIdentifier("s"),
        ts.SyntaxKind.PlusToken,
        ts.createStringLiteral(")")
      )
    } else {
      ret = ts.createIdentifier("s")
    }

    body.push(ts.createReturn(ret))
    return makeMethod(body)
  }


  generateVisitMethod(c :NodeInfo) :ts.MethodDeclaration {
    // all public field names
    let fields = c.allFields()
    for (let name of Array.from(fields.keys())) {
      // hide "pos" field as it is very noisy and rarely helpful in repr
      if (name[0] == "_" || name == "pos") {
        fields.delete(name)
      }
    }

    let body :ts.Statement[] = []

    for (let f of fields.values()) {
      let prop :ts.Expression = ts.createPropertyAccess(ts.createThis(), f.name)
      let visitFun = "visitField"  // TODO: based on field type
      if (f.nodeType) {
        if (f.nodeType instanceof ArrayNode) {
          visitFun = "visitFieldNA"
        } else {
          visitFun = "visitFieldN"
        }
      } else if (f.type) {
        if (ts.isArrayTypeNode(f.type)) {
          let t = f.type.elementType
          if (ts.isParenthesizedTypeNode(t)) {
            // unwrap "(A|B)" => "A|B"
            t = t.type
          }
          if (ts.isUnionTypeNode(t)) {
            let allAreNodeTypes = true
            for (let t2 of t.types) {
              if (
                !ts.isTypeReferenceNode(t2) ||
                !ts.isIdentifier(t2.typeName) ||
                !this.nodeInfo.has(t2.typeName.escapedText.toString())
              ) {
                allAreNodeTypes = false
                break
              }
            }
            if (allAreNodeTypes) {
              visitFun = "visitFieldNA"
            } else {
              visitFun = "visitFieldA"
            }
          } else {
            visitFun = "visitFieldA"
          }
        } else if (ts.isTypeReferenceNode(f.type) && ts.isIdentifier(f.type.typeName)) {
          let typename = f.type.typeName.escapedText.toString()
          if (typename == "Storage" || typename == "token") {
            // TODO: automatically understand that "Storage" is an enum
            print(typename)
            visitFun = "visitFieldS"
            prop = ts.createElementAccess(
              ts.createIdentifier(typename),
              prop
            )
          }
        }
      }
      let stmt :ts.Statement = ts.createExpressionStatement(
        ts.createCall(
          ts.createPropertyAccess(ts.createIdentifier("v"), ts.createIdentifier(visitFun)),
          undefined,
          [ ts.createStringLiteral(f.name), prop ]
        )
      )
      if (f.isNullable) {
        if (f.nodeType) {
          stmt = ts.createIf(prop, stmt)
        } else {
          stmt = ts.createIf(
            ts.createBinary(
              prop,
              ts.SyntaxKind.ExclamationEqualsEqualsToken,
              ts.createNull()
            ),
            stmt
          )
        }
      }
      body.push(stmt)
    }

    return this.createMethod(
      "visit",
      // ts.createParameter(U, [publicKeyword], U, f.name, U, f.type)
      [
        ts.createParameter(
          undefined,
          [],
          undefined,
          "v",
          undefined,
          ts.createTypeReferenceNode("Visitor", [])
        ),
      ],
      null,
      ...body
    )
  }


  // main transformer function
  transform :ts.Transformer<T> = node => {
    let n = ts.visitNode(node, this.visit)
    if (!this.baseNode) {
      throw new Error("did not find \"Node\" class")
    }

    // link up parents
    for (let [classname, c] of this.nodeInfo) {
      if (c.parentName) {
        c.parent = this.nodeInfo.get(c.parentName)!
        if (!c.parent) {
          throw new Error(`can not find parent "${c.parentName}" of "${c.name}"`)
        }
      }
    }

    // enrich field types
    for (let [classname, c] of this.nodeInfo) {
      for (let f of c.fields) {
        if (!f.type) {
          let p = c.parent
          while (p) {
            let pf = p.getField(f.name)
            if (pf && pf.type) {
              f.type = pf.type
              break
            }
            p = p.parent
          }
        }
        if (f.type) {
          if (ts.isUnionTypeNode(f.type)) {
            // make sure we pick up on null types in unions and set FieldInfo.isNullable
            for (let t of f.type.types) {
              if (
                t.kind == ts.SyntaxKind.NullKeyword ||
                t.kind == ts.SyntaxKind.UndefinedKeyword
              ) {
                f.isNullable = true
                break
              }
            }
          }
          if (!f.nodeType) {
            let t :ts.TypeNode = f.type

            // unwrap array
            let arrayDepth :int[] = []
            const unwrapArray = (t :ts.TypeNode) :ts.TypeNode => {
              let d = 0
              while (ts.isArrayTypeNode(t)) {
                d++
                t = t.elementType
              }
              arrayDepth.push(d)
              return t
            }

            const wrapArray = (depth :int|undefined, f :FieldInfo) => {
              if (depth && f.nodeType) {
                // restore array type
                while (depth--) {
                  f.nodeType = new ArrayNode(f.nodeType)
                }
              }
            }

            t = unwrapArray(t)

            if (ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName)) {
              // look up & link up AST node type
              let typename = t.typeName.escapedText.toString()
              f.nodeType = this.nodeInfo.get(typename) || null
            } else if (ts.isUnionTypeNode(t)) {
              // in this case, the field is optional and was converted
              let typename = ""
              let hasMultipleTypes = false
              let typeInArrayOfDepth = 0
              for (let t2 of t.types) {
                t2 = unwrapArray(t2)
                if (ts.isTypeReferenceNode(t2) && ts.isIdentifier(t2.typeName)) {
                  if (typename) {
                    // we don't handle multiple AST Node field types (yet)
                    hasMultipleTypes = true
                  } else {
                    typename = t2.typeName.escapedText.toString()
                    typeInArrayOfDepth = arrayDepth.pop() || 0
                    continue
                  }
                }
                arrayDepth.pop()
              }
              if (!hasMultipleTypes && typename) {
                f.nodeType = this.nodeInfo.get(typename) || null
                wrapArray(typeInArrayOfDepth, f)
              }
            }

            wrapArray(arrayDepth.pop(), f)
          } // if (!f.nodeType)
        } // if (f.type)
      }
    }

    // generate members for Node class
    for (let [classname, c] of this.nodeInfo) {

      if (!c.hasMember("visit")) {
        c.addMember(this.generateVisitMethod(c))
      }

      // if (!c.hasMember(reprMethodName) && !c.hasParent("PrimType")) {
      //   c.addMember(this.generateReprMethod(c))
      // }

      // if (!c.hasMember("toString")) {
      //   c.addMember(this.generateToStringMethod(c))
      // }

      if (c !== this.baseNode) {
        // isTYPE() :this is TYPE
        this.baseNode.addMember(this.generateTypeTestMethod(classname))
      }
    }
    return n
  }


  visit = (n :ts.Node) :ts.Node => {
    // print(`visit ${ts.SyntaxKind[n.kind]} ${ts.isIdentifier(n) ? n.escapedText : ""}`)
    if (ts.isClassDeclaration(n)) {
      return this.visitClass(n)
    }
    if (ts.isImportDeclaration(n)) {
      return this.visitImport(n)
    }
    // if (ts.isFunctionDeclaration(n)) {
    //   print((n as any).body.statements[0].declarationList.declarations[0])
    // }
    return ts.visitEachChild(n, this.visit, this.context)
  }


  visitImport(n :ts.ImportDeclaration) :ts.ImportDeclaration {
    if (ts.isStringLiteral(n.moduleSpecifier)) {
      // rewrite relative paths since output file is written to parent dir
      let path = n.moduleSpecifier.text
      if (path[0] == ".") {
        // "../foo/bar" => "./foo/bar"
        // "../../bar" => "../bar"
        path = Path.relative("..", path)
        if (!path.startsWith("../")) {
          path = "./" + path
        }
        n.moduleSpecifier = ts.createStringLiteral(path)
      }
    }
    return n
  }


  visitClass(n :ts.ClassDeclaration) :ts.ClassDeclaration {
    // name of class
    let classname = n.name ? String(n.name.escapedText) : "_"

    // node info
    let info = new NodeInfo(classname, n)
    this.nodeInfo.set(classname, info)

    if (classname[0] != "_") {
      // make sure class has "export" modifier
      n.modifiers = ts.createNodeArray([ts.createModifier(ts.SyntaxKind.ExportKeyword)])
      // reference to base node
      if (classname == "Node") {
        this.baseNode = info
      }
    }

    // name of parent classes
    let parentClassname = ""
    if (n.heritageClauses) for (let h of n.heritageClauses) {
      if (h.token == ts.SyntaxKind.ExtendsKeyword) for (let t of h.types) {
        let e = t.expression
        if (ts.isIdentifier(e)) {
          parentClassname = e.escapedText.toString()
          info.parentName = parentClassname
          // note: TS does not support multiple inheritance
          break
        }
      }
    }

    // parent fields
    let parentFields = this.classToFields.get(parentClassname) || [] as ts.ParameterDeclaration[]
    let parentFieldNames = new Set<string>(parentFields.map(p =>
      (p.name as ts.Identifier).escapedText.toString()
    ))
    let parentFieldValues = new Map<string,ts.Expression>()

    // find fields
    info.fields = []
    let initBody :ts.Statement[] = []
    let hasCustomConstructor = false
    let mvMembers = new Set<ts.Node>()
    let numMovedDefaultValues = 0
    for (let i = 0; i < n.members.length; i++) {
      let m = n.members[i]

      if (ts.isConstructorDeclaration(m)) {
        hasCustomConstructor = true
        // print('cons', ts.SyntaxKind[m.parameters[0].kind], m.parameters[0])
        let paramsForSubclasses :ts.ParameterDeclaration[] = []
        for (let p of m.parameters) {
          paramsForSubclasses.push(ts.createParameter(
            p.decorators,
            undefined, // skip "public"
            p.dotDotDotToken,
            p.name,
            undefined, // no questionToken,
            p.type,
            // no initializer
          ))
        }
        this.classToFields.set(classname, paramsForSubclasses)
        break
      }

      // init() { ... } -- move ... to constructor
      if (
        !hasCustomConstructor &&
        ts.isMethodDeclaration(m) &&
        m.body &&
        ts.isIdentifier(m.name) &&
        m.name.escapedText.toString() == "init"
      ) {
        if (m.parameters.length > 0) {
          throw new Error(`unexpected init() method with parameters in class ${classname}`)
        }
        initBody = m.body.statements.slice()
        mvMembers.add(m)
        continue
      }

      // debug/print an existing method on a class.
      // useful for reverse-engineering TS AST<->code.
      if (
        ts.isMethodDeclaration(m) &&
        m.body &&
        ts.isIdentifier(m.name) &&
        m.name.escapedText.toString() == "foofoo"
      ) {
        print(
          repr(
            (m as any).body.statements[0], //.declarationList.declarations[0],
            // (m as any).body.statements[2],
            4
          )
        )
      }

      if (!ts.isPropertyDeclaration(m)) {
        continue
      }

      if (!ts.isIdentifier(m.name)) {
        continue
      }

      let name = m.name.escapedText.toString()
      let isNullable = false

      // if (classname == "Type") {
      //   print("parentFieldNames", parentFieldNames, {name})
      // }

      if (!m.type) {
        if (m.initializer) {
          // e.g. "foo = initval"
          if (parentFieldNames.has(name)) {
            parentFieldValues.set(name, m.initializer)
            mvMembers.add(m)
            info.unusedParentFields.add(name)
            numMovedDefaultValues++
            continue
          }
        } else {
          print(`missing type for field ${classname}.${name}`)
          continue
        }
      } else if (m.questionToken) {
        // convert "foo? :Type" -> "foo :Type|null|undefined"
        m.questionToken = undefined
        isNullable = true
        m.type = ts.createUnionTypeNode([
          ts.createKeywordTypeNode(ts.SyntaxKind.NullKeyword),
          // ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
          m.type,
        ])
      }

      info.fields.push(new FieldInfo(
        name,
        m.type || null,
        m.initializer || null,
        isNullable,
        info
      ))

      if (m.type && !m.initializer) {
        // move field to constructor
        mvMembers.add(m)
      }
    } // for (let i = 0; i < n.members.length; i++)

    // typecast class members to mutable array
    let classMembers = n.members as any as ts.ClassElement[]

    // remove members that will move into constructor
    if (!hasCustomConstructor) {
      for (let i = 0; i < n.members.length; i++) {
        if (mvMembers.has(n.members[i])) {
          classMembers.splice(i, 1)
          i--
        }
      }
    }

    // add constructor
    if (!hasCustomConstructor) {
      let publicKeyword = ts.createToken(ts.SyntaxKind.PublicKeyword)
      let params = new Map<string,ts.ParameterDeclaration>()
      let body :ts.Statement[] = []

      if (parentFields.length > 0 && parentFields.length >= parentFieldValues.size) {
        let superVals = new Array<ts.Expression>(parentFields.length)
        for (let i = 0; i < parentFields.length; i++) {
          let f = parentFields[i]
          let name = (f.name as ts.Identifier).escapedText.toString()
          let val = parentFieldValues.get(name)
          superVals[i] = val || ts.createIdentifier(name)
          if (!val) {
            params.set(name, f)
          }
        }
        // super(param0, param1, ...)
        body = [
          ts.createExpressionStatement(
            ts.createCall(ts.createSuper(), undefined, superVals)
          )
        ]
      }
      let paramsForSubclasses = new Map<string,ts.ParameterDeclaration>(params)
      let localParamCount = 0
      const U = undefined
      for (let f of info.fields) {
        if (f.type && !f.init) {
          localParamCount++
          params.set(f.name, ts.createParameter(U, [publicKeyword], U, f.name, U, f.type))
          paramsForSubclasses.set(f.name, ts.createParameter(U, [], U, f.name, U, f.type))
        }
      }

      // add constructor if the class has any local fields
      if (localParamCount > 0 || numMovedDefaultValues > 0 || initBody.length > 0) {
        if (initBody.length > 0) {
          body = body.concat(initBody)
        }
        let cons = ts.createConstructor(
          undefined,
          undefined,
          Array.from(params.values()),
          ts.createBlock(body, /*multiline*/false),
        )
        classMembers.unshift(cons)
      }


      this.classToFields.set(classname, Array.from(paramsForSubclasses.values()))
    }

    // print({classname, parentClassname, hasCustomConstructor, fields})

    return ts.visitEachChild(n, this.visit, this.context)
    // return n
  }
}


function transform<T extends ts.Node>(f :T) :T  {
  let transformers :ts.TransformerFactory<T>[] = [
    (context: ts.TransformationContext) :ts.Transformer<T> =>
      new Transformer<T>(context).transform
  ]

  let compilerOptions :ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
  }

  let r = ts.transform<T>(f, transformers, compilerOptions)

  if (r.diagnostics) {
    let file = ts.isSourceFile(f) ? f.fileName : "<input>"
    if (printDiagnostics(r.diagnostics, file) > 0) {
      process.exit(1)
    }
  }

  return r.transformed[0]!
}


const IGNORE     = -1
    , INFO       = ts.DiagnosticCategory.Message
    , WARN       = ts.DiagnosticCategory.Warning
    , ERR        = ts.DiagnosticCategory.Error
    , SUGGESTION = ts.DiagnosticCategory.Suggestion
    , OK         = IGNORE

// rules maps TS diagnostics codes to severity levels.
// The special value IGNORE can be used to completely silence a diagnostic.
// For diagnostic codes not listed, the default DiagnosticCategory for a
// certain diagnostic is used.
const diagrules = {
  6031: IGNORE, // starting compilation
  6194: IGNORE, // Found N errors. Watching for file changes.
  6133: WARN,   // unused variable, parameter or import
}

// returns number of errors
function printDiagnostics(diagnostics :ts.DiagnosticWithLocation[], file :string) :number {
  let errcount = 0
  file = Path.relative(rootdir, file)
  for (let d of diagnostics) {
    let {line, character} = ts.getLineAndCharacterOfPosition(d.file, d.start)
    let level = diagrules[d.code] !== undefined ? diagrules[d.code] : d.category
    let levelstr = "W"
    if (level == ERR) {
      levelstr = "E"
      errcount++
    }
    console.error(
      `${file}:${line+1}:${character+1}: ${levelstr} ` +
      ts.flattenDiagnosticMessageText(d.messageText, "\n") +
      `  [TS${d.code}]`
    )
  }
  return errcount
}


try {
  main()
} catch (e) {
  console.error(e.stack || ""+e)
  process.exit(1)
}
