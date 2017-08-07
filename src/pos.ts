import * as util from './util'

// Pos is a compact encoding of a source position within a file set.
// It can be converted into a Position for a more convenient, but much
// larger, representation.
//
// The Pos value for a given file is a number in the range [base, base+size],
// where base and size are specified when adding the file to the file set via
// AddFile.
//
// To create the Pos value for a specific source offset (measured in bytes),
// first add the respective file to the current file set using FileSet.AddFile
// and then call File.Pos(offset) for that file. Given a Pos value p
// for a specific file set fset, the corresponding Position value is
// obtained by calling fset.Position(p).
//
// Pos values can be compared directly with the usual comparison operators:
// If two Pos values p and q are in the same file, comparing p and q is
// equivalent to comparing the respective source file offsets. If p and q
// are in different files, p < q is true if the file implied by p was added
// to the respective file set before the file implied by q.
//
export type Pos = int

// The zero value for Pos is NoPos; there is no file and line information
// associated with it, and NoPos().IsValid() is false. NoPos is always
// smaller than any other Pos value. The corresponding Position value
// for NoPos is the zero value for Position.
//
export const NoPos :Pos = 0

// IsValid reports whether the position is valid.
export function PosIsValid(p :Pos) :bool {
  return p != NoPos
}

// Position describes an arbitrary source position
// including the file, line, and column location.
// A Position is valid if the line number is > 0.
export class Position { constructor(
  public readonly filename :string = '', // filename, if any
  public readonly offset   :int = 0,    // offset, starting at 0
  public readonly line     :int = 0,    // line number, starting at 1
  public readonly column   :int = 0,    // column number, starting at 1 (byte count)
  ) {}

  // IsValid reports whether the position is valid.
  isValid() :bool {
    return this.line > 0
  }

  // toString returns a string in one of several forms:
  //
  //  file:line:column    valid position with file name
  //  line:column         valid position without file name
  //  file                invalid position with file name
  //  -                   invalid position without file name
  //
  toString() :string {
    let p = this
    let s = p.filename
    if (p.isValid()) {
      if (s) {
        s += ":"
      }
      s += `${p.line}:${p.column}`
    }
    return s || "-"
  }
}

const invalidPosition = new Position()

// -----------------------------------------------------------------

// A lineInfo object describes alternative file and line number
// information (such as provided via a //line comment in a .go
// file) for a given file offset.
interface lineInfo {
  offset   :int
  filename :string
  line     :int
}

// A File is a handle for a file belonging to a FileSet.
// A File has a name, size, and line offset table.
export class File {
  private infos :lineInfo[] = []

  constructor(
  public set   :FileSet,
  public name  :string,  // file name as provided to addFile
  public base  :int,     // Pos value range for this file is [base...base+size]
  public size  :int,     // file size as provided to addFile
  public lines :int[],
  ) {}

  // Number of lines in file
  get lineCount() :int {
    return this.lines.length
  }

  // addLine adds the line offset for a new line.
  // The line offset must be larger than the offset for the previous line
  // and smaller than the file size; otherwise the line offset is ignored.
  //
  addLine(offset :int) {
    const f = this
    const i = f.lines.length
    if ((i === 0 || f.lines[i-1] < offset) && offset < f.size) {
      f.lines.push(offset)
    }
  }

  // AddLineInfo adds alternative file and line number information for
  // a given file offset. The offset must be larger than the offset for
  // the previously added alternative line info and smaller than the
  // file size; otherwise the information is ignored.
  //
  // AddLineInfo is typically used to register alternative position
  // information for //line filename:line comments in source files.
  //
  addLineInfo(offset :int, filename :string, line :int) {
    const f = this
    const i = f.infos.length
    if (i == 0 || f.infos[i-1].offset < offset && offset < f.size) {
      f.infos.push({offset, filename, line})
    }
  }

  // Pos returns the Pos value for the given file offset;
  // the offset must be <= f.size.
  // f.pos(f.offset(p)) == p.
  //
  pos(offset :int) :Pos {
    const f = this
    if (offset > f.size) {
      panic("illegal file offset")
    }
    return f.base + offset
  }

