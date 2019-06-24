#!/usr/bin/env node --trace-warnings
//
// Compiles and runs the arch generator in this directory
//
const proc = require("child_process")
const fs = require("fs")
const vm = require("vm")
const Path = require("path")

const progfile = __dirname + "/.gen-compiled.js"
const generatedFiles = [
  __dirname + "/../ir/ops.ts",
  __dirname + "/../ir/arch.ts",
  __dirname + "/../ir/rewrite_*",
].map(s => Path.resolve(s))
const opsTemplateFile = __dirname + "/ops_template.ts"
const opsOutFile = __dirname + "/../ir/ops.ts"

const header = `
const DEBUG = true;

` + fs.readFileSync(__dirname + "/../global.js", "utf8") + `

let _modules = new Map();

function define(id, arg1, arg2) {
  let deps = arg2 ? arg1 : []
  let body = arg2 || arg1
  _modules.set(id, { deps, body, exports:null })
}

function amd_require(id) {
  let m = _modules.get(id)
  if (!m) {
    return require(id)
  }
  if (m.exports) {
    return m.exports
  }
  m.exports = {}
  let args = []
  for (let depid of m.deps) {
    if (depid == "require") {
      args.push(amd_require)
    } else if (depid == "exports") {
      args.push(m.exports)
    } else {
      args.push(amd_require(depid))
    }
  }
  m.body.apply(null, args)
  return m.exports
}`

const footer = `
amd_require("src/arch/gen");
`


function main() {
  let js = ""
  if (sourceIsNewerThanFile(progfile)) {
    js = compile()
  }
  run(js)
}


function rpath(filename) {
  return Path.relative(".", filename)
}


function isGeneratedFile(filename) {
  filename = Path.resolve(filename)
  for (let fn of generatedFiles) {
    if (fn == filename) {
      return true
    }
    if (fn.endsWith("*") &&
        filename.substr(0, fn.length - 1) == fn.substr(0, fn.length - 1)
    ) {
      return true
    }
  }
  return false
}


function sourceIsNewerThanFile(reffile) {
  let st
  try {
    st = fs.statSync(reffile)
  } catch (_) {
    // no reffile -- inifitely newer, lol
    return true
  }
  let srcfiles = fs.readdirSync(__dirname, { withFileTypes: true })
  for (let ent of srcfiles) {
    if (ent.name[0] != "." &&
        ent.isFile() &&
        (ent.name.endsWith(".ts") || ent.name.endsWith(".js"))
    ) {
      let filename = __dirname + "/" + ent.name
      if (isGeneratedFile(filename)) {
        // ignore the file the program generates
        continue
      }
      let srcst = fs.statSync(filename)
      if (srcst.mtimeMs > st.mtimeMs) {
        // console.log(rpath(filename), "is newer than", rpath(reffile))
        return true
      }
    }
  }
  return false
}


let didRetryCompile = false


function compile() {
  console.log("compiling gen.ts ->", rpath(progfile))
  try {
    proc.execFileSync(
      __dirname + "/../../node_modules/typescript/bin/tsc",
      [
        "--outFile", progfile,
      ],
      {
        cwd: __dirname,
        stdio: "inherit",
      }
    )
  } catch (err) {
    if (!didRetryCompile) {
      console.error("retrying with clean ops.ts file")
      didRetryCompile = true
      fs.copyFileSync(opsTemplateFile, opsOutFile)
      return compile()
    }
    console.error(err.message || ""+err)
    process.exit(1)
  }
  let js = fs.readFileSync(progfile, "utf8")
  let sourceMapDirectiveIdx = js.lastIndexOf("//# sourceMappingURL=")
  let footerJs = footer
  if (sourceMapDirectiveIdx != -1) {
    // move sourceMappingURL from js to footer
    footerJs += js.substr(sourceMapDirectiveIdx)
    js = js.substr(0, sourceMapDirectiveIdx)
  }
  js = header + "\n" + js + "\n" + footerJs
  // console.log(`write ${Path.relative(".", progfile)}`)
  fs.writeFileSync(progfile, js, "utf8")
  return js
}


function run(js) {
  js = js || fs.readFileSync(progfile, "utf8")
  const script = new vm.Script(js, {
    filename: progfile,
    lineOffset: header.split("\n").length,
  });
  global.require = require
  global.__dirname = __dirname;
  script.runInThisContext()
}


main()
