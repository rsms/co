try { require("source-map-support").install() } catch(_) {}

function _stackTrace(cons) {
  const x = {stack:''}
  Error.captureStackTrace(x, cons)
  const p = x.stack.indexOf('\n')
  return p == -1 ? x.stack : x.stack.substr(p+1)
}

function panic(msg) {
  console.error.apply(console,
    ['panic:', msg].concat(Array.prototype.slice.call(arguments, 1))
  )
  console.error(_stackTrace(panic))
  process.exit(2)
}

function assert() {
  if (DEBUG) { // for DCE
    var cond = arguments[0], msg = arguments[1]
    if (!cond) {
      var e, stack = _stackTrace(assert)
      console.error('assertion failure:', msg || cond)
      console.error(_stackTrace(assert))
      process.exit(3)
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
  var allTests = []
  TEST = (name, f) => {
    if (f === undefined) {
      f = name
      name = f.name || '?'
    }
    let e = new Error(), srcloc = '?'
    if (e.stack) {
      let sf = e.stack.split(/\n/, 3)[2]
      let m = /\s+\(.+\/(src\/.+)\)$/.exec(sf)
      if (m) {
        srcloc = m[1]
      }
    }
    allTests.push({ f, name, srcloc })
  }
  var runAllTests = function runAllTests() { // named for stack trace
    for (let i = 0; i < allTests.length; ++i) {
      let t = allTests[i];
      console.log(`[TEST] ${t.name}${t.srcloc ? ' '+t.srcloc : ''}`);
      t.f();
    }
  }
  if (typeof process != 'undefined' && process.nextTick) {
    process.nextTick(runAllTests)
  } else {
    setTimeout(runAllTests,0)
  }
}
