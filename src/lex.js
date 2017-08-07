const fs     = require('fs')
const assert = require('assert')


const CP_EOF = 0xffffffff

function readCp(b, z, ctx) {
  if (ctx.offs == z) {
    return CP_EOF
  }
  const cp = b[ctx.offs++]
  return (
    cp < 0x80         ? cp :

    (cp >> 5) == 0x6  ? ((cp << 6) & 0x7ff) +
                        ((b[ctx.offs++]) & 0x3f) :

    (cp >> 4) == 0xe  ? ((cp << 12) & 0xffff) +
                        ((b[ctx.offs++] << 6) & 0xfff) +
                        ((b[ctx.offs++]) & 0x3f) :

    (cp >> 3) == 0x1e ? ((cp << 18) & 0x1fffff) +
                        ((b[ctx.offs++] << 12) & 0x3ffff) +
                        ((b[ctx.offs++] << 6) & 0xfff) +
                        (b[ctx.offs++] & 0x3f) :

    0
  )
}

function Utf8Reader(b) {
  const z = b.length
  return {
    length: b.length,
    // prevOffs: 0,
    offs: 0,

    readCp() {
      // this.prevOffs = this.offs
      return readCp(b, z, this)
    },

    // revert() {
    //   this.offs = this.prevOffs
    // }
  }
}

const TokEOF = Symbol('EOF')
const TokError = Symbol('Error')
const TokEq = Symbol('=')
const TokEqEq = Symbol('==')
const TokStrLit = Symbol('StrLit')
const TokOther = Symbol('Other')
const TokLine = Symbol('Line')
const TokWhitespace = Symbol('Whitespace')

function* lex(src) {
  // hello = "world"

  let startOffs = src.offs
  let cp = src.readCp()

  let nextStartOffs = src.offs
  let nextCp = src.readCp()

  const advance = () => {
    startOffs = nextStartOffs
    cp = nextCp
    nextStartOffs = src.offs
    nextCp = src.readCp()
  }

  const tok = (t, startOffs, byteLength) => {
    if (byteLength === undefined) {
      byteLength = nextStartOffs - startOffs
    }
    return { t, startOffs, byteLength }
  }

  const readStrLit = (endCp) => {
    // enters at char starts the literal, e.g. '"'
    while (true) {
      advance()
      switch (cp) {
        case 0x5C: // \
          advance() // read next unconditionally
          break
        case endCp:
          return true
        case CP_EOF:
        case 0:
          return false
        default:
          break
      }
    }
  }

  while (true) {
    switch (cp) {
      case 0:
        yield tok(TokError, startOffs)
        return

      case CP_EOF:
        yield tok(TokEOF, startOffs)
        return

      case 0x3D: // =
        if (nextCp == 0x3D) { // ==
          const so = startOffs
          advance()
          yield tok(TokEqEq, so)
        } else {
          yield tok(TokEq, startOffs)
        }
        break

      case 0xD: { // <CR>
        const so = startOffs
        if (nextCp == 0xA) { // <CR><LF>
          advance()
        }
        yield tok(TokLine, so)
        break
      }

      case 0xA: // <LF>
        yield tok(TokLine, startOffs)
        break

      case 0x20: // <SP>
      case 0x9: { // <TAB>
        const so = startOffs
        while (nextCp == 0x20 || nextCp == 0x09 || nextCp == 0x0A) {
          advance()
        }
        yield tok(TokWhitespace, so)
        break
      }

      case 0x22: { // "
        const so = startOffs
        if (!readStrLit(0x22)) {
          yield tok(TokError, so)
          return
        }
        yield tok(TokStrLit, so)
        break
      }

      default:
        // console.log('cp', cp.toString(16))
        yield tok(TokOther, startOffs)
        break
    }

    advance()
  }
}


const buf = fs.readFileSync('in.txt')
const src = Utf8Reader(buf)

for (let tok of lex(src)) {
  console.log('tok:', tok)
}
