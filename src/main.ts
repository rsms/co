import { Parser } from './parser'
import { bindpkg } from './bind'
import * as scanner from './scanner'
import { NoPos, Position, SrcFileSet } from './pos'
import { TypeSet } from './typeset'
import { Node, Package, Scope, Ent, Stmt, nilScope } from './ast'
import { Universe } from './universe'
import { TypeResolver } from './resolve'
import { stdoutStyle, stdoutSupportsStyle } from './termstyle'
import { strings } from "./bytestr"
// import * as astio from './astio'
import * as utf8 from './utf8'

import { Pkg as IRPkg } from './ir/ssa'
import { IRBuilder, IRBuilderFlags } from './ir/builder'
import { printir, fmtir } from './ir/repr'
import { runPassesDev } from './ir/passes'
import { Program } from './asm/prog'

import { archs } from './ir/arch'
import { Config } from "./ir/config"
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
      print('TODO read', fn, 'options:', options)
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
    print(
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
      pkg._scope,
      typeres,
      errh,
      diagh,
      scanner.Mode.ScanComments
    )

    const file = parser.parseFile()
    pkg.files.push(file)

    if (isNodeJsLikeEnv) {
      if (file.imports) {
        print(`${file.imports.length} imports`)
        for (let imp of file.imports) {
          print("  " + imp.repr())
        }
      }

      if (file.unresolved) {
        print(`${file.unresolved.size} unresolved references`)
        for (let ident of file.unresolved) {
          print("  " + ident.repr())
        }
      }

      // print(`${file.decls.length} declarations`)
      // for (let decl of file.decls) {
      //   print(decl.repr())
      // }
      // print(file.repr())
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
    // TODO: FIXME implement
    let name = strings.get(utf8.encodeString(_path))
    return Promise.resolve(new Ent(name, new Stmt(NoPos, nilScope), null))
    // return Promise.reject(new Error(`not found`))
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

function dumpAst(n :Node) {
  if (isNodeJsLikeEnv) {
    n.repr("\n", s => process.stdout.write(s))
    process.stdout.write("\n")
  } else {
    console.log(n.repr())
  }
}

async function main(options? :MainOptions) :Promise<MainResult> {
  const typeSet = new TypeSet()
  const universe = new Universe(typeSet)
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
  // options.noIR = true
  if (options.noIR) {

    // print(r.pkg.repr())
    dumpAst(r.pkg)

    // serialize ast
    // let buf = astio.encode(r.pkg)
    // let buf = astio.encode1(r.pkg)
    // print("astio.encode => " + buf)
    // let ast = astio.decode(buf)
    // print("decoding complete")
    // for (let n of ast) {
    //   print(n.repr())
    // }
    // print("astio.decode => " + astio.encode(...ast))

    return { success: true, diagnostics, ast: r.pkg }
  }

  // select target arch and build configuration
  print('available target archs:', Array.from(archs.keys()).join(', '))
  const config = new Config("covm", {
    optimize: !options.noOptimize,
    loopstats: true, // debug
  })
  print(`selected target config: ${config}`)


  const irb = new IRBuilder()  // reusable

  irb.init(config, diagh, IRBuilderFlags.Comments)

  // print AST & build IR
  try {
    for (let file of r.pkg.files) {

      if (isNodeJsLikeEnv) {
        banner(
          `${r.pkg} ${file.sfile.name} ${file.decls.length} declarations`
        )
        print(r.pkg.repr())
        // for (let decl of file.decls) {
        //   print(decl.repr())
        // }
        banner(`ssa-ir ${file.sfile.name}`)
      }

      // build IR
      let sfile = file.sfile
      for (let d of file.decls) {
        let fn = irb.addTopLevel(sfile, d)
        if (isNodeJsLikeEnv && fn) {
          print(`\n-----------------------\n`)
          printir(fn)
          print(
            `━━━━━━━━━━━━━━━━━━━━━━━━` +
            `━━━━━━━━━━━━━━━━━━━━━━━━`
          )
        }
      }


      // // run IP passes separately for debugging (normally run online)
      // let stopAtPass = options.genericIR ? "lower" : ""
      // // stopAtPass = "lowered deadcode"

      // for (let [ , f] of irb.pkg.funs) {
      //   runPassesDev(f, config, stopAtPass, pass => {
      //     if (isNodeJsLikeEnv) {
      //       print(`after ${pass.name}\n`)
      //       printir(f)
      //       print(
      //         `━━━━━━━━━━━━━━━━━━━━━━━━` +
      //         `━━━━━━━━━━━━━━━━━━━━━━━━`
      //       )
      //     }
      //   })
      //   let prog = new Program(f, config)
      //   prog.gen()
      // }

      // for (let [ , f] of irb.pkg.funs) {
      //   printir(f)
      // }

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
    print(
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
    print('only running unit tests')
  } else {
    main({
      sources: process.argv.slice(2).filter(v => !v.startsWith('-')),
      noOptimize: process.argv.includes('-no-optimize'),
      genericIR: process.argv.includes('-ir'),
      noIR: process.argv.includes('-ast'),
    }).catch(err => {
      console.error(err.stack || ''+err)
      process.exit(1)
      // return { success: false, diagnostics }
    })
  }
} else {
  GlobalContext['colang'] = {
    main,
    fmtir,
    printir,
  }
}
