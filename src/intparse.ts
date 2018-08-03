import { Int64, UInt64, SInt64 } from './int64'
// import { debuglog as dlog } from './util'

const u64MaxByRadix = [
  '', '',
  '1111111111111111111111111111111111111111111111111111111111111111',
    // base 2
  '11112220022122120101211020120210210211220', // base 3
  '33333333333333333333333333333333',          // base 4
  '2214220303114400424121122430',              // base 5
  '3520522010102100444244423',                 // base 6
  '45012021522523134134601',                   // base 7
  '1777777777777777777777',                    // base 8
  '145808576354216723756',                     // base 9
  '18446744073709551615',                      // base 10
  '335500516a429071284',                       // base 11
  '839365134a2a240713',                        // base 12
  '219505a9511a867b72',                        // base 13
  '8681049adb03db171',                         // base 14
  '2c1d56b648c6cd110',                         // base 15
  'ffffffffffffffff',                          // base 16
  '67979g60f5428010',                          // base 17
  '2d3fgb0b9cg4bd2f',                          // base 18
  '141c8786h1ccaagg',                          // base 19
  'b53bjh07be4dj0f',                           // base 20
  '5e8g4ggg7g56dif',                           // base 21
  '2l4lf104353j8kf',                           // base 22
  '1ddh88h2782i515',                           // base 23
  'l12ee5fn0ji1if',                            // base 24
  'c9c336o0mlb7ef',                            // base 25
  '7b7n2pcniokcgf',                            // base 26
  '4eo8hfam6fllmo',                            // base 27
  '2nc6j26l66rhof',                            // base 28
  '1n3rsh11f098rn',                            // base 29
  '14l9lkmo30o40f',                            // base 30
  'nd075ib45k86f',                             // base 31
  'fvvvvvvvvvvvv',                             // base 32
  'b1w8p7j5q9r6f',                             // base 33
  '7orp63sh4dphh',                             // base 34
  '5g24a25twkwff',                             // base 35
  '3w5e11264sgsf',                             // base 36
]

const _U32_CUTOFF = 0xFFFFFFFF >>> 0

export class IntParser {
  int32val :int = 0
  int64val :Int64 | null = null

  private _ndigits = 0      // total digit count
  private _ndigitsChunk = 0 // digit count per i32 chunk
  private _radix = 10
  private _signed :bool = false
  private _neg :bool = false
  private _s32cutoff = 0 | 0

  init(radix :int, signed :bool, negative :bool) {
    assert(signed || (!signed && !negative), 'invalid unsigned and negative')

    this.int32val = 0
    this.int64val = null

    this._ndigits = 0
    this._ndigitsChunk = 0
    this._radix = radix
    this._signed = signed
    this._neg = negative

    if (signed) {
      this._s32cutoff = negative ? 0x80000000 : 0x7FFFFFFF
      this.parseval = this.parseval_s32
    } else {
      this.parseval = this.parseval_u32
    }
  }

  // parsedigit parses an ASCII digit
  //
  parsedigit(c :int) {
    let n = 37  // max base + 1 since we compare with base/radix later
    if (c >= 0x30 && c <= 0x39) { // 0..9
      n = c - 0x30
    } else if (c >= 0x41 && c <= 0x5A) { // A..Z
      n = c - (0x41 - 10)
    } else if (c >= 0x61 && c <= 0x7A) { // a..z
      n = c - (0x61 - 10)
    }
    if (n <= this._radix) {
      return this.parseval(n)
    }
  }

  // parseval parses a digit value
  //
  // It is dynamically redirected to a parsing function depending on the
  // current magnitude of the number and if its signed or negative.
  //
  parseval :(n :int)=>void


  private parseval_s32(n :int) {
    let p = this
    let nextval = (p.int32val * p._radix) + n
    if (nextval > this._s32cutoff) {
      // i32 -> i64
      p.int64val = SInt64.fromInt32(p.int32val)
      p.int32val = n
      p._ndigits = p._ndigitsChunk
      p._ndigitsChunk = 1
      p.parseval = p.parseval_s64
      // dlog(`[intParser] s32 -> s64  starting at ${p.int64val}`)
    } else {
      p.int32val = nextval
      p._ndigitsChunk++
    }
  }

