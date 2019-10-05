import { NoPos, Position, SrcFileSet } from "./pos"
import { ErrorCode } from "./error"
import { Diagnostic, Diag, DiagKind } from "./diag"
import { Scanner, Mode as ScanMode } from "./scanner"
import { Parser } from "./parser"
import { PkgBinder } from "./bind"
import { TypeSet } from "./typeset"
import { Universe } from "./universe"
import { TypeResolver } from "./resolve"
import { token } from "./token"
import { serialize } from "./util"
import * as ast from "./ast"
import * as utf8 from "./utf8"
import * as ssa from "./ir/ssa"
import { Config } from "./ir/config"
import { IRBuilder, IRBuilderFlags } from "./ir/builder"
import { runPassesDev as runIRPasses } from "./ir/passes"
import { printir } from "./ir/repr"
import { archs } from "./ir/arch"
import { ArchInfo } from "./ir/arch_info"


// input source text is either UTF-8 encoded data or a JavaScript string
export type SourceData = Uint8Array | string

// input source is either a filename with data or just a filename
export type Source = [string,SourceData]|string

// called when diagnostics is emitted.
// note that you can also retrieve diagnostics with getDiagnostics()
export type DiagnosticCallback = (d :Diagnostic)=>void

// ScanCallback is called with the current token. Returning false stops scanning.
// Any data associated with the token can be read from the third argument; s,
// which is the scanner itself.
export type ScanCallback = (t :token, s :Scanner)=>false|any

// Scanning mode
export { ScanMode }

// Diagnostic describes an issue or notice regarding source code
// DiagnosticKind is the kind, or "level", of diagnostic (e.g. "error" or "info")
export { Diagnostic, DiagKind as DiagnosticKind }

// ast describes the Co syntax as an Abstract Syntax Tree
export { ast }

// IRBuilderFlags
export { IRBuilderFlags }

// CompilerHost represents the full suite of functionality for parsing and compiling programs.
export interface CompilerHost {
  readonly fs :FileSystem
  scanFile(filename :string, f: ScanCallback, cb? :DiagnosticCallback, mode? :ScanMode) :Promise<void>
  scanFile(filename :string, source :SourceData, f: ScanCallback, cb? :DiagnosticCallback, mode? :ScanMode) :void
  parseFile(filename :string, gscope? :ast.Scope, cb? :DiagnosticCallback, mode? :ScanMode) :Promise<ast.File>
  parseFile(filename :string, source :SourceData, gscope? :ast.Scope, cb? :DiagnosticCallback, mode? :ScanMode) :ast.File
  parsePackage(name :string, sources :Iterable<Source>, cb? :DiagnosticCallback, mode? :ScanMode) :Promise<ast.Package>
  compilePackage(pkg :ast.Package, target :string|Config, cb? :DiagnosticCallback, flags? :IRBuilderFlags) :ssa.Pkg
}

// FileSystem represents the interface to some underlying file system.
// This could be an "actual" file system or a virtual one.
export interface FileSystem {
  readfile(path :string) :Promise<Uint8Array>
  readfileSync(path :string) :Uint8Array
  existsSync(path :string) :bool
  readdirSync(path :string) :string[]
}

// Create a new compiler host
export function createCompilerHost(fs? :FileSystem) :CompilerHost {
  return new CHost(fs || getDefaultFileSystem())
}

// List of names of supported target architectures
export function getSupportedTargets() :string[] {
  return Array.from(archs.keys())
}

// Create a target configuration to be used with compilation
export function createTargetConfig(name :string, props?: Partial<Config>) :Config {
  return new Config(name, props)
}

// Retrieve read-only target information
export function getTargetInfo(name :string) :ArchInfo {
  let a = archs.get(name)
  if (!a) { throw new Error(`unknown target ${JSON.stringify(name)}`) }
  return a
}

// Access diagnostics produced during scanning, parsing and binding
export function getDiagnostics(n :ast.Node) :Diagnostic[] {
  return (n as any)[diagKey] || []
}

// Access the number of errors encountered during scanning, parsing and binding.
// Useful as a check after parsing to know if an AST is valid.
export function getErrorCount(n :ast.Node) :int {
  return (n as any)[errcountKey] || 0
}

