import { Position } from './pos'
import { termColorSupport, style, noStyle } from './termstyle'

// error codes
class _errors {
  E_SYNTAX         = "syntax"
  E_CONV           = "type or value conversion"
  E_RESOLVE        = "reference resolution"
  E_UNUSED_VAR     = "declared and not used"
  E_UNUSED_PARAM   = "unused parameter"
  E_UNUSED_FIELD   = "unused field"
  E_UNUSED_TYPEVAR = "unused type var"
  E_SUGGESTION     = "suggests a change"
}
export const errors = new _errors()

// error code type
export type ErrorCode = keyof(_errors)

// An ErrorHandler may be provided to Scanner.init. If a syntax error is
// encountered and a handler was installed, the handler is called with a
// position and an error message. The position points to the beginning of
// the offending token.
//
export type ErrorHandler = (pos :Position, msg :string, c :ErrorCode) => void

// ErrorReporter serves as a base for other types that report source errors.
//
export class ErrorReporter {
  errorCount :number = 0

  constructor(
    public defaultErrCode :ErrorCode,
    public errh :ErrorHandler|null = null,
  ) {}

  errorAt(msg :string, position :Position, code? :ErrorCode) {
    if (this.errh) {
      this.errh(position, msg, code || this.defaultErrCode)
    }
    this.errorCount++

    // when compiling in debug mode, also show stack trace when reporting error
    if (DEBUG) {
      if (this.errh) {
        let e = new Error()
        let maxlen = 0, SP = '                              '
        const S = termColorSupport ? style : noStyle
        let v = (e.stack||'').split('\n').slice(2).map(s => {
          let m = /\s+at\s+([^\s]+)\s+\((.+)\)/.exec(s)
          if (!m) { return [s, null] }
          let p = m[2].lastIndexOf('/src/')
          if (p != -1) {
            m[2] = m[2].substr(p+1)
          }
          maxlen = Math.max(m[1].length, maxlen)
          return [m[1], m[2]]
        })
        console.error(
          v.map(s => {
            if (!s[1]) { return S.italic(String(s[0])) }
            let f = s[0] as string
            return S.grey(
              '  ' + f + SP.substr(0,maxlen - f.length) + '  ' + s[1]
            )
          }).join('\n')
        )
      }
    }
  }
}
