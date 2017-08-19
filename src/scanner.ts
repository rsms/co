import { AppendBuffer, bufcmp, str8buf } from './util'
import { Pos, Position, File } from './pos'
import * as utf8 from './utf8'
import * as unicode from './unicode'
import { token, lookupKeyword, prec } from './token'
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
}

const linePrefix = str8buf('//!line ')

// A Scanner holds the scanner's internal state while processing a given text.
// It must be initialized via init before use or resue.
//
export class Scanner {
  // immutable state (only changed by init())
  // Note: `undefined as any as X` is a workaround for a TypeScript issue
  // where members are otherwise not initialized at construction which causes
  // duplicate struct definitions in v8.
  public file :File = undefined as any as File // source file handle
  public dir  :string = ''   // directory portion of file.name
  public src  :Uint8Array = undefined as any as Uint8Array // source
  public errh :ErrorHandler|null = null // error reporting
  public mode :Mode = 0         // scanning mode

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
  public prec      :prec = prec.LOWEST
  public intval    :int = 0 // value for some tokens
  public hash      :int = 0 // hash value for current token (if NAME*)

  // sparse buffer state (not reset by s.init)
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
  // Calls to Scan will invoke the error handler errh if they encounter a
  // syntax error and errh is not nil. Also, for each error encountered,
  // the Scanner field ErrorCount is incremented by one. The mode parameter
  // determines how comments are handled.
  //
  // Note that Init may call errh if there is an error in the first character
  // of the file.
  //
  init(file :File, src :Uint8Array, errh? :ErrorHandler|null, m :Mode =Mode.None) {
    const s = this
    // Explicitly initialize all fields since a scanner may be reused
    if (file.size != src.length) {
      panic(`file size (${file.size}) does not match src len (${src.length})`)
    }
    s.file = file
    s.dir = Path.dirname(file.name)
    s.src = src
    s.errh = errh || null
    s.mode = m
  
    s.ch = 0x20 /*' '*/
    s.tok = token.EOF
    s.offset = 0
    s.rdOffset = 0
    s.lineOffset = 0
    s.insertSemi = false
    s.errorCount = 0
  
    s.readchar()
  }

