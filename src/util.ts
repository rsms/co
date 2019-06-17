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


// asciibuf creates a byte array from a string of ASCII characters.
// The string must only contain character values in the range [0-127].
//
export function asciibuf(s :string) :Uint8Array {
  return Uint8Array.from(
    s as any as ArrayLike<number>,
    (_: number, k: number) => s.charCodeAt(k)
  )
}


// asciistr creates a string from bytes representing ASCII characters.
// The byte array must only contain values in the range [0-127].
//
export function asciistr(b :ArrayLike<byte>) :string {
  return String.fromCharCode.apply(null, b)
}


// asciistrn is just like asciistr but implements efficient parsing of
// subarrays and only works with Uint8Array
//
export var asciistrn :(b :Uint8Array, start :int, end :int)=>string = (
  typeof Buffer == 'function' ?
  function asciistrn(b :Uint8Array, start :int, end :int) :string {
    // make use of faster nodejs Buffer implementation
    return Buffer.from(
      b.buffer,
      b.byteOffset + start,
      end - start,
    ).toString('ascii')
  } :
  function asciistrn(b :Uint8Array, start :int, end :int) :string {
    // fallback implementation
    b = start > 0 && end < b.length ? b.subarray(start, end) : b
    return String.fromCharCode.apply(null, b)
  }
)


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
  let prefix = ''

  if (e.stack) {
    // let m = /\s*at\s+(?:[^\s]+\.|)([^\s\.]+)/.exec(e.stack.split(/\n/, 3)[2])
    let m = /\s*at\s+(?:[^\s]+\.|)([^\s\.]+)\s+\(.+\/src\/(.+)\)/.exec(
      e.stack.split(/\n/, 3)[2]
    )
    if (m) {
      const fun = m[1]
      const origin = m[2]
      if (origin) {
        const filename = origin.split('.ts:', 1)[0]
        const trmsg = String(v[0])
        if (trmsg.indexOf('TODO:') == 0 || trmsg.indexOf('TODO ') == 0) {
          // message start with "TODO"
          prefix = 'TODO src/' + origin + ' ' + fun + '>'
          v[0] = trmsg.substr(5).replace(/^\s*/, '')
        } else {
          prefix = filename + '/' + fun + '>'
        }
      } else {
        prefix = fun + '>'
      }
    } else {
      prefix = 'DEBUG>'
    }
  }

  v.splice(0, 0, prefix)
  console.log.apply(console, v)
} : function(..._ :any[]){}


// is2pow returns true if n is a power-of-two number.
// n must be a positive non-zero integer.
//
export function is2pow(n :int) :bool {
  assert(n > 0)
  return (n & (n - 1)) == 0
}
