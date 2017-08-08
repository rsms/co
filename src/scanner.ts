import { AppendBuffer, bufcmp, str8buf } from './util'
import { Pos, Position, File } from './pos'
import * as utf8 from './utf8'
import * as unicode from './unicode'
import { token, prec, lookupKeyword } from './token'
import * as Path from 'path'

// An ErrorHandler may be provided to Scanner.Init. If a syntax error is
// encountered and a handler was installed, the handler is called with a
// position and an error message. The position points to the beginning of
// the offending token.
//
export type ErrorHandler = (pos :Position, msg :string) => void

export enum Mode {
  None = 0,

  ScanComments = 1, // emit comments as tokens

  CopySource = 2,
    // copy slices of source data for tokens with literal values instead of
    // referencing the source buffer. This means slightly lower speed but
    // less memory usage since when scanning is done, the source code memory
    // can be reclaimed. If you plan to keep the source code around after
    // scanning (common case) you should leave this disabled.

  RawStrings = 4,
    // Don't convert escape sequences in string literals into UTF8 bytes.
}

const linePrefix = str8buf('//!line ')

// A Scanner holds the scanner's internal state while processing
// a given text. It can be allocated as part of another data
// structure but must be initialized via Init before use.
//
export class Scanner {
  // immutable state (only changed by init())
  // Note: `undefined as any as X` is a workaround for a TypeScript issue
  // where members are otherwise not initialized at construction which causes
  // duplicate struct definitions in v8.
  private file :File = undefined as any as File // source file handle
  private dir  :string = ''   // directory portion of file.name
  private src  :Uint8Array = undefined as any as Uint8Array // source
  private err  :ErrorHandler|null = null // error reporting
  private mode :Mode = 0         // scanning mode

  // scanning state
  private ch         :int = -1 // current character (unicode; -1=EOF)
  private offset     :int = 0  // character offset
  private rdOffset   :int = 0  // reading offset (position after current char)
  private lineOffset :int = 0  // current line offset
  private insertSemi :bool = false // insert a semicolon before next newline
  private cbraceL    :int = 0  // curly-brace level, for string interpolation
  private interpStrL :int = 0  // string interpolation level
  private byteval   :Uint8Array|null = null // value for some string tokens

  // public scanning state (read-only)
  public pos       :Pos = 0  // token start position
  public startoffs :int = 0  // token start offset
  public endoffs   :int = 0  // token end offset
  public tok       :token = token.EOF
  public intval    :int = 0 // value for some tokens
  public prec      :prec = prec.LOWEST // valid if tokIsOperator

  // sparse buffer state (not reset by s.init)
  // private sparsebuf  :Uint8Array|null = null // sparse buffer for small lits
  // private sparseoffs :int = 0 // write offset into sparsebuf
  private appendbuf  :AppendBuffer|null = null // for string literals

  // public state - ok to modify
  public errorCount :int = 0 // number of errors encountered

  // Init prepares the scanner s to tokenize the text src by setting the
  // scanner at the beginning of src. The scanner uses the file set file
  // for position information and it adds line information for each line.
  // It is ok to re-use the same file when re-scanning the same file as
  // line information which is already present is ignored. Init causes a
  // panic if the file size does not match the src size.
  //
  // Calls to Scan will invoke the error handler err if they encounter a
  // syntax error and err is not nil. Also, for each error encountered,
  // the Scanner field ErrorCount is incremented by one. The mode parameter
  // determines how comments are handled.
  //
  // Note that Init may call err if there is an error in the first character
  // of the file.
  //
  init(file :File, src :Uint8Array, err? :ErrorHandler, m :Mode =Mode.None) {
    const s = this
    // Explicitly initialize all fields since a scanner may be reused
    if (file.size != src.length) {
      panic(`file size (${file.size}) does not match src len (${src.length})`)
    }
    s.file = file
    s.dir = Path.dirname(file.name)
    s.src = src
    s.err = err || null
    s.mode = m
  
    s.ch = 0x20 /*' '*/
    s.tok = token.EOF
    s.offset = 0
    s.rdOffset = 0
    s.lineOffset = 0
    s.insertSemi = false
    s.errorCount = 0
  
    s.next()
  }