  private parseval_s64(n :int) {
    let p = this
    let nextval = (p.int32val * p._radix) + n
    if (nextval > this._s32cutoff) {
      // i64 -> big
      let radixToPower = UInt64.fromFloat64(
        Math.pow(p._radix, p._ndigitsChunk)
      )
      p.int64val = (p.int64val as SInt64).mul(radixToPower).add(
        SInt64.fromFloat64(p.int32val)
      )
      p.int32val = n
      p._ndigits += p._ndigitsChunk
      p._ndigitsChunk = 1
      p.parseval = p.parseval_sbig
      // dlog(`[intParser] s64 -> sbig  starting at ${p.int64val}`)
    } else {
      p.int32val = nextval
      p._ndigitsChunk++
    }
  }


  private parseval_u32(n :int) {
    let p = this
    let nextval = (p.int32val * p._radix) + n
    if (nextval > _U32_CUTOFF) {
      // i32 -> i64
      p.int64val = UInt64.fromInt32(p.int32val)
      p.int32val = n
      p._ndigits = p._ndigitsChunk
      p._ndigitsChunk = 1
      p.parseval = p.parseval_u64
      // dlog(`[intParser] u32 -> u64  starting at ${p.int64val}`)
    } else {
      p.int32val = nextval
      p._ndigitsChunk++
    }
  }

  private parseval_u64(n :int) {
    let p = this
    let nextval = (p.int32val * p._radix) + n
    if (nextval > _U32_CUTOFF) {
      // i64 -> big
      let radixToPower = UInt64.fromFloat64(
        Math.pow(p._radix, p._ndigitsChunk)
      )
      p.int64val = (p.int64val as UInt64).mul(radixToPower).add(
        UInt64.fromFloat64(p.int32val)
      )
      p.int32val = n
      p._ndigits += p._ndigitsChunk
      p._ndigitsChunk = 1
      p.parseval = p.parseval_ubig
      // dlog(`[intParser] u64 -> ubig  starting at ${p.int64val}`)
    } else {
      p.int32val = nextval
      p._ndigitsChunk++
    }
  }

  private parseval_ubig(_n :int) {
    // not implemented
    this._ndigitsChunk++
  }

  private parseval_sbig(_n :int) {
    // not implemented
    this._ndigitsChunk++
  }

  private overflow() :bool {
    let p = this
    p.int32val = NaN
    p.int64val = null
    return false
  }

  // finalize performs any final parsing required
  //
  finalize() :bool {
    let p = this

    if (!p.int64val) {
      if (p._neg) {
        p.int32val = -p.int32val
      }
      return true  // valid
    }

    assert(p._ndigitsChunk > 0, 'started int64val but did not read digit')

    let power = UInt64.fromFloat64(Math.pow(p._radix, p._ndigitsChunk))

    if (power._high >= p._radix) {
      return p.overflow()
    }

    if (p._signed) {
      if (p.parseval === p.parseval_sbig) {
        if (p._ndigitsChunk > 1) {
          // did transition into big and contains at least one digit past i64
          return p.overflow()
        }
      } else if (p.int64val._high != 0 && p.int32val != 0) {
        // special case for -0x8000000000000001 (SINT64_MIN - 1)
        return p.overflow()
      }

      let n = p.int64val.mul(power).add(SInt64.fromInt32(p.int32val))

      if (n._high < 0 && (!p._neg || n._low != 0 || n._high != -2147483648)) {
        assert(n.lt(SInt64.ZERO)) // make sure it actually overflowed
        // Note on (n._low != 0 || n._high != -2147483648):
        // checks for the specific case of exactly SInt64.MIN which does
        // cause overflow because of the sign bit.
        return p.overflow()
      }

      p.int64val = n

    } else {
      // unsigned
      let ndigits = p._ndigits + p._ndigitsChunk
      let maxstr = u64MaxByRadix[p._radix]

      if (
        (p.parseval === p.parseval_ubig && p._ndigitsChunk > 1) ||
        ndigits > maxstr.length
      ) {
        return p.overflow()
      }

      if (ndigits == maxstr.length && p.int64val._high == 0) {
        let maxstr_low = maxstr.substr(0, p._ndigits)
        let low = p.int64val._low >>> 0
        if (maxstr_low < low.toString(p._radix)) {
          return p.overflow()
        }
      }

      p.int64val = p.int64val.mul(power).add(UInt64.fromInt32(p.int32val))

      if (p.int64val._high == 0) {
        // overflowed by just a bit
        return p.overflow()
      }
    }

    p.int32val = NaN

    if (p._neg) {
      assert(p._signed)
      p.int64val = p.int64val.neg()
    }

    return true
  }

}
