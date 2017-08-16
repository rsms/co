import './global'
import * as parser from './parser'
import * as scanner from './scanner'
import { Position, FileSet } from './pos'
import * as fs from 'fs'
import { ByteStrSet } from './bytestr'
import { astRepr } from './ast-repr'
// import { inspect } from 'util'

// function repr(v :any, depth :number = 10) :string {
//   return inspect(v, { depth, colors: true })
// }

function main() {
  const p = new parser.Parser()

  const onErr = (p :Position, msg :string) => {
    console.error(`[scanner error] ${msg} at ${p}`)
  }

  const strSet = new ByteStrSet()
  const fileSet = new FileSet()

  const filename = 'example/imports.go'
  const src = new Uint8Array(fs.readFileSync(filename, {flag:'r'}))
  const file = fileSet.addFile(filename, src.length)

  p.initParser(file, src, strSet, onErr, scanner.Mode.ScanComments)

  const imports = p.parseImports()
  console.log(`${imports.length} imports`)
  for (const imp of imports) {
    console.log(astRepr(imp))
  }

  const decls = p.parseBody()
  console.log(`${decls.length} declarations`)
  for (const decl of decls) {
    console.log(astRepr(decl))
  }

}


main()