  // Read the next Unicode char into s.ch.
  // s.ch < 0 means end-of-file.
  next() {
    const s = this

    if (s.rdOffset < s.src.length) {
      s.offset = s.rdOffset
      
      if (s.ch == 0xA /*\n*/ ) {
        s.lineOffset = s.offset
        s.file.addLine(s.offset)
      }

      let w = 1, r = s.src[s.rdOffset]

      if (r >= 0x80) {
        // uncommon case: non-ASCII character
        [r, w] = utf8.decode(s.src, s.rdOffset)
        if (r == 0) {
          s.error('illegal NUL byte in input', s.offset)
        } else if (r == utf8.UniError) {
          s.error('invalid UTF-8 encoding', s.offset)
        }
      }

      s.rdOffset += w
      s.ch = r
    } else {
      s.offset = s.src.length
      if (s.ch == 0xA /*\n*/) {
        s.lineOffset = s.offset
        s.file.addLine(s.offset)
      }
      s.ch = -1 // eof
    }
  }

  currentPosition() :Position {
    const s = this
    return s.file.position(s.file.pos(s.offset))
  }

  // srcSlice returns a slice of s.src
  //
  // private srcSlice(
  //   startOffs :int = this.startoffs,
  //   endOffs :int = this.offset
  // ) :Uint8Array
  // {
  //   const s = this
  //   return (
  //     (this.mode & Mode.CopySource) ? this.src.slice(startOffs, endOffs) :
  //     this.src.subarray(startOffs, endOffs)
  //   )
  // }

  // byteValue returns a byte buffer representing the literal value of the
  // current token.
  // Note that this method returns a byte buffer that is potentially referenced
  // internally and which value might change next time s.scan is called. If you
  // plan to keep referencing the byte buffer, use s.takeByteValue instead.
  //
  byteValue() :Uint8Array {
    const s = this
    const end = s.endoffs == -1 ? s.offset : s.endoffs
    return s.byteval || s.src.subarray(s.startoffs, end)
  }

  // takeByteValue returns a new byte buffer that is not referenced by
  // the scanner. The buffer is still immutable.
  //
  takeByteValue() :Uint8Array {
    const s = this
    const b = s.byteValue()
    s.byteval = null
    return (this.mode & Mode.CopySource) ? b.slice() : b
  }

  // allocSparse ensures that s.sparsebuf has at least size available.
  // Returns the current write offset into sparsebuf.
  //
  // allocSparse(size :int) :Uint8Array {
  //   const s = this
  //   if (!s.sparsebuf || s.sparsebuf.length - s.sparseoffs < size) {
  //     s.sparsebuf = new Uint8Array(128)
  //     s.sparseoffs = 0
  //   }
  //   const offs = s.sparseoffs
  //   s.sparseoffs += size
  //   return s.sparsebuf.subarray(offs, s.sparseoffs)
  // }

  // Increment errorCount and call any error handler
  //
  error(msg :string, offs :int = this.startoffs) {
    const s = this
    if (s.err) {
      s.err(s.file.position(s.file.pos(offs)), msg)
    }
    s.errorCount++
  }

