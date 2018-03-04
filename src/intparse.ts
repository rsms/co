import { Int64, UInt64 } from './int64'
import { strtou } from './strtou'
import { debuglog as dlog } from './util'

const IntParserI32 = 0
const IntParserI64 = 1
const IntParserBigInt = 2

const UInt64MaxByRadix = [
  '', '',
  '1111111111111111111111111111111111111111111111111111111111111111',  // base 2
  '11112220022122120101211020120210210211220',  // base 3
  '33333333333333333333333333333333',  // base 4
  '2214220303114400424121122430',  // base 5
  '3520522010102100444244423',  // base 6
  '45012021522523134134601',  // base 7
  '1777777777777777777777',  // base 8
  '145808576354216723756',  // base 9
  '18446744073709551615',  // base 10
  '335500516a429071284',  // base 11
  '839365134a2a240713',  // base 12
  '219505a9511a867b72',  // base 13
  '8681049adb03db171',  // base 14
  '2c1d56b648c6cd110',  // base 15
  'ffffffffffffffff',  // base 16
  '67979g60f5428010',  // base 17
  '2d3fgb0b9cg4bd2f',  // base 18
  '141c8786h1ccaagg',  // base 19
  'b53bjh07be4dj0f',  // base 20
  '5e8g4ggg7g56dif',  // base 21
  '2l4lf104353j8kf',  // base 22
  '1ddh88h2782i515',  // base 23
  'l12ee5fn0ji1if',  // base 24
  'c9c336o0mlb7ef',  // base 25
  '7b7n2pcniokcgf',  // base 26
  '4eo8hfam6fllmo',  // base 27
  '2nc6j26l66rhof',  // base 28
  '1n3rsh11f098rn',  // base 29
  '14l9lkmo30o40f',  // base 30
  'nd075ib45k86f',  // base 31
  'fvvvvvvvvvvvv',  // base 32
  'b1w8p7j5q9r6f',  // base 33
  '7orp63sh4dphh',  // base 34
  '5g24a25twkwff',  // base 35
  '3w5e11264sgsf',  // base 36
]

export class IntParser {
  int32val :int = 0
  int64val :UInt64 | null = null

  _stage = IntParserI32
  _ndigits = 0      // total digit count
  _ndigitsChunk = 0 // digit count per i32 chunk
  _radix = 10

  constructor(){}

  init(radix :int) {
    this.int32val = 0
    this.int64val = null

    this._stage = IntParserI32
    this._ndigits = 0
    this._ndigitsChunk = 0
    this._radix = radix
  }

  addchar(c :int) {
    let n = 37  // max base + 1 since we compare with base/radix later
    if (c >= 0x30 && c <= 0x39) { // 0..9
      n = c - 0x30
    } else if (c >= 0x41 && c <= 0x5A) { // A..Z
      n = c - (0x41 - 10)
    } else if (c >= 0x61 && c <= 0x7A) { // a..z
      n = c - (0x61 - 10)
    }
    if (n <= this._radix) {
      return this.add(n)
    }
  }

  add(n :int) {
    let p = this
    let nextval = (p.int32val * p._radix) + n

    switch (p._stage) {

    case IntParserI32: {
      if (nextval > 0xFFFFFFFF) {
        // i32 -> i64
        p.int64val = UInt64.fromInt32(p.int32val)
        p._stage = IntParserI64
        // dlog(`[intParser] i32 -> i64  starting at ${p.int64val}`)

        p.int32val = n
        p._ndigits = p._ndigitsChunk
        p._ndigitsChunk = 1
        return
      }
      break
    }

    case IntParserI64: {
      if (nextval > 0xFFFFFFFF) {
        // i64 -> bigint
        let radixToPower = UInt64.fromFloat64(
          Math.pow(p._radix, p._ndigitsChunk)
        )
        p.int64val = (p.int64val as UInt64).mul(radixToPower).add(
          UInt64.fromFloat64(p.int32val)
        )
        p._stage = IntParserBigInt
        // dlog(`[intParser] i64 -> bigint  starting at ${p.int64val}`)

        p.int32val = n
        p._ndigits += p._ndigitsChunk
        p._ndigitsChunk = 1
        return
      }
      break
    }

    // default: {
    //   console.log('\n\n———————— bigint ————————\n')
    //   break
    // }

    } // switch (p._stage)

    p.int32val = nextval
    p._ndigitsChunk++
  }

