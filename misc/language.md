# Language

There's a focus on keeping the language simple, concise and familiar.

There are only four possible **declarations**:

- Constants — `const PI = 3.141592`
- Variables — `var counter = 3`
- Functions — `func greet(name string, age, height int)`, etc
- Types — `type byte uint8`, `type Account { ... }`, etc

Of course, the language also includes

- Literals — `123`, `"Hello world"`, `22/7`, `true`, etc
- Flow control — `while counter < 3`, `if n != 9`, etc


## Constants

When we talk about a "constant", we're really talking about a _named constant_:

```go
const PI = 3.141592653589793
print(PI)
// 3.141592653589793
```

Once we declare a constant, we can't change it

```go
PI = 3 // error: cannot assign to constant PI
```

You can also declare the type of a constant:

```go
const integerPI int = PI
print(integerPI) // 3
```

This is useful when you want to force a specific type that's different than
the value expression's natural type.

## Variables

Variables in this language are like vars in JavaScript and Clojure, unlike
those of say C++ — a variable is a _value container_ which value can be
exchanged for a different one at any point in time.

```go
var PI = 141592653589793
PI = 4 // totally fine; now PI == 4
```

However, when passing the value of a var to a function call, a different var
or a structure field, the var is not referenced but
_the value at the time of reading_ is referenced. This means that a var is only
truly variable—as in the value it represents can change—within a certain scope.

```go
func greetSoon(name string) {
  startTimer(100, func {
    print(name)
  })
}
var name = "John"
greetSoon(name)
name = "Anne"
// ...
// prints "John"
```

However, if we reference the value directly in our greet function, we'll read
the value when we call print:

```go
func greetSoon() {
  startTimer(100, func {
    print(name)
  })
}
var name = "John"
greetSoon()
name = "Anne"
// ...
// prints "Anne"
```


## Functions

Functions can be declared but are also first-class values that can be used in
expressions.