  // Scan the next token
  //
  scan() :token {
  while (true) {
    const s = this

    s.skipWhitespace()

    // current token start
    s.pos = s.file.pos(s.offset)
    s.startoffs = s.offset
    s.endoffs = -1
    s.byteval = null

    // always make progress
    const ch = s.ch
    s.next()

    switch (ch) {

      case -1: {
        s.tok = s.insertSemi ? token.SEMICOLON : token.EOF
        s.insertSemi = false
        break
      }

      case 0x30: case 0x31: case 0x32: case 0x33: case 0x34:
      case 0x35: case 0x36: case 0x37: case 0x38: case 0x39:
        // 0..9
        s.scanNumber(ch)
        break

      case 0xA: { // \n
        // we only reach here if s.insertSemi was set in the first place
        // and exited early from s.skipWhitespace().
        // newline consumed
        s.tok = token.SEMICOLON
        s.insertSemi = false
        break
      }

      case 0x22: // "
        s.scanString()
        break

      case 0x27: // '
        s.scanChar()
        break

      case 0x3a: // :
        s.tok = s.switch2(token.COLON, token.DEFINE)
        s.prec = prec.LOWEST
        s.insertSemi = false
        break

      case 0x2e: { // .
        if (unicode.isDigit(s.ch)) {
          s.scanFloatNumber(/*seenDecimal*/true)
        } else {
          if (s.ch == 0x2e) { // .
            s.next()
            if (s.ch == 0x2e) {
              s.next()
              s.tok = token.ELLIPSIS
            } else {
              s.tok = token.PERIOD2
            }
          } else {
            s.tok = token.PERIOD
          }
          s.insertSemi = false
        }
        break
      }

      case 0x40: // @
        s.scanIdentifier()
        s.tok = token.IDENTAT
        s.startoffs++ // skip @
        s.insertSemi = true
        break

      case 0x2c: // ,
        s.tok = token.COMMA
        s.insertSemi = false
        break
      case 0x3b: // ;
        s.tok = token.SEMICOLON
        s.insertSemi = false
        break

      case 0x28: // (
        s.tok = token.LPAREN
        s.insertSemi = false
        break
      case 0x29: // )
        s.tok = token.RPAREN
        s.insertSemi = true
        break

      case 0x5b: // [
        s.tok = token.LBRACK
        s.insertSemi = false
        break
      case 0x5d: // ]
        s.tok = token.RBRACK
        s.insertSemi = true
        break

      case 0x7b: // {
        if (s.interpStrL) {
          s.cbraceL++
        }
        s.tok = token.LBRACE
        s.insertSemi = false
        break
      case 0x7d: // }
        if (s.interpStrL) {
          if (s.cbraceL == 0) {
            // continue interpolated string
            s.interpStrL--
            s.scanString()
          } else {
            s.cbraceL--
          }
        } else {
          s.tok = token.RBRACE
          s.insertSemi = true
        }
        break

      case 0x2b: { // +
        s.tok = s.switch3(token.ADD, token.ADD_ASSIGN, ch, token.INC)
        s.insertSemi = (s.tok == token.INC)
        break
      }

      case 0x2d: { // -
        if (s.ch == 0x3e) { // >
          s.next()
          s.tok = token.ARROWR
          s.insertSemi = false
        } else {
          s.tok = s.switch3(token.SUB, token.SUB_ASSIGN, ch, token.DEC)
          s.insertSemi = (s.tok == token.DEC)
        }
        break
      }

      case 0x2a: // *
        s.tok = s.switch2(token.MUL, token.MUL_ASSIGN)
        s.insertSemi = false
        break

      case 0x2f: { // /
        if (s.ch == 0x2f) { // /
          s.scanLineComment()
          if (!(s.mode & Mode.ScanComments)) {
            continue
          }
          // note: intentionally not changing s.insertSemi
        } else if (s.ch == 0x2a) { // *
          const CRcount = s.scanGeneralComment()
          if (s.mode & Mode.ScanComments) {
            s.tok = token.COMMENT
            if (CRcount) {
              // strip CR characters from comment
              const v = s.src.subarray(
                s.startoffs,
                s.endoffs == -1 ? s.offset : s.endoffs
              )
              s.byteval = stripByte(v, 0xD, CRcount) // copy; no mutation
            }
          } else {
            continue
          }
          // note: intentionally not changing s.insertSemi
        } else {
          s.tok = s.switch2(token.QUO, token.QUO_ASSIGN)
          s.insertSemi = false
        }
        break
      }

      case 0x25: // %
        s.tok = s.switch2(token.REM, token.REM_ASSIGN)
        s.insertSemi = false
        break

      case 0x5e: // ^
        s.tok = s.switch2(token.XOR, token.XOR_ASSIGN)
        s.insertSemi = false
        break

      case 0x3c: { // <
        if (s.ch == 0x2d) { // -
          s.next()
          s.tok = token.ARROWL
        } else {
          s.tok = s.switch4(token.LSS, token.LEQ, ch, token.SHL, token.SHL_ASSIGN)
        }
        s.insertSemi = false
        break
      }

      case 0x3e: // >
        s.tok = s.switch4(token.GTR, token.GEQ, ch, token.SHR, token.SHR_ASSIGN)
        s.insertSemi = false
        break
      
      case 0x3d: // =
        s.tok = s.switch2(token.ASSIGN, token.EQL)
        s.insertSemi = false
        break

      case 0x21: // !
        s.tok = s.switch2(token.NOT, token.NEQ)
        s.insertSemi = false
        break

      case 0x26: { // &
        if (s.ch == 0x5e) { // ^
          s.next()
          s.tok = s.switch2(token.AND_NOT, token.AND_NOT_ASSIGN)
        } else {
          s.tok = s.switch3(token.AND, token.AND_ASSIGN, ch, token.LAND)
        }
        s.insertSemi = false
        break
      }

      case 0x7c: // |
        s.tok = s.switch3(token.OR, token.OR_ASSIGN, ch, token.LOR)
        s.insertSemi = false
        break

      default: {
        if (isIdentStart(ch)) { // $
          s.scanIdentifier()

          if (s.offset - s.startoffs > 1) {
            // shortest keyword is 2
            switch (s.tok = lookupKeyword(s.byteValue())) {
              case token.IDENT:
              case token.BREAK:
              case token.CONTINUE:
              case token.FALLTHROUGH:
              case token.RETURN:
                s.insertSemi = true
                break

              default:
                s.insertSemi = false
                break
            }
          } else {
            s.tok = token.IDENT
            s.insertSemi = true
          }
        } else {
          s.error('unexpected character in input')
          s.tok = token.ILLEGAL
        }
      }

    } // switch (ch)

    if (s.endoffs == -1) {
      s.endoffs = s.offset
    }

    return s.tok

    } // while(true)
  }

