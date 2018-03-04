// strtou parses an unsigned integer from a byte array.
// The maximum value this function can produce is Number.MAX_SAFE_INTEGER
//
// Note on performance: In benchmarks with nodejs 8.1.3, this is roughly 2.5x
// faster than parseInt(String.fromCharCode ...)
//
export function strtou(
  b :ArrayLike<byte>,
  base :int,
  start :int,
  end :int,
) :int {
  assert(base >= 2)
  assert(base <= 36)

  var cutoff = Math.floor(Number.MAX_SAFE_INTEGER / base)
  var cutlim = Number.MAX_SAFE_INTEGER % base
  var acc = 0 // accumulator
  var i = start, c = 0

  while (i < end) {
    c = b[i]

    if (c >= 0x30 && c <= 0x39) { // 0..9
      c -= 0x30
    } else if (c >= 0x41 && c <= 0x5A) { // A..Z
      c -= 0x41 - 10
    } else if (c >= 0x61 && c <= 0x7A) { // a..z
      c -= 0x61 - 10
    } else {
      return -1
    }

    if (c >= base) {
      return -1
    }

    if (acc > cutoff || (acc == cutoff && c > cutlim)) {
      return -1 // overflow
    } else {
      acc = (acc * base) + c
    }

    i++
  }

  return acc
}


TEST("strtou", () => {
  function t(input :string, base :int, expect :int) {
    let buf = Uint8Array.from(
      input as any as ArrayLike<number>,
      (v: number, k: number) => input.charCodeAt(k)
    )
    let output = strtou(buf, base, 0, buf.length)
    assert(
      output === expect,
      `strtou32("${input}", ${base}) => ${output}; expected ${expect}`
    )
  }

  t("", 10, 0)
  t("0", 10, 0)
  t("000000000000", 10, 0)
  t("1", 10, 1)
  t("00000000000000000000000000000000000000000000000001", 10, 1)
  t("123", 10, 123)
  t("4294967295", 10, 4294967295)  // 0xFFFFFFFF
  t(Number.MAX_SAFE_INTEGER.toString(10), 10, Number.MAX_SAFE_INTEGER)
  t((Number.MAX_SAFE_INTEGER+1).toString(10), 10, -1)

  t("0", 16, 0x0)
  t("FF", 16, 0xFF)
  t("DEADBEEF", 16, 0xDEADBEEF)
  t("deadbeef", 16, 0xdeadbeef)
  t("dEaDbEef", 16, 0xdeadbeef)
  t("0000DEADBEEF", 16, 0xDEADBEEF)

  // invalid chars
  t("x123", 10, -1)
  t("-123", 10, -1)
})
