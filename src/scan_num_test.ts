import { quickcheck } from './test'
import { token } from './token'
import * as scanner from './scanner'
import {
  sourceScanner,
  assertGotTok,
} from './scanner_test'


function numberBaseForToken(t :token) :int {
  return (
    t == token.INT_HEX ? 16 :
    t == token.INT_OCT ? 8 :
    t == token.INT_BIN ? 2 :
    10
  )
}

function assertGotI32Val(s :scanner.Scanner, t :token, expectedString :string) {
  assertGotTok(s, t)
  let base = numberBaseForToken(t)
  if (isNaN(s.int32val)) {
    assert(
      false,
      `expected int32 value but none was parsed (s.int32val=NaN)` +
      ` at ${s.sfile.position(s.pos)}`,
      assertGotI32Val
    )
  } else if (base == 16) {
    assert(
      s.int32val.toString(base) === expectedString,
      `expected int32 value ${expectedString}` +
      ` but got 0x${s.int32val.toString(base)}` +
      ` at ${s.sfile.position(s.pos)}`,
      assertGotI32Val
    )
  } else {
    assert(
      s.int32val.toString(base) === expectedString,
      `expected int32 value ${expectedString}` +
      ` but got ${s.int32val.toString(base)} (0x${s.int32val.toString(16)})` +
      ` at ${s.sfile.position(s.pos)}`,
      assertGotI32Val
    )
  }
}

function assertGotF64Val(s :scanner.Scanner, expectedVal :number) {
  assertGotTok(s, token.FLOAT)
  assert(
    !isNaN(s.floatval),
    `expected float value but none was parsed (s.floatval=NaN)` +
    ` at ${s.sfile.position(s.pos)}`,
    assertGotF64Val
  )
  assert(
    s.floatval === expectedVal,
    `expected float value ${expectedVal} but got ${s.floatval}` +
    ` at ${s.sfile.position(s.pos)}`,
    assertGotF64Val
  )
}

function assertGotI64Val(s :scanner.Scanner, t :token, expectedString :string) {
  assertGotTok(s, t)
  let base = numberBaseForToken(t)
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
  let base = numberBaseForToken(t)
  assertGotTok(s, t)
  assert(
    isNaN(s.int32val),
    `expected invalid int but got` +
    ` int32val ${s.int32val.toString(base)} (0x${s.int32val.toString(16)})` +
    ` at ${s.sfile.position(s.pos)}`,
    assertGotInvalidInt
  )
  assert(
    s.int64val == null,
    `expected invalid int` +
    ` but got int64val ${s.int64val ? s.int64val.toString(base) : '0'}`+
    ` (0x${s.int64val ? s.int64val.toString(16) : '0'})` +
    ` at ${s.sfile.position(s.pos)}`,
    assertGotInvalidInt
  )
}

function expectedStringFromSource(s :string, t :token) :string {
  let base = numberBaseForToken(t)
  if (s[0] == '+') {
    s = s.substr(1) // remove "+" used to force parser into signed int
  }
  if (base != 10) {
    // strip prefix, e.g. "0x"
    s = (
      s[0] == '-' ? '-' + s.substr(3) :
      s.substr(2)
    )
  }
  return (
    s == '-0' ? '0' :
    s[0] == '+' ? s.substr(1) :
    s
  )
}

function assertScanI32s(samples :[string,token][]) {
  for (let sample of samples) {
    let source = sample[0]
    let expectToken = sample[1]
    let expectString = expectedStringFromSource(source, expectToken)
    let s = sourceScanner(source)
    // console.log(`>> scan "${source}"`)
    assertGotI32Val(s, expectToken, expectString)
  }
}

function assertScanI64s(samples :[string,token][]) {
  for (let sample of samples) {
    let source = sample[0]
    let expectToken = sample[1]
    let expectString = expectedStringFromSource(source, expectToken)
    let s = sourceScanner(source)
    // console.log(`>> scan "${source}"`)
    assertGotI64Val(s, expectToken, expectString)
  }
}

function assertScanBigInts(samples :[string,token][]) {
  for (let sample of samples) {
    let source = sample[0]
    let expectToken = sample[1]
    let s = sourceScanner(source)
    // console.log(`>> scan "${source}"`)
    assertGotInvalidInt(s, expectToken)
  }
}

function assertScanF64s(samples :string[]) {
  for (let source of samples) {
    let expectVal = parseFloat(source)
    let s = sourceScanner(source)
    // console.log(`>> scan "${source}" -> ${expectVal}`)
    assertGotF64Val(s, expectVal)
  }
}


