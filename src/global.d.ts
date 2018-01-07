type int = number
type byte = number
type bool = boolean

declare var AssertionError :ErrorConstructor
declare const DEBUG :boolean
declare const VERSION :string

// panic prints a message, stack trace and exits the process
//
declare function panic(msg :any, ...v :any[]) :void

// assert checks the condition for truth, and if false, prints an optional
// message, stack trace and exits the process.
// assert is removed in release builds
//
declare function assert(cond :any, msg? :string, cons? :Function) :void

// repr resturns a detailed string representation of the input
//
declare function repr(obj :any) :string

// TEST can be called at init time to add a unit test to be run at startup.
// Only active in debug builds (when DEBUG is true.)
//
declare function TEST(name :string, testFn :()=>any) :void
declare function TEST(testFn :()=>any) :void