// Returns the FileSystem for the current runtime environment
export function getDefaultFileSystem() :FileSystem {
  return _defaultFileSystem || (_defaultFileSystem = createDefaultFileSystem())
}

// isNoFileSystem returns true if the provided file system is the non-functional
// implementation used when the environment does not have or support an actual
// file system.
export function isNoFileSystem(fs :FileSystem) :bool {
  return dummyKey in fs
}


// end of external API
// ---------------------------------------------------------------------
// start of implementation


let _defaultFileSystem :FileSystem|null = null

function createNodeJSFileSystem(fs :{[k:string]:any}) :FileSystem {
  return {
    existsSync: fs.existsSync,
    readfileSync: fs.readFileSync as (s:string)=>Uint8Array,
    readfile: (path :string) => new Promise((resolve, reject) => {
      fs.readFile(path, (err :Error, buf :Uint8Array) =>
        err ? reject(err) : resolve(buf))
    }),
    readdirSync: (path :string) :string[] => fs.readdirSync(path, "utf8"),
  }
}

function createDefaultFileSystem() :FileSystem {
  if (typeof require != "undefined") {
    let fs :any ; try { fs = require('fs') } catch(_) {}
    if (fs && typeof fs.readFile == "function") {
      return createNodeJSFileSystem(fs)
    }
  }
  let notimplAsync = () => Promise.reject(new Error("no file system"))
  let notimplSync = () :never => { throw new Error("no file system") }
  let fs :FileSystem = {
    readfile(_ :string) :Promise<Uint8Array> { return notimplAsync() },
    readfileSync(_ :string) :Uint8Array { return notimplSync(), new Uint8Array() },
    existsSync(_ :string) :bool { return notimplSync(), false },
    readdirSync(_ :string) :string[] { return notimplSync(), [] },
  }
  ;(fs as any)[dummyKey] = true
  return fs
}

// ---------------------------------------------------------------------

const diagKey = Symbol("diag")
const errcountKey = Symbol("errcount")
const dummyKey = Symbol("dummy")

class Pool<T> {
  _free    :T[] = []
  _factory :()=>T
  constructor(factory :()=>T) {
    this._factory = factory
  }
  alloc() :T {
    let obj = this._free.pop()
    return obj || this._factory()
  }
  free(obj :T) {
    this._free.push(obj)
  }
}


class DiagReporter {
  diag :Diagnostic[] = []
  constructor(cb? :DiagnosticCallback|null) {
    let diag :Diagnostic[] = (this.diag = [])
    this.errh = (pos :Position, msg :string, c :ErrorCode) => {
      let d = new Diag("error", msg, pos, c)
      diag.push(d)
      cb && cb(d)
    }
    this.diagh = (pos :Position, msg :string, kind :DiagKind) => {
      let d = new Diag(kind, msg, pos)
      diag.push(d)
      cb && cb(d)
    }
  }
  errh(pos :Position, msg :string, c :ErrorCode) {}
  diagh(pos :Position, msg :string, kind :DiagKind) {}
  assignTo(obj :any) {
    if (this.diag.length > 0) {
      obj[diagKey] = this.diag
    }
  }
}


class CHost implements CompilerHost {
  readonly fs :FileSystem

  // Universe is shared amongs all incovations.
  // It houses type interning in addition to intrinsic bindings.
  universe = new Universe(new TypeSet())

  // Exclusive resources
  typeres   = new Pool(()=>new TypeResolver())
  parser    = new Pool(()=>new Parser())
  scanner   = new Pool(()=>new Scanner())
  irbuilder = new Pool(()=>new IRBuilder())

  parseComments = true // TODO: pass this to parse/scan invocations somehow
  serialMode = false   // do not perform work in a concurrent "async" manner

  constructor(fs :FileSystem) {
    this.fs = fs
  }

  importPackage = (imps :Map<string,ast.Ent>, path :ast.StringLit) :Promise<ast.Ent> => {
    // TODO: FIXME implement
    print(`TODO: CHost.importPackage ${path}`)
    // let name = strings.get(utf8.encodeString(path))
    // return Promise.resolve(new Ent(name, new Stmt(NoPos, nilScope), null))
    return Promise.reject(new Error("import not implemented"))
  }

