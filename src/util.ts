import * as utf8 from './utf8'

// export function SplitFileExt(path :string) :[string, string] {
//   let p = path.lastIndexOf('/')
//   p = path.lastIndexOf('.', p == -1 ? 0 : p)
//   return p == -1 ? [path, ''] : [path.substr(0, p), path.substr(p)]
// }

// export function SplitPath(path :string) :[string, string] {
//   const p = path.lastIndexOf('/')
//   return p == -1 ? ['.', path] : [path.substr(0, p), path.substr(p+1)]
// }

export function search(n :number, f :(n:number)=>bool) :int {
  // Define f(-1) == false and f(n) == true.
  // Invariant: f(i-1) == false, f(j) == true.
  let i = 0, j = n
  while (i < j) {
    const mid = i + (((j-i)/2) >> 0) // avoid overflow and truncate to int
    // i ≤ h < j
    if (!f(mid)) {
      i = mid + 1 // preserves f(i-1) == false
    } else {
      j = mid // preserves f(j) == true
    }
  }
  // i == j, f(i-1) == false, and f(j) (= f(i)) == true  =>  answer is i.
  return i
}

// bufcopy creates a new buffer containing bytes with some additional space.
//
function bufcopy(bytes :ArrayLike<byte>, addlSize :int) {
  const size = bytes.length + addlSize
  const b2 = new Uint8Array(size)
  b2.set(bytes, 0)
  // const b = Buffer.allocUnsafe(size)
  // this.buffer.copy(b)
  return b2
}


// str8buf creates a new buffer based on a string.
// Each character in the string is interpreted as an 8-bit UTF-8 byte.
//
export function str8buf(s :string) :Uint8Array {
  return Uint8Array.from(
    s as any as ArrayLike<number>,
    (v: number, k: number) => s.charCodeAt(k)
  )
}

// buf8str interprets a byte array as UTF-8 text
//
export function buf8str(b :Uint8Array) :string {
  return utf8.decodeToString(b)
}


// bufcmp compares two arrays of bytes
//
export function bufcmp(
  a       :ArrayLike<byte>,
  b       :ArrayLike<byte>,
  aStart  :int = 0,
  aEnd    :int = a.length,
  bStart  :int = 0,
  bEnd    :int = b.length,
) :int {
  if (a === b) {
    return 0
  }
  var ai = aStart, bi = bStart
  for (; ai != aEnd && bi != bEnd; ++ai, ++bi) {
    if (a[ai] < b[bi]) { return -1 }
    if (b[bi] < a[ai]) { return 1 }
  }
  var aL = aEnd - aStart, bL = bEnd - bStart
  return (
    aL < bL ? -1 :
    bL < aL ? 1 :
    0
  )
}


// asbuf returns a byte buffer for a
// 
export let asbuf :(a :ArrayLike<byte>) => Uint8Array


if (typeof Buffer != 'undefined') {

  asbuf = (a :ArrayLike<byte>) => {
    if (a instanceof Buffer || a instanceof Uint8Array) {
      return a as Uint8Array
    }

    if (
      (a as any).buffer &&
      (a as any).byteOffset !== undefined &&
      (a as any).byteLength !== undefined
    ) {
      return Buffer.from(
        (a as any).buffer as ArrayBuffer,
        (a as any).byteOffset as int,
        (a as any).byteLength as int
      ) as Uint8Array
    }

    const buf = Buffer.allocUnsafe(a.length)
    for (let i = 0; i < a.length; ++i) {
      buf[i] = a[i]
    }
    return buf as Uint8Array
  }

  // function asnodebuf(a :ArrayLike<byte>) :Buffer {
  //   return (a instanceof Buffer) ? a : new Buffer(asbuf(a))
  // }

  // bufcmp1 = (a, b, aStart, aEnd, bStart, bEnd) => {
  //   if (a === b) {
  //     return 0
  //   }

  //   // Note: although TS type decarations may say that Buffer.compare
  //   // only accepts a Buffer, in fact it also accepts a Uint8Array.
  //   if (a instanceof Buffer &&
  //       (b instanceof Buffer || b instanceof Uint8Array))
  //   {
  //     return a.compare(b as Buffer, bStart, bEnd, aStart, aEnd)
  //   }

  //   if (b instanceof Buffer &&
  //       (a instanceof Buffer || a instanceof Uint8Array))
  //   {
  //     return b.compare(a as Buffer, aStart, aEnd, bStart, bEnd)
  //   }

  //   const abuf = asnodebuf(a)
  //   const bbuf = asbuf(b) as Buffer

  //   return abuf.compare(bbuf, bStart, bEnd, aStart, aEnd)
  // }
}


export class AppendBuffer {
  buffer :Uint8Array
  length :int // current offset

  constructor(size :int) {
    this.length = 0
    this.buffer = new Uint8Array(size)
  }

  reset() {
    this.length = 0
  }

  // Make sure there's space for at least `size` additional bytes
  reserve(addlSize :int) {
    if (this.length + addlSize >= this.buffer.length) {
      this._grow(addlSize)
    }
  }

  subarray() :Uint8Array {
    return this.buffer.subarray(0, this.length)
  }

  // slice() :Uint8Array {
  //   return this.buffer.slice(0, this.length)
  // }
  // slice(start :int = 0, end? :int) :Uint8Array {
  //   const _end = end === undefined ? this.length : Math.min(this.length, end)
  //   if (this.buffer.length - (_end - start) < 128) {
  //     // trade memory usage for speed by avoiding allocation & copy
  //     return this.buffer.subarray(start, _end)
  //   }
  //   return this.buffer.slice(start, _end)
  // }

  append(b :int) :void {
    if (this.length >= this.buffer.length) {
      this._grow()
    }
    this.buffer[this.length++] = b
  }

  appendRange(src :Uint8Array, srcStart :int, srcEnd? :int) :void {
    const end = (srcEnd === undefined) ? src.length : srcEnd
    const size = end - srcStart
    if (this.length + size >= this.buffer.length) {
      this._grow(size)
    }
    this.buffer.set(src.subarray(srcStart, srcEnd), this.length)
    this.length += size
  }

  private _grow(minAddlSize :int = 8) {
    this.buffer = bufcopy(
      this.buffer,
      Math.min(minAddlSize, this.buffer.length)
    )
  }
}

// debug function
export const debuglog = DEBUG ? function(...v :any[]) {
  let e = new Error()
  let sframe = 'DEBUG'

  // let srcloc = ''
  // if (e.stack) {
  //   sframe = e.stack.split(/\n/, 3)[2]
  //   let m = /\s*at\s+(?:[^\s]+\.|)([^\s\.]+)\s+\(.+\/(src\/.+)\)/.exec(sframe)
  //   if (m) {
  //     sframe = m[1]
  //     srcloc = m[2]
  //   }
  // }

  if (e.stack) {
    sframe = e.stack.split(/\n/, 3)[2]
    let m = /\s*at\s+(?:[^\s]+\.|)([^\s\.]+)/.exec(sframe)
    if (m) {
      sframe = m[1]
    }
  }

  let args = Array.prototype.slice.call(arguments)
  args.splice(0, 0, `${sframe}>`)
  // if (srcloc) {
  //   args.splice(args.length, 0, `(${srcloc})`)
  // }
  console.log.apply(console, args)
} : function(...v :any[]){}
