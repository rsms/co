// import {}
import { assertEq, assertEqList, assertEqObj, assertThrows } from './test'
import { asciibuf } from './util'
import { Position, SrcFile, SrcFileSet } from './pos'
import { token, tokstr } from './token'
import * as scanner from './scanner'
import * as unicode from './unicode'

const SEMIC = token.SEMICOLON
const ReportErrors = false


function dedentMultiLineString(s :string) :string {
  let p = s.lastIndexOf('\n')
  if (p == -1 || p == s.length - 1) {
    return s
  }
  let ind = s.substr(p)
  let v :string[] = []
  for (let line of s.split('\n')) {
    if (line.indexOf(ind) != 0) {
      // some line has a lower indentation -- abort and don't change s
      return s
    }
    v.push(line.substr(ind.length))
  }
  return v.join('\n')
}

function onScanError(position :Position, message :string) {
  console.error(`[error] ${message} at ${position}`)
}

function dumpTokens(s :scanner.Scanner) {
  s.next()
  while (s.tok != token.EOF) {
    console.log(`>> ${tokstr(s.tok)}`)
    s.next()
  }
}

function sourceScanner(srctext :string) :scanner.Scanner {
  let s = new scanner.Scanner()
  let fileSet = new SrcFileSet()
  let src = asciibuf(dedentMultiLineString(srctext))
  let file = fileSet.addFile('a', src.length)
  s.init(file, src, ReportErrors ? onScanError : null)
  return s
}

function assertTokens(srctext :string, tokens :token[]) {
  let s = sourceScanner(srctext)
  let i = 0
  s.next()
  while (s.tok != token.EOF) {
    assert(
      i < tokens.length,
      `too many tokens produced; ` +
      `got extra ${token[s.tok]} (${tokstr(s.tok)}) ` +
      `at ${s.sfile.position(s.pos)}`,
      assertTokens
    )

    let etok = tokens[i++] // expected token

    assert(
      etok === s.tok,
      `expected ${token[etok]} (${tokstr(etok)}) ` +
      `but got ${token[s.tok]} (${tokstr(s.tok)}) `+
      `at ${s.sfile.position(s.pos)}`,
      assertTokens
    )

    s.next()
  }
  assert(i == tokens.length, `too few tokens produced`, assertTokens)
}

function assertGotTok(s :scanner.Scanner, t :token) {
  s.next()
  assert(
    s.tok == t,
    `expected token.${token[t]} ` +
    `but got ${token[s.tok]} (${tokstr(s.tok)}) `+
    `at ${s.sfile.position(s.pos)}`,
    assertGotTok
  )
}

function assertGotI64Val(s :scanner.Scanner, t :token, expectedString :string) {
  assertGotTok(s, t)
  let base = (
    t == token.INT_HEX ? 16 :
    t == token.INT_OCT ? 8 :
    t == token.INT_BIN ? 2 :
    10
  )
  if (!s.int64val) {
    assert(
      false,
      `expected int64 value but none was parsed` +
      ` at ${s.sfile.position(s.pos)}`,
      assertGotI64Val
    )
  } else if (base == 16) {
    assert(
      s.int64val.toString(base) === expectedString,
      `expected int64 value ${expectedString}` +
      ` but got 0x${s.int64val.toString(base)}` +
      ` at ${s.sfile.position(s.pos)}`,
      assertGotI64Val
    )
  } else {
    assert(
      s.int64val.toString(base) === expectedString,
      `expected int64 value ${expectedString}` +
      ` but got ${s.int64val.toString(base)} (0x${s.int64val.toString(16)})` +
      ` at ${s.sfile.position(s.pos)}`,
      assertGotI64Val
    )
  }
}


function assertGotInvalidInt(s :scanner.Scanner, t :token) {
  assertGotTok(s, t)
  assert(
    isNaN(s.int32val),
    `expected invalid int but got` +
    ` int32val ${s.int32val.toString(10)} (0x${s.int32val.toString(16)})` +
    ` at ${s.sfile.position(s.pos)}`,
    assertGotInvalidInt
  )
  assert(
    s.int64val == null,
    `expected invalid int` +
    ` but got int64val ${s.int64val ? s.int64val.toString(10) : '0'}`+
    ` (0x${s.int64val ? s.int64val.toString(16) : '0'})` +
    ` at ${s.sfile.position(s.pos)}`,
    assertGotInvalidInt
  )
}


TEST('basics', () => {
  assertTokens(`
    123  // implicit semicolon here
    // line comment
    456; // explicit semicolon doesn't generate implicit semicolon
    /* multi-line
       comment
       ignored */
    678  // implicit semicolon here
    `, [
    token.INT, SEMIC,
    token.INT, SEMIC,
    token.INT, SEMIC,
  ])
})