- Function declaration — `func foo(name string) int { name.length }`
- Function expression — `func (name string) int { name.length }`
- Function type declaration — `type Foo func(name string) int` (See [Types](#types))
- Method declaration — `func Account.foo(name string) int { name.length }`
- Inline method declaration — `type Account { foo(name string) int { name.length } }`

A function always begins with the keyword `func` and is followed by an optional
name, parameters, return type and body:

```go
func foo(name string) int {
  name.length
}
print(foo("John")) // 4
```

Parameters can have default values, making them optional:

```go
func foo(name string = "John") int {
  name.length
}
print(foo()) // 4
print(foo("bar")) // 3
```

When calling a function, parameters can be named

```go
func foo(name string = "John", twice bool = false) int {
  if twice {
    name.length * 2
  } else {
    name.length
  }
}
print(foo(twice=true)) // 8
```

The code generated for the above is equivalent to the following:

```go
const fooArg0 = "John"
func foo(name string, twice bool) int {
  // ...
}
print(foo(fooArg0, true)) // 8
```

Thus there's no runtime penalty when using named parameters, even when out-of
order.


## Flow control


### if

```go
if n < 3 {
  print("n is less than three")
} else if n < 5 || n == 500 {
  print("n is less than five, or it's 500")
} else {
  print("n is a large number")
}
```

If's are expressions and has the type of its branches:

```go
if n < 3 { 1 } else { 2 } // type is int
```

When there are different types in different branches the effective type is
the union:

```go
if n < 3 { true } else { 100 } // type is bool|int
```

When there's no `else` branch, the value of `else` is [`nil`](#nil), making the other
branch's type "optional":

```go
if n < 3 { 1 }  // type is int?
```

And again, when an `else` branch is missing, the other branch's types becomes
optional as the `if...else` might return `nil`:

```go
if n < 3 { 1 } else if n < 5 { "small" } // type is int?|string?
```


### switch

Used to `switch` paths depending on a value:

```go
n = 4
message = switch n {
  1, 2, 3  "one, two or three"
  4        "four"
  else     "large number"
}
print(message)  // "four"
```

Switches are similar to `if...else`:

- Use a switch when you need to take different paths depending on the value
  of something.
- Use an `if...else` when the conditions for different branches require
  comparison that goes beyond just equality.
- Switches allows branches with single expressions without the need for
  enclosing curly braces. Sometimes this is makes "tables" a lot more readable.

When the conditions are all constant integer values, switches generate very
efficient code that has better time-complexity than `if...else`.

When there are non-integer or non-constant conditions, a `switch` generates
the same code as if you'd used a `if...else`. These two snippets of code are
equivalent:

```go
var three = 3
switch n {
  three "one, two or three"
  4     "four"
  else  "large number"
}
```

```go
var three = 3
if n == three  { "one, two or three" }
else if n == 4 { "four" }
else           { "large number" }
```

The same would happen if any of the conditions were not integers.

Similarly to `if...else`, a `switch` has a result value, and thus the effective
type of a `switch` is the union of all branches:

```go
r = switch n {
  1, 2, 3  "one, two or three"
  4        4
  else     false
}
print(typeof(r))  // string|int|bool
```

And just like `if...else`, if we leave out the `else` branch the result becomes
optional as it might result in `nil`:

```go
r = switch n {
  1, 2, 3  "one, two or three"
  4        4
}
print(typeof(r))  // string?|int?
```


### while

Loop `while` a condition is true:

```go
var n = 3
while n-- {
  print("O hai! #${n}")
}
// "O hai! #0"
// "O hai! #1"
// "O hai! #2"
```

### for

Execute code `for` each item in a collection or range:

```go
names = ["Bob", "Anne", "Astrid"]
for name in names {
  print(name)
}
// "Bob"
// "Anne"
// "Astrid"
```

```go
end = 3
for n in 1..end {
  print(n)
}
// 1
// 2
// 3
```

A `for` loop is really just syntactic sugar for a `while` loop over an iterator:

```go
for name in names {
  print(name)
}

// generates the same code as

var iterator = names.iter()
while iterator.valid {
  name = iterator.value
  print(name)
  iterator = iterator.next()
}
```



## Types

A type defines the _shape_ of a value.

As this language is strongly typed, types also play a central role in compiler
assistance and communication of intention.

### Type declarations

Named types can be declared at the file-level and has the same visibility as
constants, variables and functions.

```go
type N int               // primitive type
type L int[]             // list type
type F func(int) string  // function type
type S { a int }         // structure type
type T (int, string)     // tuple type
```

#### Type generics

Generalized type parameters are declared after a name, in between `<` and `>`:

- `<A>` — A can be any type
- `<A is B>` — A must be a type compatible with B
- `<A is B|C>` — A must be a type compatible with B or C
- `<A is B&C>` — A must be a type compatible with B _and_ C

```go
type Array<T> T[]            // list of `T`s wher T is any type
type F<A, R> func(x, y A) R  // parameters and return value are generic
type M<A, B is X> Map<A, B>  // map with value type compatible with X
```

```go
type Foo { name string }
type Bar { age int }

func greet<A is Foo & Bar>(a A) {
  // ok since A is a Foo and a Bar
  print("Hello ${a.name}, I hear you're ${a.age} years old")
}
greet({ name = "Anne", age int = 35 })
// "Hello Anne, I hear you're 35 years old"
```

#### Distinct type matching

```go
func foo(x int) {}
const a int = 1
const b N = 1
foo(a) // ok
foo(b) // error: cannot use a (type N) as type int in argument to foo
// Because N != int (N is a distinct type)
```

#### Type aliasing

```go
type N = int  // N is internally resolved to int
func foo(x int) {}
const a int = 1
const b N = 1
foo(a) // ok
foo(b) // ok, because N == int

// And we can use N and int interchangably
func N.foo() {}  // enables function "foo" for type int
```


### nil

`nil` is used for modeling "optional" values and doesn't represent a type in
itself.
For instance, the following is invalid:

```go
var x = nil  // error: missing type in var declaration
```

`nil` can only be used in place of an actual value to _make a value optional_.
If we declare what type (or types) a variable is of, we can assign nil:

```go
var x bool? = nil  // ok; maybe a bool
```

Optional vars and structure fields are default-initialized to `nil` rather than
their zero value, so we can actually write the same var declaration but leave
out the assignment:

```go
var x bool?
print(x)  // nil
```

Another example is a function that returns "maybe a string" — it promises to
return either a string or nil:

```go
func lastName(name string) string? {
  var ln string? = nil
  while (p = name.find(' ')) != -1 {
    ln = name[p:]
  }
  ln
}
print(lastName("Bob"))  // nil
print(lastName("Anne Marley"))  // "Marley"
```

Since `nil` (or `null` if you want), has caused a lot of headache in other
languages, we make sure—at compile-time—that a type `T?` can never be assigned
to a type `T`, but have to be explicitly checked for nil before. TypeScript
got this right and the feature is inspired by that:

```go
var x int
var y int?
y = x  // ok
x = y  // error: assignment of optional y to non-optional x
```

All we need to do is check for `nil`:

```go
var x int
var y int?
y = x  // ok
if y? {
  // because of the check, y's effective type is `int` in this scope.
  x = y  // ok
}
```

`y?` is just syntactic sugar for `y != nil` and can be written either way.
Using `?` suffix actually works with any expression to check for nil and
return true or false.

```go
var y int?
hasValue = y?  // false

func foo() int? { ... }

if (x := foo())? {
  // here, x's effective type is `int`
}
```

The type system will also ensure that you don't check for nil on values which
aren't optional:

```go
var x int
if x != nil {}  // error: comparison of incompatible types int (x) and nil
if x? {}        // error: checking for nil on non-optional x
```

Example of optional generics:

```go
func foo<A, ...R>(a A) R?... { nil }
var x = foo<string int bool>()
print(typeof(x))  // int?|bool?
```

### Structures

Structures are enclosed in `{...}` and are very flexible.
They can be used to:

- Describe interfaces
- Contain data
- Model "classes"

A structure type that doesn't contain any function code is just an interface:

```go
type FileReader {
  fileSize int
  read(n int) (byte, nread int)
}
```

Trying to create a FileReader would fail at compile-time:

```go
FileReader()
// error: trying to make an interface (FileReader.read() is undefined)
```

If we instead declare a struct that has read, we can create one:

```go
type DummyFileReader {
  FileReader
  read(n int) (byte, nread int) {
    return (0, n)
  }
}
DummyFileReader() // ok
```

In the example above, listing `FileReader` inside `DummyFileReader` means that
we _compose_ the FileReader type into our DummyFileReader type.
DummyFileReader will now have all of the things that FileReader has.

We can use this to extend and override behavior of different types:

```go
type Stranger {
  height int
  func greet() {
    print("Hello stranger. ${@heightMessage()}")
  }
  func heightMessage() string {
    "I see you're ${@height} cm tall"
  }
}
Stranger(165).greet()
// "Hello stranger. I see you're 165 cm tall"

type Friend {
  Stranger
  name string
  func greet() {
    print("Hello ${@name}, ${@heightMessage()}")
  }
}
Friend(172, "Bob").greet()
// "Hello Bob. I see you're 172 cm tall"
```

Composition allows us to mix multiple types into another type, even when there
might be name or type collisions:

```go
type A {
  x, y int
  z float
}
type B {
  z string
}
type C {
  A
  B
  y bool
}
c := C()
c.x   // ok; refers to int declared by A
c.y   // ok; refers to bool declared by C
c.A.y // ok; refers to int declared by A
c.z   // error: ambiguous field access; declared by both A and B
c.A.z // ok; refers to float declared by A
c.B.z // ok; refers to string declared by B
```


## Literals

- Number — `123`, `1.23`, `1.2e+9`, `0xBEEF`, `22/7`, `0b101`, ...
- Character — `'a'`, `'\u221A'`, `'\U00010299'`, ...
- String — `"Hello"`, `"2 + 3 = ${2+3}"`, `"\U0001F469\U0001F3FD\U0000200D\U0001F680"`, ...

