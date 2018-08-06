//
// int64 pseudo-random number generator with seed control
//
// Exported functions:
//   function seed(n :int) :void
//   function sint64rand() :SInt64
//   function uint64rand() :UInt64
//
import { SInt64, UInt64 } from './int64'

interface WasmInterface {
  seed(a :int) :void
  xorshift128plus() :int
  get_high() :int
}

const wasm = (typeof WebAssembly != 'undefined' ?
  new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
    //!<wasmdata src="int64_rand.wast">
    0,97,115,109,1,0,0,0,1,9,2,96,0,1,127,96,1,127,0,3,4,3,0,1,0,6,16,3,126,1,
    66,1,11,126,1,66,2,11,127,1,65,0,11,7,37,3,8,103,101,116,95,104,105,103,
    104,0,0,4,115,101,101,100,0,1,15,120,111,114,115,104,105,102,116,49,50,56,
    112,108,117,115,0,2,10,110,3,4,0,35,2,11,15,0,32,0,173,36,0,32,0,173,66,1,
    124,36,1,11,87,1,4,126,35,0,33,0,35,1,33,1,32,1,36,0,32,0,66,23,134,33,2,
    32,2,32,0,133,33,0,32,0,66,17,136,33,2,32,1,66,26,136,33,3,32,0,32,1,133,
    33,0,32,0,32,3,133,33,0,32,0,32,2,133,33,0,32,0,36,1,32,0,32,1,124,33,1,
    32,1,66,32,135,167,36,2,32,1,167,11
    //!</wasmdata>
  ])), {}).exports as any as WasmInterface :
  null
)

// fallback function for when WebAssembly isn't available
let js_state0 = 1 | 0
let js_state1 = 2 | 0
function i32rand_mwc1616() :int {
  js_state0 = 18030 * (js_state0 & 0xffff) + (js_state0 >> 16)
  js_state1 = 30903 * (js_state1 & 0xffff) + (js_state1 >> 16)
  return js_state0 << 16 + (js_state1 & 0xffff)
}


export const seed :(n :int)=>void = (
  wasm !== null ? wasm.seed : (n :int) => {
    js_state0 = n | 0
    js_state1 = (n + 1) | 0
  }
)

export const sint64rand :()=>SInt64 = (
  wasm !== null ? () => {
    const low = (wasm as WasmInterface).xorshift128plus()
    return new SInt64(low, (wasm as WasmInterface).get_high())
  } : () =>
    new SInt64(i32rand_mwc1616(), i32rand_mwc1616())
)

export const uint64rand :()=>UInt64 = (
  wasm !== null ? () => {
    const low = (wasm as WasmInterface).xorshift128plus()
    return new UInt64(low, (wasm as WasmInterface).get_high())
  } : () =>
    new UInt64(i32rand_mwc1616(), i32rand_mwc1616())
)

// make initial seed actually random
seed((Math.random() * 0xffffffff) >>> 0)
