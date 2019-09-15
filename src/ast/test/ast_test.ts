import * as S from "../../sexpr"
import { token } from "../../token"
import * as Path from "../../path"
import { assertEq, assertEqList, assertEqObj, assertThrows, quickcheck } from "../../test"
import { Mode as ScanMode } from "../../scanner"
import * as ast from "../../ast"
import * as api from "../../api"
import * as utf8 from "../../utf8"
import { mstr, bufcopy } from "../../util"


function getFixturesDir() {
  // Note: __dirname is the directory of the co program, not this source file
  return Path.clean(__dirname + "/../src/ast/test") + "/"
}

function rpath(fn :string) :string {
  // version of relPath that doesn't rely on the environment
  let dir = Path.dir(__dirname) + "/"
  return fn.startsWith(dir) ? fn.substr(dir.length) : fn
}


TEST('empty', async () => {
  let chost = api.createCompilerHost()
  let dir = getFixturesDir()

  // parse empty file by having compiler host read it from disk
  if (!api.isNoFileSystem(chost.fs)) {
    let file = await chost.parseFile(dir + "empty.co")
    assert(file instanceof ast.File)
    assertEq(file.imports.length, 0)
    assertEq(file.decls.length, 0)
    assertEq(api.getDiagnostics(file).length, 0)
  }

  // parse empty file by providing source content
  {
    let file = await chost.parseFile("empty.co", new Uint8Array())
    assert(file instanceof ast.File)
    assertEq(file.imports.length, 0)
    assertEq(file.decls.length, 0)
    assertEq(api.getDiagnostics(file).length, 0)
  }

  // parse empty package
  {
    let pkg = await chost.parsePackage("test1", [["empty1.co", ""], ["empty2.co", ""]])
    assert(pkg instanceof ast.Package)
    assertEq(pkg.files.length, 2)
    assertEq(api.getDiagnostics(pkg).length, 0)
  }

  // parse empty package (no source files)
  {
    let pkg = await chost.parsePackage("test1", [])
    assert(pkg instanceof ast.Package)
    assertEq(pkg.files.length, 0)
    assertEq(api.getDiagnostics(pkg).length, 0)
  }
})


TEST('#directive', () => {
  let chost = getCompilerHost()

  { // #end offset at EOF
    let source = utf8.encodeString(`x = 1\n#end`)
    let file = parseFile("a.co", source) ; assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 10) // #end|<EOF>
    assertEq(file.endPos!.line, 2)
  }

  { // #end offset at EOF with semicolon
    let source = utf8.encodeString(`x = 1\n#end;`)
    let file = parseFile("a.co", source) ; assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 11) // #end;|<EOF>
  }

  { // #end offset at EOF with whitespace and semicolon
    let source = utf8.encodeString(`x = 1\n#end \t ;`)
    let file = parseFile("a.co", source) ; assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 14) // #end;|<EOF>
  }

  { // #end at beginning of file and at EOF
    let source = utf8.encodeString(`#end`)
    let file = parseFile("a.co", source) ; assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 4) // #end|<EOF>
    assertEq(file.endPos!.line, 1)
  }

  { // #end offset with implicit semicolon
    let source = utf8.encodeString(mstr(`
    x = 1
    #end
    hello
    `))
    let file = parseFile("a.co", source) ; assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 11) // #end\n|hello
  }

  { // #end offset with explicit semicolon
    let source = utf8.encodeString(mstr(`
    x = 1
    #end;
    hello
    `))
    let file = parseFile("a.co", source) ; assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 12) // #end;\n|hello
  }

  { // #end offset with explicit semicolon and CR
    let source = utf8.encodeString(`x = 1\r\n#end;\r\nhello`)
    let file = parseFile("a.co", source) ; assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 14) // #end;\r\n|hello
  }

  { // #end offset with implicit semicolon and comment
    let source = utf8.encodeString(mstr(`
    x = 1
    #end // comment
    hello
    `))
    let file = parseFile("a.co", source) ; assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 22)
  }

  { // #end offset with implicit semicolon and comment (with comment scanning enabled)
    let source = utf8.encodeString(mstr(`
    x = 1
    #end // comment
    hello
    `))
    let file = parseFile("a.co", source, api.ScanMode.ScanComments)
    assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 22)
  }

  { // #end offset with explicit semicolon and comment
    let source = utf8.encodeString(mstr(`
    x = 1
    #end; // comment
    hello
    `))
    let file = parseFile("a.co", source) ; assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 23)
  }

  { // #end with data
    let source = utf8.encodeString(mstr(`
    x = 1
    #end // comment
    hello world
    `))
    let file = parseFile("a.co", source)
    assertEq(api.getErrorCount(file), 0)
    // print(file.repr({colors:true}))
    assertEq(file.endPos!.offset, 22)   // beginning of "hello world"
    assertEq(file.endMeta.length, 0)    // no directive metadata
    let data = source.subarray(file.endPos!.offset)
    assertEq(utf8.decodeToString(data), "hello world\n")
  }

  { // #end with arbitrary data
    let source = utf8.encodeString(mstr(`
    x = 1
    #end
    `))

    // append data to end of source
    let dataIn = [0, 1, 2, 0xFF]
    let i = source.length
    source = bufcopy(source, dataIn.length)
    for (let b of dataIn) {
      source[i++] = b
    }

    let file = parseFile("a.co", source)
    assertEq(api.getErrorCount(file), 0)
    assertEq(file.endPos!.offset, 11)   // beginning of data

    let dataOut = source.subarray(file.endPos!.offset)
    assertEq(dataOut.length, dataIn.length)
    for (let i = 0; i < dataIn.length; i++) {
      assertEq(dataOut[i], dataIn[i])
    }
  }

  { // #end with metadata
    let file = parseFile("a.co", mstr(`
    x = 1
    #end foo "bar" 45 6.78
    hello world
    `))
    assertEq(api.getErrorCount(file), 0)
    assert(file.endPos)  // in this test we only care about endPos being set
    assertEq(file.endMeta.length, 4)
    assertEq(file.endMeta[0].repr(), "(id foo)")
    assertEq(file.endMeta[1].repr(), '(StringLit "bar" str<3>)')
    assertEq(file.endMeta[2].repr(), "(IntLit 45 int)")
    assertEq(file.endMeta[3].repr(), "(FloatLit 6.78 f64)")
  }

  // invalid directive
  assertParseError(mstr(`
  x = 1
  #lol
  `), /invalid directive/)

  // invalid metadata (not just expressions)
  assertParseError(mstr(`
  x = 1
  #end x = 1
  `), /expecting expression/)
})



