const fs = require('fs')
const assert = require('assert')
const childproc = require('child_process')
const Path = require('path')

let rootdir = '.'


function panic(/* ... */) {
  console.error.apply(console, Array.prototype.slice.call(arguments))
  process.exit(1)
}


function main() {
  rootdir = Path.dirname(__dirname)

  process.chdir(rootdir)
  
  const annotations = new Map() // file => Annotation[]
  scandir('src', annotations)

  let promises = []
  for (let [file, av] of annotations) {
    for (let a of av) {
      if (!a.attrs || !a.attrs.src) {
        panic(`missing src attribute at ${file} offset ${a.startoffs}`)
      }
      if (a.attrs.src.endsWith('.wast')) {
        let wastfile = a.attrs.src
        if (!Path.isAbsolute(wastfile)) {
          wastfile = Path.join(Path.dirname(a.file), wastfile)
        }

        const stjs = fs.statSync(file)
        const stwast = fs.statSync(wastfile)

        if (stwast.mtimeMs <= stjs.mtimeMs) {
          console.log(`${wastfile} required by ${file}: up-to-date`)
        } else {
          console.log(`${wastfile} required by ${file}: compiling`)
          promises.push(
            wastcompile(wastfile).then(buf => {
              a.data = buf
              return a
            })
          )
        }
      } else {
        panic(
          `don't know what to do with ${a.attrs.src} `+
          `at ${file} offset ${a.startoffs}`
        )
      }
    }
  }

  awaitAll(promises).then(av => {
    //console.log('compiled wasm annotations:', av)
    let files = new Map() // file => Annotation[]
    for (let a of av) {
      let av2 = files.get(a.file)
      if (!av2) {
        av2 = []
        files.set(a.file, av2)
      }
      av2.push(a)
    }
    const promises = []
    for (let [file, a] of files) {
      promises.push(integrate(file, a))
    }
    return awaitAll(promises)
  })
}


function awaitAll(promises) {
  return Promise.all(promises).catch(err => {
    panic(err.stack || String(err))
  })
}


function integrate(file, av) {
  console.log('update', file)
  let src1 = av[0].source
  let src2 = ''
  let p = 0
  for (let a of av) {
    if (a.startoffs < p) {
      panic(`out-of-order annotation`)
    }
    const maxwidth = 78 - a.indentation.length
    src2 += (
      src1.substring(p, a.startoffs) +
      fmtbytes(a.data, maxwidth, a.indentation)
    )
    p = a.endoffs
  }
  if (p < src1.length) {
    src2 += src1.substr(p)
  }
  fs.writeFileSync(file, src2, 'utf8')
}


function fmtbytes(data, maxwidth, indent) {
  let w = 0
  let s = indent
  let lasti = data.length - 1
  for (let i = 0; i <= lasti; i++) {
    let b = data[i]
    let c = b.toString()
    if (i != lasti) {
      c += ','
    }
    if (w + c.length > maxwidth) {
      s += '\n' + indent
      w = 0
    }
    w += c.length
    s += c
  }
  return s
}


function scandir(dir, annotations) {
  for (let name of fs.readdirSync(dir)) {
    if (name[0] == '.' || name.endsWith('.d.ts')) {
      // ignore
      continue
    }
    const path = Path.join(dir, name)
    if (name.endsWith('.ts')) {
      const a = scanfile(path)
      if (a.length) {
        annotations.set(path, a)
      }
    } else {
      let st = fs.statSync(path)
      if (st.isDirectory()) {
        scandir(path, annotations)
      }
    }
  }
}


function scanfile(file) {
  const source = fs.readFileSync(file, 'utf8')
  const annotations = []
  const startstr = '//!<wasmdata'
  const endstr = '//!</wasmdata>'
  let p = 0
  while (true) {
    p = source.indexOf(startstr, p)
    if (p == -1) {
      break
    }
    let start = source.indexOf('>', p + startstr.length)
    if (start == -1) {
      throw new Error(`unterminated <wasmdata in ${file} at offset ${p}`)
    }

    let s = source.substring(p + startstr.length, start)

    // parse attributes
    let attrs = {}
    let re = /(\w+)="(.+)"/g, m
    while((m = re.exec(s)) !== null) {
      attrs[m[1]] = m[2]
    }
    
    // skip past >\n
    start++
    if (source[start] == '\n') {
      start++
    }

    let end = source.indexOf(endstr, start)
    if (end == -1) {
      throw new Error(`missing closing </wasmdata> in ${file} at offset ${p}`)
    }

    // find first non-whitespace before end
    let endx = end
    while (--end && (source[end] == ' ' || source[end] == '\t')) {
    }
    let indentation = source.substring(end+1, endx)

    annotations.push({
      file,
      source,
      attrs,
      indentation,
      startoffs: start,
      endoffs: end,
    })

    p = end + endstr.length
  }
  return annotations
}


function wastcompile(wastfile) {
  return new Promise((resolve, reject) => {

    // add {rootdir}/_local/wabt to PATH in case there's a wabt there
    let env = Object.assign({}, process.env, {
      PATH: Path.join(rootdir, '_local', 'wabt') + ":" +
            (process.env.PATH || ''),
    })

    const wasmfile = wastfile + '.wasm'

    const p = childproc.execFile(
      'wat2wasm', [wastfile, '-o', wasmfile],
      { env },
      (err, stdout, stderr) => {
        if (err) {
          if (err.code == 'ENOENT') {
            panic(
              `wat2wasm not found in PATH or _local/wabt\n` +
              `Get wabt from https://github.com/WebAssembly/wabt/releases`
            )
          }
          let stderrstr = stderr.toString('utf8')
          if (stderrstr.length > 0) {
            console.error(stderr.toString('utf8'))
          }
          return reject(err)
        }
        fs.readFile(wasmfile, (err, buf) => {
          if (err) { return reject(err) }
          resolve(buf)
        })
      }
    )

  })
}


// function verifyWasmModule(wasmbuf) {
//   const m = new WebAssembly.Instance(new WebAssembly.Module(wasmbuf), {})

//   const expectedFuns = new Set([
//     'mul',
//     'div_s',
//     'div_u',
//     'rem_s',
//     'rem_u',
//     'get_high',
//   ])

//   for (let name of expectedFuns) {
//     assert(typeof m.exports[name] == 'function', `missing function "${name}"`)
//   }

//   for (let name in m.exports) {
//     if (typeof m.exports[name] == 'function') {
//       assert(expectedFuns.has(name), `unexpected function "${name}"`)
//     } else {
//       assert(expectedFuns.has(name), `unexpected export "${name}"`)
//     }
//   }
// }


main()
