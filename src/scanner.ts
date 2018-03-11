import { Pos, Position, SrcFile } from './pos'
import * as utf8 from './utf8'
import * as unicode from './unicode'
import { ErrorCode, ErrorReporter, ErrorHandler } from './error'
import { token, lookupKeyword, prec } from './token'
import * as path from './path'
import { Int64 } from './int64'
import { IntParser } from './intparse'
import {
  AppendBuffer,
  bufcmp,
  asciibuf,
  asciistr,
  asciistrn,
  // debuglog as dlog,
} from './util'


export enum Mode {
  None = 0,

  ScanComments = 1, // do not skip comments; produce token.COMMENT

  CopySource = 2,
    // copy slices of source data for tokens with literal values instead of
    // referencing the source buffer. This means slightly lower speed but
    // less memory usage since when scanning is done, the source code memory
    // can be reclaimed. If you plan to keep the source code around after
    // scanning (common case) you should leave this disabled.
}

const linePrefix = asciibuf('//!line ')

enum istrOne { OFF, WAIT, CONT }

// A Scanner holds the scanner's internal state while processing a given text.
// It must be initialized via init before use or resue.
//
export class Scanner extends ErrorReporter {
  // immutable state (only changed by init())
  // Note: `undefined as any as X` is a workaround for a TypeScript issue
  // where members are otherwise not initialized at construction which causes
  // duplicate struct definitions in v8.
  public sfile :SrcFile = undefined as any as SrcFile // source file handle
  public sdata :Uint8Array = undefined as any as Uint8Array // source data
  public dir   :string = ''   // directory portion of file.name
  public mode  :Mode = 0      // scanning mode

  // scanning state
  private ch         :int = -1 // current character (unicode; -1=EOF)
  protected offset   :int = 0  // character offset
  private rdOffset   :int = 0  // reading offset (position after current char)
  private lineOffset :int = 0  // current line offset
  private insertSemi :bool = false // insert a semicolon before next newline
  private parenL     :int = 0  // parenthesis level, for string interpolation
  private interpStrL :int = 0  // string interpolation level
  private istrOne    :istrOne = istrOne.OFF // string interpolation
  private byteval    :Uint8Array|null = null // value for some string tokens
  private intParser  = new IntParser()

  // public scanning state (read-only)
  public pos       :Pos = 0  // token start position
  public startoffs :int = 0  // token start offset
  public endoffs   :int = 0  // token end offset
  public tok       :token = token.EOF
  public prec      :prec = prec.LOWEST
  public hash      :int = 0 // hash value for current token (if NAME*)
  public int32val  :int = 0 // value for some tokens (char and int lits)
  public int64val  :Int64|null = null  // value for large int tokens
  public floatval  :number = +0.0  // IEEE 754-2008 float

  // sparse buffer state (not reset by s.init)
  private appendbuf  :AppendBuffer|null = null // for string literals

  // public state - ok to modify
  public errorCount :int = 0 // number of errors encountered

  constructor() {
    super('E_SYNTAX')
  }

  // Init prepares the scanner s to tokenize the text sdata by setting the
  // scanner at the beginning of sdata. The scanner uses the file set file
  // for position information and it adds line information for each line.
  // It is ok to re-use the same file when re-scanning the same file as
  // line information which is already present is ignored. Init causes a
  // panic if the file size does not match the sdata size.
  //
  // Calls to Scan will invoke the error handler errh if they encounter a
  // syntax error and errh is not nil. Also, for each error encountered,
  // the Scanner field ErrorCount is incremented by one. The mode parameter
  // determines how comments are handled.
  //
  // Note that Init may call errh if there is an error in the first character
  // of the file.
  //
  init(
    sfile :SrcFile,
    sdata :Uint8Array,
    errh? :ErrorHandler|null,
    mode  :Mode =Mode.None,
  ) {
    const s = this
    // Explicitly initialize all fields since a scanner may be reused
    if (sfile.size != sdata.length) {
      panic(
        `file size (${sfile.size}) `+
        `does not match source size (${sdata.length})`
      )
    }
    s.sfile = sfile
    s.dir = path.dir(sfile.name)
    s.sdata = sdata
    s.errh = errh || null
    s.mode = mode
  
    s.ch = 0x20 /*' '*/
    s.tok = token.EOF
    s.offset = 0
    s.rdOffset = 0
    s.lineOffset = 0
    s.insertSemi = false
    s.errorCount = 0
    s.parenL = 0
    s.interpStrL = 0
    s.byteval = null
  
    s.readchar()
  }

