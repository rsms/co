var GlobalContext = (
  typeof global != 'undefined' ? global :
  typeof window != 'undefined' ? window :
  this || {}
)

var __utillib = null;
try {
  if (typeof require != 'undefined') {
    __utillib = require("util");
    require("source-map-support").install();
  }
} catch(_) {}

function _stackTrace(cons) {
  const x = {stack:''}
  if (Error.captureStackTrace) {
    Error.captureStackTrace(x, cons)
    const p = x.stack.indexOf('\n')
    if (p != -1) {
      return x.stack.substr(p+1)
    }
  }
  return x.stack
}

// _parseStackFrame(sf :string) : StackFrameInfo | null
// interface StackFrameInfo {
//   func :string
//   file :string
//   line :int
//   col  :int
// }
//
function _parseStackFrame(sf) {
  let m = /\s*at\s+(?:[^\s]+\.|)([^\s\.]+)\s+(?:\[as ([^\]]+)\]\s+|)\((?:.+[\/ ](src\/[^\:]+)|([^\:]*))(?:\:(\d+)\:(\d+)|.*)\)/.exec(sf)
  // 1: name
  // 2: as-name | undefined
  // 3: src-filename
  // 4: filename
  // 5: line
  // 6: column
  //
  if (m) {
    return {
      func: m[2] || m[1],
      file: m[3] || m[4],
      line: m[5] ? parseInt(m[5]) : 0,
      col:  m[6] ? parseInt(m[6]) : 0,
    }
  } else {
    console.log("failed to parse stack frame", JSON.stringify(sf))
  }
  return null
}

function exit(status) {
  if (typeof process != 'undefined') {
    process.exit(status)
  }
  throw 'EXIT#' + status
}

const print = console.log.bind(console)

function panic(msg) {
  console.error.apply(console,
    ['panic:', msg].concat(Array.prototype.slice.call(arguments, 1))
  )
  console.error(_stackTrace(panic))
  exit(2)
}

function assert() {
  if (DEBUG) { // for DCE
    let cond = arguments[0]
      , msg = arguments[1]
      , cons = arguments[2] || assert
    if (cond) {
      return
    }
    let stack = _stackTrace(cons)
    let message = 'assertion failure: ' + (msg || cond)

    if (typeof process != 'undefined') {
      let sf = _parseStackFrame(stack.substr(0, stack.indexOf('\n') >>> 0))
      if (sf) try {
        let fs = require('fs')
        let lines = fs.readFileSync(sf.file, 'utf8').split(/\n/)
        let line_before = lines[sf.line - 2]
        let line        = lines[sf.line - 1]
        let line_after  = lines[sf.line]
        let context = [' > ' + line]
        if (typeof line_before == 'string') {
          context.unshift('   ' + line_before)
        }
        if (typeof line_after == 'string') {
          context.push('   ' + line_after)
        }
        stack = (
          sf.file + ':' + sf.line + ':' + sf.col + "\n" +
          context.join('\n') + '\n\nStack trace:\n' +
          stack
        )
      } catch (_) {}
    }

    if (!assert.throws && typeof process != 'undefined') {
      console.error(message + "\n" + stack)
      exit(3)
    } else {
      let e = new Error(message)
      e.name = 'AssertionError'
      e.stack = stack
      throw e
    }
  }
}

var repr = __utillib && __utillib.inspect ? function repr(obj, maxdepth) {
  let color = typeof process != "undefined" && process.stdout && process.stdout.isTTY;
  return __utillib.inspect(obj, /*showHidden*/false, /*depth*/maxdepth||4, !!color)
} : function repr(obj, maxdepth) {
  // TODO: something better
  try {
    return JSON.stringify(obj, null, 2)
  } catch (_) {
    return String(obj)
  }
}

function TEST(){}
if (DEBUG) {
if (
  typeof process != 'undefined' &&
  ( process.argv.indexOf('-test') != -1 ||
    process.argv.indexOf('-test-only') != -1
  )
) {
  let allTests = GlobalContext.allTests = GlobalContext.allTests || []
  TEST = (name, f) => {
    if (f === undefined) {
      f = name
      name = f.name || '?'
    }
    let e = new Error(), srcloc = '?'
    if (e.stack) {
      let sf = e.stack.split(/\n/, 3)[2]
      let m = /\s+(?:\(.+[\/\s](src\/.+)\)|at\s+.+[\/\s](src\/.+))$/.exec(sf)
      if (m) {
        srcloc = m[1] || m[2]
        let v = srcloc.split(/[\/\\]/)
        v.shift() // "src"
        if (v[v.length-1].match(/^index/)) {
          v.pop()
        }
        let srcfile = v.join("/")
        let p = srcfile.indexOf(':')
        srcfile = p != -1 ? srcfile.substr(0, p) : srcfile
        if ((p = srcfile.indexOf('_test.ts')) != -1) {
          srcfile = p != -1 ? srcfile.substr(0, p) : srcfile
        } else if ((p = srcfile.indexOf('.ts')) != -1) {
          srcfile = p != -1 ? srcfile.substr(0, p) : srcfile
        }
        name = srcfile + '/' + name
      }
    }
    allTests.push({ f, name, srcloc })
  }
  let hasRunAllTests = false
  function runAllTests() {
    return new Promise(resolve => {
      if (hasRunAllTests) {
        return
      }
      hasRunAllTests = true
      let throws = assert.throws
      assert.throws = true
      let longestTestName = allTests.reduce((a, t) => Math.max(a, t.name.length), 0)
      let spaces = "                                                              "
      let promises = []
      let onerr = err => {
        assert.throws = throws
        if (!throws && typeof process != 'undefined') {
          console.error(err.message)
          if (err.stack) {
            if (err.stack.indexOf('AssertionError:') == 0) {
              err.stack = err.stack.split(/\n/).slice(1).join('\n')
            }
            console.error(err.stack)
          }
          exit(3)
        } else {
          throw err
        }
      }
      try {
        for (let i = 0; i < allTests.length; ++i) {
          let t = allTests[i];
          let name = t.name + spaces.substr(0, longestTestName - t.name.length)
          console.log(`[TEST] ${name}${t.srcloc ? '  '+t.srcloc : ''}`);
          let r = t.f();
          if (
            r instanceof Promise ||
            (r && typeof r == "object" && typeof r.then == "function")
          ) {
            r.catch(onerr)
            promises.push(r)
          }
        }
        assert.throws = throws
      } catch(err) {
        onerr(err)
      }

      if (promises.length > 0) {
        // await outstanding tests, showing a message if it takes a long time
        let timer = setTimeout(() => {
          console.log(`awaiting ${promises.length} async tests...`)
        }, 500)
        return Promise.all(promises).then(() => {
          clearTimeout(timer)
          resolve()
        })
      }

      resolve()
    }) // Promise
  }
  GlobalContext.runAllTests = runAllTests
}}
