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
    var cond = arguments[0]
      , msg = arguments[1]
      , cons = arguments[2] || assert
    if (cond) {
      return
    }
    let stack = _stackTrace(cons)
    let message = 'assertion failure: ' + (msg || cond)

    if (typeof process != 'undefined') {
      var sf = _parseStackFrame(stack.substr(0, stack.indexOf('\n') >>> 0))
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
      var e = new Error(message)
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
  var allTests = GlobalContext.allTests = GlobalContext.allTests || []
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
    var longestTestName = allTests.reduce((a, t) => Math.max(a, t.name.length), 0)
    var spaces = "                                                              "
    try {
      for (let i = 0; i < allTests.length; ++i) {
        let t = allTests[i];
        let name = t.name + spaces.substr(0, longestTestName - t.name.length)
        console.log(`[TEST] ${name}${t.srcloc ? '  '+t.srcloc : ''}`);
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
  GlobalContext.runAllTests = runAllTests
  if (typeof process != 'undefined' && process.nextTick) {
    process.nextTick(runAllTests)
  } else {
    setTimeout(runAllTests,0)
  }
}}
