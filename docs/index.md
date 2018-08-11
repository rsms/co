---
layout: page
---

# The Co programming language

Go, TypeScript, Koka, Kotlin, Clojure and WebAssembly walks into a bar...



Programs are divided into packages than can be imported.

```co
import "foo"
import bar "bar"
import . "lol/cat"
import (
  "bob-hello"
  bar2 "alt/bar"
  . "meow"
)
```

Functions are defined with the `fun` keyword.

```co
// simple, empty functions
fun empty0
fun empty1()
fun empty2(
  // no implicit semicolons inserted here
)
fun empty3() {}

// parameters
fun fp2(int, int) int // types only
fun fp1(a, b, c int) int // shorthand type
fun fp3(a, b, c int) int { 0 } // with body
fun fp4(a, b int, d, e f32) int { 0 } // shorthand types
// fun fp5(a int, int)int //error: mixed named and unnamed function parameters
// fun fp6(pkg.T int) {} // error: illegal parameter name

// trailing commas in params
// fun fp7(,) // error: unexpected ,, expecting name or type
// fun fp9(;) // error: unexpected ;, expecting name or type
fun fp10(int,)
fun fp11(a, b int,)

// rest
fun rest1(a ...int) {}
fun rest2(a, b ...int) {} // == (a int, b ...int)
// fun rest3(a ...int, b ...int) {} // error: can only use ... with final param
// fun rest4(a ...) {} // error: unexpected ), expecting type after ...

// result
fun fr0() int {}
fun fr1() (int) {}
fun fr2() (int,) {}
fun fr3() () {}
fun fr4() (i32, i64) {}
// fun fr5() (a t0) {} // error: unexpected name, expecting comma, or )

// single-expression body
fun fx0(a int) int -> 4
fun fx1(a int) -> (4, 4)
fun fx2() -> 4
fun fx3 -> 4
// fun fx4(b) int -> ; // error: missing function body
// fun fx5(b) -> ; // error: missing function body
// fun fx6 -> ; // error: missing function body
// fun fx7 -> return 3 // error: unexpected return, expecting expression

// used as an expression
fe0 = fun foo0(int) { 4 }
fe1 = fun foo1(int) -> 4
fe2 = fun (int) { 4 } // name is optional when used as an expression
fe3 = fun (int) -> 4
fe4 = fun -> 4
// fe5 = fun (d) int // error: missing function body

// funfunfun
fun a() ->
  fun b() ->
    fun c() -> 123


```

There are tuples, too, with compile-time indexing.

```co
fun tuple1 {
  xs = (1, 2.3, true, "3")  // type: (i32, f64, bool, str<1>)

  // constant-expression field access (all these accesses field 1 <f64>)
  _ = xs[1]
  _ = xs[+1]
  a = -1 ; _ = xs[-a]
  b = -2 ; _ = xs[^b]
  c u32 = 0xfffffffe ; _ = xs[^c]
  d u64 = 0xfffffffffffffffe ; _ = xs[^d]
  e i64 = -2 ; _ = xs[^e]
  f i64 = 3 ; _ = xs[f + b]
  g = 3 ; _ = xs[g + b]
  _ = xs[g >> 1]
  h1 = 1 ; h2 = h1 + 1 ; h3 = h2 - 1 ; h4 = h3 ; _ = xs[h4]

  // literal field access
  _ = xs.0  // int
  _ = xs.1  // f64
  _ = xs.2  // bool
  _ = xs.3  // str<1>
  // // _ = xs.4 // error: out-of-bounds tuple index 4 on type (int, ...)

  // slicing tuples
  _ = xs[1:3]  // (f64, bool)
  _ = xs[1:]   // (f64, bool, str<1>)
  _ = xs[:3]   // (i32, f64, bool)
  _ = xs[:]    // (i32, f64, bool, str<1>)
  // _ = xs[1:2]  // invalid single-element slice of type ...
  // _ = xs[2:2] // invalid empty slice: 2 == 2
  // _ = xs[2:1] // error: invalid slice index: 2 > 1
  // _ = xs[4:] // invalid for tuples; would yield empty tuple

  // error: non-constant tuple index
  // k = 0
  // if k == 0 { k = k + 1 }  // makes k variable
  // e0 = xs[k] // error: non-constant tuple index
}

fun late1 {
  // late resolution
  xs2 = (1, latestr)  // resolved to (int, str<5>) in post-resolve
  v = xs2.1  // resolved to str<5> in post-resolve
}

latestr = "hello"
```

[More examples ->](https://github.com/rsms/co/tree/master/example)
