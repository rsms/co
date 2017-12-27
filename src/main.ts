// require('source-map-support').install()
import './global'
import * as parser from './parser'
import { bindpkg } from './bind'
import * as scanner from './scanner'
import { Position, SrcFileSet } from './pos'
import * as fs from 'fs'
import { ByteStr, ByteStrSet } from './bytestr'
import { Node, Scope, Obj, Package } from './ast'
import { astRepr } from './ast-repr'
import { str8buf } from './util'

function main() {
  const p = new parser.Parser()

  const errh = (p :Position, msg :string, typ :string) => {
    console.error(`${p}: ${msg} (${typ})`)
  }

  const strSet = new ByteStrSet()
  const sfileSet = new SrcFileSet()

  const universe = getUniverse(strSet)
  const pkg = new Package("example", new Scope(universe))

  const sfiles = ['example/scope.xl']
  const files = []

  for (let filename of sfiles) {
    console.log(`————————————\nparse ${filename}`)
    const sdata = fs.readFileSync(filename, {flag:'r'}) as Uint8Array
    const sfile = sfileSet.addFile(filename, sdata.length)

    p.initParser(
      sfile, sdata, strSet, pkg.scope, errh, scanner.Mode.ScanComments
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
    function importer(imports :Map<string,Obj>, path :string) :Promise<Obj> {
      return Promise.reject(new Error(`not found`))
    }
    bindpkg(pkg, sfileSet, files, importer, errh).then(hasErrors => {
      console.log('pkg:', !!pkg)
    })
  }
}


function getUniverse(strSet :ByteStrSet) :Scope {
  const unidecls = new Map<ByteStr,Obj>()
  const universe = new Scope(null, unidecls)
  const def = (name :string) => {
    let n = strSet.emplace(str8buf(name))
    console.log(`"${name}" => "${n}"  ${n.hash.toString(16)}`)
    unidecls.set(n, new Obj(n, new Node(0, universe), null))
  }
  def("true")
  def("false")
  def("nil")
  // TODO: fixme
  return universe
}


main()