  // setOffset sets the read offset.
  // it's only safe to call this outside of next() and readchar()
  //
  setOffset(offs :int) {
    const s = this
    s.offset = s.rdOffset = offs
  }

  private _r :utf8.DecodeResult = {c:0,w:0}

  // Read the next Unicode char into s.ch.
  // s.ch < 0 means end-of-file.
  private readchar() {
    const s = this

    if (s.rdOffset < s.sdata.length) {
      s.offset = s.rdOffset
      
      if (s.ch == 0xA /*\n*/ ) {
        s.lineOffset = s.offset
        s.sfile.addLine(s.offset)
      }

      s._r.w = 1
      s._r.c = s.sdata[s.rdOffset]

      if (s._r.c >= 0x80) {
        // uncommon case: non-ASCII character
        if (!utf8.decode(s.sdata, s.rdOffset, s._r)) {
          s.errorAtOffs('invalid UTF-8 encoding', s.offset)
        } else if (s._r.c == 0) {
          s.errorAtOffs('illegal NUL byte in input', s.offset)
        }
      }

      s.rdOffset += s._r.w
      s.ch = s._r.c
    } else {
      s.offset = s.sdata.length
      if (s.ch == 0xA /*\n*/) {
        s.lineOffset = s.offset
        s.sfile.addLine(s.offset)
      }
      s.ch = -1 // eof
    }
  }

