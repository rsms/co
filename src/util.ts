export type StrWriter = (s: string) => void

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

// serialize works on a collection of promieses.
// It's similar to Promise.all but instead of being concurrent, this function
// executes each promise serially; in order.
//
// Example:
//   let foo = (msg :string, delay :number) =>
//     new Promise<string>(res => setTimeout(() => { log(msg); res(msg) }, delay))
//   let inputs :[string,number][] = [
//     ["hello", 10],["world",50],["good night",0]]
//   serialize(inputs.map(a=>()=>foo(a[0],a[1]))).then(results => log({results}))
//   // Console: hello\nworld\ngood night\n
//   Promise.all(inputs.map(a=>foo(a[0],a[1]))).then(results => log({results}))
//   // Console: good night\nhello\nworld\n
//
export function serialize<T>(v :(()=>Promise<T>)[]) :Promise<T[]> {
  let results :T[] = []
  let p = v[0]()
  for (let i = 1; i < v.length; i++) {
    let f = v[i]
    p = p.then(r => (results.push(r), f()))
  }
  return p.then(r => (results.push(r), results))
}

// bufcopy creates a new buffer containing bytes with some additional space.
//
export function bufcopy(bytes :ArrayLike<byte>, addlSize :int) {
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


export interface ByteWriter {
  writeByte(b :int) :void
  writeNbytes(b :int, n :int) :void
  write(src :Uint8Array, srcStart? :int, srcEnd? :int) :int
}


export class AppendBuffer implements ByteWriter {
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

  // bytes returns a Uint8Array of the written bytes which references the underlying storage.
  // Further modifications are observable both by the receiver and the returned array.
  // Use
  //
  bytes() :Uint8Array {
    return this.buffer.subarray(0, this.length)
  }

  // bytesCopy returns a Uint8Array of the written bytes as a copy.
  //
  bytesCopy() :Uint8Array {
    return this.buffer.slice(0, this.length)
  }

  // slice(start :int = 0, end? :int) :Uint8Array {
  //   const _end = end === undefined ? this.length : Math.min(this.length, end)
  //   if (this.buffer.length - (_end - start) < 128) {
  //     // trade memory usage for speed by avoiding allocation & copy
  //     return this.buffer.subarray(start, _end)
  //   }
  //   return this.buffer.slice(start, _end)
  // }

  writeByte(b :int) :void {
    if (this.length >= this.buffer.length) {
      this._grow(8)
    }
    this.buffer[this.length++] = b
  }

  // write b n times
  writeNbytes(b :int, n :int) :void {
    if (this.length + n >= this.buffer.length) {
      this._grow(n)
    }
    let end = this.length + n
    this.buffer.fill(b, this.length, end)
    this.length = end
  }

  write(src :Uint8Array, srcStart? :int, srcEnd? :int) :int {
    if (srcStart === undefined) {
      srcStart = 0
    }
    const end = (srcEnd === undefined) ? src.length : srcEnd
    const size = end - srcStart
    if (this.length + size >= this.buffer.length) {
      this._grow(size)
    }
    this.buffer.set(src.subarray(srcStart, srcEnd), this.length)
    this.length += size
    return size
  }

  private _grow(minAddlSize :int) {
    this.buffer = bufcopy(
      this.buffer,
      Math.max(minAddlSize, this.buffer.length)
    )
  }
}

const stackFrameRe = /\s*at\s+(?:[^\s]+\.|)([^\s\.]+)\s+(?:\[as ([^\]]+)\]\s+|)\((?:.+[\/ ]src\/([^\:]+)|([^\:]*))(?:\:(\d+)\:(\d+)|.*)\)/
  // 1: name
  // 2: as-name | undefined
  // 3: src-filename
  // 4: filename
  // 5: line
  // 6: column

// debug function
export const debuglog = DEBUG ? _debuglog : function(..._ :any[]){}

function _debuglog(...v :any[]) {
  let stackFrame = ""
  if (Error.captureStackTrace) {
    const e = {stack:''}
    Error.captureStackTrace(e, _debuglog)
    stackFrame = e.stack.split(/\n/, 2)[1]
  } else {
    let e = new Error()
    if (e.stack) {
      stackFrame = e.stack.split(/\n/, 3)[2]
    }
  }

  let prefix = "DEBUG>"
  let suffix = ""

  if (stackFrame) {
    let m = stackFrameRe.exec(stackFrame)
    // example: "at Foo.bar [as lol] (/<co> src/parser.ts:1839:5)"
    // m = { 1:"bar", 2:"lol", 3:"parser.ts",               5:"1839", 6:"5" }
    //
    // example: "at Foo.bar (/<co> src/parser.ts:1839:5)"
    // m = { 1:"bar",          3:"parser.ts",               5:"1839", 6:"5" }
    //
    // example: "at Foo.bar [as lol] (/abc/def:123:45)"
    // m = { 1:"bar", 2:"lol",                4:"/abc/def", 5:"123", 6:"45" }
    //
    // example: "at Foo.bar [as lol] (blabla)"
    // m = { 1:"foo",                         4:"blabla"                    }
    //
    if (m) {
      const fun = m[2] || m[1]
      const origin = m[3] || m[4]
      prefix = fun + '>'
      if (origin) {
        const trmsg = String(v[0])
        if (trmsg.indexOf('TODO:') == 0 || trmsg.indexOf('TODO ') == 0) {
          // message start with "TODO"
          prefix = 'TODO src/' + origin + ' ' + fun + '>'
          v[0] = trmsg.substr(5).replace(/^\s*/, '')
        }
        suffix = `at src/${origin}:${m[5]}:${m[6]}`
      }
    }
  }

  v.splice(0, 0, prefix)
  if (suffix) {
    v.push(suffix)
  }
  console.log.apply(console, v)
}


// is2pow returns true if n is a power-of-two number.
// n must be a positive non-zero integer.
//
export function is2pow(n :int) :bool {
  assert(n > 0)
  return (n & (n - 1)) == 0
}

// mstr takes a multi-line string as input and strips a whitespace prefix from each line
// when the last line is purely whitespace.
//
export function mstr(s :string) :string {
  let p = s.lastIndexOf("\n")
  if (p == -1) { return s }
  let ind = s.substr(p + 1)
  for (let i = 0; i < ind.length; i++) {
    let c = ind.charCodeAt(i)
    if (c != 0x20 && c != 0x09) { // SP TAB
      // last line is not just whitespace -- treat as vanilla string
      return s
    }
  }
  s = s.substr(s.charCodeAt(0) == 0x0A ? 1 : 0, p) // strip first LF + last line
  let lines :string[] = []
  for (let line of s.split("\n")) {
    if (line.length == 0) {
      lines.push(line)
    } else if (!line.startsWith(ind)) {
      // some line does not begin with ind -- treat as vanilla string
      return s
    } else {
      lines.push(line.substr(ind.length))
    }
  }
  return lines.join("\n")
}
