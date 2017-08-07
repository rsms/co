import * as utf8 from './utf8'

export const
  MaxRune     = 0x10FFFF, // Maximum valid Unicode code point.
  MaxASCII    = 0x007F,   // maximum ASCII value.
  MaxLatin1   = 0x00FF,   // maximum Latin-1 value.
  InvalidChar = 0xFFFD    // Represents invalid code points.


const fmt4 = '0000'

export function repr(cp :int) :string {
  let s = cp.toString(16)
  if (cp <= 0xFFFF) {
    s = fmt4.substr(0, fmt4.length - s.length) + s
  }
  let str = JSON.stringify(utf8.encodeAsString(cp))
  str = str.substr(1, str.length-2)
  return `U+${s} '${str}'`
}

export function isLetter(cp :int) :bool {
  // TODO
  return false
}

export function isDigit(cp :int) :bool {
  // TODO
  return false
}
