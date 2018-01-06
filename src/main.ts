import * as parser from './parser'
import { bindpkg } from './bind'
import * as scanner from './scanner'
import { Position, SrcFileSet } from './pos'
import * as fs from 'fs'
import { ByteStrSet } from './bytestr'
import { astRepr } from './ast-repr'
import { Package, Scope, Ent } from './ast'
import { Universe } from './universe'

function main() {
  const p = new parser.Parser()

  const errh = (p :Position, msg :string, typ :string) => {
    console.error(`${p}: ${msg} (${typ})`)
  }
  const diagh = (p :Position, msg :string, k :parser.DiagKind) => {
    console.log(`[diag] ${p}: ${msg} (${parser.DiagKind[k]})`)
  }

  const strSet = new ByteStrSet()
  const sfileSet = new SrcFileSet()

  const universe = new Universe(strSet)
  const pkg = new Package("example", new Scope(universe.scope))

  const sfiles = ['example/functions.xl']
  const files = []

  for (let filename of sfiles) {
    console.log(`————————————\nparse ${filename}`)
    const sdata = fs.readFileSync(filename, {flag:'r'}) as Uint8Array
    const sfile = sfileSet.addFile(filename, sdata.length)

    p.initParser(
      sfile,
      sdata,
      universe,
      pkg.scope,
      errh,
      diagh,
      scanner.Mode.ScanComments
    )

    const file = p.parseFile()
    files.push(file)

    if (file.imports) {
      console.log(`${file.imports.length} imports`)
      for (let imp of file.imports) {
        console.log(astRepr(imp))
      }
    }

    console.log(`${file.unresolved.size} unresolved`)
    for (let ident of file.unresolved) {
      console.log(' - ' + astRepr(ident))
    }

    console.log(`${file.decls.length} declarations`)
    for (let decl of file.decls) {
      console.log(astRepr(decl))
    }
  }

  // bind and assemble package
  if (p.errorCount == 0) {
    console.log(`————————————\nbind & assemble ${pkg}`)
    function importer(_imports :Map<string,Ent>, _path :string) :Promise<Ent> {
      return Promise.reject(new Error(`not found`))
    }
    bindpkg(pkg, sfileSet, files, importer, errh).then(_hasErrors => {
      console.log('pkg:', !!pkg)
    })
  }
}


main()