TEST('parse-float', () => {
  let samples = [
    // Note: JavaScript ES6 uses IEEE 754-2008, which we do as well, so
    // we can nicely use JS numbers (let the js env parse them) to verify that
    // our parser works correctly.
    ['1.0',           1.0],
    ['0.',            0.0],
    ['0.0',           0.0],
    ['72.40',         72.4],
    ['072.40',        72.4],
    ['2.71828',       2.71828],
    ['1.e+0',         1.e+0],
    ['6.67428e-11',   6.67428e-11],
    ['1E6',           1E6],
    ['.25',           .25],
    ['.12345E+5',     .12345E+5],
  ]

  let src = samples.map(sample => `${sample[0]}`).join('\n')
  let s = sourceScanner(src)
  // dumpTokens(sourceScanner(src))

  for (let [source, value] of samples) {
    assertGotTok(s, token.FLOAT)
    assertEq(s.floatval, value)
    assertGotTok(s, SEMIC)
  }

  assertGotTok(s, token.EOF)
})


TEST('parse-int-dec', () => {

  let s = sourceScanner(`
    // 32-bit integers
    4294967295            // UINT32_MAX

    // 64-bit integers
    4294967296            // UINT32_MAX + 1
    92233720368547
    922337203685477
    9223372036854775
    92233720368547758
    922337203685477580
    999999999999999999
    1000000000000000000
    9223372036854775807   // I64_MAX
    9223372036854775808   // I64_MAX + 1
    9999999994294967295   // largest number that fits in two i32 passes
    18446744073709551615  // U64_MAX

    // large integers
    18446744073709551616  // U64_MAX + 1
    18446744078004518910  // U64_MAX + U32_MAX
    18446744078004518911  // U64_MAX + U32_MAX + 1
    18446744078004518909  // U64_MAX + U32_MAX - 1
    12345678901234567890123
  `)

  // 32-bit integers
  assertGotTok(s, token.INT)
  assertEq(s.int32val, 4294967295) // UINT32_MAX
  assertGotTok(s, SEMIC)

  // 64-bit integers
  assertGotI64Val(s, token.INT, '4294967296')
  assert(isNaN(s.int32val)) // UINT32_MAX + 1
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '92233720368547')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '922337203685477')
  assertGotTok(s, SEMIC)
  
  assertGotI64Val(s, token.INT, '9223372036854775')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '92233720368547758')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '922337203685477580')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '999999999999999999')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '1000000000000000000')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '9223372036854775807')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '9223372036854775808')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '9999999994294967295')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT, '18446744073709551615')
  assertGotTok(s, SEMIC)

  // large integers (invalid)
  assertGotInvalidInt(s, token.INT)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT)
  assertGotTok(s, SEMIC)

  assertGotTok(s, token.EOF)
})


TEST('parse-int-octal', () => {

  let s = sourceScanner(`
    // 32-bit integers
    0o37777777777            // UINT32_MAX

    // 64-bit integers
    0o40000000000            // 4294967296   UINT32_MAX + 1
    0o2476132610706643       // 92233720368547
    0o32155613530704145      // 922337203685477
    0o406111564570651767     // 9223372036854775
    0o5075341217270243656    // 92233720368547758
    0o63146314631463146314   // 922337203685477580
    0o67405553164730777777   // 999999999999999999
    0o67405553164731000000   // 1000000000000000000
    0o777777777777777777777  // 9223372036854775807   I64_MAX
    0o1000000000000000000000 // 9223372036854775808   I64_MAX + 1
    0o1053071060146567015777 // 9999999994294967295
      // largest number that fits in two i32 passes
    0o1777777777777777777777 // 18446744073709551615  U64_MAX

    // large integers
    0o2000000000000000000000    // 18446744073709551616  U64_MAX + 1
    0o2000000000037777777776    // 18446744078004518910  U64_MAX + U32_MAX
    0o2000000000037777777777    // 18446744078004518911  U64_MAX + U32_MAX + 1
    0o2000000000037777777775    // 18446744078004518909  U64_MAX + U32_MAX - 1
    0o2472412662347316120442313 // 12345678901234567890123
  `)

  // 32-bit integers
  assertGotTok(s, token.INT_OCT)
  assertEq(s.int32val, 4294967295) // UINT32_MAX
  assertGotTok(s, SEMIC)

  // 64-bit integers
  assertGotI64Val(s, token.INT_OCT, '40000000000')
  assert(isNaN(s.int32val)) // UINT32_MAX + 1
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '2476132610706643')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '32155613530704145')
  assertGotTok(s, SEMIC)
  
  assertGotI64Val(s, token.INT_OCT, '406111564570651767')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '5075341217270243656')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '63146314631463146314')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '67405553164730777777')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '67405553164731000000')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '777777777777777777777')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '1000000000000000000000')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '1053071060146567015777')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_OCT, '1777777777777777777777')
  assertGotTok(s, SEMIC)

  // large integers (invalid)
  assertGotInvalidInt(s, token.INT_OCT)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT_OCT)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT_OCT)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT_OCT)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT_OCT)
  assertGotTok(s, SEMIC)

  assertGotTok(s, token.EOF)
})


