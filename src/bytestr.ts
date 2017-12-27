import { bufcmp } from './util'
import * as utf8 from './utf8'
//
// Interned byte strings
//

let _nextId = 0

export class ByteStr {
  readonly _id :int = _nextId++ // only for debugging
  constructor(
  readonly hash  :int,
  readonly bytes :Uint8Array,
  ){}

  toString() :string {
    return utf8.decodeToString(this.bytes)
  }
}

export class ByteStrSet {
  _m = new Map<int,ByteStr[]>() // naive implementation
  // TODO: use a rb-tree or something like that

  emplace(value :Uint8Array, hash :int = 0) :ByteStr {
    if (!hash) {
      hash = hashBytes(value, 0, value.length)
    }
    let v = this._m.get(hash)
    if (v) {
      for (let bs of v) {
        if (bs.bytes.length == value.length && bufcmp(bs.bytes, value) == 0) {
          return bs
        }
      }
      const bs = new ByteStr(hash, value)
      v.push(bs)
      return bs
    } else {
      const bs = new ByteStr(hash, value)
      this._m.set(hash, [bs])
      return bs
    }
  }
}

// hashBytes returns an unsigned 31 bit integer hash of an array of bytes.
// It's using the FNV1a algorithm which is very fast and has good distribution
// for common short names (based on tests on a large corpus of go source code.)
//
export function hashBytes(buf :ArrayLike<byte>, offs :int, length :int) {
  // This function must exactly match what's in scanner.
  var h = 0x811c9dc5, i = offs, e = offs + length
  while (i < e) {
    h = (h ^ buf[i++]) * 0x1000193
  }
  return h >>> 0
}