  scanIdentifier() {
    const s = this
    while (isIdentStart(s.ch) || unicode.isDigit(s.ch)) {
      s.next()
    }
  }

  scanChar() {
    const s = this
    let cp = -1
    s.tok = token.CHAR

    switch (s.ch) {
      case -1: case 0xA: { // EOF | \n
        s.error("unterminated character literal")
        s.tok = token.ILLEGAL
        return
      }
      case 0x27: { // '
        s.error("empty character literal or unescaped ' in character literal")
        s.next()
        s.insertSemi = true
        s.intval = unicode.InvalidChar
        return
      }
      case 0x5c: { // \
        s.next()
        cp = s.scanEscape(0x27) // '
        // note: cp is -1 for illegal escape sequences
        break
      }
      default: {
        cp = s.ch
        s.next()
        break
      }
    }


    if (s.ch == 0x27) { // '
      s.next()
      s.insertSemi = true
      s.intval = cp
    } else {
      // failed -- read until EOF or '
      s.insertSemi = false
      while (true) {
        if (s.ch == -1) {
          break
        }
        if (s.ch == 0x27) { // '
          s.insertSemi = true
          s.next() // consume '
          break
        }
        s.next()
      }
      s.intval = unicode.InvalidChar
      s.error("invalid character literal")
    }
  }

  resetAppendBuf() :AppendBuffer {
    const s = this
    if (s.appendbuf) {
      s.appendbuf.reset()
    } else {
      // we need to buffer the value since it's not a 1:1 literal
      s.appendbuf = new AppendBuffer(64)
    }
    return s.appendbuf
  }

  scanString() {
    // opening char already consumed
    const s = this
    let buf :AppendBuffer|null = null
    s.startoffs++ // skip initial "
    let chunkStart = s.startoffs

    loop1:
    while (true) {
      switch (s.ch) {
        // case 0xA: // \n
        case -1:
          s.error("string literal not terminated")
          if (buf) {
            buf = null
          }
          break loop1

        case 0x22: // "
          if (buf) {
            buf.appendRange(s.src, chunkStart, s.offset)
          }
          s.next()
          break loop1

        case 0x5c: { // \
          // we need to buffer the value since it's not a 1:1 literal
          if (!buf) {
            buf = s.resetAppendBuf()
          }
          buf.appendRange(s.src, chunkStart, s.offset)

          s.next()

          const cp = s.scanEscape(0x22) // "
          // we continue even if there was an error

          if (cp >= 0) {
            // Write unicode code point as UTF8 to value buffer
            if (cp < utf8.UniSelf) {
              buf.append(cp)
            } else {
              buf.reserve(utf8.UTFMax)
              buf.length += utf8.encode(buf.buffer, buf.length, cp)
            }
          }

          chunkStart = s.offset
          break
        }

        case 0x24: { // $
          s.next()
          if (s.ch as int == 0x7b) { // {
            // start interpolated string
            s.next()
            s.interpStrL++
            s.tok = token.STRING_PIECE
            s.insertSemi = false
            if (buf) {
              s.byteval = buf.subarray()
            } else {
              s.endoffs = s.offset - 2
            }
          }
          return
        }

        default:
          s.next()
      }
    }

    s.tok = token.STRING
    s.insertSemi = true
    if (buf) {
      s.byteval = buf.subarray()
    } else {
      s.endoffs = s.offset - 1
    }
  }