  async parsePackage(
    name    :string,
    sources :Iterable<Source>,
    cb?     :DiagnosticCallback,
    smode?  :ScanMode,
  ) :Promise<ast.Package> {
    let pkgscope = new ast.Scope(this.universe.scope)
    let pkg = new ast.Package(name, pkgscope)
    let fset = new SrcFileSet()
    let diags = new DiagReporter(cb)

    let typeres = this.typeres.alloc()
    typeres.init(fset, this.universe, diags.errh)

    let errcount = 0

    // sources => [filename,SourceData|null]
    let src :[string,SourceData|null][] = []
    for (let source of sources) {
      src.push(typeof source == "string" ? [source,null] : source)
    }

    // parse source files
    if (this.serialMode) {
      for (let [filename, source] of src) {
        let data = this.loadFileSync(filename, source)
        let [f, nerrs] = this._parseFile(filename, data, pkgscope, fset, typeres, diags, smode)
        pkg.files.push(f)
        errcount += nerrs
      }
    } else {
      await Promise.all(src.map(([filename, source]) =>
        this.loadFile(filename, source).then(data => {
          let [f, nerrs] = this._parseFile(filename, data, pkgscope, fset, typeres, diags, smode)
          pkg.files.push(f)
          errcount += nerrs
        })
      ))
    }

    // bind package together, resolving cross-file references and imports
    if (errcount == 0 && typeres.errorCount == 0) {
      let binder = new PkgBinder(fset, typeres, diags.errh)
      errcount += typeres.errorCount + await binder.importAndBind(this.importPackage, pkg.files)
    } else {
      // add errors from type resolver (avoids double counting)
      errcount += typeres.errorCount
    }

    // save error count to ast node
    if (errcount > 0) {
      ;(pkg as any)[errcountKey] = errcount
    }

    this.typeres.free(typeres)
    diags.assignTo(pkg)

    return pkg
  }

  // calling with SourceData yields immediate results, else async
  parseFile(_ :string,                ps? :ast.Scope, cb? :DiagnosticCallback, m? :ScanMode) :Promise<ast.File>
  parseFile(_ :string, s :SourceData, ps? :ast.Scope, cb? :DiagnosticCallback, m? :ScanMode) :ast.File
  parseFile(
    filename :string,
    source? :SourceData|ast.Scope,
    gscope? :ast.Scope|DiagnosticCallback,
    cb? :DiagnosticCallback|ScanMode,
    smode? :ScanMode,
  ) :Promise<ast.File>|ast.File {
    let parse = (data :Uint8Array, ps :ast.Scope|null, cb? :DiagnosticCallback, m? :ScanMode) => {
      let fset = new SrcFileSet()
      let diags = new DiagReporter(cb)
      let typeres = this.typeres.alloc()
      typeres.init(fset, this.universe, diags.errh)

      let [f, errcount] = this._parseFile(filename, data, ps, fset, typeres, diags, smode)

      errcount += typeres.errorCount
      this.typeres.free(typeres)
      diags.assignTo(f)

      if (errcount == 0) {
        let binder = new PkgBinder(fset, typeres, diags.errh)
        errcount += typeres.errorCount + binder.bind([ f ])
      }

      // save error count to ast node
      if (errcount > 0) {
        ;(f as any)[errcountKey] = errcount
      }
      return f
    }

    if (typeof source == "string") {
      // parseFile(filename, source, gscope, cb, mode)
      source = utf8.encodeString(String(source))
    }
    if (source instanceof Uint8Array) {
      // parseFile(filename, source, gscope, cb, mode)
      let _gscope = (gscope as ast.Scope||null) || new ast.Scope(this.universe.scope)
      return parse(source, _gscope, cb as DiagnosticCallback, smode)
    }

    // parseFile(filename, gscope, cb, mode)
    let _gscope = (source as ast.Scope||null) || new ast.Scope(this.universe.scope)
    return this.loadFile(filename, null).then(data =>
      parse(data, _gscope, gscope as DiagnosticCallback, cb as ScanMode)
    )
  }