  // Read the next Unicode char into s.ch.
  // s.ch < 0 means end-of-file.
  private readchar() {
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
        } else if (w == 0 && r == utf8.UniError) {
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

  // gotchar reads the next character and returns true if s.ch == ch
  private gotchar(ch :int) :bool {
    const s = this
    if (s.ch == ch) {
      s.readchar()
      return true
    }
    return false
  }

  currentPosition() :Position {
    const s = this
    return s.file.position(s.file.pos(s.offset))
  }

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

  // Increment errorCount and call any error handler
  //
  error(msg :string, offs :int = this.startoffs) {
    const s = this
    s.errorAt(s.file.position(s.file.pos(offs)), msg)
  }

  errorAt(position :Position, msg :string) {
    const s = this
    if (s.errh) {
      s.errh(position, msg)
    }
    s.errorCount++
  }

  // Scan the next token
  //
  next() {
  while (true) {
    const s = this

    // skip whitespace
    while (
      s.ch == 0x20 ||
      s.ch == 0x9 ||
      (s.ch == 0xA && !s.insertSemi) ||
      s.ch == 0xD
    ) {
      s.readchar()
    }

    // current token start
    s.pos = s.file.pos(s.offset)
    s.startoffs = s.offset
    s.endoffs = -1
    s.byteval = null

    // always make progress
    const ch = s.ch
    s.readchar()

    let insertSemi = false

    switch (ch) {

      case -1: {
        s.tok = s.insertSemi ? token.SEMICOLON : token.EOF
        break
      }

      case 0x30: case 0x31: case 0x32: case 0x33: case 0x34:
      case 0x35: case 0x36: case 0x37: case 0x38: case 0x39:
        // 0..9
        s.scanNumber(ch)
        insertSemi = true
        break

      case 0xA: { // \n
        // we only reach here if s.insertSemi was set in the first place
        // and exited early from skipping whitespace.
        // newline consumed
        s.tok = token.SEMICOLON
        break
      }

      case 0x22: // "
        s.tok = s.scanString()
        insertSemi = s.tok != token.STRING_PIECE
        break

      case 0x27: // '
        s.scanChar()
        insertSemi = true
        break

      case 0x3a: // :
        if (s.gotchar(0x3D)) {
          s.tok = token.DEFINE
          s.prec = prec.LOWEST
        } else {
          s.tok = token.COLON
        }
        break

      case 0x2e: { // .
        if (isDigit(s.ch)) {
          s.scanFloatNumber(/*seenDecimal*/true)
          insertSemi = true
        } else {
          if (s.gotchar(0x2e)) { // ..
            if (s.gotchar(0x2e)) { // ...
              s.tok = token.ELLIPSIS
            } else {
              s.tok = token.PERIODS
            }
          } else {
            s.tok = token.DOT
          }
        }
        break
      }

      case 0x40: { // @
        s.startoffs++ // skip @
        let c = s.ch
        if (c < utf8.UniSelf && (asciiFeats[c] & langIdentStart)) {
          s.readchar()
          s.scanIdentifier(c)
        } else if (c >= utf8.UniSelf && isUniIdentStart(c)) {
          s.readchar()
          s.scanIdentifierU(c, this.startoffs)
        }
        s.tok = token.NAMEAT
        insertSemi = true
        break
      }

      case 0x2c: // ,
        s.tok = token.COMMA
        break
      case 0x3b: // ;
        s.tok = token.SEMICOLON
        break

      case 0x28: // (
        s.tok = token.LPAREN
        break
      case 0x29: // )
        s.tok = token.RPAREN
        insertSemi = true
        break

      case 0x5b: // [
        s.tok = token.LBRACK
        break
      case 0x5d: // ]
        s.tok = token.RBRACK
        insertSemi = true
        break

      case 0x7b: // {
        if (s.interpStrL) {
          s.cbraceL++
        }
        s.tok = token.LBRACE
        break
      case 0x7d: // }
        if (s.interpStrL) {
          if (s.cbraceL == 0) {
            // continue interpolated string
            s.interpStrL--
            s.tok = s.scanString()
            insertSemi = s.tok != token.STRING_PIECE
          } else {
            s.cbraceL--
          }
        } else {
          s.tok = token.RBRACE
          insertSemi = true
        }
        break

      case 0x2b: { // +
        s.prec = prec.LOWEST
        if (s.gotchar(0x3D)) { // +=
          s.tok = token.ADD_ASSIGN
        } else if (s.gotchar(ch)) { // ++
          s.tok = token.INC
          insertSemi = true
        } else {
          s.tok = token.ADD
          s.prec = prec.ADD
        }
        break
      }

      case 0x2d: { // -
        s.prec = prec.LOWEST
        if (s.gotchar(0x3e)) { // ->
          s.tok = token.ARROWR
        } else {
          if (s.gotchar(0x3D)) { // -=
            s.tok = token.SUB_ASSIGN
          } else if (s.gotchar(ch)) { // --
            s.tok = token.DEC
            insertSemi = true
          } else {
            s.tok = token.SUB
            s.prec = prec.ADD
          }
        }
        break
      }

      case 0x2a: // *
        if (s.gotchar(0x3D)) { // *=
          s.tok = token.MUL_ASSIGN
          s.prec = prec.LOWEST
        } else {
          s.tok = token.MUL
          s.prec = prec.MUL
        }
        break

      case 0x2f: { // /
        if (s.ch == 0x2f) { // //
          s.scanLineComment()
          if (!(s.mode & Mode.ScanComments)) {
            continue
          }
          insertSemi = s.insertSemi // persist s.insertSemi
        } else if (s.ch == 0x2a) { // /*
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
          insertSemi = s.insertSemi // persist s.insertSemi
        } else {
          if (s.gotchar(0x3D)) { // /=
            s.tok = token.QUO_ASSIGN
            s.prec = prec.LOWEST
          } else {
            s.tok = token.QUO
            s.prec = prec.MUL
          }
        }
        break
      }

      case 0x25: // %
        if (s.gotchar(0x3D)) { // %=
          s.tok = token.REM_ASSIGN
          s.prec = prec.LOWEST
        } else {
          s.tok = token.REM
          s.prec = prec.MUL
        }
        break

      case 0x5e: // ^
        if (s.gotchar(0x3D)) { // ^=
          s.tok = token.XOR_ASSIGN
          s.prec = prec.LOWEST
        } else {
          s.tok = token.XOR
          s.prec = prec.ADD
        }
        break

      case 0x3c: { // <
        if (s.gotchar(0x2D)) { // <-
          s.tok = token.ARROWL
          s.prec = prec.LOWEST
        } else if (s.gotchar(0x3D)) { // <=
          s.tok = token.LEQ
          s.prec = prec.CMP
        } else if (s.gotchar(ch)) { // <<
          if (s.gotchar(0x3D)) { // <<=
            s.tok = token.SHL_ASSIGN
            s.prec = prec.LOWEST
          } else {
            s.tok = token.SHL
            s.prec = prec.MUL
          }
        } else {
          s.tok = token.LSS
          s.prec = prec.CMP
        }
        break
      }

      case 0x3E: // >
        if (s.gotchar(0x3D)) { // >=
          s.tok = token.GEQ
          s.prec = prec.CMP
        } else if (s.gotchar(ch)) { // >>
          if (s.gotchar(0x3D)) { // >>=
            s.tok = token.SHR_ASSIGN
            s.prec = prec.LOWEST
          } else {
            s.tok = token.SHR
            s.prec = prec.MUL
          }
        } else {
          s.tok = token.GTR
          s.prec = prec.CMP
        }
        break
      
      case 0x3D: // =
        if (s.gotchar(0x3D)) { // ==
          s.tok = token.EQL
          s.prec = prec.CMP
        } else {
          s.tok = token.ASSIGN
          s.prec = prec.LOWEST
        }
        break

      case 0x21: // !
        if (s.gotchar(0x3D)) { // !=
          s.tok = token.NEQ
          s.prec = prec.CMP
        } else {
          s.tok = token.NOT
          s.prec = prec.LOWEST
        }
        break

      case 0x26: { // &
        if (s.gotchar(0x5E)) { // &^
          if (s.gotchar(0x3D)) { // &^=
            s.tok = token.AND_NOT_ASSIGN
            s.prec = prec.LOWEST
          } else {
            s.tok = token.AND_NOT
            s.prec = prec.MUL
          }
        } else if (s.gotchar(0x3D)) { // &=
          s.tok = token.AND_ASSIGN
          s.prec = prec.LOWEST
        } else if (s.gotchar(ch)) { // &&
          s.tok = token.LAND
          s.prec = prec.AND
        } else {
          s.tok = token.AND
          s.prec = prec.MUL
        }
        break
      }

      case 0x7c: // |
        if (s.gotchar(0x3D)) { // |=
          s.tok = token.OR_ASSIGN
          s.prec = prec.LOWEST
        } else if (s.gotchar(ch)) { // ||
          s.tok = token.LOR
          s.prec = prec.OR
        } else {
          s.tok = token.OR
          s.prec = prec.ADD
        }
        break

      default: {
        if (
          (ch < utf8.UniSelf && (asciiFeats[ch] & langIdentStart)) ||
          (ch >= utf8.UniSelf && isUniIdentStart(ch))
        ) {
          if (ch < utf8.UniSelf) {
            s.scanIdentifier(ch)
          } else {
            s.scanIdentifierU(ch, this.startoffs)
          }

          if (s.offset - s.startoffs > 1) {
            // shortest keyword is 2
            switch (s.tok = lookupKeyword(s.byteValue())) {
              case token.NAME:
              case token.BREAK:
              case token.CONTINUE:
              case token.FALLTHROUGH:
              case token.RETURN:
                insertSemi = true
                break
            }
          } else {
            s.tok = token.NAME
            insertSemi = true
          }
        } else {
          s.error(`unexpected character ${unicode.repr(ch)} in input`)
          s.tok = token.ILLEGAL
        }
        break
      }

    } // switch (ch)

    if (s.endoffs == -1) {
      s.endoffs = s.offset
    }

    s.insertSemi = insertSemi

    return

    } // while(true)
  }


  scanIdentifierU(c :int, hashOffs :int, hash :int = 0x811c9dc5) {
    // Scan identifier with non-ASCII characters.
    // c is already verified to be a valid indentifier character.
    // Hash is calculated as a second pass at the end.
    const s = this
    const ZeroWidthJoiner = 0x200D
    let lastCp = c
    c = s.ch

    while (
      isUniIdentCont(c) ||
      unicode.isEmojiModifier(c) ||
      unicode.isEmojiModifierBase(c) ||
      c == ZeroWidthJoiner
    ) {
      lastCp = c
      s.readchar()
      c = s.ch
    }

    if (lastCp == ZeroWidthJoiner) {
      s.error(`illegal zero width-joiner character at end of identifer`)
      s.tok = token.ILLEGAL
      return
    }

    // computing rest of hash
    for (let i = hashOffs; i < s.offset; ++i) {
      hash = (hash ^ s.src[i]) * 0x1000193 // fnv1a
    }
    s.hash = hash >>> 0
  }


  scanIdentifier(c :int) {
    // enters past first char; c = 1st char, s.ch = 2nd char
    // c is already verified to be a valid indentifier character.
    // The hash function used here must exactly match what's in bytestr.
    const s = this
    let hash = (0x811c9dc5 ^ c) * 0x1000193 // fnv1a

    c = s.ch
    while (
      isLetter(c) ||
      isDigit(c) ||
      c == 0x5F || // _
      c == 0x24    // $
    ) {
      hash = (hash ^ c) * 0x1000193 // fnv1a
      s.readchar()
      c = s.ch
    }

    if (c >= utf8.UniSelf && isUniIdentCont(c)) {
      return s.scanIdentifierU(c, hash, s.offset)
    }

    s.hash = hash >>> 0
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
        s.readchar()
        s.intval = unicode.InvalidChar
        return
      }
      case 0x5c: { // \
        s.readchar()
        cp = s.scanEscape(0x27) // '
        // note: cp is -1 for illegal escape sequences
        break
      }
      default: {
        cp = s.ch
        s.readchar()
        break
      }
    }


