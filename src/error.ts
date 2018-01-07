import { Position } from './pos'

// error codes
class _errors {
  E_SYNTAX  = 'syntax'
  E_CONV    = 'type or value conversion'
  E_RESOLVE = 'reference resolution'
  E_UNUSED_VAR   = 'declared and not used'
  E_UNUSED_PARAM = 'unused parameter'
  E_UNUSED_FIELD = 'unused field'
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
  }
}