  // Offset returns the offset for the given file position p;
  // p must be a valid Pos value in that file.
  // f.offset(f.pos(offset)) == offset.
  //
  offset(p :Pos) :int {
    const f = this
    if (p < f.base || p > f.base + f.size) {
      panic("illegal Pos value")
    }
    return p - f.base
  }

  // position returns the Position value for the given file position p.
  // If adjusted is set, the position may be adjusted by position-altering
  // //line comments; otherwise those comments are ignored.
  // p must be a Pos value in f or NoPos.
  //
  position(p :Pos, adjusted :bool = true) :Position {
    const f = this
    if (p == NoPos) {
      return invalidPosition
    }
    if (p < f.base || p > f.base + f.size) {
      panic("illegal Pos value")
    }
    return f._position(p, adjusted)
  }

  // If adjusted is set, will return the filename and line information possibly
  // adjusted by //line comments; otherwise those comments are ignored.
  //
  private _position(p :Pos, adjusted :bool) :Position {
    const f = this
    const offset = p - f.base

    let filename = f.name
    let line = 0, column = 0
    
    let i = searchInts(f.lines, offset)

    if (i >= 0) {
      line = i + 1
      column = offset - f.lines[i] + 1
    }

    if (adjusted && f.infos.length > 0) {
      // file has extra line infos
      let i = searchLineInfos(f.infos, offset)
      if (i >= 0) {
        const alt = f.infos[i]
        filename = alt.filename
        i = searchInts(f.lines, alt.offset)
        if (i >= 0) {
          line += alt.line - i - 1
        }
      }
    }

    return new Position(filename, offset, line, column)
  }

}

function searchLineInfos(a :lineInfo[], x :int) :int {
  return util.Search(a.length, (i :int) => a[i].offset > x) - 1
}

// -----------------------------------------------------------------

// A FileSet represents a set of source files
export class FileSet { constructor(
  public base:  int = 1,      // base offset for the next file. 0 == NoPos
    // Base is the minimum base offset that must be provided to
    // AddFile when adding the next file.

  public files: File[] = [],  // list of files in the order added to the set
  public last:  File|null = null,  // cache of last file looked up
  ) {}

  // AddFile adds a new file with a given filename, base offset, and file size
  // to the file set s and returns the file. Multiple files may have the same
  // name. The base offset must not be smaller than the FileSet's Base(), and
  // size must not be negative. As a special case, if a negative base is
  // provided, the current value of the FileSet's Base() is used instead.
  //
  // Adding the file will set the file set's Base() value to base + size + 1
  // as the minimum base value for the next file. The following relationship
  // exists between a Pos value p for a given file offset offs:
  //
  //  int(p) = base + offs
  //
  // with offs in the range [0, size] and thus p in the range [base, base+size].
  // For convenience, File.Pos may be used to create file-specific position
  // values from a file offset.
  //
  addFile(filename :string, size :int, base :int = -1) :File {
    let s = this
    if (base < 0) {
      base = s.base
    }
    if (base < s.base || size < 0) {
      panic("illegal base or size")
    }
    // base >= s.base && size >= 0
    const f = new File(s, filename, base, size, [0])
    base += size + 1 // +1 because EOF also has a position
    if (base < 0) {
      panic("Pos offset overflow (too much source code in file set)")
    }
    // add the file to the file set
    s.base = base
    s.files.push(f)
    s.last = f
    return f
  }

}


function searchInts(a :ArrayLike<int>, x :int) :int {
  // Inlined version of
  //  return util.Search(a.length, i => a[i] > x) - 1
  //
  let i = 0, j = a.length
  while (i < j) {
    const h = i + (((j-i)/2) >> 0) // avoid overflow when computing h
    // i ≤ h < j
    if (a[h] <= x) {
      i = h + 1
    } else {
      j = h
    }
  }
  return i - 1
}
