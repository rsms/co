---
layout: page
title: Patterns
---

# Patterns

Following are different patterns prevalent in day-to-day programming with
some popular languages that target the web platform.
These patterns all have issues, or at least it seems like they where designed with
different things in mind than how they are actually used today.

Outline:

- [Repeat fields over and over](#repeat-fields-over-and-over)
- [Public static private protected](#public-static-private-protected)
- [Implements Interface and redefines it all over](#implements-interface-and-redefines-it-all-over)
- [Named arguments](#named-arguments)
- [import import import import](#import-import-import-import)
- [new](#new)
- [Constructors](#constructors)
- [return](#return)
- [Flow control as expressions](#flow-control-as-expressions)
- [function for clarity](#function-for-clarity)
- [Default initialization](#default-initialization)
- [Go all-in with types](#go-all-in-with-types)
- [this](#this)
- [null — optional values](#null--optional-values)
- [Mutability](#mutability)
- [Multiple return values](#multiple-return-values)
- [Built-in types](#built-in-types)
  - [Array](#array) & [slices](#array-slices)
- [Collections](#collections)

## Repeat fields over and over

```ts
class Foo {
  private _field1 :number
  field2 :string
  field3 :Bar
  field4 :boolean

  constructor(field2 :string, field3 :Bar, field4 :boolean) {
    this.field2 = field2
    this.field3 = field3
    this.field4 = field4
    this._field1 = field4 ? 1 : 0
  }
}
let foo = new Foo(1, "2", three, true)
```

TypeScript allows an alternate and strange constructor syntax to mitigate this
clearly wasteful pattern. However, it's still overly verbose (you have to
declare the access scope for each field) and I find it really hard to read as
some fields are at the class scope and some at the constructor-parameter scope:

```ts
class Foo {
  private _field1 :number
  constructor(
    public field2 :string,
    public field3 :Bar,
    public field4 :boolean
  ) {
    this._field1 = field4 ? 1 : 0
  }
}
let foo = new Foo(1, "2", three, true)
```

But it would be so much nicer if we could just do this:

```ts
class Foo {
  field2 :string
  field3 :Bar
  field4 :boolean
  private _field1 :number = field4 ? 1 : 0
}
let foo = new Foo(field2="2", field3=three, field4=true)
```


## Public static private protected

Java had its issues. Let's not go there again.

```ts
class Foo {
  public foo() { ... }
  public static fooify() { ... }
  private doMagicalThings() { ... }
  protected update() { doMagicalThings() }
}
```

Forget about protected.
It's a "Oh let's design a perfect system on this white-board" kind of invention.
Let's just say that some things are internal to an implementation, and the
things that are not can be accessed by other modules/packages.

How about this instead:

```ts
class Foo {
  foo() { ... }
  _doMagicalThings() { ... }
  _update() { ... }
}

function fooify(f :Foo) { ... }
```

Only code within the same package can access stuff that begins with an
underscore.
Also, "static methods" are really just convoluted ways of writing functions.



## Implements Interface and redefines it all over

```ts
interface Foo {
  field2 :string
  field3 :Bar
  field4 :boolean
  transmogrify() :boolean
}

class foo implements Foo {
  field2 :string
  _field1 :number
  field3 :Bar
  field4 :boolean
  transmogrify() :boolean {
    return false
  }
}
```

Ugh. What if we could just do this instead:

```ts
interface Foo {
  field2 :string
  field3 :Bar
  field4 :boolean
  transmogrify() :boolean
}

class foo implements Foo {
  _field1 :number
  transmogrify() :boolean {
    return this._field1 > 0
  }
}
```

The compiler could tell us if we are shadowing a field.

```ts
...
class foo implements Foo {
  _field1 :number
  field4 :string          // error: Foo.field4 redeclared
  ...
```


## Named arguments

JavaScript confusingly allows this

```js
function x(a=0, b=0, c=0) {
  console.log({a, b, c})
}
let b = 0
x((b=9), c=3) // {a: 9, b: 3, c: 0} -- WTF?!
```

What would you expect to happen? Yeah.
We really just defined a new variable `c` in the calling scope. 🤦‍♂️

Wouldn't it be nice if we could just do this? Python and Go got it right.

```js
function x(a=0, b=0, c=0) {
  console.log({a, b, c})
}
let b = 0
x((b=9), c=3) // {a: 9, b: 0, c: 3} -- Thank you.
```


## import import import import

Uuuuugh. This one drives me crazy when writing JS/TS:

```ts
import { Foo, bar, baz } from './file1'
import * as library from 'some/library'
import * as lolcat from './file3'
import lolcatz from './file4'
import { Internet } from './file5'

// In scope:
// library.A, library.B
// Foo, bar, baz, lolcat, lolcatz, Internet
```

The problem here is that _every file of a logical package_ needs to import
basically every other of its files.

This makes it really expensive to:
- Move code around and
- to rename files.

Filenames should really just be a way to organize your code.
Also, why not just allow importing packages as the name they already have?
Go, Python, Pony and a whole bunch of other languages got this right.

```ts
import 'some/library'

// In scope:
// library.A, library.B
// Foo, bar, baz, lolcat, lolcatz, Internet
```

To sum things up:

- One directory = one package
- One file = some chunk of code of a package (compiler and runtime doesn't care.)
- A file inside a directory is part of the same lecixal scope as other files in that same directory.
- Imports are done on a package level.



## new

Basically anything you do in JavaScript allocates stuff, so why not throw away
that old Java marketing trick "new" operator?

```ts
let date = new Date()
let foo = new Foo()
let bar = new Bar()
```

Python got this right. Let's just forget about the embarrassment that's `new`
and do this:

```ts
let date = Date()
let foo = Foo()
let bar = Bar()
```


## Constructors

Here's a pretty common kind of constructor that executes some small amount of
code so that it can initialize its state:

```ts
class Foo {
  field1 :string
  _field2 :number

  constructor(field1 :string) {
    this.field1 = field1
    this._field2 = field1.length
  }
}
```

This sucks, right?! So much typing, so little progress.

First off, it should be a programming-crime to do anything else than
state initialization in a constructor. If you start a network request,
read a file or really do any "real work", you'll eventually get into trouble
and should move that code into a descriptive function.

So, constructors are purely for initialization.

Here's one idea, where we allow putting some expression after a field,
where the expression is executed when a Foo is initialized:

```ts
class Foo {
  field1 :string
  _field2 :number = field1.length
}
Foo("o hai") // _field2 is set to 5
```

An issue with this approach is the order of which these initializing
expressions are evaluated, since they probably depend on each other.
We could say that the compiler should handle this. After all, it's invalid to
initialize A=B and B=A at the same time, so automatically resolving
initialization order is possible. But it's a lot of work for a compiler.

We could alternatively do this, where we attribute special meaning to the
member name "_init", similar to Python's "__init__":

```ts
class Foo {
  field1 :string
  _field2 :number
  _init() {
    this._field2 = field1.length
  }
}
Foo("o hai") // _field2 is set to 5
```

Or just ditch constructors alltogether, like Go:

```ts
class Foo {
  field1 :string
  _field2 :number
}
function makeFoo(field1 :string) :Foo {
  Foo(field1, _field2=field1.length)
}
```



## return

Why do I have to type "return" all the time?

```js
function bar(n) {
  const x = 10
  return function() {
    return x * n
  }
}
```

Here's a crazy idea: What if we just return the last expression in a function body?
Another way of thinking about this: Instead of making return opt-in, we make it
opt-out, assuming the common-case is to return a value.

```js
function bar(n) {
  const x = 10
  function() {
    x * n
  }
}
```

So much nicer.

We'd still allow explicit return, so that returning early is possible:

```js
function bar(n) {
  const x = 10
  if (n < 1) {
    return null
  }
  function() { x * n }
}
```

See [Go all in with types](#go-all-in-with-types)


## Flow control as expressions

Let's consider having all flow-control structures be expressions, as in they
have a result value. For example "if..else":

```js
function bar(n) {
  const x = 10
  if (n < 1) {
    null
  } else {
    function() { x * n }
  }
}
```

Which can be thought of as:

```js
function bar(n) // -> null or function
  if { ... } else { ... } // -> null or function
```

In some languages where control structures are expressions, a different name
than "if" is used for clarity. Something like this:

```js
...
  cond {
    case (n < 1) null
    default function() { x * n }
  }
}
```

However, I think the tradeoffs for renaming "if" are not worth it — "if" is not
only a logical and simple term, but is prevalent in the majority of programming
languages. Therefore I think it makes more sense to:

- Make `if...else` an expression, where its type is the union of all branches' types.
- Remove the `<cond> ? <then> : <else>` syntax, which would be redundant and is hard to read.
- Remove the need to enclose conditions in `(...)` (for all control structures.)
- Require braces for bodies/blocks of code to be explicit about effects.

Our little example snippet could be written like this:

```ts
function bar(n :int) {
  const x = 10
  if n < 1 { null }
  else { function() { x * n } }
}
```


## function for clarity

`() =>`, `lambda x: y`, `^(){ ... }` et al. might look real cool, but in reality
I find these alternative "short" function syntaxes hard to read,
causing the code in question to suffer in terms of clarity and readability.

```ts
function foo() :(name :string) => number {
  return ((name :string) => () =>
    "Hello, " + name
  )("Dr " + name)
}
```

Wait, what? Let's try this with "function" and our idea of implicit return:

```ts
function foo() :function(name :string):number {
  (function (name :string) {
    function() {
      "Hello, " + name
    }
  })("Dr " + name)
}
```

It's a little longer, but a lot more readable I think. We might even abbreviate
"function" the way a lot of other languages does, and allow dropping `()` for
functions that don't accept parameters:

```go
func foo() :func(name :string):number {
  func (name :string) {
    func { "Hello, " + name }
  }("Dr " + name)
}
```


## Default initialization

What's the value of something before you've assigned it or initialized it?
In TypeScript and JavaScript, it's always "undefined" until explicitly intitialized.
This means that for something of the type "number", it's not always a number.

```ts
class Foo {
  x :number
  name :string
}
let foo = new Foo()
console.log(foo.x * 10)      // NaN, because x is not a number
console.log(foo.name.length) // crash, because name is not a string
```

Objective-C, Go and a few other languages got this right by always initializing
values to zero, whatever that means for the value type.

I think Go has the best model here:
_things are allocated into zeroed memory_ (all bits are `0`).
All primitive types in Go are valid when its memory is all zero, which means
that we only need to zero the memory region for a new thing — no need to
execute code that initializes each and every member separately.

```go
type Foo struct {
  x, y int    // == 0, 0
  z    float  // == 0.0
  bar  string // == "" (the empty string)
  lol  bool   // == false
  // and so on
}
```

What's also nice about this model is that any compound types are always
initialized too, in the same way, since any compound type is really just a set
of primitive types.

```go
type Foo struct {
  x, y int    // == 0, 0
  z    float  // == 0.0
  bar  string // == { 0 }
  lol  bool   // == false
}
type Bar struct {
  Foo          // == { 0, 0, 0.0, { 0 }, false }
  hello string // == { 0 }
}
// Memory for Bar:
//   { { 0, 0, 0.0, { 0 }, false } { 0 } }
// Assuming int and float are 32-bits wide and bool is 8 bits:
//   00000000 00000000 00000000 00000000 00 00000000
```

This is probably the best model for initialization and a good way to guarantee
that any type is always valid (although perhaps not functionally.)

> We need to figure out a way to deal with pointers in this model.


## Go all-in with types

TypeScript is awesome, but it is a "patch on top of JavaScript" and for
historical reasons, declaring types in TypeScript is optional, meaning the
syntax for no type or with types needs to be unambiguous. Therefore TypeScript
dictates that every timetype needs to be prefixed with a colon, like so:

```ts
class Vec3 {
  x :number
  y :number
  z :number
}
function origin(x :number, y :number, z :number) :Vec3|null {
  if (z > 0) {
    return Vec3(x, y, z)
  }
  null
}
let o = origin()
```

What if we said that types are only optional in certain specific cases,
like for return types and assignment declarations?
We could drop the `:`, since we wouldn't need it for disambiguation, and could
even allow C- and Go-style short-form multi-declarations of the same type:

```go
class Vec3 {
  x, y, z number
}
func origin(x, y, z number) Vec3|null {
  if z > 0 {
    Vec3(x, y, z)
  } else {
    null
  }
}
let o = origin() // o has type Vec3|null
```

And what if a missing "else" condition meant "a default-initialized thing of the same type as the 'then' branch"?

```go
class Vec3 {
  x, y, z number
}
func origin(x, y, z number) Vec3 {
  if z > 0 {
    Vec3(x, y, z)
  }
}
let o = origin() // o has type Vec3
```

Of course, in the following case the compiler would have to error and require
the programmer to add an "else" branch?

```go
func origin(x, y, z number) {
  if z > 0 {
    Vec3(x, y, z)
  } else if z < 0 {
    NegVec3(x, y, -z)
  }
}
```

The compiler might say something like this:

```txt
Error: ambiguous "if" with multiple "else" candidates: Vec3, NegVec3 in foo:12:3
- Add an "else" branch or change all existing branches to the same type.
```

For the sake of simplicity, we might consider forcing return-type declaration
for all functions:

```go
func origin(x, y, z number) Vec3|NegVec3 {
  if z > 0 {
    Vec3(x, y, z)
  } else if z < 0 {
    NegVec3(x, y, -z)
  }
}
```

The compiler could then either pick the first type and for the "else" case return
a default-initialized instance of that type, or it could complain with an error
as discusses earlier.


## this

There're a lot of opinions around the `this` keyword, but one thing is fact: It has—and is still—causing a lot of trouble and confusion.

The main issue with `this`:

> What is _this_ at this location in my code?

Here's an example:

```js
...
  bar() {
    return this.x // what is "this"?
  }
...
```

It all depends on the context, and not just the lexical context (like a
class definition), but the _runtime-call context_. In JavaScript `this` is
whatever a function was called with:

```js
function bar() {
  return this
}
let A = { bar }
let B = { bar }
A.bar() // this == A
B.bar() // this == B
bar()   // this == whatever `this` is in the calling context!
```

`this` gets worse when you use higher-order functions with closures:

```js
function bar(n) {
  return function() {
    return this.x * n
  }
}
let fn = ({ x:10, bar }).bar(10)
fn() // NaN!
```

A different kind of function was introduced into JavaScript to address this
particular issue! That's how big of a problem `this` is.

```js
function bar(n) {
  return () => { // automatically "binds this"
    return this.x * n
  }
}
let fn = ({ x:10, bar }).bar(10)
fn() // 100
```

What if we got rid of `this`. Go and Python both takes this approach, although
a bit differently.

In Python the name "self" is used, which carries no special meaning in the
language; it's purely a convention. For functions called with a parent context,
like a class instance, it receives that context as the first parameter.

```py
class Foo:
  x = 10
  def bar(self, n):
    def f():
      return self.x * n
    return f
fn = Foo().bar(10)
print(fn())
```

Additionally, since white-space has lexical meaning in Python, there's an
alternative function syntax for anonymous functions:

```py
class Foo:
  x = 10
  def bar(self, n):
    return lambda: self.x * n
fn = Foo().bar(10)
print(fn())  # 100
```

#### Some ideas for getting rid of "this"

Go's approach is even simpler: There are no "methods" on types, there are only
functions, and some functions takes a certain type as a prefix parameter.
We give whatever name we want to that parameter (in this example it's `f`):

```go
type Foo struct {
  x int
}
func (f Foo) bar(n int) func()int {
  return func() int {
    return f.x * n
  }
}
fn := Foo{x:10}.bar(10)
fn() // 100
```

The downside with this approach is the prefix-parameter syntax required which
makes code harder to read compared to some other popular languages.
There are a lot of parenthesis and names intermixed in this fairly simple
function definition:

```go
class Foo {
  (f Foo) bar(n int) int
}
func (f Foo) baz(n int) int
```

Let's see if we can make it more easilty readable:

```go
class Foo {
  bar(f Foo, n int) int
}
func Foo.baz(f Foo, n int) int
```

That's easier to read, but now we're typing "Foo" where we clearly don't need to.

Let's try something else: (we use `;` instead of `,` to still allow multi-parameter-single-type delcarations)

```go
class Foo {
  bar(f; n int) int
}
func Foo.baz(f; n int) int
// f would implicitly have type Foo
```

But this would introduce a new awkward syntax (ushing both `;` and `,` for
function parameters) and make the language harder to use.


#### Circling back to "this"

So perhaps the concept of "this" is a decent one after all.
The main issue with "this" in JavaScript et al. is the fact that its value is
really hard to reason about. So why don't we keep "this" and make the value
as obvious as possible and non-ambiguous?

Two kinds of functions:

- _Bound:_ Bound to a type — has `this` that is always of its bound-to type
- _Unbound_: doesn't have `this`

Example:

```ts
interface Fooable {
  bar(n int) func()int
}

class Foo is Fooable {
  x int

  bar(x int) func()int {
    // here, "this" is always of type Foo
    func() {
      // here, "this" is still of type Foo since this function is
      // an "unbound" function -- typing "this" simply includes "this"
      // from the "bar" function body in this function's closure.
      this.x * x
    }
  }
}

// Extending a type or interface
func Fooable.baz(x int) int {
  // here, "this" is always of type Fooable
  this.bar(x)
}

// An unbound function
func lol(x int) int {
  // here, "this" doesn't exist and the compiler will error
  this.x * x  // error: undefined: this in foo:12:3
}
```

The last piece of the puzzle is the fact that we type "this"
_all the freaking time_. Go uses a single-character name by convention,
but the concept of "this" clearly means we need to pick _just one name_.

Before considering alternative names, what if we allow implicit member-field
access?

```ts
interface Fooable {
  y int
  bar(n int) func()int
}

class Foo is Fooable {
  x int

  bar(x1 int) func()int {
    // Note that we have to choose between naming the parameter "x"
    // or using "x" to access "this.x" — we can't do both.
    func() {
      // here, "this" is still of type Foo.
      // When we type "x", the compiler looks in the parent scope for "x"
      // and when it doesn't find it as just plain "x", it looks at "this.x",
      // which it does find, and so "x" here is the same as "this.x"
      x * x1
    }
  }
}

func Fooable.baz(x int) int {
  bar(x + y) // "y" is on interface Fooable
}

// An unbound function
func lol(x1 int) int {
  // here, "this" doesn't exist and the compiler won't find "x"
  x * x1  // error: undefined: x in foo:12:3
}
```

This is nice, but has some trickyness to it: What if you introduce a name "y"
in the global scope and want to access that in `Fooable.baz`? It's easy to
forget (or not even know) that `Fooable` defines a field "y":

```ts
// Fooable is defined in a different file, so we don't see it here
const y = 9

// Extending a type or interface
func Fooable.baz(x int) int {
  bar(x + y)
}
```

We'd expect `y` to always be `9`, but in reality we would use the value of
`Fooable.x`, potentially introducing subtle bugs.

Therefore, we'll avoid implicit member-field access. Perhaps we can find a way
to lower the cost of typing "this." all the time?

My only favorite thing about Ruby is the use of `@` for "this", so let's try that.

```ts
interface Fooable {
  bar(n int) func()int
}

class Foo is Fooable {
  x int

  bar(x int) func()int {
    // here, "@" is always of type Foo
    func() {
      // here, "@" is still of type Foo since @ function is
      // an "unbound" function -- typing "@" simply includes "@"
      // from the "bar" function body in @ function's closure.
      @x * x
    }
  }
}

// Extending a type or interface
func Fooable.baz(x int) int {
  // here, "@" is always of type Fooable
  @bar(x)
}

// An unbound function
func lol(x int) int {
  // unbound -- the compiler will error
  @x * x  // error: @ in unbound function in foo:12:3
}
```

With this approach we don't have to allow implicit member-field access, which
can be hard to reason about and is error-prone. And we don't have to type
"this." or "self." all of the time. Nice.



## null — optional values

On one hand, `null` (or "empty") is a really useful concept since we can model
things that are optional. But on the other hand, it's a well-known source of
runtime bugs where the programmer didn't realize that the value of something
might be null.

Most languages does nothing to help you avoid accidentally reading null values,
some languages simply do don't have `null`, and a few languages have syntax
and/or compile-time- and/or runtime-checks to help you with null values.

For instance, programming in Swift is a constant consideration of
"Should I use `?` here, or maybe `!`, or perhaps none of those?"

C++ has two different kinds of ways to refer to a value: `*Type` for things that
might be null, and `&Type` for things that can't be null. The compiler then
ensures that a `&Type` value is never null, but does nothing to assist with
values that might be null. Also, having two different ways to declare a pointer
is error-prone because it requires deeper knowledge of the differences.
C++ also has "Plain Old Data" values which are not references nor pointers.

Null is a useful concept and we should include it and make sure there are no
different kinds of ways to refer to values — there are only values.

Optional values in our language:

- A value is optional if its type is suffixed by `?`, e.g. `Foo?`
- An optional value is default-initialized to `null` rather than its type.
- Values of primary types like `int` and `bool` can _not_ be optional.
- The keyword `null` is a special value that can be returned or assigned to any
  optional type. E.g. `var f Foo? = null` or `x.y = null` if `y` is optional.
- There is no "null type", i.e. `null` can't be used as a type name.
- `null` can't be used alone for type inference, i.e. `x := null` is invalid and
  should instead be written as `var x Foo?`

```go
var foo Foo?
// ...
if f := foo {
  // we know f is not null; f has type Foo (sans null)
} else {
  // we know f is null; f has type null
}
```

The type system could help us avoiding mistakes where some code deals with
null values and some doesn't:

```go
func foo(n int) Foo? {
  if n > 0 { Foo(n) } else { null }
}

func bar(f Foo) { ... }

f := foo(0)
bar(f)     // error: possible null value for required parameter f
```

We'd fix the error above by checking `f`:

```go
f := foo(0)
if f {
  bar(f) // ok; typeof(f) is Foo (not `Foo?`)
}
```

Only compound types can be null/optional. This means that values of a primary
type like `int`, `bool` or `float` can never be null, and an `if` check will
never be ambiguous.

This becase of zeroed-initizlied memory. See [Default initialization](#default-initialization) for longer discussion.

```go
type Foo {
  n int // = 0
}
var x int   // = 0
var y float // = 0.0
var z bool  // = false
var f Foo?  // = null
var g Foo   // = Foo{n=0}
```

Attempting to make a value of primary type optional causes the compiler to emit
an error:

```go
var z bool?  // error: primary type bool can not be made optional
```

The compiler should guarantee that something declared as _not optional_ can
never be null.

Here's another example:

```go
func cpuinfo() CpuInfo {
  var ci CpuInfo?
  //
  // ... maybe assign a value to ci ...
  //
  ci   // error: possible null value for required value
}
```

We can fix this either by making `cpuinfo()` return an optional value and leave
the null-checking to the caller, or we can ensure the result is never null:

```go
const _emptyCpuInfo CpuInfo

func cpuinfo() CpuInfo {
  var ci CpuInfo?
  //
  // ... maybe assign a value to ci ...
  //
  ci || _emptyCpuInfo
}
```

If we fail to make a CpuInfo, we return a zero one (`_emptyCpuInfo`).


### Pointers & references

This also implies that our language doesn't have pointers or references for
primary types, meaning that the following is _not possible_:

```go
func incr(n *int) { n++ }
var count = 0
incr(&count)
```

Instead, the value must be wrapped in a compound type and that type's field be
updated:

```go
func incr(r {n int}) { r.n++ }
var count = { n := 0 }
incr(count)
// count.n is now 1
```

Alternatively a new value can be returned. This is usually the best solution
for updating values of a primary type as it makes it clear what is happening at
the call site:

```go
func incr(n int) int { n + 1 }
var count = 0
count = incr(count)
// count is now 1
```


## Mutability

Opt-in to mutability with `var` — a mutable container. Maps to a `local` in WASM.


### Exploring opt-in to mutability

We could say that fields are immutable by default and you opt-in with `var`s:

```swift
type Foo {
  var x int
  y float
}

func lol(f Foo) {
  // parameters are always constants
  f = Foo() // error: assignment to constant f
  startTimeout(100, func {
    // f here still refers to the original Foo, since we
    // received the value, not the var, when lol() was called.
    print("timeout. f.x: ${f.x}")
  })
}

f := Foo() // == `var f Foo = Foo()`
const f2 = f
f.x = 5    // ok; changes var to point to 5
f.y = 5    // error: assignment to constant y
lol(f)     // passes the value to foo (not the var)
f = Foo()  // ok; f is a var; lol() code is unaffected
f2 = Foo() // error: assignment to constant f2
```


**A stricter opt-in**

The assign-declare operator `:=` creates consts

```ts
type Foo {
  var x int
  y float
}
f := Foo() // == `const f Foo = Foo()`
var f2 = f
f.x = 5    // ok; changes var to point to 5
f.y = 5    // error: assignment to constant y
f = Foo()  // error: assignment to constant f
f2 = Foo() // ok; f2 is a var
```

**Exploring opt-out from mutability**

> Not doing this, but here for comparison

```ts
type Foo {
  x int
  const y float
}
const f = Foo()
f2 := f    // == `var f2 Foo = Foo()`
f.x = 5    // ok; changes var to point to 5
f.y = 5    // error: assignment to constant y
f = Foo()  // error: assignment to constant f
f2 = Foo() // ok; f2 is a var
```


## Multiple return values

Returning more than one value is often very useful.
Consider this UTF8 decoder that returns both the Unicode code point that it
decoded as well as the amount of bytes it "consumed" from the input buffer:

```go
func decodeUtf8(b [byte], offs int) (cp, w int) {
  // reads 1-4 bytes from b starting at offs
  return (codepoint, bytesRead)
}

var offs = 0
while offs < len(bytes) {
  r := decodeUtf8(bytes, offs)
  print("read codepoint ${hex(r.cp)}")
  offs += r.w
}
```

We could also expand the result values by position into local names:

```go
var offs = 0
while offs < len(bytes) {
  cp, width := decodeUtf8(bytes, offs)
  print("read codepoint ${hex(cp)}")
  offs += width
}
```


## Built-in types

- 1 bit: `bool`
- 8 bits: `uint8`, `int8`
- 32 bits: `uint32`, `int32`, `float32`
- 64 bits: `uint64`, `int64`, `float64`
- Fixed-size array

```
BuiltInType = Array<T> | Primary
Primary     = bool
            | uint8 | int8
            | uint32 | int32 | float32
            | uint64 | int64 | float64
Array<T>    = ArrayMember<T>*
Size        = uint
```

### Array

- Building block for almost any other data structure imaginable — enables
  implementation of things like hash tables, tries, etc in the language itself.
- Potentially SIMD instructions would operate on arrays (e.g. 8x16, 32x4, 64x2)
  where all operands need to be adjacent in memory.
- Constant, fixed size means there's no need to store the size itself in memory.
- It's size is part of its type (`int[4]` and `int[5]` are distinct, incompatible types.)
- We need dynamic size and indexing, so we also have "slices".

```go
var a int[3]       // 3 default-initialized elements
func makeNumbers() int[4] { int[]{1, 2, 3, 4} }
b := makeNumbers() // typeof(a) == int[4]
a = b              // error: assigning array of incompatible size
var c int[0]       // empty array

// Creation
const a uint8[3]       // 3 default-initialized elements
a := uint8[3]{1, 2, 3} // explicit initial values
```

#### Array slices

Go's [`slice` approach](https://blog.golang.org/slices) is elegantly simple:
A slice is a "view" into an array, with its own offset and length.

Think of a slice like this:

```go
type slice<T> {
  offs   uint
  length uint
  a      T[(size known by compiler)]
}
```

We can make slices from arrays, or make new slices that reference
dynamically-sized arrays:

```go
a := uint8[]{1, 2, 3, 4, 5}  // array of 5 ints
s1 := a[1:4]   // slice of a; len(s1) == 3; index 0=2, 1=3, 2=4
```

Making an empty slice is similar to making an empty array:

```go
var s2 int[] // an empty slice of ints; len(c) == 0
s2 = s1      // ok; size is not part of a slice's type, so types match
```

Allocating arrays of size only known at runtime can be done only via slices:

```go
s3 := int[](4) // slice of an array of size 4
var z = getPreferredSize()
s4 := int[](z) // slice of an array of some size known only at runtime
```

#### Array mutation

Arrays need to be mutable in order to be efficient as fundamental building blocks.
Perhaps we could take an "isolate" approach, where an array is mutable as long
as its not referenced outside of its own scope:

```swift
type Node {
  id       int
  children Node[]
}

func makeNode(id int) Node {
  const nodes Node[16]
  // `nodes` are mutable in this scope, and only this scope
  for i := range(0, size) {
    nodes[i] = Node(id=id+i)
  }
  Node(id, nodes)
}

n := makeNode(0)
n.children[1] = Node()  // error: assignment to immutable array
```


## Collections

- Array & slice: Ordered collection of values —
  `int[]`, `Foo[3]`, `Foo[3][]`
- Set: Unordered collection of unique values —
  `Set<int>(1, 2)`, `Set<Foo>()`
- Map: Unordered collection of key-value associations —
  `Map<string,int>(("frank", 32), ("anne", 34))`


### Collection mutability

Because we're opting for mutability via `var`s, immutable persistent
data structures would be a suitable approach for collections.

```go
m := Map<string,int>()   // Map()
m2 := m.set("frank", 32) // Map("frank"=32)
m != m2                  // true; different values -- m is still the empty map
m2 = m2.set("anne", 34)  // Map("anne"=34, "frank"=32)
```

We could also consider the approach taken by Swift and C++ where storage
dictates mutability:

```go
m := Map<string,int>() // Map()
m.set("frank", 32)     // Map("frank"=32)
m.set("anne", 34)      // Map("anne"=34, "frank"=32)

const m2 = Map<string,int>()
m2.set("bob", 12)  // error: mutation of constant Map m2
```

With this approach we could have the compiler be clever and copy the map when
it's referenced by something else. This could easily spiral into what is
move semantics, copy elision, and rvalues of C++11 — awesome but complicated
concepts.