// ===========================================================================


TEST('int/unsigned/base16', () => {
  // unsigned 32-bit integers
  assertScanI32s([
    ['0x0',        token.INT_HEX],
    ['0x1',        token.INT_HEX],
    ['0x123',      token.INT_HEX],
    ['0xff0099',   token.INT_HEX],
    ['0xdeadbeef', token.INT_HEX],
    ['0xffffffff', token.INT_HEX], // UINT32_MAX
  ])

  // unsigned 64-bit integers
  assertScanI64s([
    // 64-bit integers
    ['0x100000000',        token.INT_HEX], // UINT32_MAX + 1
    ['0x53e2d6238da3',     token.INT_HEX],
    ['0x346dc5d638865',    token.INT_HEX],
    ['0x20c49ba5e353f7',   token.INT_HEX],
    ['0x147ae147ae147ae',  token.INT_HEX],
    ['0xccccccccccccccc',  token.INT_HEX],
    ['0xde0b6b3a763ffff',  token.INT_HEX],
    ['0xde0b6b3a7640000',  token.INT_HEX],
    ['0x7fffffffffffffff', token.INT_HEX], // SINT64_MAX
    ['0x8000000000000000', token.INT_HEX], // SINT64_MAX + 1
    ['0x8ac7230335dc1bff', token.INT_HEX], // 
      // largest number that fits in two i32 passes
    ['0xffffffffffffffff', token.INT_HEX], // 18446744073709551615  U64_MAX
  ])

  // unsigned bit integers
  assertScanBigInts([
    // large integers
    ['0x10000000000000000',   token.INT_HEX], // UINT64_MAX + 1
    ['0x10000000000000002',   token.INT_HEX], // UINT64_MAX + 3
    ['0x100000000fffffffe',   token.INT_HEX], // UINT64_MAX + UINT32_MAX
    ['0x100000000ffffffff',   token.INT_HEX], // UINT64_MAX + UINT32_MAX + 1
    ['0x100000000fffffffd',   token.INT_HEX], // UINT64_MAX + UINT32_MAX - 1
    ['0x29d42b64e76714244cb', token.INT_HEX],
  ])
})


TEST('int/unsigned/base10', () => {
  // unsigned 32-bit integers
  assertScanI32s([
    ['0',          token.INT],
    ['1',          token.INT],
    ['123',        token.INT],
    ['4294967295', token.INT], // UINT32_MAX
  ])

  // unsigned 64-bit integers
  assertScanI64s([
    ['4294967296',           token.INT], // UINT32_MAX + 1
    ['92233720368547',       token.INT],
    ['922337203685477',      token.INT],
    ['9223372036854775',     token.INT],
    ['92233720368547758',    token.INT],
    ['922337203685477580',   token.INT],
    ['999999999999999999',   token.INT],
    ['1000000000000000000',  token.INT],
    ['9223372036854775807',  token.INT], // SINT64_MAX
    ['9223372036854775808',  token.INT], // SINT64_MAX + 1
    ['9999999994294967295',  token.INT],
      // largest number that fits in two i32 passes
    ['10000000000000000000', token.INT],
    ['10000000009999999999', token.INT],
    ['9999999999999999999',  token.INT],
    ['9999999999800000000',  token.INT],
    ['18446744073709551615', token.INT], // U64_MAX
  ])

  // unsigned bit integers
  assertScanBigInts([
    ['18446744073709551616',   token.INT],  // U64_MAX + 1
    ['18446744073709551618',   token.INT],  // U64_MAX + 3
    ['18446744078004518910',   token.INT],  // U64_MAX + U32_MAX
    ['18446744078004518911',   token.INT],  // U64_MAX + U32_MAX + 1
    ['18446744078004518909',   token.INT],  // U64_MAX + U32_MAX - 1
    ['90000000000000000000',   token.INT],
    ['20000000000000000000',   token.INT],
    ['22222222222222222222',   token.INT],
    ['99999999999999999999',   token.INT],
    ['12345678901234567890123', token.INT],
    ['99999999999999999999999999999999999',token.INT],
  ])
})