  _parseFile(
    filename :string,
    data     :Uint8Array,
    pkgscope :ast.Scope|null,
    fset     :SrcFileSet,
    typeres  :TypeResolver,
    diags    :DiagReporter,
    smode    :ScanMode|undefined,
  ) :[ast.File,int] {
    let sfile = fset.addFile(filename, data.length)
    let parser = this.parser.alloc()
    parser.initParser(sfile, data, this.universe, pkgscope, typeres, diags.errh, diags.diagh, smode)
    let file = parser.parseFile()
    let errcount = parser.errorCount
    this.parser.free(parser)
    return [file, errcount]
  }

  // calling with SourceData yields immediate results, else async
  scanFile(fn :string,                f: ScanCallback, cb? :DiagnosticCallback, m? :ScanMode) :Promise<void>
  scanFile(fn :string, s :SourceData, f: ScanCallback, cb? :DiagnosticCallback, m? :ScanMode) :void
  scanFile(
    filename :string,
    source   :SourceData|ScanCallback,
    f        :ScanCallback|DiagnosticCallback|undefined,
    cb?      :DiagnosticCallback|ScanMode,
    smode?   :ScanMode,
  ) :Promise<void>|void {
    let scan = (data :Uint8Array, f :ScanCallback, cb? :DiagnosticCallback, m? :ScanMode) => {
      let fset = new SrcFileSet()
      let diags = new DiagReporter(cb)
      let sfile = fset.addFile(filename, data.length)
      let scanner = this.scanner.alloc()
      scanner.init(sfile, data, diags.errh, smode)
      try {
        scanner.next()
        while (scanner.tok != token.EOF) {
          if (f(scanner.tok, scanner) === false) {
            break
          }
          scanner.next()
        }
      } finally {
        this.scanner.free(scanner)
      }
    }
    if (typeof source == "string") {
      source = utf8.encodeString(String(source))
    }
    if (source instanceof Uint8Array) {
      scan(source, f as ScanCallback, cb as DiagnosticCallback, smode)
    } else {
      return this.loadFile(filename, null).then(data => {
        scan(data, source as ScanCallback, f as DiagnosticCallback, cb as ScanMode)
      })
    }
  }


  loadFileSync(filename :string, source :SourceData|null|undefined) :Uint8Array {
    if (source === null || source === undefined) {
      return this.fs.readfileSync(filename)
    } else if (source instanceof Uint8Array) {
      return source
    } else {
      return utf8.encodeString(String(source))
    }
  }

  loadFile(filename :string, source :SourceData|null|undefined) :Promise<Uint8Array> {
    return (
      source === null || source === undefined ? this.fs.readfile(filename) :
      Promise.resolve(this.loadFileSync(filename, source))
    )
  }

  compilePackage(
    pkg :ast.Package,
    target :string|Config,
    cb? :DiagnosticCallback,
    flags? :IRBuilderFlags,
  ) :ssa.Pkg {
    let diags = new DiagReporter(cb)
    let config = typeof target == "string" ? new Config(target) : target

    let irbuilder = this.irbuilder.alloc()
    irbuilder.init(config, diags.diagh, flags)

    for (let file of pkg.files) {
      for (let d of file.decls) {
        let fn = irbuilder.addTopLevel(file.sfile, d)
        if (DEBUG) {
          print(`\n-----------------------\n`)
          fn ? printir(fn) : print(fn)
          print(
            `━━━━━━━━━━━━━━━━━━━━━━━━` +
            `━━━━━━━━━━━━━━━━━━━━━━━━`
          )
        }
      }
    }

    let irpkg = irbuilder.pkg
    this.irbuilder.free(irbuilder)

    // run IP passes separately for debugging (normally run online)
    let stopAtPass = "lower" // ""
    // stopAtPass = "lowered deadcode"
    for (let [ , f] of irpkg.funs) {
      runIRPasses(f, config, stopAtPass, pass => {
        if (DEBUG) {
          print(`after ${pass.name}\n`)
          printir(f)
          print(
            `━━━━━━━━━━━━━━━━━━━━━━━━` +
            `━━━━━━━━━━━━━━━━━━━━━━━━`
          )
        }
      })
    }

    if (DEBUG) {
      for (let [ , f] of irpkg.funs) {
        printir(f)
      }
    }

    return irpkg
  }

  // codegen() {
  //   let prog = new Program(f, config)
  //   prog.gen()
  // }

}

