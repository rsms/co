import { assertEq } from './test'
import { asciibuf } from './util'
import { Position, SrcFileSet } from './pos'
import { token, tokstr } from './token'
import * as scanner from './scanner'

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

export function dumpTokens(s :scanner.Scanner) {
  s.next()
  while (s.tok != token.EOF) {
    console.log(`>> ${tokstr(s.tok)}`)
    s.next()
  }
}

export function sourceScanner(srctext :string) :scanner.Scanner {
  let s = new scanner.Scanner()
  let fileSet = new SrcFileSet()
  let src = asciibuf(dedentMultiLineString(srctext))
  let file = fileSet.addFile('a', src.length)
  s.init(file, src, ReportErrors ? onScanError : null)
  return s
}

export function assertTokens(srctext :string, tokens :token[]) {
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

export function assertGotTok(s :scanner.Scanner, t :token) {
  s.next()
  assert(
    s.tok == t,
    `expected token.${token[t]} ` +
    `but got ${token[s.tok]} (${tokstr(s.tok)}) `+
    `at ${s.sfile.position(s.pos)}`,
    assertGotTok
  )
}

// ===========================================================================


TEST('basics', () => {
  assertTokens(`
    123  // implicit semicolon here
    // line comment
    bob; // explicit semicolon doesn't generate implicit semicolon
    /* multi-line
       comment
       ignored */
    ]  // implicit semicolon here
    `, [
    token.INT,      SEMIC,
    token.NAME,     SEMIC,
    token.RBRACKET, SEMIC,
  ])
})


TEST('char', () => {
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

  for (let [_, value] of samples) {
    assertGotTok(s, token.CHAR)
    assertEq(s.int32val, value)
    assertGotTok(s, SEMIC)
  }

  assertGotTok(s, token.EOF)
})


TEST('char/invalid', () => {
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