  // scanEscape parses an escape sequence where `quote` is the accepted
  // escaped character. In case of a syntax error, it stops at the offending
  // character (without consuming it) and returns -1. Otherwise
  // it returns the unicode codepoint.
  //
  scanEscape(quote :int) :int {
    const s = this

    let n :int = 0
    let base :int = 0
    let max :int = 0

    switch (s.ch) {
      case 0x61:  s.next(); return 0x7  // a - alert or bell
      case 0x62:  s.next(); return 0x8  // b - backspace
      case 0x66:  s.next(); return 0xC  // f - form feed
      case 0x6e:  s.next(); return 0xA  // n - line feed or newline
      case 0x72:  s.next(); return 0xD  // r - carriage return
      case 0x74:  s.next(); return 0x9  // t - horizontal tab
      case 0x76:  s.next(); return 0xb  // v - vertical tab
      case 0x5c:  s.next(); return 0x5c // \
      case 0x24:  s.next(); return 0x24 // $
      case quote: s.next(); return quote

      case 0x30: case 0x31: case 0x32: case 0x33: case 0x34:
      case 0x35: case 0x36: case 0x37: // 0..7
        n = 3; base = 8; max = 255
        break
      case 0x78: // x
        s.next()
        n = 2; base = 16; max = 255
        break
      case 0x75: // u
        s.next()
        n = 4; base = 16; max = unicode.MaxRune
        break
      case 0x55: // U
        s.next()
        n = 8; base = 16; max = unicode.MaxRune
        break

      default: {
        let msg = "unknown escape sequence"
        if (s.ch < 0) {
          msg = "escape sequence not terminated"
        }
        s.error(msg)
        return -1
      }
    }

    let cp :int = 0
    while (n > 0) {
      let d = digitVal(s.ch) // returns a large value for non-digit chars
      if (d >= base) {
        let msg = (
          (s.ch == quote) ? "escape sequence incomplete" :
          (s.ch < 0) ? "escape sequence not terminated" :
            `illegal character ${unicode.repr(s.ch)} in escape sequence`
        )
        s.error(msg, s.offset)
        return -1
      }
      cp = cp * base + d
      s.next()
      n--
    }

    if (cp > max || 0xD800 <= cp && cp < 0xE000) /* surrogate range */ {
      s.error("escape sequence is invalid Unicode code point")
      return -1
    }

    return cp
  }

  scanNumber(c :int) {
    let s = this
    s.insertSemi = true

    if (c == 0x30) { // 0
      switch (s.ch) {

        case 0x78: case 0x58: { // x, X
          s.tok = token.INT_HEX
          s.next()
          while (unicode.isHexDigit(s.ch)) {
            s.next()
          }
          if (s.offset - s.startoffs <= 2 || unicode.isLetter(s.ch)) {
            // only scanned "0x" or "0X" OR e.g. 0xfg
            while (unicode.isLetter(s.ch) || unicode.isDigit(s.ch)) {
              s.next() // consume invalid letters & digits
            }
            s.error("invalid hex number")
          }
          return
        }

        case 0x6F: case 0x4F: // o, O
          s.tok = token.INT_OCT
          return s.scanRadixInt8(8)

        case 0x62: case 0x42: // b, B
          s.tok = token.INT_BIN
          return s.scanRadixInt8(2)

        case 0x2e: case 0x65: case 0x45:  // . e E
          return s.scanFloatNumber(/*seenDecimal*/false)

        case 0x2f:  // /
          if (s.scanRatioNumber()) {
            // i.e. 0/N
            s.error("invalid zero ratio")
            return
          }
          break
      }
    }

    while (unicode.isDigit(s.ch)) {
      s.next()
    }
    s.tok = token.INT

    switch (s.ch) {
      case 0x2e: case 0x65: case 0x45:  // . e E
        s.scanFloatNumber(/*seenDecimal*/false)
        break

      case 0x2f:  // /
        s.scanRatioNumber()
        break
    }
  }