    if (s.ch == 0x27) { // '
      s.readchar()
      s.intval = cp
    } else {
      // failed -- read until EOF or '
      while (true) {
        if (s.ch == -1) {
          break
        }
        if (s.ch == 0x27) { // '
          s.readchar() // consume '
          break
        }
        s.readchar()
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

  scanString() :token {
    // opening char already consumed
    const s = this
    let buf :AppendBuffer|null = null
    s.startoffs++ // skip initial "
    let chunkStart = s.startoffs
    let tok = token.STRING

    loop1:
    while (true) {
      switch (s.ch) {
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
          s.readchar()
          break loop1

        case 0x5c: { // \
          // we need to buffer the value since it's not a 1:1 literal
          if (!buf) {
            buf = s.resetAppendBuf()
          }

          if (chunkStart != s.offset) {
            buf.appendRange(s.src, chunkStart, s.offset)
          }

          s.readchar()
          const ch = s.ch as int // e.g. "u", "x", etc
          const n = s.scanEscape(0x22) // "

          // we continue even if there was an error
          if (n >= 0) {
            if (n >= utf8.UniSelf && (ch == 0x75 || ch == 0x55)) { // u | U
              // Write unicode code point as UTF8 to value buffer
              if (0xD800 <= n && n <= 0xE000) {
                s.error("illegal: surrogate half in string literal")
              } else if (n > unicode.MaxRune) {
                s.error("escape sequence is invalid Unicode code point")
              }
              buf.reserve(utf8.UTFMax)
              buf.length += utf8.encode(buf.buffer, buf.length, n)
            } else {
              buf.append(n)
            }
          }

          chunkStart = s.offset
          break
        }

        case 0x24: { // $
          s.readchar()
          if (s.gotchar(0x7b)) { // {
            // start interpolated string
            s.interpStrL++
            if (buf) {
              s.byteval = buf.subarray()
            } else {
              s.endoffs = s.offset - 2
            }
            return token.STRING_PIECE
          }
          s.error("expecting ${ to start string interpolation")
          break
        }

        case 0xA: // \n
          tok = token.STRING_MULTI
          s.readchar()
          break

        default:
          s.readchar()
      }
    }

    if (buf) {
      s.byteval = buf.subarray()
    } else {
      s.endoffs = s.offset - 1
    }

    return tok
  }

  // scanEscape parses an escape sequence where `quote` is the accepted
  // escaped character. In case of a syntax error, it stops at the offending
  // character (without consuming it) and returns -1.
  // Otherwise it returns the unicode codepoint for \u and \U, and returns a
  // byte value for all other escape sequences.
  //
  scanEscape(quote :int) :int {
    const s = this

    let n :int = 0
    let base :int = 0

    switch (s.ch) {
      case quote: s.readchar(); return quote
      case 0x30:  s.readchar(); return 0    // 0 - null
      case 0x61:  s.readchar(); return 0x7  // a - alert or bell
      case 0x62:  s.readchar(); return 0x8  // b - backspace
      case 0x66:  s.readchar(); return 0xC  // f - form feed
      case 0x6e:  s.readchar(); return 0xA  // n - line feed or newline
      case 0x72:  s.readchar(); return 0xD  // r - carriage return
      case 0x74:  s.readchar(); return 0x9  // t - horizontal tab
      case 0x76:  s.readchar(); return 0xb  // v - vertical tab
      case 0x5c:  s.readchar(); return 0x5c // \
      case 0x24:  s.readchar(); return 0x24 // $
      case 0x78:  s.readchar(); n = 2; base = 16; break // x
      case 0x75:  s.readchar(); n = 4; base = 16; break // u
      case 0x55:  s.readchar(); n = 8; base = 16; break // U
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
      s.readchar()
      n--
    }

    return cp
  }

  scanNumber(c :int) {
    let s = this

    if (c == 0x30) { // 0
      switch (s.ch) {

        case 0x78: case 0x58: { // x, X
          s.tok = token.INT_HEX
          s.readchar()
          while (isHexDigit(s.ch)) {
            s.readchar()
          }
          if (s.offset - s.startoffs <= 2 || unicode.isLetter(s.ch)) {
            // only scanned "0x" or "0X" OR e.g. 0xfg
            while (unicode.isLetter(s.ch) || unicode.isDigit(s.ch)) {
              s.readchar() // consume invalid letters & digits
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
      s.readchar()
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
    s.readchar()
    let isInvalid = false
    while (unicode.isDigit(s.ch)) {
      if (s.ch - 0x30 >= base) {
        // e.g. 0o678
        isInvalid = true
      }
      s.readchar()
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
    s.readchar() // consume /
    while (unicode.isDigit(s.ch)) {
      s.readchar()
    }
    if (startoffs+1 == s.offset) {
      // e.g. 43/* 43/= etc -- restore state
      s.ch = 0x2f // /
      s.offset = startoffs
      s.rdOffset = s.offset + 1
      return false
    }
    if (s.ch == 0x2e) { // .
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
      s.readchar()
      while (unicode.isDigit(s.ch)) {
        s.readchar()
      }
    }

    if (s.ch == 0x65 || s.ch == 0x45) { // e E
      s.readchar()
      if ((s.ch as int) == 0x2d || (s.ch as int) == 0x2b) { // - +
        s.readchar()
      }
      let valid = false
      while (unicode.isDigit(s.ch)) {
        valid = true
        s.readchar()
      }
      if (!valid) {
        s.error("invalid floating-point exponent")
      }
    }

    s.tok = token.FLOAT
  }

  scanLineComment() {
    const s = this
    // initial '/' already consumed; s.ch == '/'
    do { s.readchar() } while (s.ch != 0xA && s.ch >= 0)

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
      s.readchar()
      switch (s.ch) {
        case -1: // EOF
          s.error("comment not terminated")
          return CR_count
        case 0x2f: // /
          if (s.src[s.offset-1] == 0x2a) { // *
            s.readchar()
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
      s.readchar()
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
      s.readchar()
      while (s.ch >= 0) {
        const ch = s.ch as int
        if (ch == 0xA) { // \n
          return true
        }
        s.readchar()
        if (ch == 0x2a && s.ch as int == 0x2f) { // */
          s.readchar()
          break
        }
      }

      // skip whitespace
      while (
        s.ch as int == 0x20 || // ' '
        s.ch as int == 0x9 || // \t
        (s.ch as int == 0xA && !s.insertSemi) || // \n
        s.ch as int == 0xD) // \r
      {
        s.readchar()
      }

      if (s.ch < 0 || s.ch as int == 0xA) { // \n
        return true
      }

      if (s.ch as int != 0x2f) { // /
        // non-comment token
        return false
      }

      s.readchar() // consume '/'
    }
  
    return false
  }

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

function isLetter(c :int) :bool {
  return (
    (0x41 <= c && c <= 0x5A) || // A..Z
    (0x61 <= c && c <= 0x7A)  // a..z
  )
}

function isDigit(c :int) :bool {
  return 0x30 <= c && c <= 0x39 // 0..9
}

function isHexDigit(c :int) :bool {
  return (
    (0x30 <= c && c <= 0x39) || // 0..9
    (0x41 <= c && c <= 0x46) || // A..F
    (0x61 <= c && c <= 0x66)    // a..f
  )
}

function isUniIdentStart(c :int) :bool {
  return (
    unicode.isLetter(c) ||
    c == 0x5F || // _
    c == 0x24 || // $
    unicode.isEmojiPresentation(c) ||
    unicode.isEmojiModifierBase(c)
  )
}

function isUniIdentCont(c :int) :bool {
  return (
    unicode.isLetter(c) ||
    unicode.isDigit(c) ||
    c == 0x5F || // _
    c == 0x24 || // $
    unicode.isEmojiPresentation(c) ||
    unicode.isEmojiModifierBase(c)
  )
}

const
  langIdent = 1<< 1 -1,
  langIdentStart = 1<< 2 -1

// must smaller than utf8.UniSelf
const asciiFeats = new Uint8Array([
  /* 0    0  NUL */ 0,
  /* 1    1  SOH */ 0,
  /* 2    2  STX */ 0,
  /* 3    3  ETX */ 0,
  /* 4    4  EOT */ 0,
  /* 5    5  ENQ */ 0,
  /* 6    6  ACK */ 0,
  /* 7    7  BEL */ 0,
  /* 8    8  BS  */ 0,
  /* 9    9  TAB */ 0,
  /* 10   A  LF  */ 0,
  /* 11   B  VT  */ 0,
  /* 12   C  FF  */ 0,
  /* 13   D  CR  */ 0,
  /* 14   E  SO  */ 0,
  /* 15   F  SI  */ 0,
  /* 16  10  DLE */ 0,
  /* 17  11  DC1 */ 0,
  /* 18  12  DC2 */ 0,
  /* 19  13  DC3 */ 0,
  /* 20  14  DC4 */ 0,
  /* 21  15  NAK */ 0,
  /* 22  16  SYN */ 0,
  /* 23  17  ETB */ 0,
  /* 24  18  CAN */ 0,
  /* 25  19  EM  */ 0,
  /* 26  1A  SUB */ 0,
  /* 27  1B  ESC */ 0,
  /* 28  1C  FS  */ 0,
  /* 29  1D  GS  */ 0,
  /* 30  1E  RS  */ 0,
  /* 31  1F  US  */ 0,
  /* 32  20  SP  */ 0,
  /* 33  21  !   */ 0,
  /* 34  22  "   */ 0,
  /* 35  23  #   */ 0,
  /* 36  24  $   */ langIdent | langIdentStart,
  /* 37  25  %   */ 0,
  /* 38  26  &   */ 0,
  /* 39  27  '   */ 0,
  /* 40  28  (   */ 0,
  /* 41  29  )   */ 0,
  /* 42  2A  *   */ 0,
  /* 43  2B  +   */ 0,
  /* 44  2C  ,   */ 0,
  /* 45  2D  -   */ 0,
  /* 46  2E  .   */ 0,
  /* 47  2F  /   */ 0,
  /* 48  30  0   */ langIdent,
  /* 49  31  1   */ langIdent,
  /* 50  32  2   */ langIdent,
  /* 51  33  3   */ langIdent,
  /* 52  34  4   */ langIdent,
  /* 53  35  5   */ langIdent,
  /* 54  36  6   */ langIdent,
  /* 55  37  7   */ langIdent,
  /* 56  38  8   */ langIdent,
  /* 57  39  9   */ langIdent,
  /* 58  3A  :   */ 0,
  /* 59  3B  ;   */ 0,
  /* 60  3C  <   */ 0,
  /* 61  3D  =   */ 0,
  /* 62  3E  >   */ 0,
  /* 63  3F  ?   */ 0,
  /* 64  40  @   */ 0,
  /* 65  41  A   */ langIdent | langIdentStart,
  /* 66  42  B   */ langIdent | langIdentStart,
  /* 67  43  C   */ langIdent | langIdentStart,
  /* 68  44  D   */ langIdent | langIdentStart,
  /* 69  45  E   */ langIdent | langIdentStart,
  /* 70  46  F   */ langIdent | langIdentStart,
  /* 71  47  G   */ langIdent | langIdentStart,
  /* 72  48  H   */ langIdent | langIdentStart,
  /* 73  49  I   */ langIdent | langIdentStart,
  /* 74  4A  J   */ langIdent | langIdentStart,
  /* 75  4B  K   */ langIdent | langIdentStart,
  /* 76  4C  L   */ langIdent | langIdentStart,
  /* 77  4D  M   */ langIdent | langIdentStart,
  /* 78  4E  N   */ langIdent | langIdentStart,
  /* 79  4F  O   */ langIdent | langIdentStart,
  /* 80  50  P   */ langIdent | langIdentStart,
  /* 81  51  Q   */ langIdent | langIdentStart,
  /* 82  52  R   */ langIdent | langIdentStart,
  /* 83  53  S   */ langIdent | langIdentStart,
  /* 84  54  T   */ langIdent | langIdentStart,
  /* 85  55  U   */ langIdent | langIdentStart,
  /* 86  56  V   */ langIdent | langIdentStart,
  /* 87  57  W   */ langIdent | langIdentStart,
  /* 88  58  X   */ langIdent | langIdentStart,
  /* 89  59  Y   */ langIdent | langIdentStart,
  /* 90  5A  Z   */ langIdent | langIdentStart,
  /* 91  5B  [   */ 0,
  /* 92  5C  \   */ 0,
  /* 93  5D  ]   */ 0,
  /* 94  5E  ^   */ 0,
  /* 95  5F  _   */ langIdent | langIdentStart,
  /* 96  60  `   */ 0,
  /* 97  61  a   */ langIdent | langIdentStart,
  /* 98  62  b   */ langIdent | langIdentStart,
  /* 99  63  c   */ langIdent | langIdentStart,
  /* 100 64  d   */ langIdent | langIdentStart,
  /* 101 65  e   */ langIdent | langIdentStart,
  /* 102 66  f   */ langIdent | langIdentStart,
  /* 103 67  g   */ langIdent | langIdentStart,
  /* 104 68  h   */ langIdent | langIdentStart,
  /* 105 69  i   */ langIdent | langIdentStart,
  /* 106 6A  j   */ langIdent | langIdentStart,
  /* 107 6B  k   */ langIdent | langIdentStart,
  /* 108 6C  l   */ langIdent | langIdentStart,
  /* 109 6D  m   */ langIdent | langIdentStart,
  /* 110 6E  n   */ langIdent | langIdentStart,
  /* 111 6F  o   */ langIdent | langIdentStart,
  /* 112 70  p   */ langIdent | langIdentStart,
  /* 113 71  q   */ langIdent | langIdentStart,
  /* 114 72  r   */ langIdent | langIdentStart,
  /* 115 73  s   */ langIdent | langIdentStart,
  /* 116 74  t   */ langIdent | langIdentStart,
  /* 117 75  u   */ langIdent | langIdentStart,
  /* 118 76  v   */ langIdent | langIdentStart,
  /* 119 77  w   */ langIdent | langIdentStart,
  /* 120 78  x   */ langIdent | langIdentStart,
  /* 121 79  y   */ langIdent | langIdentStart,
  /* 122 7A  z   */ langIdent | langIdentStart,
  /* 123 7B  {   */ 0,
  /* 124 7C  |   */ 0,
  /* 125 7D  }   */ 0,
  /* 126 7E  ~   */ 0,
  /* 127 7F  DEL */ 0,
])

