var global = (
  typeof global != 'undefined' ? global :
  typeof window != 'undefined' ? window :
  this
)

try {
  typeof require != 'undefined' && require("source-map-support").install()
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
  let m = /^\s*at\s+([^\s]+)\s+\((?:.+\/(src\/[^\:]+)|([^\:]+))\:(\d+)\:(\d+)\)$/.exec(sf)
  if (m) {
    return {
      func: m[1],
      file: m[2] || m[3],
      line: parseInt(m[4]),
      col:  parseInt(m[5]),
    }
  }
  return null
}

function exit(status) {
  if (typeof process != 'undefined') {
    process.exit(status)
  }
  throw 'EXIT#' + status
}

function panic(msg) {
  console.error.apply(console,
    ['panic:', msg].concat(Array.prototype.slice.call(arguments, 1))
  )
  console.error(_stackTrace(panic))
  exit(2)
}

function assert() {
  if (DEBUG) { // for DCE
    var cond = arguments[0]
      , msg = arguments[1]
      , cons = arguments[2] || assert
    if (!cond) {
      if (!assert.throws && typeof process != 'undefined') {
        var stack = _stackTrace(cons)
        console.error('assertion failure:', msg || cond)
        var sf = _parseStackFrame(stack.substr(0, stack.indexOf('\n') >>> 0))
        if (sf) {
          try {
            const fs = require('fs')
            const lines = fs.readFileSync(sf.file, 'utf8').split(/\n/)
            const line_before = lines[sf.line - 2]
            const line        = lines[sf.line - 1]
            const line_after  = lines[sf.line]
            let context = [' > ' + line]
            if (typeof line_before == 'string') {
              context.unshift('   ' + line_before)
            }
            if (typeof line_after == 'string') {
              context.push('   ' + line_after)
            }
            console.error(sf.file + ':' + sf.line + ':' + sf.col)
            console.error(context.join('\n') + '\n\nStack trace:')
          } catch (_) {}
        }
        console.error(stack)
        exit(3)
      } else {
        var e = new Error('assertion failure: ' + (msg || cond))
        e.name = 'AssertionError'
        e.stack = _stackTrace(cons)
        throw e
      }
    }
  }
}

function repr(obj) {
  // TODO: something better
  try {
    return JSON.stringify(obj)
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
  var allTests = global.allTests = global.allTests || []
  TEST = (name, f) => {
    if (f === undefined) {
      f = name
      name = f.name || '?'
    }
    let e = new Error(), srcloc = '?'
    if (e.stack) {
      let sf = e.stack.split(/\n/, 3)[2]
      let m = /\s+(?:\(.+\/(src\/.+)\)|at\s+.+\/(src\/.+))$/.exec(sf)
      if (m) {
        srcloc = m[1] || m[2]
        var p = srcloc.lastIndexOf('/')
        var srcfile = p != -1 ? srcloc.substr(p + 1) : srcloc
        p = srcfile.indexOf(':')
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
  var hasRunAllTests = false
  var runAllTests = function runAllTests() { // named for stack trace
    if (hasRunAllTests) {
      return
    }
    hasRunAllTests = true
    let throws = assert.throws
    assert.throws = true
    try {
      for (let i = 0; i < allTests.length; ++i) {
        let t = allTests[i];
        console.log(`[TEST] ${t.name}${t.srcloc ? '\t'+t.srcloc : ''}`);
        t.f();
      }
      assert.throws = throws
    } catch(err) {
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
  }
  global.runAllTests = runAllTests
  if (typeof process != 'undefined' && process.nextTick) {
    process.nextTick(runAllTests)
  } else {
    setTimeout(runAllTests,0)
  }
}}