  // undobyte "puts back" the last-read byte.
  // note that this does NOT fully update scanner state -- after calling this
  // function, you should either call readchar() to update s.ch and s.offset
  // or call next().
  //
  private undobyte() {
    const s = this
    assert(s.ch < 0x80)
    s.rdOffset -= 1
    s.offset -= 1
    s.endoffs = s.offset
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
    return s.sfile.position(s.sfile.pos(s.offset))
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
    return s.byteval || s.sdata.subarray(s.startoffs, end)
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
  error(msg :string, pos :Pos = this.pos, code? :ErrorCode) {
    const s = this
    s.errorAt(msg, s.sfile.position(pos), code)
  }

  errorAtOffs(msg :string, offs :int, code? :ErrorCode) {
    const s = this
    s.errorAt(msg, s.sfile.position(s.sfile.pos(offs)), code)
  }

  // Scan the next token
  //
  next() {
  while (true) {
    const s = this

    if (s.istrOne == istrOne.OFF) {
      // skip whitespace
      while (
        s.ch == 0x20 ||
        s.ch == 0x9 ||
        (s.ch == 0xA && !s.insertSemi) ||
        s.ch == 0xD
      ) {
        s.readchar()
      }
    }

    // current token start
    s.pos = s.sfile.pos(s.offset)
    s.startoffs = s.offset
    s.endoffs = -1
    s.byteval = null

    if (s.istrOne == istrOne.CONT) {
      // continue interpolated string
      s.istrOne = istrOne.OFF
      s.startoffs-- // b/c scanString increments it, assuming it's skipping `"`
      s.tok = s.scanString()
      s.insertSemi = s.tok != token.STRING_PIECE
      return
    } else if (s.istrOne == istrOne.WAIT) {
      // we are about to scan a single token following $ in a string template
      s.istrOne = istrOne.CONT
    }

    // make progress
    let ch = s.ch
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
        s.scanNumber(ch, /*modch=*/0)
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
          s.tok = token.SET_ASSIGN
          s.prec = prec.LOWEST
        } else {
          s.tok = token.COLON
        }
        break

      case 0x2e: { // .
        if (
          isDigit(s.ch) &&
          s.tok != token.NAME &&
          s.tok != token.RPAREN &&
          s.tok != token.RBRACKET
        ) {
          // Note: We check for NAME so that:
          //   x.1 => (selector (name x) (int 1))
          //   ).1 => (selector (name x) (int 1))
          //   ].1 => (selector (name x) (int 1))
          //   .1  => (float 0.1)
          s.scanFloatNumber(/*seenDecimal*/true, /*modc*/0)
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
        if (s.interpStrL) {
          s.parenL++
        }
        s.tok = token.LPAREN
        break
      case 0x29: // )
        s.tok = token.RPAREN
        insertSemi = true
        if (s.interpStrL) {
          if (s.parenL == 0) {
            // continue interpolated string
            s.interpStrL--
            s.tok = s.scanString()
            insertSemi = s.tok != token.STRING_PIECE
          } else {
            s.parenL--
          }
        }
        break

      case 0x5b: // [
        s.tok = token.LBRACKET
        break
      case 0x5d: // ]
        s.tok = token.RBRACKET
        insertSemi = true
        break

      case 0x7b: // {
        s.tok = token.LBRACE
        break
      case 0x7d: // }
        s.tok = token.RBRACE
        insertSemi = true
        break

      case 0x2B: { // +
        s.prec = prec.LOWEST
        if (s.gotchar(0x3D)) { // +=
          s.tok = token.ADD_ASSIGN
        } else if (s.gotchar(ch)) { // ++
          s.tok = token.INC
          insertSemi = true
        } else if (s.ch >= 0x30 && s.ch <= 0x39) { // 0..9
          ch = s.ch
          s.readchar()
          s.scanNumber(ch, /*modch=*/0x2B)
          insertSemi = true
        } else if (s.gotchar(0x2e)) { // .
          s.scanFloatNumber(/*seenDecimal*/true, /*modc=*/0x2B)
          insertSemi = true
        } else {
          s.tok = token.ADD
          s.prec = prec.ADD
        }
        break
      }

      case 0x2D: { // -
        s.prec = prec.LOWEST
        if (s.gotchar(0x3e)) { // ->
          s.tok = token.ARROWR
        } else if (s.gotchar(0x3D)) { // -=
          s.tok = token.SUB_ASSIGN
        } else if (s.gotchar(ch)) { // --
          s.tok = token.DEC
          insertSemi = true
        } else if (s.ch >= 0x30 && s.ch <= 0x39) { // 0..9
          ch = s.ch
          s.readchar()
          s.scanNumber(ch, /*modc=*/0x2D)
          insertSemi = true
        } else if (s.gotchar(0x2e)) { // .
          s.scanFloatNumber(/*seenDecimal*/true, /*modc=*/0x2D)
          insertSemi = true
        } else {
          s.tok = token.SUB
          s.prec = prec.ADD
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
              const v = s.sdata.subarray(
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
          s.tok = token.ANDAND
          s.prec = prec.ANDAND
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
          s.tok = token.OROR
          s.prec = prec.OROR
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

    // dlog(
    //   `-> ${tokstr(s.tok)} "${utf8.decodeToString(s.byteValue())}"`)
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
      if (lastCp == 0x2D && c == 0x2D) { // --
        s.undobyte() // "put back" the "-" byte
        break
      }
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
      hash = (hash ^ s.sdata[i]) * 0x1000193 // fnv1a
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
      c == 0x2D || // -
      c == 0x5F || // _
      c == 0x24    // $
    ) {
      s.readchar()
      if (c == 0x2D && s.ch == 0x2D) { // --
        s.undobyte() // "put back" the "-" byte
        break
      }
      hash = (hash ^ c) * 0x1000193 // fnv1a
      c = s.ch
    }

    if (c >= utf8.UniSelf && isUniIdentCont(c)) {
      return s.scanIdentifierU(c, s.offset, hash)
    }

    s.hash = hash >>> 0
  }

  scanChar() {
    const s = this
    let cp = -1
    s.tok = token.CHAR
    s.int32val = NaN

    switch (s.ch) {
    
    case -1: // EOF
      s.error("unterminated character literal")
      s.tok = token.ILLEGAL
      return

    case 0x27: // '
      s.error("empty character literal or unescaped ' in character literal")
      s.readchar()
      s.tok = token.ILLEGAL
      return

    case 0x5c: // \
      s.readchar()
      cp = s.scanEscape(0x27) // '
      // note: cp is -1 for illegal escape sequences
      break

    default:
      cp = s.ch
      if (cp < 0x20) {
        s.error("invalid character literal")
        s.tok = token.ILLEGAL
        cp = -1
      }
      s.readchar()
      break
    }

    if (s.ch == 0x27) { // '
      s.readchar()
      if (cp == -1) {
        s.tok = token.ILLEGAL
      } else {
        s.int32val = cp
      }
    } else {
      // failed -- read until EOF or '
      s.tok = token.ILLEGAL
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
            buf.appendRange(s.sdata, chunkStart, s.offset)
          }
          s.readchar()
          break loop1

        case 0x5c: { // \
          // we need to buffer the value since it's not a 1:1 literal
          if (!buf) {
            buf = s.resetAppendBuf()
          }

          if (chunkStart != s.offset) {
            buf.appendRange(s.sdata, chunkStart, s.offset)
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
          // start interpolated string

          if (buf) {
            s.byteval = buf.subarray()
          }

          if (s.gotchar(0x28)) { // (
            // don't close until we see a balanced closing ')'
            s.interpStrL++
            s.endoffs = s.offset - 2 // exclude `$(`
          } else if (s.ch as int == 0x22) { // "
            // "foo $"bar"" is invalid -- hard to read, hard to parse.
            // ("foo $("bar")" _is_ valid however.)
            s.error(
              "invalid \" in string template — string literals inside string " +
              "templates need to be enclosed in parenthesis"
            )
            break // consume
          } else {
            // expect a single token to follow
            s.endoffs = s.offset - 1 // exclude `$`
            s.istrOne = istrOne.WAIT
          }
          return token.STRING_PIECE
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
    let isuc = false

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
      case 0x75:  s.readchar(); n = 4; base = 16; isuc = true; break // u
      case 0x55:  s.readchar(); n = 8; base = 16; isuc = true; break // U
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
        s.errorAtOffs(msg, s.offset)
        return -1
      }
      cp = cp * base + d
      s.readchar()
      n--
    }

    // validate unicode codepoints
    if (isuc && !unicode.isValid(cp)) {
      s.errorAtOffs(
        "escape sequence is invalid Unicode code point",
        s.offset
      )
      return -1
    }

    return cp
  }

  scanNumber(c :int, modc :int) {
    let s = this

    if (c == 0x30) { // 0
      switch (s.ch) {

        case 0x78: case 0x58: // x, X
          return s.scanHexInt(modc)

        case 0x6F: case 0x4F: // o, O
          s.tok = token.INT_OCT
          return s.scanRadixInt8(8, modc)

        case 0x62: case 0x42: // b, B
          s.tok = token.INT_BIN
          return s.scanRadixInt8(2, modc)

        case 0x2e: case 0x65: case 0x45:  // . e E
          return s.scanFloatNumber(/*seenDecimal*/false, modc)

        // case 0x2f:  // /
        //   // this is invalid, but we will still parse any number after "/"
        //   // scanRatioNumber returns true if it actually parsed a number.
        //   if (s.scanRatioNumber()) {
        //     // i.e. 0/N
        //     s.error("invalid zero ratio")
        //     return
        //   }
        //   break
      }
    }

    // if we get here, the number is in base 10 and is either an int, float
    // or ratio.

    s.intParser.init(10, /*signed*/modc > 0, /*negative*/modc == 0x2D)
    s.intParser.parseval(c - 0x30) // entry char

    while (s.ch >= 0x30 && s.ch <= 0x39) {  // 0..9
      s.intParser.parseval(s.ch - 0x30)
      s.readchar()
    }
    s.tok = token.INT

    switch (s.ch) {
    case 0x2e: case 0x65: case 0x45:  // . e E
      // scanning a floating-point number
      return s.scanFloatNumber(/*seenDecimal*/false, modc)
    }

    // scanned an integer
    let valid = s.intParser.finalize()
    s.int32val = s.intParser.int32val
    s.int64val = s.intParser.int64val
    if (!valid) {
      s.error("integer constant too large")
    }

    // if (s.ch == 0x2f) {
    //   return s.scanRatioNumber()
    // }
  }

  scanHexInt(modc :int) {
    const s = this
    s.tok = token.INT_HEX
    s.readchar()
    s.intParser.init(16, /*signed*/modc > 0, /*negative*/modc == 0x2D)
    let n = 0
    while ((n = hexDigit(s.ch)) != -1) {
      s.intParser.parseval(n)
      s.readchar()
    }
    if (s.offset - s.startoffs <= 2 || unicode.isLetter(s.ch)) {
      // only scanned "0x" or "0X" OR e.g. 0xfg
      while (unicode.isLetter(s.ch) || unicode.isDigit(s.ch)) {
        s.readchar() // consume invalid letters & digits
      }
      s.error("invalid hex number")
    }
    let valid = s.intParser.finalize()
    s.int32val = s.intParser.int32val
    s.int64val = s.intParser.int64val
    if (!valid) {
      s.error("integer constant too large")
    }
  }

  scanRadixInt8(radix :int, modc :int) {
    const s = this
    s.readchar()
    let isInvalid = false

    s.intParser.init(radix, /*signed*/modc > 0, /*negative*/modc == 0x2D)

    while (unicode.isDigit(s.ch)) {
      if (s.ch - 0x30 >= radix) {
        // e.g. 0o678
        isInvalid = true
      } else {
        s.intParser.parseval(s.ch - 0x30)
      }
      s.readchar()
    }

    if (isInvalid || s.offset - s.startoffs <= 2 || !s.intParser.finalize()) {
      // isInvalid OR only scanned "0x"
      s.error(`invalid ${radix == 8 ? "octal" : "binary"} number`)
      s.int32val = NaN
      s.int64val = null
    } else {
      s.int32val = s.intParser.int32val
      s.int64val = s.intParser.int64val
    }
  }

  // scanRatioNumber() :bool {
  //   // ratio_lit = decimals "/" decimals
  //   const s = this
  //   const startoffs = s.offset
  //   s.readchar() // consume /
  //   while (unicode.isDigit(s.ch)) {
  //     s.readchar()
  //   }
  //   if (startoffs+1 == s.offset) {
  //     // e.g. 43/* 43/= etc -- restore state
  //     s.ch = 0x2f // /
  //     s.offset = startoffs
  //     s.rdOffset = s.offset + 1
  //     return false
  //   }
  //   if (s.ch == 0x2e) { // .
  //     s.error("invalid ratio")
  //   }
  //   s.tok = token.RATIO
  //   return true
  // }

  scanFloatNumber(seenDecimal :bool, modc :int) {
    // float_lit = decimals "." [ decimals ] [ exponent ] |
    //             decimals exponent |
    //             "." decimals [ exponent ] .
    // decimals  = decimal_digit { decimal_digit } .
    // exponent  = ( "e" | "E" ) [ "+" | "-" ] decimals .
    const s = this
    s.tok = token.FLOAT

    // Note: We are ignoring modc since we use parseFloat to parse the entire
    // range of source text.

    if (seenDecimal || s.ch == 0x2e) { // .
      s.readchar()
      while (unicode.isDigit(s.ch)) {
        s.readchar()
      }
    }

    if (s.ch == 0x65 || s.ch == 0x45) { // e E
      s.readchar()
      if ((s.ch as int) == 0x2D || (s.ch as int) == 0x2B) { // - +
        s.readchar()
      }
      let valid = false
      if (unicode.isDigit(s.ch)) {
        valid = true
        s.readchar()
        while (unicode.isDigit(s.ch)) {
          s.readchar()
        }
      }
      if (!valid) {
        s.error("invalid floating-point exponent")
        s.floatval = NaN
        return
      }
    }

    let str :string
    if (s.byteval) {
      str = asciistr(s.byteval)
    } else {
      str = asciistrn(s.sdata, s.startoffs, s.offset)
    }

    s.floatval = parseFloat(str)

    assert(!isNaN(s.floatval), 'we failed to catch invalid float lit')
  }

  scanLineComment() {
    const s = this
    // initial '/' already consumed; s.ch == '/'
    do { s.readchar() } while (s.ch != 0xA && s.ch >= 0)

    if (s.sdata[s.offset-1] == 0xD) { // \r
      // don't include \r in comment
      s.endoffs = s.offset - 1
    }

    if (s.startoffs == s.lineOffset && s.sdata[s.startoffs + 2] == 0x21) { // !
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
          if (s.sdata[s.offset-1] == 0x2a) { // *
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
         bufcmp(s.sdata, linePrefix, offs, offs + linePrefix.length) == 0
    ) {
      // get filename and line number, if any
      // e.g. "//!line file name:line"
      let text = utf8.decodeToString(
        s.sdata.subarray(offs + linePrefix.length, s.offset)
      )
      /// --- here--- the above doesnt work on uintarray.
      // we need to decode sdata to a js string
      let i = text.lastIndexOf(':')
      if (i > 0) {
        let line = parseInt(text.substr(i+1))
        if (!isNaN(line) && line > 0) {
          // valid //!line filename:line comment
          let filename = text.substr(0, i).trim()
          if (filename) {
            filename = path.clean(filename)
            if (!path.isAbs(filename)) {
              // make filename relative to current directory
              filename = path.join(s.dir, filename)
            }
          }
          // update scanner position
          s.sfile.addLineInfo(s.offset + 1, filename, line)
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

function hexDigit(c :int) :int {
  if (c >= 0x30 && c <= 0x39) { // 0..9
    return c - 0x30
  } else if (c >= 0x41 && c <= 0x46) { // A..F
    return c - (0x41 - 10)
  } else if (c >= 0x61 && c <= 0x66) { // a..f
    return c - (0x61 - 10)
  }
  return -1
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
    c == 0x2D || // -
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

