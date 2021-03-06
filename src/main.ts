import { stdoutStyle, stdoutSupportsStyle } from './termstyle'
import * as api from "./api"
import * as cli from "./cli"
import * as asm from "./asm/asm"
import { VirtualMachine } from "./vm/vm"

import './all_tests'

// true if the runtime environment looks like NodeJS
const NODEJS :bool = (()=>{
  try { return typeof require('fs').readFileSync == "function" } catch(_) {}
  return false
})()

// set to true via CLI flag -quiet
let quiet = false


async function main(argv :string[]) :Promise<int> {
  let [opt, sources] = cli.parseopt(argv.slice(1),
    "Usage: $prog [options]",
    ["ast",     "Parse and print ast (don't compile)"],
    ["ir",      "Only compile IR (don't codegen)"],
    ["no-opt",  "Disable optimizations"],
    ["quiet",   "Only print errors"],
    ["debug",   "Print information about internal compiler processes"],
    ["version", "Print version information"],
    DEBUG && ["test",      "Run unit tests before calling main()"],
    DEBUG && ["test-only", "Run unit tests and exit"],
  )

  if (opt.version) {
    print(`co ${VERSION + (VERSION_TAG ? "-" + VERSION_TAG : "")}`)
    return 0
  }

  // set global variable
  quiet = !!opt.quiet

  if (sources.length == 0) {
    sources = ['example/ssa1.co']
  }

  // create compiler host
  let chost = api.createCompilerHost()

  // parse package
  let pkg = await chost.parsePackage("example", sources, printDiag)
  let numerrs = api.getErrorCount(pkg)

  // only print ast?
  if (opt.ast) {
    api.ast.print(pkg)
    return numerrs > 0 ? 1 : 0
  }

  // return if we encountered errors
  if (numerrs > 0) {
    return 1
  }

  // select compilation target
  print('available targets:', api.getSupportedTargets().join(', '))
  let target = api.createTargetConfig("covm", {
    optimize: !opt["no-opt"],
    loopstats: !!opt.debug,
  })
  print(`target config: ${target}`)

  // compile AST -> IR
  try {
    let flags = api.IRBuilderFlags.Comments
    let irpkg = chost.compilePackage(pkg, target, printDiag, flags)

    // Assemble into covm objects
    banner(`asm`)
    let obj = new asm.Obj(target)
    for (let f of irpkg.funs) {
      obj.addFun(f)
    }
    obj.seal(0)
    console.log(obj.writeStr())

    // // Run in development VM
    // banner(`vm`)
    // const vm = new VirtualMachine()
    // let res = await vm.runPkg(irpkg)
    // print("main return value:", repr(res))

  } catch (error) {
    if (NODEJS) { throw error }
    return 1
  }

  return 0
}

// diagnostics printer
let printDiag = NODEJS ? (d :api.Diagnostic) => {
  if (quiet && d.kind != "error") {
    // silence all but errors when -quiet is provided
    return
  }
  let msg = d.toString()
  msg = (
    d.kind == "error" ? stdoutStyle.red(msg) :
    d.kind == "warn"  ? stdoutStyle.lightyellow(msg) :
    d.kind == "info"  ? stdoutStyle.cyan(msg) :
    msg )
  if (d.kind == "error") {
    console.error(msg)
  } else {
    console.log(msg)
  }
} : undefined


// banner prints a large message, using terminal styling when available.
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

// entry
let testsPromise = DEBUG && typeof GlobalContext.runAllTests == 'function' ?
  GlobalContext.runAllTests() : null
if (NODEJS) {
  if (DEBUG) {
    if (!process.argv.includes('-test-only')) {
      (testsPromise || Promise.resolve()).then(() => {
        main(process.argv.slice(1)).catch(cli.die).then(process.exit)
      })
    }
  } else {
    main(process.argv.slice(1)).catch(cli.die).then(process.exit)
  }
} else {
  GlobalContext["colang"] = {
    ...api,
    main,
  }
}
