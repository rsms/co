#!/usr/bin/env node --trace-warnings
//
// Compiles and runs the arch generator in this directory
//
const proc = require("child_process")
const fs = require("fs")
const vm = require("vm")
const Path = require("path")

const progfile = __dirname + "/.gen-compiled.js"

const header = `
const DEBUG = false;

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
amd_require("arch/gen");
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
    if (ent.name[0] != "." && ent.isFile()) {
      let filename = __dirname + "/" + ent.name
      let srcst = fs.statSync(filename)
      if (srcst.mtimeMs > st.mtimeMs) {
        console.log(rpath(filename), "is newer than", rpath(reffile))
        return true
      }
    }
  }
  return false
}


function compile() {
  console.log("compiling . ->", rpath(progfile))
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
    console.error(err.message || ""+err)
    process.exit(1)
  }
  let js = fs.readFileSync(progfile, "utf8")
  js = header + js + footer
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
  global.__dirname = __dirname
  script.runInThisContext()
}


main()