TEST('parse-int-hex', () => {

  let s = sourceScanner(`
    // 32-bit integers
    0xffffffff         // UINT32_MAX

    // 64-bit integers
    0x100000000        // UINT32_MAX + 1
    0x53e2d6238da3     // 92233720368547
    0x346dc5d638865    // 922337203685477
    0x20c49ba5e353f7   // 9223372036854775
    0x147ae147ae147ae  // 92233720368547758
    0xccccccccccccccc  // 922337203685477580
    0xde0b6b3a763ffff  // 999999999999999999
    0xde0b6b3a7640000  // 1000000000000000000
    0x7fffffffffffffff // 9223372036854775807   I64_MAX
    0x8000000000000000 // 9223372036854775808   I64_MAX + 1
    0x8ac7230335dc1bff // 9999999994294967295
      // largest number that fits in two i32 passes
    0xffffffffffffffff // 18446744073709551615  U64_MAX

    // large integers
    0x10000000000000000   // 18446744073709551616  U64_MAX + 1
    0x100000000fffffffe   // 18446744078004518910  U64_MAX + U32_MAX
    0x100000000ffffffff   // 18446744078004518911  U64_MAX + U32_MAX + 1
    0x100000000fffffffd   // 18446744078004518909  U64_MAX + U32_MAX - 1
    0x29d42b64e76714244cb // 12345678901234567890123
  `)

  // 32-bit integers
  assertGotTok(s, token.INT_HEX)
  assertEq(s.int32val, 0xffffffff) // UINT32_MAX
  assertGotTok(s, SEMIC)

  // 64-bit integers
  assertGotI64Val(s, token.INT_HEX, '100000000')
  assert(isNaN(s.int32val)) // UINT32_MAX + 1
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, '53e2d6238da3')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, '346dc5d638865')
  assertGotTok(s, SEMIC)
  
  assertGotI64Val(s, token.INT_HEX, '20c49ba5e353f7')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, '147ae147ae147ae')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, 'ccccccccccccccc')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, 'de0b6b3a763ffff')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, 'de0b6b3a7640000')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, '7fffffffffffffff')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, '8000000000000000')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, '8ac7230335dc1bff')
  assertGotTok(s, SEMIC)

  assertGotI64Val(s, token.INT_HEX, 'ffffffffffffffff')
  assertGotTok(s, SEMIC)

  // large integers (invalid)
  assertGotInvalidInt(s, token.INT_HEX)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT_HEX)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT_HEX)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT_HEX)
  assertGotTok(s, SEMIC)

  assertGotInvalidInt(s, token.INT_HEX)
  assertGotTok(s, SEMIC)

  assertGotTok(s, token.EOF)
})


TEST('parse-char', () => {
  let samples = [
    ['a',           0x61],
    ['K',           0x4B],
    ['\\n',         0xA],
    ['\\t',         0x9],
    ['\\f',         0xC],
    ['\\0',         0],
    ['\\x00',       0],
    ['\\x0A',       0xA],
    ['\\xff',       0xff],
    ['\\u221A',     0x221A],
    ['\\U00010299', 0x10299],
  ]

  let src = samples.map(sample => `'${sample[0]}'`).join('\n')
  let s = sourceScanner(src)
  // dumpTokens(sourceScanner(src))

  for (let [source, value] of samples) {
    assertGotTok(s, token.CHAR)
    assertEq(s.int32val, value)
    assertGotTok(s, SEMIC)
  }

  assertGotTok(s, token.EOF)
})


TEST('parse-char/invalid', () => {
  let singleInvalidCharSources = [
    "''",     // empty
    "'ab'",   // too long
    "'\n'",   // literal linebreak
    "'\x00'", // literal null
    "'\x09'", // literal tab
    "'\\'",   // escape eats terminator
    "'\\2'",  // invalid escape
    "'a",     // unterminated
    "'\\U00110000'", // invalid unicode point
  ]
  for (let src of singleInvalidCharSources) {
    let s = sourceScanner(src)
    assertGotTok(s, token.ILLEGAL)
    assert(isNaN(s.int32val))
    assertGotTok(s, SEMIC)
    assertGotTok(s, token.EOF)
  }
})
