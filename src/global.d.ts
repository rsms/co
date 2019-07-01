type int = number
type byte = number
type bool = boolean

// writable version of ArrayLike
interface WArrayLike<T> {
  length: number
  [n: number]: T
}

declare var AssertionError :ErrorConstructor
declare const DEBUG :boolean
declare const VERSION :string
declare const GlobalContext :{[k:string]:any}

// panic prints a message to stderr, equivalent to console.log
//
declare function print(msg :any, ...v :any[]) :void

// panic prints a message to stderr, stack trace and exits the process
//
declare function panic(msg :any, ...v :any[]) :void

// assert checks the condition for truth, and if false, prints an optional
// message, stack trace and exits the process.
// assert is removed in release builds
//
// declare function assert(cond :any, msg? :string, cons? :Function) :void
declare interface AssertFun {
  (cond :any, msg? :string, cons? :Function) :void

  // throws can be set to true to cause assertions to be thrown as exceptions,
  // or set to false to cause the process to exit.
  // Only has an effect in Nodejs-like environments.
  // false by default.
  throws :bool
}
declare var assert :AssertFun

// repr resturns a detailed string representation of the input
//
declare function repr(obj :any, maxdepth? :int) :string

// TEST can be called at init time to add a unit test to be run at startup.
// Only active in debug builds (when DEBUG is true.)
//
declare function TEST(name :string, testFn :()=>any) :void
declare function TEST(testFn :()=>any) :void

// needed for older typescript
// declare namespace WebAssembly {
//   interface Export {
//     kind: string
//     name: string
//   }
//   interface Import {
//     module: string
//     kind: string
//     name: string
//   }
//   class Module {
//     constructor (bufferSource: ArrayBuffer|Uint8Array)
//     static customSections(module: Module, sectionName: string): ArrayBuffer[]
//     static exports(module: Module): Export[]
//     static imports(module: Module): Import[]
//   }
//   class Instance {
//     readonly exports: { [name:string]: Function }
//     constructor (module: Module, importObject?: Object)
//   }
//   interface MemoryDescriptor {
//     initial :number
//       // The initial size of the WebAssembly Memory, in units of
//       // WebAssembly pages
//     maximum :number
//       // The maximum size the WebAssembly Memory is allowed to grow to,
//       // in units of WebAssembly pages.
//       // When present, the maximum parameter acts as a hint to the engine
//       // to reserve memory up front.  However, the engine may ignore or clamp
//       // this reservation request.  In general, most WebAssembly modules
//       // shouldn't need to set a maximum.
//   }
//   class Memory {
//     readonly buffer :ArrayBuffer
//     constructor(descriptor :MemoryDescriptor)

//     // grow increases the size of the memory instance by a specified number
//     // of WebAssembly pages.
//     grow(pages :number)
//   }
// }