TEST('int/unsigned/base8', () => {
  // unsigned 32-bit integers
  assertScanI32s([
    ['0o0',           token.INT_OCT],
    ['0o1',           token.INT_OCT],
    ['0o123',         token.INT_OCT],
    ['0o4671',        token.INT_OCT],
    ['0o37777777777', token.INT_OCT], // UINT32_MAX
  ])

  // unsigned 64-bit integers
  assertScanI64s([
    // 64-bit integers
    ['0o40000000000',            token.INT_OCT], // UINT32_MAX + 1
    ['0o2476132610706643',       token.INT_OCT], // 
    ['0o32155613530704145',      token.INT_OCT], // 
    ['0o406111564570651767',     token.INT_OCT], // 
    ['0o5075341217270243656',    token.INT_OCT], // 
    ['0o63146314631463146314',   token.INT_OCT], // 
    ['0o67405553164730777777',   token.INT_OCT], // 
    ['0o67405553164731000000',   token.INT_OCT], // 
    ['0o777777777777777777777',  token.INT_OCT], // I64_MAX
    ['0o1000000000000000000000', token.INT_OCT], // I64_MAX + 1
    ['0o1053071060146567015777', token.INT_OCT],
      // largest number that fits in two i32 passes
    ['0o1777777777777777777777', token.INT_OCT], // U64_MAX
  ])

  // unsigned bit integers
  assertScanBigInts([
    ['0o2000000000000000000000',    token.INT_OCT], // U64_MAX + 1
    ['0o2000000000037777777776',    token.INT_OCT], // U64_MAX + U32_MAX
    ['0o2000000000037777777777',    token.INT_OCT], // U64_MAX + U32_MAX + 1
    ['0o2000000000037777777775',    token.INT_OCT], // U64_MAX + U32_MAX - 1
    ['0o7777777777777777777777',    token.INT_OCT],
    ['0o10000000000000000000000',   token.INT_OCT],
    ['0o2472412662347316120442313', token.INT_OCT],
  ])
})


TEST('int/unsigned/base2', () => {
  // unsigned 32-bit integers
  assertScanI32s([
    ['0b0',           token.INT_BIN],
    ['0b1',           token.INT_BIN],
    ['0b100',         token.INT_BIN],
    ['0b111',         token.INT_BIN],
    ['0b10101',       token.INT_BIN],
    ['0b11111111111111111111111111111111', token.INT_BIN], // UINT32_MAX
  ])

  // unsigned 64-bit integers
  assertScanI64s([
    // 64-bit integers
    [ '0b100000000000000000000000000000000',
      token.INT_BIN ], // UINT32_MAX + 1
    [ '0b10100111110001011010110001000111000110110100011',
      token.INT_BIN ],
    [ '0b11010001101101110001011101011000111000100001100101',
      token.INT_BIN ],
    [ '0b100000110001001001101110100101111000110101001111110111',
      token.INT_BIN ],
    [ '0b101000111101011100001010001111010111000010100011110101110',
      token.INT_BIN ],
    [ '0b110011001100110011001100110011001100110011001100110011001100',
      token.INT_BIN ],
    [ '0b110111100000101101101011001110100111011000111111111111111111',
      token.INT_BIN ],
    [ '0b110111100000101101101011001110100111011001000000000000000000',
      token.INT_BIN ],
    [ '0b111111111111111111111111111111111111111111111111111111111111111',
      token.INT_BIN ], // I64_MAX
    [ '0b1000000000000000000000000000000000000000000000000000000000000000',
      token.INT_BIN ], // I64_MAX + 1
    [ '0b1000101011000111001000110000001100110101110111000001101111111111',
      token.INT_BIN ], // largest number that fits in two i32 passes
    [ '0b1111111111111111111111111111111111111111111111111111111111111111',
      token.INT_BIN ], // U64_MAX
  ])

  // unsigned bit integers
  assertScanBigInts([
    [ '0b10000000000000000000000000000000000000000000000000000000000000000',
      token.INT_BIN], // U64_MAX + 1
    [ '0b10000000000000000000000000000000011111111111111111111111111111110',
      token.INT_BIN], // U64_MAX + U32_MAX
    [ '0b10000000000000000000000000000000011111111111111111111111111111111',
      token.INT_BIN], // U64_MAX + U32_MAX + 1
    [ '0b10000000000000000000000000000000011111111111111111111111111111101',
      token.INT_BIN], // U64_MAX + U32_MAX - 1
    [
'0b10100111010100001010110110010011100111011001110001010000100100010011001011',
      token.INT_BIN], // 12345678901234567890123
  ])
})


