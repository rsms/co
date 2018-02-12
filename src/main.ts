import { Parser } from './parser'
import { bindpkg } from './bind'
import * as scanner from './scanner'
import { Position, SrcFileSet } from './pos'
import { ByteStrSet } from './bytestr'
import { TypeSet } from './typeset'
import { astRepr } from './ast-repr'
import { Package, Scope, Ent } from './ast'
import { Universe } from './universe'
import { TypeResolver } from './resolve'
import { stdoutStyle, stdoutSupportsStyle } from './termstyle'
import { IRBuilder } from './ir'
import * as ir from './ir'
import { printir, fmtir } from './ir-repr'


// fs
type SyncFileReader = (fn :string, options? :{[k:string]:any}) => Uint8Array
let readFileSync :SyncFileReader
let isNodeJsLikeEnv = false
try {
  const _readFileSync = require('fs').readFileSync
  readFileSync = _readFileSync as SyncFileReader
  isNodeJsLikeEnv = true
} catch(_) {
  // Hack to support the playground.
  // TODO: export a nice API instead of this mess.
  let global_readFileSync = global['readFileSync']
  if (global_readFileSync && typeof global_readFileSync == 'function') {
    readFileSync = global_readFileSync as SyncFileReader
  } else {
    readFileSync = (fn :string, options? :{[k:string]:any}) => {
      // FIXME
      return new Uint8Array(0)
    }
  }
}


const reprOptions = {colors:stdoutSupportsStyle}

// TODO FIXME this collects errors and diagnostics for the web playground.
// replace this with a better API.
interface diaginfo {
  type: string  // info | warn | error
  errcode?: string // available when type=="error"
  message: string
  pos: Position
}
let diagnostics :diaginfo[]

function errh(pos :Position, message :string, errcode :string) {
  if (isNodeJsLikeEnv) {
    let msg = `${pos}: ${message} (${errcode})`
    console.error(stdoutStyle.red(msg))
  }
  diagnostics.push({ type: 'error', errcode, message, pos })
}

function diagh(pos :Position, message :string, type :string) {
  if (isNodeJsLikeEnv) {
    const msg = `${pos}: ${type}: ${message}`
    console.log(
      '[diag] ' +
      ( type == "info" ? stdoutStyle.cyan(msg) :
        stdoutStyle.lightyellow(msg)
      )
    )
  }
  diagnostics.push({ type, message, pos })
}

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
  const fset = new SrcFileSet()

  typeres.init(fset, universe, errh)

  for (let filename of sources) {
    if (isNodeJsLikeEnv) {
      banner(`parse ${filename}`)
    }

    const sdata = readFileSync(filename, {flag:'r'}) as Uint8Array
    const sfile = fset.addFile(filename, sdata.length)

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

    if (isNodeJsLikeEnv) {
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
      // for (let decl of file.decls) {
      //   console.log(astRepr(decl, reprOptions))
      // }
      console.log(astRepr(file, reprOptions))
    }
  }

  if (parser.errorCount > 0 || typeres.errorCount > 0) {
    return Promise.resolve({ pkg, success: false })
  }

  // bind and assemble package
  if (isNodeJsLikeEnv) {
    banner(`bind & assemble ${pkg}`)
  }
  function importer(_imports :Map<string,Ent>, _path :string) :Promise<Ent> {
    return Promise.reject(new Error(`not found`))
  }

  return bindpkg(pkg, fset, importer, typeres, errh)
    .then(hasErrors => ( { pkg, success: !hasErrors } ))
}

interface MainResult {
  success     :bool
  diagnostics :diaginfo[]
  ast?        :Package
  ir?         :ir.Pkg
}

function main(sources? :string[], noIR? :bool) :Promise<MainResult> {
  const strSet = new ByteStrSet()
  const typeSet = new TypeSet()
  const universe = new Universe(strSet, typeSet)
  const typeres = new TypeResolver()
  const parser = new Parser()

  const _sources = sources || ['example/ssa1.xl']
  diagnostics = []

  let p = parsePkg("example", _sources, universe, parser, typeres).then(r => {
    if (!r.success) {
      return { success: false, diagnostics, ast: r.pkg }
    }
    if (noIR) {
      return { success: true, diagnostics, ast: r.pkg }
    }

    const irb = new IRBuilder()
    irb.init(diagh)

    // print AST & build IR
    try {
      for (const file of r.pkg.files) {

        if (isNodeJsLikeEnv) {
          banner(`${r.pkg} ${file.sfile.name} ${file.decls.length} declarations`)
          console.log(astRepr(r.pkg, reprOptions))
          // for (let decl of file.decls) {
          //   console.log(astRepr(decl, reprOptions))
          // }
          banner(`ssa-ir ${file.sfile.name}`)
        }

        // build IR
        let sfile = file.sfile
        for (let d of file.decls) {
          let n = irb.addTopLevel(sfile, d)
          if (isNodeJsLikeEnv) {
            if (n) {
              console.log(`\n-----------------------\n`)
              printir(n)
            }
          }
        }
      }

      return { success: true, diagnostics, ast: r.pkg, ir: irb.pkg }
    } catch (error) {
      return { success: false, error, diagnostics, ast: r.pkg }
    }
  })

  if (!sources && isNodeJsLikeEnv) {
    return p.catch(err => {
      console.error(err.stack || ''+err)
      process.exit(1)
      return { success: false, diagnostics }
    })
  }

  return p
}


// banner prints a large message, using terminal styling when available.
//
function banner(message :string) {
  if (stdoutSupportsStyle) {
    // '\x1b[47;30m'    black on white
    // '\x1b[40;37;1m'  bold white on black
    // '\x1b[44;37;1m'  bold white on blue
    const s = (s :string) => '\x1b[40m' + stdoutStyle.white(s) + '\x1b[0m'
    process.stdout.write(
      s('\n\n  ' + message + '\n') + '\n\n'
    )
  } else {
    console.log(
      '\n========================================================\n' +
      message +
      '\n--------------------------------------------------------'
    )
  }
}


if (isNodeJsLikeEnv) {
  main()
} else {
  global['colang'] = {
    main,
    fmtast: astRepr,
    fmtir,
    printir,
  }
}