  scanRadixInt8(base :int) {
    // invariant: base = 8 | 2
    const s = this
    s.next()
    let isInvalid = false
    while (unicode.isDigit(s.ch)) {
      if (s.ch - 0x30 >= base) {
        // e.g. 0o678
        isInvalid = true
      }
      s.next()
    }
    if (isInvalid || s.offset - s.startoffs <= 2) {
      // isInvalid OR only scanned "0x"
      s.error(`invalid ${base == 8 ? "octal" : "binary"} number`)
    }
  }

  scanRatioNumber() :bool {
    // ratio_lit = decimals "/" decimals
    const s = this
    const startoffs = s.offset
    s.next() // consume /
    while (unicode.isDigit(s.ch)) {
      s.next()
    }
    if (startoffs+1 == s.offset) {
      // e.g. 43/* 43/= etc -- restore state
      s.ch = 0x2f // /
      s.offset = startoffs
      s.rdOffset = s.offset + 1
      return false
    }
    if (isIdentStart(s.ch) || s.ch == 0x2e) { // .
      s.error("invalid ratio")
    }
    s.tok = token.RATIO
    return true
  }

  scanFloatNumber(seenDecimal :bool) {
    // float_lit = decimals "." [ decimals ] [ exponent ] |
    //             decimals exponent |
    //             "." decimals [ exponent ] .
    // decimals  = decimal_digit { decimal_digit } .
    // exponent  = ( "e" | "E" ) [ "+" | "-" ] decimals .
    const s = this

    if (seenDecimal || s.ch == 0x2e) { // .
      s.next()
      while (unicode.isDigit(s.ch)) {
        s.next()
      }
    }

    if (s.ch == 0x65 || s.ch == 0x45) { // e E
      s.next()
      if ((s.ch as int) == 0x2d || (s.ch as int) == 0x2b) { // - +
        s.next()
      }
      let valid = false
      while (unicode.isDigit(s.ch)) {
        valid = true
        s.next()
      }
      if (!valid) {
        s.error("invalid floating-point exponent")
      }
    }

    s.tok = token.FLOAT
    s.insertSemi = true
  }

  skipWhitespace() {
    const s = this
    while (true) {
      switch (s.ch) {
        case 0x20: // SP
        case 0x9:  // \t
        case 0xD:  // \r
          break
        case 0xA:  // \n
          if (s.insertSemi) {
            return
          }
          break
        default:
          if (s.ch < utf8.UniSelf || !unicode.isWhitespace(s.ch)) {
            return
          }
          break
      }
      s.next()
    }
  }

  switch2(tok0 :token, tok1 :token) :token {
    const s = this
    if (s.ch == 0x3D) { // =
      s.next()
      return tok1
    }
    return tok0
  }

  switch3(tok0 :token, tok1 :token, ch2 :int, tok2 :token) :token {
    const s = this
    if (s.ch == 0x3D) { // =
      s.next()
      return tok1
    } else if (s.ch == ch2) {
      s.next()
      return tok2
    }
    return tok0
  }

  switch4(tok0 :token, tok1 :token, ch2 :int, tok2 :token, tok3 :token) :token {
    const s = this
    if (s.ch == 0x3D) { // =
      s.next()
      return tok1
    } else if (s.ch == ch2) {
      s.next()
      if (s.ch == 0x3D) { // =
        s.next()
        return tok3
      } else {
        return tok2
      }
    }
    return tok0
  }

  scanLineComment() {
    const s = this
    // initial '/' already consumed; s.ch == '/'
    do { s.next() } while (s.ch != 0xA && s.ch >= 0)

    if (s.src[s.offset-1] == 0xD) { // \r
      // don't include \r in comment
      s.endoffs = s.offset - 1
    }

    if (s.startoffs == s.lineOffset && s.src[s.startoffs + 2] == 0x21) { // !
      // comment pragma, e.g. //!foo
      s.interpretCommentPragma()
    }

    s.startoffs += 2 // skip //
    s.tok = token.COMMENT
  }