TEST('int/signed/base16', () => {
  // signed 32-bit integers
  assertScanI32s([
    ['-0x0',        token.INT_HEX],
    ['+0x0',        token.INT_HEX],
    ['-0x1',        token.INT_HEX],
    ['+0x12c',      token.INT_HEX],
    ['-0x12c',      token.INT_HEX],
    ['+0xaff',      token.INT_HEX],
    ['-0xaff',      token.INT_HEX],
    ['-0x80000000', token.INT_HEX], // SINT32_MIN
    ['+0x7fffffff', token.INT_HEX], // SINT32_MAX
  ])

  // signed 64-bit integers
  assertScanI64s([
    ['-0x80000001',         token.INT_HEX], // SINT32_MIN - 1
    ['+0x80000000',         token.INT_HEX], // SINT32_MAX + 1
    ['-0x100000000',        token.INT_HEX],
    ['-0x1000000000000000', token.INT_HEX],
    ['+0x1000000000000000', token.INT_HEX],
    ['-0xfffffffffffffff',  token.INT_HEX],
    ['+0xfffffffffffffff',  token.INT_HEX],
    ['-0x7fffffffffffffff', token.INT_HEX], // SINT64_MIN + 1
    ['-0x8000000000000000', token.INT_HEX], // SINT64_MIN
    ['+0x7fffffffffffffff', token.INT_HEX], // SINT64_MAX
  ])

  // signed bit integers
  assertScanBigInts([
    ['-0x8000000000000001',       token.INT_HEX], // SINT64_MIN - 1
    ['-0x8000000000000002',       token.INT_HEX], // SINT64_MIN - 2
    ['+0x8000000000000000',       token.INT_HEX], // SINT64_MAX + 1
    ['+0x8000000000000001',       token.INT_HEX], // SINT64_MAX + 2
    ['+0xffffffffffffffff',       token.INT_HEX],
    ['-0xffffffffffffffff',       token.INT_HEX],
    ['+0x1000000000000000f',      token.INT_HEX],
    ['-0x1000000000000000f',      token.INT_HEX],
    ['+0xcacacacacaccacacacacac', token.INT_HEX],
  ])
})


TEST('int/signed/base10', () => {
  // signed 32-bit integers
  assertScanI32s([
    ['-1',          token.INT],
    ['+1',          token.INT],
    ['-0',          token.INT],
    ['+0',          token.INT],
    ['-123',        token.INT],
    ['+123',        token.INT],
    ['-987',        token.INT],
    ['-2147483648', token.INT], // SINT32_MIN
    ['+2147483647', token.INT], // SINT32_MAX
  ])

  // signed 64-bit integers
  assertScanI64s([
    ['-2147483649',          token.INT], // SINT32_MIN - 1
    ['+2147483648',          token.INT], // SINT32_MAX + 1
    ['-10000000000',         token.INT],
    ['-92233720368547',      token.INT],
    ['-9223372036854775807', token.INT], // SINT64_MIN + 1
    ['-9223372036854775808', token.INT], // SINT64_MIN
    ['+9223372036854775807', token.INT], // SINT64_MAX
  ])

  // signed bit integers
  assertScanBigInts([
    ['-9223372036854775809',      token.INT], // SINT64_MIN - 1
    ['+9223372036854775808',      token.INT], // SINT64_MAX + 1
    ['-9999999999999999999',      token.INT],
    ['+9999999999999999999',      token.INT],
    ['-999999999999999999999999', token.INT],
    ['+999999999999999999999999', token.INT],
  ])
})


TEST('int/signed/base8', () => {
  // signed 32-bit integers
  assertScanI32s([
    ['-0o1',           token.INT_OCT],
    ['+0o1',           token.INT_OCT],
    ['-0o0',           token.INT_OCT],
    ['+0o0',           token.INT_OCT],
    ['-0o173',         token.INT_OCT], // -123
    ['+0o173',         token.INT_OCT], // 123
    ['-0o1467',        token.INT_OCT],
    ['-0o20000000000', token.INT_OCT], // SINT32_MIN
    ['+0o17777777777', token.INT_OCT], // SINT32_MAX
  ])

  // signed 64-bit integers
  assertScanI64s([
    ['-0o20000000001',            token.INT_OCT], // SINT32_MIN - 1
    ['+0o20000000000',            token.INT_OCT], // SINT32_MAX + 1
    ['+0o651341234707',           token.INT_OCT],
    ['-0o777777777777777777777',  token.INT_OCT], // SINT64_MIN + 1
    ['-0o1000000000000000000000', token.INT_OCT], // SINT64_MIN
    ['+0o777777777777777777777',  token.INT_OCT], // SINT64_MAX
  ])

  // signed bit integers
  assertScanBigInts([
    ['-0o1000000000000000000001',     token.INT_OCT], // SINT64_MIN - 1
    ['+0o1000000000000000000000',     token.INT_OCT], // SINT64_MAX + 1
    ['+0o1000000000000000000001',     token.INT_OCT], // SINT64_MAX + 2
    ['+0o7777777777777777777777',     token.INT_OCT],
    ['+0o10000000000000000000000',    token.INT_OCT],
    ['-0o10000000000000000000000',    token.INT_OCT],
    ['-0o12345671234567123456712345', token.INT_OCT],
  ])
})


