#!/usr/bin/env node --trace-warnings
//
// Compiles and runs the arch generator in this directory
//
const proc = require("child_process")
const fs = require("fs")
const vm = require("vm")
const Path = require("path")

const rootdir  = Path.dirname(__dirname)
const basedir  = Path.resolve(process.cwd())
const builddir = Path.resolve(rootdir + "/.build-cache")
const adjdir   = Path.join(Path.relative(basedir, rootdir), Path.relative(__dirname, rootdir))
const outname  = "." + Path.relative(rootdir, basedir).replace(/[^A-Za-z0-9_\.]+/g, '-')
const progfile = Path.join(basedir, outname) + ".js"

const argv = process.argv.slice(2)
const outputFiles = argv.filter(s => s[0] != '-').map(s => Path.resolve(s)) // files prog generates

const tsconfigFile = basedir + "/tsconfig.json"
const tsconfig = jsonparse(fs.readFileSync(tsconfigFile, "utf8"), tsconfigFile)
const entryName = tsconfig.include.filter(s => s.indexOf("/global.") == -1)[0].replace(/\.ts$/, "")
const mainModuleId = Path.relative(rootdir, basedir) + "/" + entryName

const header = `
const DEBUG = true;

` + fs.readFileSync(rootdir + "/src/global.js", "utf8") + `

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
amd_require("${mainModuleId}");
`


let backups = []

function recordBackup() {
  for (let file of outputFiles) {
    try {
      backups.push({
        file,
        data: fs.readFileSync(file),
        stat: fs.statSync(file),
      })
    } catch(_) {}
  }
}


function restoreBackup() {
  for (let b of backups) {
    let stat = null
    try { stat = fs.statSync(b.file) } catch(_) {}
    if (!stat || b.stat.mtimeMs < stat.mtimeMs) {
      console.log("restoring", b.file)
      fs.writeFileSync(b.file, data)
      // TODO: set mtime?
    }
  }
}


function main() {
  recordBackup()
  process.on('exit', (code) => {
    if (code != 0) {
      restoreBackup()
    }
  })
  let didRetry_define_is_not_defined = false
  while (true) {
    try {
      let js = ""
      if (sourceIsNewerThanFile(progfile)) {
        js = compile()
      }
      process.chdir(basedir)
      run(js)
    } catch (err) {
      if (err.message == "define is not defined" && !didRetry_define_is_not_defined) {
        // trash broken progfile and retry
        fs.unlinkSync(progfile)
        didRetry_define_is_not_defined = true
        continue
      }
      console.error(err.message || ""+err)
      process.exit(1)
    }
    break
  }
}


function rpath(filename) {
  return Path.relative(".", filename)
}


function isGeneratedFile(filename) {
  filename = Path.resolve(filename)
  for (let fn of outputFiles) {
    if (fn == filename) {
      return true
    }
    if (fn.endsWith("*") &&
        filename.substr(0, fn.length - 1) == fn.substr(0, fn.length - 1)
    ) {
      // allows outputFiles to contain prefix patterns e.g. "foo.*"
      return true
    }
  }
  return false
}


function sourceIsNewerThanFile(reffile) {
  let st
  try { st = fs.statSync(reffile) } catch (_) {
    return true
  }
  let srcfiles = fs.readdirSync(basedir, { withFileTypes: true })
  for (let ent of srcfiles) {
    if (ent.name[0] != "." &&
        ent.isFile() &&
        (ent.name.endsWith(".ts") || ent.name.endsWith(".js"))
    ) {
      let filename = basedir + "/" + ent.name
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
  console.log(`compiling ${Path.relative(rootdir, basedir)} -> ${progfile}`)

  // tsc
  proc.execFileSync(
    __dirname + "/../node_modules/typescript/bin/tsc",
    [ "--outFile", progfile ],
    { cwd: basedir,
      stdio: "inherit",
    }
  )

  let js = fs.readFileSync(progfile, "utf8")
  let sourceMapDirectiveIdx = js.lastIndexOf("//# sourceMappingURL=")
  let footerJs = footer
  if (sourceMapDirectiveIdx != -1) {
    // move sourceMappingURL from js to footer
    footerJs += js.substr(sourceMapDirectiveIdx)
    js = js.substr(0, sourceMapDirectiveIdx)
  }
  js = header + "\n" + js + "\n" + footerJs
  // console.log(`write ${rpath(progfile)}`)
  fs.writeFileSync(progfile, js, "utf8")
  return js
}


function run(js) {
  js = js || fs.readFileSync(progfile, "utf8")
  const script = new vm.Script(js, {
    filename: progfile,
    lineOffset: header.split("\n").length,
  })
  global.require = function(path) {
    let pathabs = path[0] == "." ? Path.resolve(basedir, path) : path
    return require(pathabs)
  }
  global.__dirname = basedir
  script.runInThisContext()
}


// jsonparse parses "relaxed" JSON which can be in JavaScript format
//
function jsonparse(jsonText, filename /*optional*/) {
  return vm.runInNewContext(
    '(()=>(' + jsonText + '))()',
    { /* sandbox */ },
    { filename, displayErrors: true }
  )
}


main()
