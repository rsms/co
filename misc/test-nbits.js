const assert = require('assert')

function str8buf(s) {
  return Uint8Array.from(s, (v, k) => s.charCodeAt(k))
}

function bufcmp(
  a,               // :ArrayLike<byte>,
  b,               // :ArrayLike<byte>,
  aStart = 0,      // :int = 0,
  aEnd = a.length, // :int = a.length,
  bStart = 0,      // :int = 0,
  bEnd = b.length  // :int = b.length,
) { // :int
  var ai = aStart, bi = bStart
  for (; ai != aEnd && bi != bEnd; ++ai, ++bi) {
    if (a[ai] < b[bi]) { return -1 }
    if (b[bi] < a[ai]) { return 1 }
  }
  var aL = aEnd - aStart, bL = bEnd - bStart
  return (
    aL < bL ? -1 :
    bL < aL ? 1 :
    0
  )
}

const i64maxDecBuf = new Uint8Array([ // "9223372036854775807"
  57,50,50,51,51,55,50,48,51,54,56,53,52,55,55,53,56,48,55
])

const u64maxDecBuf = new Uint8Array([ // "18446744073709551615"
  49,56,52,52,54,55,52,52,48,55,51,55,48,57,53,53,49,54,49,53
])

function intDecBits(b) { // (Uint8Array) -> number
  let v = 0, z = b.length
  for (let i = 0; i < z; i++) {
    v = v * 10 + (b[i] - 0x30)
  }
  if (v < 0x1FFFFFFFFFFFFF) {
    return v < 0x80 ? 7 : Math.floor(Math.log2(v)) + 1
  }
  // Beyond js integer precision. We have to look at the bytes.
  let start = 0
  while (b[start] == 0x30) { start++ } // skip leading zeroes
  z = b.length - start
  return  (
    z < 19 ? 63 :
    z == 19 ? bufcmp(b, i64maxDecBuf, start) <= 0 ? 63 : 64 :
    z == 20 && bufcmp(b, u64maxDecBuf, start) <= 0 ? 64 :
    0
  )
}

let samples = [
  ["0",   7],  // 0x0
  ["127", 7],  // 0x7F
  ["128", 8],  // 0x80
  ["255", 8],  // 0xFF
  
  ["256", 9],     // 0x100
  ["32767", 15],  // 0x7FFF
  ["32768", 16],  // 0x8000
  ["65535", 16],  // 0xFFFF
  
  ["65536", 17],      // 0x10000
  ["2147483647", 31], // 0x7FFFFFFF
  ["2147483648", 32], // 0x80000000
  ["4294967295", 32], // 0xFFFFFFFF

  ["4294967296", 33],           // 0x100000000
  ["9007199254740991", 63],     // 0x1FFFFFFFFFFFFF (js MAX_SAFE_INTEGER)
  ["9223372036854775807", 63],  // 0x7FFFFFFFFFFFFFFF
  ["9223372036854775808", 64],  // 0x8000000000000000
  ["18446744073709551615", 64], // 0xFFFFFFFFFFFFFFFF
  ["18446744073709551616", 0],  // 0x10000000000000000 too large
]

let samples2 = samples.map((sample, i) =>
  [str8buf(sample[0]), sample[1]] )

samples2.forEach((sample, i) => {
  let b = sample[0]
  let expected = sample[1]
  let result = intDecBits(b)
  let ok = result == expected
  console.log(
    ok ? 'OK' : 'FAIL',
    `#${i}`,
    `intDecBits ${samples[i][0]} => ${JSON.stringify(result)}` +
    (ok ? '' : `; expected ${expected}`)
  )
})

bench('a', () => {
  samples2.forEach((sample, i) => {
    let b = sample[0]
    let expected = sample[1]
    x = intDecBits(b) 
  })
})

function bench(name, f, iterations = 10000) {
  let start = Date.now(), x
  for (let i = iterations; i--; ) {
    x = f() // need to store to avoid clever v8 optimizations
  }
  let duration = Date.now() - start
  let avg = duration / iterations
  console.log(
    `bench ${name}: ${fmtduration(avg)} avg (${fmtduration(duration)} total)`)
}

function fmtduration(ms) {
  return (
    ms < 1 ? (ms * 1000).toFixed(0) + 'us' :
    ms < 1000 ? ms.toFixed(1) + 'ms' :
    (ms / 1000).toFixed(1) + 's'
  )
}