  // finalize performs any final parsing required
  //
  finalize() :bool {
    let p = this

    if (p._stage == IntParserI32) {
      // no finalization needed for small numbers
      return true  // valid
    }

    assert(p.int64val != null)
    assert(p._ndigitsChunk > 0)

    let ndigits = p._ndigits + p._ndigitsChunk
    let maxstr = UInt64MaxByRadix[p._radix]

    if (ndigits <= maxstr.length) {
      let power = UInt64.fromFloat64(Math.pow(p._radix, p._ndigitsChunk))
      p.int64val = (p.int64val as UInt64).mul(power).add(
        UInt64.fromFloat64(p.int32val)
      )
      p.int32val = NaN

      if (
        ndigits < maxstr.length ||
        (
          !p.int64val.eqz() &&
          p.int64val.toString(p._radix) <= maxstr
        )
      ) {
        return true  // valid
      }
    }

    // invalid
    p.int64val = null
    p.int32val = NaN
    return false  // invalid
  }

}



// function fmtduration(milliseconds: int) :string {
//   return (
//     milliseconds < 0.001 ? `${(milliseconds * 1000000).toFixed(0)} ns` :
//     milliseconds < 0.01 ? `${(milliseconds * 1000).toFixed(2)} µs` :
//     `${milliseconds.toFixed(2)} ms`
//   )
// }

// let iterations = 100000
// if (process.argv.length > 2) {
//   const n = parseInt(process.argv[2])
//   if (!isNaN(n)) {
//     iterations = n
//   }
// }

// function bench(label :string, f :(i?:int)=>any, countPerIteration :int = 1) {
//   if (typeof global.gc == 'function') {
//     global.gc()
//   }
//   let timeStart = process.hrtime()
//   for (let n = 0; n < iterations; n++) {
//     f(n)
//   }
//   let timeEnd = process.hrtime()
//   let start = (timeStart[0] * 1000) + (timeStart[1] / 1000000)
//   let end = (timeEnd[0] * 1000) + (timeEnd[1] / 1000000)
//   let d = end - start
//   let totalAvg = d / iterations
//   if (countPerIteration > 1) {
//     let itemAvg = d / iterations / countPerIteration
//     console.log(
//       `${label} ${fmtduration(totalAvg)}, ` +
//       `${fmtduration(itemAvg)} per operation (avg)`
//     )
//   } else {
//     console.log(`${label} ${fmtduration(totalAvg)} (avg)`)
//   }
// }



// function digitCount(n :int) :int {
//   return Math.floor(Math.log10(Math.abs(n))) + 1
// }

// function findNDigits() {
//   // 100000000
//   // 1000000001
//   // 999999999
//   // for (let i = 100000000; i < 0xFFFFFFFF; i++) {
//   //   // let n = digitCount(i)
//   //   let n = i.toString(10).length
//   //   if (n == 9) {
//   //     dlog(`${i} has 9 digits`)
//   //   }
//   // }
//   let p = new IntParser()
//   let x :any
//   let samples = [
//     '1234',
//     '100 000 00',
//     '100 000 00',
//     '100 000 000  000 00',
//     '999 999 999  999 99',
//   ]

//   // 2.5 microsec (500 ns / op)

//   bench('a', () => {
//     for (let sample of samples) {
//       p.init(10)
//       let s = sample.replace(/[^0-9]+/g, '')
//       // console.log('parse', s)
//       for (let i = 0; i < s.length; i++) {
//         let c = s.charCodeAt(i)
//         p.parse(c)
//       }
//     }
//   }, samples.length)

//   process.exit(0)
// }

// findNDigits()