TEST('suite', async () => {
  let chost = getCompilerHost()
  if (api.isNoFileSystem(chost.fs)) {
    return
  }

  let fs = chost.fs

  let dir = getFixturesDir()
  for (let name of fs.readdirSync(dir)) {
    if (name.endsWith(".co")) {
      await testFile(dir + name)
    }
  }

  async function testFile(filename :string) {
    // Parses a file and compares the resulting AST to an "expected" AST defined
    // in a comment in the source file.
    //
    // The "expect" comment should have the prefix "!expect" (no leading spaces)
    // and the remainder of the comment is parsed as s-expression AST.
    //
    // The actual parsed AST need only match the parts defined in the expected
    // structure, allowing some leeway in terms of irrelevant information.
    // For instance, a test case that doesn't case about Node.pos can simply omit
    // (pos N) from "expected".
    //
    print(`  test ${rpath(filename)}`)

    let data = await fs.readfile(filename)
    let file = parseFile(filename, data)
    if (!file.endPos) {
      return
    }
    let actual = fileToSExpr(file)

    let expectCode = utf8.decodeToString(data.subarray(file.endPos.offset))
    let expect = parseSExpr(filename, expectCode, file.endPos.line)
    assert(expect instanceof S.List, `"expected" s-expr should be a single list (got ${expect})`)
    expect = expect[0] as S.List

    // find difference between what is expected and what was actually parsed
    let diff = S.diff(expect, actual)
    if (diff) {
      print("---\nexpect:\n" + expect.toString("\n"))
      print("---\nactual:\n" + actual.toString("\n"))
      print("---\ndiff:\n" + (diff && diff.toString("\n")))
      assert(false, `unexpected parse result for ${rpath(filename)}`)
    }
  }

})


// --------------------------------------------------------------------------------
// helpers


function parseFile(filename :string, code :api.SourceData, mode? :api.ScanMode) :api.ast.File {
  let chost = getCompilerHost()
  return chost.parseFile(filename, code, undefined, d => console.error(d.toString()), mode)
}


function fileToSExpr(file :api.ast.File) :S.List {
  let decls = (parseSExpr(file.sfile.name, file.repr(), 0)[0] as S.List).get("decls") as S.List
  decls.shift() // pop "decls" keyword at beginning of list
  return decls
}

function parseSExpr(filename :string, source :string, lineOffset :int) :S.List {
  return S.parse(source, {
    filename,
    ltgt: S.AS_SYM, // treat <...> as part of sym (instead of list)
    lineOffset: lineOffset > 0 ? lineOffset-1 : 0,
  })
}

let _chost :api.CompilerHost|null = null

function getCompilerHost() {
  return _chost || (_chost = api.createCompilerHost())
}


// assertParseError tests that source produces errors.length number of errors,
// each matching errors[N] in order.
//
function assertParseError(source :string, ...errors :(RegExp|string)[]) {
  let chost = getCompilerHost()
  let diags :api.Diagnostic[] = []
  let file = chost.parseFile("a.co", source, undefined, d => {
    if (d.kind == "error") {
      diags.push(d)
    }
  })
  assertEq(api.getErrorCount(file), errors.length)
  for (let i = 0; i < diags.length; i++) {
    let d = diags[i]
    let match = errors[i]
    assert(
      (typeof match == "string") ? d.message === match : match.test(d.message),
      `expected error ${repr(d.message)} to match ${repr(match)}`
    )
  }
}


// // parseExpect takes a source file as input and returns the Co code and the "expected" sepxr.
// function parseExpect(filename :string, code :string) :[string, S.List|null] {
//   const prefix = "!expect"
//   let expect :S.List|null = null
//   let chost = getCompilerHost()
//   chost.scanFile(filename, code, (t, s) :any => {
//     if (t == token.COMMENT) {
//       let comment = s.stringValue()
//       if (comment.startsWith(prefix)) {
//         let pos = s.currentPosition()
//         let ai = pos.offset
//         let bi = code.indexOf("\n", ai)
//         if (bi != -1) {
//           let expectCode = code.substr(bi)
//           code = code.substr(0, ai)
//           expect = parseSExpr(filename, expectCode, pos.line)
//           assert(expect instanceof S.List, `${prefix} should be a single list (got ${expect})`)
//           expect = expect[0] as S.List
//         }
//         return false  // stop scanner
//       }
//     }
//   }, undefined, ScanMode.ScanComments)
//   return [code, expect]
// }
