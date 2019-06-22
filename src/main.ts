import { Parser } from './parser'
import { bindpkg } from './bind'
import * as scanner from './scanner'
import { Position, SrcFileSet } from './pos'
import { ByteStrSet } from './bytestr'
import { TypeSet } from './typeset'
import { Package, Scope, Ent } from './ast'
import { astRepr } from './ast_repr'
import { Universe } from './universe'
import { TypeResolver } from './resolve'
import { stdoutStyle, stdoutSupportsStyle } from './termstyle'

import { Pkg as IRPkg } from './ir/ssa'
import { IRBuilder, IRBuilderFlags } from './ir/builder'
import { printir, fmtir } from './ir/repr'
// import { IRVirtualMachine } from './ir/vm'
import { runPassesDev } from './ir/passes'
import { Program } from './asm/prog'

import { archs } from './arch/all'
import './all_tests'


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
  let global_readFileSync = GlobalContext['readFileSync']
  if (global_readFileSync && typeof global_readFileSync == 'function') {
    readFileSync = global_readFileSync as SyncFileReader
  } else {
    readFileSync = (fn :string, options? :{[k:string]:any}) => {
      // FIXME
      console.log('TODO read', fn, 'options:', options)
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
  ir?         :IRPkg
  error?      :Error
}

interface MainOptions {
  sources?    :string[]
  noOptimize? :bool
  noIR?       :bool
  genericIR?  :bool  // stop IR pipeline early. (don't do regalloc etc.)
}

async function main(options? :MainOptions) :Promise<MainResult> {
  const strSet = new ByteStrSet()
  const typeSet = new TypeSet()
  const universe = new Universe(strSet, typeSet)
  const typeres = new TypeResolver()
  const parser = new Parser()

  options = options || {}

  const _sources = (
    options.sources && options.sources.length ? options.sources :
    ['example/ssa1.co']
  )

  // clear diagnostics from past run (this is a global var)
  diagnostics = []

  let r = await parsePkg("example", _sources, universe, parser, typeres)
  if (!r.success) {
    return { success: false, diagnostics, ast: r.pkg }
  }

  // skip code generation?
  if (options.noIR) {
    return { success: true, diagnostics, ast: r.pkg }
  }

  // select target arch and build configuration
  console.log('available target archs:', Object.keys(archs).join(', '))
  const arch = archs['covm']
  const config = arch.config({
    optimize: !options.noOptimize,
  })
  console.log(`selected target config: ${config}`)


  const irb = new IRBuilder()  // reusable

  irb.init(config, diagh, IRBuilderFlags.Comments)

  // print AST & build IR
  try {
    for (let file of r.pkg.files) {

      if (isNodeJsLikeEnv) {
        banner(
          `${r.pkg} ${file.sfile.name} ${file.decls.length} declarations`
        )
        console.log(astRepr(r.pkg, reprOptions))
        // for (let decl of file.decls) {
        //   console.log(astRepr(decl, reprOptions))
        // }
        banner(`ssa-ir ${file.sfile.name}`)
      }

      // build IR
      let sfile = file.sfile
      for (let d of file.decls) {
        let fn = irb.addTopLevel(sfile, d)
        if (isNodeJsLikeEnv && fn) {
          console.log(`\n-----------------------\n`)
          printir(fn)
        }
      }


      // run IP passes separately for debugging (normally run online)
      let stopAtPass = options.genericIR ? "lower" : ""
      // stopAtPass = "generic deadcode"

      for (let [ , f] of irb.pkg.funs) {
        runPassesDev(f, config, stopAtPass, pass => {
          if (isNodeJsLikeEnv) {
            console.log(`after ${pass.name}\n`)
            printir(f)
            console.log(
              `━━━━━━━━━━━━━━━━━━━━━━━━` +
              `━━━━━━━━━━━━━━━━━━━━━━━━`
            )
          }
        })

        let prog = new Program(f, config)
        prog.gen()
      }

    }

    // Run in development VM
    // banner(`vm`)
    // const vm = new IRVirtualMachine(irb.pkg, diagh)
    // let mainfun = irb.pkg.mainFun() || null
    // if (mainfun) {
    //   vm.execFun(mainfun)
    // } else {
    //   console.warn('no main function found in package -- not executing')
    // }

    return {
      success: true,
      diagnostics,
      ast: r.pkg,
      ir: irb.pkg,
      // code: codegen.something
    }
  } catch (error) {
    if (isNodeJsLikeEnv) {
      throw error
    }
    return { success: false, error, diagnostics, ast: r.pkg }
  }
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

if (typeof GlobalContext.runAllTests == 'function') {
  GlobalContext.runAllTests()
}

if (isNodeJsLikeEnv) {
  if (DEBUG && process.argv.includes('-test-only')) {
    console.log('only running unit tests')
  } else {
    main({
      sources: process.argv.slice(2).filter(v => !v.startsWith('-')),
      noOptimize: process.argv.includes('-no-optimize'),
    }).catch(err => {
      console.error(err.stack || ''+err)
      process.exit(1)
      // return { success: false, diagnostics }
    })
  }
} else {
  GlobalContext['colang'] = {
    main,
    fmtast: astRepr,
    fmtir,
    printir,
  }
}