  scanGeneralComment() :int /* CR count */ {
    // initial '/' already consumed; s.ch == '*'
    const s = this
    let CR_count = 0

    while (true) {
      s.next()
      switch (s.ch) {
        case -1: // EOF
          s.error("comment not terminated")
          return CR_count
        case 0x2f: // /
          if (s.src[s.offset-1] == 0x2a) { // *
            s.next()
            s.startoffs += 2
            s.endoffs = s.offset - 2
            return CR_count
          }
          break
        case 0xD: // \r
          ++CR_count
          break
        default:
          break
      }
    }
  }

  findCommentLineEnd() :bool {
    // initial '/' already consumed; s.ch == '*'
    const s = this
    
    // save state
    const enterOffset = s.offset

    while (true) {
      const ch = s.ch
      s.next()
      switch (ch) {
        case -1: // EOF
        case 0xA: // \n
          return true
        case 0x2a: // *
          if (s.ch == 0x2f) { // /
            // restore state
            s.ch = 0x2a
            s.offset = enterOffset
            s.rdOffset = s.offset + 1
            return false
          }
          break
        default:
          break
      }
    }
  }
  
  interpretCommentPragma() {
    const s = this
    const offs = s.startoffs
    if ( s.offset - offs > linePrefix.length &&
         bufcmp(s.src, linePrefix, offs, offs + linePrefix.length) == 0
    ) {
      // get filename and line number, if any
      // e.g. "//!line file name:line"
      let text = utf8.decodeToString(
        s.src.subarray(offs + linePrefix.length, s.offset)
      )
      /// --- here--- the above doesnt work on uintarray.
      // we need to decode src to a js string
      let i = text.lastIndexOf(':')
      if (i > 0) {
        let line = parseInt(text.substr(i+1))
        if (!isNaN(line) && line > 0) {
          // valid //!line filename:line comment
          let filename = text.substr(0, i).trim()
          if (filename) {
            filename = Path.normalize(filename)
            if (!Path.isAbsolute(filename)) {
              // make filename relative to current directory
              filename = Path.join(s.dir, filename)
            }
          }
          // update scanner position
          s.file.addLineInfo(s.offset + 1, filename, line)
            // +1 since comment applies to next line
        }
      }
    }
  }

  findLineEnd() :bool {
    // initial '/' already consumed; enters with s.ch == '*'
    const s = this
  
    // read ahead until a newline, EOF, or non-comment token is found
    while (s.ch == 0x2f || s.ch == 0x2a) { // / *
      if (s.ch == 0x2f) { // /
        //-style comment always contains a newline
        return true
      }

      /*-style comment: look for newline */
      s.next()
      while (s.ch >= 0) {
        const ch = s.ch as int
        if (ch == 0xA) { // \n
          return true
        }
        s.next()
        if (ch == 0x2a && s.ch as int == 0x2f) { // */
          s.next()
          break
        }
      }

      s.skipWhitespace() // s.insertSemi is set

      if (s.ch < 0 || s.ch as int == 0xA) { // \n
        return true
      }

      if (s.ch as int != 0x2f) { // /
        // non-comment token
        return false
      }

      s.next() // consume '/'
    }
  
    return false
  }

}

function isIdentStart(cp :int) :bool {
  return (
    (0x61 <= cp && cp <= 0x7A) || // a..z
    (0x41 <= cp && cp <= 0x5A) || // A..Z
    cp == 0x5F || // _
    cp == 0x24 || // $
    cp >= utf8.UniSelf && unicode.isLetter(cp)
  )
}

function digitVal(ch :int) :int {
  return (
    0x30 <= ch && ch <= 0x39 ? ch - 0x30 :      // 0..9
    0x61 <= ch && ch <= 0x66 ? ch - 0x61 + 10 : // a..f
    0x41 <= ch && ch <= 0x46 ? ch - 0x41 + 10 : // A..F
    16 // larger than any legal digit val
  )
}


function stripByte(v :Uint8Array, b :byte, countHint :int = 0) :Uint8Array {
  const c = new Uint8Array(v.length - countHint)
  let i = 0
  for (let x = 0, L = v.length; x < L; ++x) {
    const _b = v[x]
    if (_b != b) { // \r
      c[i++] = _b
    }
  }
  return i < c.length ? c.subarray(0, i) : c
}
