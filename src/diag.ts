import { Position } from "./pos"
import { ErrorCode } from "./error"

// type of diagnostic
export type DiagKind = "info"
                     | "warn"
                     | "error"

// A DiagHandler may be provided to e.g. a Parser.
// If a diagnostic message is produced and a handler was installed,
// the handler is called with a position, kind of diagnostic and a message.
// The position points to the beginning of the related source code.
//
export type DiagHandler = (p :Position, msg :string, k :DiagKind) => void

// Diagnostic describes an issue or notice regarding source code
export interface Diagnostic {
  kind     :DiagKind  // a string; i.e. "error", "warn", "info"
  pos      :Position  // source code position
  message  :string    // human-readable diagnostic
  errcode? :ErrorCode // specific code
  toString() :string
}

export class Diag implements Diagnostic {
  kind     :DiagKind
  message  :string
  pos      :Position
  errcode? :ErrorCode

  constructor(kind :DiagKind, message :string, pos :Position, errcode? :ErrorCode) {
    this.kind = kind
    this.message = message
    this.pos = pos
    this.errcode = errcode
  }

  toString() :string {
    return (
      this.kind == "error" ?
      `${this.pos}: ${this.message} (${this.errcode})` :
      `${this.pos}: ${this.message} (${this.kind})`
    )
  }
}
