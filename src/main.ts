import { Parser, DiagKind } from './parser'
import { bindpkg } from './bind'
import * as scanner from './scanner'
import { Position, SrcFileSet } from './pos'
import * as fs from 'fs'
import { ByteStrSet } from './bytestr'
import { TypeSet } from './typeset'
import { astRepr } from './ast-repr'
import { Package, Scope, Ent } from './ast'
import { Universe } from './universe'
import { TypeResolver } from './resolve'
import { stdoutStyle, stdoutSupportsStyle } from './termstyle'


const reprOptions = {colors:stdoutSupportsStyle}


interface ParseResults {
  pkg     :Package
  success :bool
}

function parsePkg(
  name     :string,
  sources  :string[],
  universe :Universe,
  parser   :Parser,
  typeres  :TypeResolver,
) :Promise<ParseResults> {

  const pkg = new Package(name, new Scope(universe.scope))
  const sfileSet = new SrcFileSet()

  const errh = (p :Position, msg :string, typ :string) => {
    console.error(stdoutStyle.red(`${p}: ${msg} (${typ})`))
  }

  const diagh = (p :Position, msg :string, k :DiagKind) => {
    const m = `[diag] ${p}: ${msg} (${DiagKind[k]})`
    console.log(k == DiagKind.INFO ? stdoutStyle.cyan(m) : stdoutStyle.lightyellow(m))
  }

  typeres.init(sfileSet, universe, errh)

  for (let filename of sources) {
    console.log(
      '\n--------------------------------------------------------\n' + 
      `parse ${filename}`
    )
    const sdata = fs.readFileSync(filename, {flag:'r'}) as Uint8Array
    const sfile = sfileSet.addFile(filename, sdata.length)

    parser.initParser(
      sfile,
      sdata,
      universe,
      pkg.scope,
      typeres,
      errh,
      diagh,
      scanner.Mode.ScanComments
    )

    const file = parser.parseFile()
    pkg.files.push(file)

    if (file.imports) {
      console.log(`${file.imports.length} imports`)
      for (let imp of file.imports) {
        console.log(astRepr(imp, reprOptions))
      }
    }

    if (file.unresolved) {
      console.log(`${file.unresolved.size} unresolved references`)
      for (let ident of file.unresolved) {
        console.log(' - ' + astRepr(ident, reprOptions))
      }
    }

    console.log(`${file.decls.length} declarations`)
    for (let decl of file.decls) {
      console.log(astRepr(decl, reprOptions))
    }
  }

  if (parser.errorCount != 0) {
    return Promise.resolve({ pkg, success: false })
  }

  // bind and assemble package
  console.log(
    '\n--------------------------------------------------------\n' + 
    `bind & assemble ${pkg}`
  )
  function importer(_imports :Map<string,Ent>, _path :string) :Promise<Ent> {
    return Promise.reject(new Error(`not found`))
  }

  return bindpkg(pkg, sfileSet, importer, typeres, errh)
    .then(hasErrors => ( { pkg, success: !hasErrors } ))
}


function main() {
  const strSet = new ByteStrSet()
  const typeSet = new TypeSet()
  const universe = new Universe(strSet, typeSet)
  const typeres = new TypeResolver()
  const parser = new Parser()

  parsePkg("example", ['example/scope4.xl'], universe, parser, typeres).then(r => {
    if (!r.success) {
      return
    }

    // print AST
    for (const file of r.pkg.files) {
      console.log('\n========================================================')
      console.log(
        `${r.pkg} ${file.sfile.name} ${file.decls.length} declarations`)
      console.log('--------------------------------------------------------')
      for (let decl of file.decls) {
        console.log(astRepr(decl, reprOptions))
      }
    }

  })
}


main()
