export const
  UniError = 0xFFFD,   // the "error" Rune or "Unicode replacement character"
  UniSelf  = 0x80,     // characters below UniSelf are represented as
                       // themselves in a single byte.
  UTFMax   = 4         // Maximum number of bytes of a UTF8-encoded char

const
  maxCp        = 0x10FFFF, // Maximum valid Unicode code point.
  // Code points in the surrogate range are not valid for UTF-8.
  surrogateMin = 0xD800,
  surrogateMax = 0xDFFF,
  // rune1Max = 1<<8 - 1  // 0x80
  rune2Max = 1<<11 - 1 // 0x400
  // rune3Max = 1<<16 - 1  // 0x8000

export function decode(src :ArrayLike<byte>, offset :int) :[int, int] {
  const r = src[offset]

  if (r < UniSelf) {
    return [isNaN(r) ? UniError : r, 1]
  }

  const end = src.length

  if ((r >> 5) == 0x6) {
    return [
      offset + 2 > end ? UniError :
      ((r << 6) & 0x7ff) +
      ((src[++offset]) & 0x3f),
      2
    ]
  }


  if ((r >> 4) == 0xe) {
    return [
      offset + 3 > end ? UniError :
      ((r << 12) & 0xffff) +
      ((src[++offset] << 6) & 0xfff) +
      ((src[++offset]) & 0x3f),
      3
    ]
  }

  if ((r >> 3) == 0x1e) {
    return [
      offset + 4 > end ? UniError :
      ((r << 18) & 0x1fffff) +
      ((src[++offset] << 12) & 0x3ffff) +
      ((src[++offset] << 6) & 0xfff) +
       (src[++offset] & 0x3f),
      4
    ]
  }

  return [UniError, 0]
}

interface TextDecoderOptions {
  fatal?: boolean
  ignoreBOM?: boolean
}
interface TextDecodeOptions {
  stream?: boolean
}

declare class TextDecoder {
  constructor(utfLabel?: string, options?: TextDecoderOptions)
  encoding: string
  fatal: boolean
  ignoreBOM: boolean
  decode(input?: ArrayBufferView, options?: TextDecodeOptions): string
}


// declare class TextEncoder  {
//   constructor() // since Firefox 48 and Chrome 53, only supports utf-8
//   encoding :string // always "utf-8"
//   encode(input? :string, options? :TextEncodeOptions) :Uint8Array
// }

// interface TextEncodeOptions {
//   stream?: boolean
// }


export let decodeToString :(src :ArrayLike<byte>) => string

if (typeof TextDecoder != 'undefined') {
  const dec = new TextDecoder('utf-8')
  decodeToString = (src :ArrayLike<byte>) => {
    const bytes = (
      (src as any).buffer != undefined ? src as Uint8Array :
      new Uint8Array(src)
    )
    return dec.decode(bytes)
  }
} else if (typeof Buffer != 'undefined') {
  // nodejs
  decodeToString = (src :ArrayLike<byte>) => {
    let buf :Buffer
    if (src instanceof Buffer) {
      buf = src
    } else if (
      (src as any).buffer &&
      (src as any).byteOffset !== undefined &&
      (src as any).byteLength !== undefined
    ) {
      buf = Buffer.from(
        (src as any).buffer as ArrayBuffer,
        (src as any).byteOffset as int,
        (src as any).byteLength as int
      )
    } else {
      buf = Buffer.allocUnsafe(src.length)
      for (let i = 0; i < src.length; ++i) {
        buf[i] = src[i]
      }
    }
    return buf.toString('utf8')
  }
} else {
  // todo: fallback implementation
  panic('missing TextDecoder')
}


// encode writes into b (which must be large enough) the UTF-8 encoding
// of the character. Never writes more than UTFMax bytes.
// Returns the number of bytes written.
//
export function encode(b :Uint8Array, offs :int, cp :int) :int {
  if (cp < UniSelf) {
    b[offs] = cp
    return 1
  }
  if (cp < 0x800) {
    b[offs]   = (cp >> 6)   | 0xc0
    b[++offs] = (cp & 0x3f) | 0x80
    return 2
  }
  if (cp > maxCp || (surrogateMin <= cp && cp <= surrogateMax)) {
    // invalid codepoint
    cp = UniError
  }
  if (cp < 0x10000) {
    b[offs]   = (cp >> 12)         | 0xe0
    b[++offs] = ((cp >> 6) & 0x3f) | 0x80
    b[++offs] = (cp & 0x3f)        | 0x80
    return 3
  }
  b[offs]   = (cp >> 18)         | 0xf0
  b[++offs] = ((cp >> 12) & 0x3f)| 0x80
  b[++offs] = ((cp >> 6) & 0x3f) | 0x80
  b[++offs] = (cp & 0x3f)        | 0x80
  return 4
}

export function byteSize(cp :int) :int {
  return (
    (cp < 0x80) ? 1 :
    (cp < 0x800) ? 2 :
    (cp < 0x10000) ? 3 :
    4
  )
}

export function encodeToString(cp :int) :string {
  if (cp < 0 || cp > maxCp) {
    panic(`invalid unicode code point ${cp}`)
  }
  if (cp < 0x10000) {
    return String.fromCharCode(cp)
  }
  cp -= 0x10000
  return String.fromCharCode(
    (cp >> 10) + surrogateMin,
    (cp % rune2Max) + 0xDC00
  )
}