TEST('int/signed/base2', () => {
  // signed 32-bit integers
  assertScanI32s([
    ['-0b1',          token.INT_BIN],
    ['+0b1',          token.INT_BIN],
    ['-0b0',          token.INT_BIN],
    ['+0b0',          token.INT_BIN],
    ['-0b110',        token.INT_BIN],
    ['+0b110',        token.INT_BIN],
    ['-0b111001',     token.INT_BIN],
    ['-0b10000000000000000000000000000000', token.INT_BIN], // SINT32_MIN
    ['+0b1111111111111111111111111111111',  token.INT_BIN], // SINT32_MAX
  ])

  // signed 64-bit integers
  assertScanI64s([
    ['-0b10000000000000000000000000000001',   token.INT_BIN], // SINT32_MIN - 1
    ['+0b10000000000000000000000000000000',   token.INT_BIN], // SINT32_MAX + 1
    ['+0b110101010101010101010101010101010',  token.INT_BIN],
    ['+0b1101111110000001111111000001111111', token.INT_BIN],
    ['-0b111111111111111111111111111111111111111111111111111111111111111',
      token.INT_BIN], // SINT64_MIN + 1
    ['-0b1000000000000000000000000000000000000000000000000000000000000000',
      token.INT_BIN], // SINT64_MIN
    ['+0b111111111111111111111111111111111111111111111111111111111111111',
      token.INT_BIN], // SINT64_MAX
  ])

  // signed bit integers
  assertScanBigInts([
    ['-0b1000000000000000000000000000000000000000000000000000000000000001',
      token.INT_BIN], // SINT64_MIN - 1
    ['+0b1000000000000000000000000000000000000000000000000000000000000000',
      token.INT_BIN], // SINT64_MAX + 1
    ['-0b10000000000000000000000000000000000000000000000000000000000000000',
      token.INT_BIN],
    ['+0b10000000000000000000000000000000000000000000000000000000000000000',
      token.INT_BIN],
    ['-0b11111111111111111111111111111111111111111111111111111111111111111111',
      token.INT_BIN],
    ['+0b11111111111111111111111111111111111111111111111111111111111111111111',
      token.INT_BIN],
  ])
})



TEST('int/neg-base10-quickcheck', () => {
  function negI64Gen(i :int) :string {
    return '-9223372036854775' + (i >= 0 ? i.toString() : '')
  }

  // negative i64s
  quickcheck<string>([-1, 808], {
    gen: negI64Gen,
    check(src :string) {
      let s = sourceScanner(src)
      s.next()
      return (
        s.tok == token.INT &&
        isNaN(s.int32val) &&
        s.int64val != null &&
        s.int64val.toString() === src
      )
    },
  })

  // negative bigs
  quickcheck<string>([809, 10000], {
    gen: negI64Gen,
    check(src :string) {
      let s = sourceScanner(src)
      s.next()
      return (
        s.tok == token.INT &&
        isNaN(s.int32val) &&
        s.int64val == null
      )
    },
  })

})


TEST('float', () => {
  assertScanF64s([
    '1.0',
    '0.',
    '0.0',
    '72.40',
    '072.40',
    '2.71828',
    '1.e+0',
    '6.67428e-11',
    '1E6',
    '.25',
    '.12345E+5',
  ])

  // negative
  assertScanF64s([
    '-1.0',
    '-0.',
    '-0.0',
    '-72.40',
    '-072.40',
    '-2.71828',
    '-1.e+0',
    '-6.67428e-11',
    '-1E6',
    '-.25',
    '-.12345E+5',
  ])

  // + sign (simply for compatibility with signed int syntax)
  assertScanF64s([
    '+1.0',
    '+0.',
    '+0.0',
    '+72.40',
    '+072.40',
    '+2.71828',
    '+1.e+0',
    '+6.67428e-11',
    '+1E6',
    '+.25',
    '+.12345E+5',
  ])

})

