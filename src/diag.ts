//
// Diagnostics
//
import { Position } from './pos'

// type of diagnostic
export type DiagKind = "info" | "warn" | "error"
//   INFO,
//   WARN,
//   // ERROR, // Note: for config only; never reported to a DiagHandler
// }

// A DiagHandler may be provided to Parser.init. If a diagnostic message is
// produces and a handler was installed, the handler is called with a
// position, kind of diagnostic and a message.
// The position points to the beginning of the related source code.
//
export type DiagHandler = (p :Position, msg :string, k :DiagKind) => void
