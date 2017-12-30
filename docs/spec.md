# Language specification

## Source code representation

Source code is Unicode text encoded in UTF-8. The text is not canonicalized, so a single accented code point is distinct from the same character constructed from combining an accent and a letter; those are treated as two code points. For simplicity, this document will use the unqualified term character to refer to a Unicode code point in the source text.

Each code point is distinct; for instance, upper and lower case letters are different characters.

#### Characters

The following terms are used to denote specific Unicode character classes:

```php
newline        = /* the Unicode code point U+000A */
unicode_char   = /* an arbitrary Unicode code point except newline */
unicode_letter = /* a Unicode code point classified as "Letter" */
unicode_digit  = /* a Unicode code point classified as "Number, decimal digit" */
```

#### Letters and digits

```php
letter        = unicode_letter | "_" | "$"
decimal_digit = "0" ... "9"
octal_digit   = "0" ... "7"
hex_digit     = "0" ... "9" | "A" ... "F" | "a" ... "f"
```


## Lexical elements

### Comments

Comments have no semantic effect on a program. There are two forms:

```php
Comment        = LineComment | GeneralComment
LineComment    = "//" /* anything except newline */ newline
GeneralComment = "/*" /* anything except the terminator: */ "*/"
```

### Semicolons

The formal grammar uses semicolons `;` as terminators in a number of productions.
However, most of these semicolons can be omitted using the following two rules:

1. When the input is broken into tokens, a semicolon is automatically inserted
   into the token stream immediately after a line's final token if that token is
    - an identifier
    - an integer, floating-point, imaginary, char, or string literal
    - one of the keywords `break`, `continue`, `fallthrough`, or `return`
    - one of the operators and delimiters `++`, `--`, `)`, `]`, or `}`
2. To allow complex statements to occupy a single line, a semicolon may be
   omitted before a closing `)` or `}`.

To reflect idiomatic use, code examples elide semicolons using these rules.


### Identifiers

```php
identifier = letter (letter | unicode_digit | "-")*

```

```
a
_3
HelloWorld
αβ
grinning-face
x--            // identifier `x--`
x --           // identifier `x` with unary operator `--`
```


### Keywords

The following keywords are reserved and may not be used as identifiers

```
break        default      for          import       switch
case         defer        fun          package      type
chan         else         go           range        var
const        enum         goto         return       while
continue     fallthrough  if           select       
```


### Operators and Delimiters

The following character sequences represent operators, delimiters, and other special tokens:

```
+    &     +=    &=     &&    ==    !=    (    )
-    |     -=    |=     ||    <     <=    [    ]
*    ^     *=    ^=     <-    >     >=    {    }
/    <<    /=    <<=    ->    =     :=    ,    ;
%    >>    %=    >>=    ++    !     ...   .    :
     &^          &^=    --          ..
```


### Integer literals

An integer literal represents an integer constant. An optional prefix sets a non-decimal base: `0x` for hexadecimal, `0o` for octal and `0b` for binary.

```php
int_lit  = dec_lit | hex_lit | oct_lit | bin_lit
dec_lit  = decimal_digit+
hex_lit  = "0" ( "x" | "X" ) hex_digit+
oct_lit  = "0" ( "o" | "O")  octal_digit+
bin_lit  = "0" ( "b" | "B" ) ( "0" | "1" )+
```

```
42
0
0xBadFace
0o67
0b1001
170141183460469231731687303715884105727
```

### Floating-point literals

```php
float_lit = decimals "." [ decimals ] [ exponent ] |
            decimals exponent |
            "." decimals [ exponent ]

decimals  = decimal_digit+
exponent  = ( "e" | "E" ) [ "+" | "-" ] decimals
```

```
0. // == 0.0
72.40
072.40  // == 72.40
2.71828
1.e+0
6.67428e-11
1E6
.25
.12345E+5
```

### Ratio literals

Represents a ratio between integers. Division of integers that can’t be reduced
to an integer yields a ratio, i.e. `22/7 == 22/7`, rather than a floating point
or truncated value.

```php
ratio_lit = decimals "/" decimals
```

```
22/7
1/3
```

### Character literals

Represents a character constant; an integer value identifying a
Unicode code point.
Within the quotes, any character may appear except newline and unescaped
single quote. A single quoted character represents the Unicode value of the 
character itself, while multi-character sequences beginning with a backslash
encode values in various formats.

The simplest form represents the single character within the quotes; since
source text is Unicode characters encoded in UTF-8, multiple UTF-8-encoded
bytes may represent a single integer value.
For instance, the literal `'a'` holds a single byte representing a literal `a`,
U+0061, value `0x61`, while `'ä'` holds two bytes (`0xc3 0xa4`) representing
a literal a-dieresis `ä`, U+00E4, value `0xe4`.

After a backslash, certain single-character escapes represent special values:

```
\a   U+0007 alert or bell
\b   U+0008 backspace
\f   U+000C form feed
\n   U+000A line feed or newline
\r   U+000D carriage return
\t   U+0009 horizontal tab
\v   U+000b vertical tab
\\   U+005c backslash
\'   U+0027 single quote  (valid escape only within character literals)
\"   U+0022 double quote  (valid escape only within string literals)
```

All other sequences starting with a backslash are illegal inside character
literals.

```php
char_lit       = "'" ( unicode_value | byte_value ) "'"
unicode_value  = unicode_char | little_u_value | big_u_value | escaped_char
byte_value     = hex_byte_value | "\0"
hex_byte_value = "\" "x" hex_digit hex_digit
little_u_value = "\" "u" hex_digit hex_digit hex_digit hex_digit
big_u_value    = "\" "U" hex_digit hex_digit hex_digit hex_digit
                           hex_digit hex_digit hex_digit hex_digit
escaped_char   = "\" ( "a" | "b" | "f" | "n" | "r" | "t" | "v" | "\"" | "'" | '"' )
```

```
'B'
'\n'
'\t'
'\117'
'\xEB'
'\u221A'
'\U00010299'
```

### String literals

A string literal represents a constant list of bytes, obtained by concatenating
a sequence of characters (in source text.) String literals does not inherently
represent text, as in Unicode characters, but simply a list of bytes.

We allow explicit definition of Unicode code points inside string literals in
source text (e.g. `"\u221A"`) though the resulting string constant value will
actually contain the UTF-8 representation of that code point, not the canonical
code point value. So while you can type `"\u221A"` for the `SQUARE ROOT`
code point, what actually ends up in memory are the three bytes `0xE2 0x88 0x9A`
— the UTF-8 encoding of `U+221A`. That means `"\u221A"` and `"\xE2\x88\x9A"`
are equivalent. Additionally, since source text is Unicode characters encoded
in UTF-8, verbatim string literals are not interpreted at all.

```php
string_lit = `"` { unicode_value | byte_value | newline } `"`
```

```
"hello world"
"\U0001F469\U0001F3FD\u200D\U0001F680" // 👩🏽‍🚀
"x ${y + "foo ${or} yo" + b ar} z"
"日本語"
"\u65e5本\U00008a9e"
"\xff\u00FF"
"\uD800"             // illegal: surrogate half
"\U00110000"         // illegal: invalid Unicode code point
  "usage: ${program} [options]
  options:
  -h   Show help
  " // == "usage: ${program} [options]\noptions:\n-h   Show help"
```

These examples all represent the same string:

```
"日本語"                                 // UTF-8 input text
"\u65e5\u672c\u8a9e"                    // the explicit Unicode code points
"\U000065e5\U0000672c\U00008a9e"        // the explicit Unicode code points
"\xe6\x97\xa5\xe6\x9c\xac\xe8\xaa\x9e"  // the explicit UTF-8 bytes
```

#### Multiline strings

String literals can span multiple lines of source text.
A multiline string literal is a string literal that contains at least one
_line feed_ (`U+000A`) character in the source text.
Some additional rules apply to multiline string literals:

- A single initial newline is ignored
- A single trailing newline is ignored
- Any whitespace before a trailing newline is interpreted as indentation and
  stripped from preceeding lines.

Multiline string literals can be indented to match the surrounding code:

```
fun usage() {
  msg = "
    usage: ${program} [options]
    options:
      -h   Show help
      -v   Print version
    "
}
```

Which embeds the following string constant (note the lack of leading whitespace):

```
usage: ${program} [options]
options:
  -h   Show help
  -v   Print version
```

This is true because:

1. The initial newline is ignored (i.e. `usage = "<newline>` => `usage = "`)
2. The whitespace of the trailing newline is recorded as 4 space characters.
3. The trailing newline is ignored
4. Four space characters are removed from the beginning of each line of the string
   literal.

Here's a crude illustration of what whitespace is removed, marked with `×`:

```
  msg = "
××××usage
××××usage: ${program} [options]
××××options:
××××  -h   Show help
××××  -v   Print version
××××"
}
```


## Constants

Kinds of constants:

- boolean
- character
- integer
- floating-point
- ratio
- string

Character, integer, floating-point, and ratio constants are collectively called
_numeric_ constants.

Numeric constants represent exact values of arbitrary precision and do not overflow. Consequently, there are no constants denoting the IEEE-754 negative zero,
infinity, and not-a-number values.

A constant may be given a type explicitly by a constant declaration or conversion,
or implicitly when used in a variable declaration or an assignment or as an
operand in an expression. It is an error if the constant value cannot be
represented as a value of the respective type. For instance, `3.0` can be given
any integer or any floating-point type, while `2147483648.0` (equal to `1<<31`)
can be given the types `float32`, `float64`, or `uint32` but not `int32` or
`string`.

An untyped constant has a default type which is the type to which the constant
is implicitly converted in contexts where a typed value is required, for instance,
in a short declaration such as `i = 0` where there is no explicit type.
The default type of an untyped constant is `bool`, `char`, `int`, `float64`,
`ratio` or `string` respectively, depending on whether it is a
boolean, character, integer, floating-point, ratio, or string constant.

Constants are declared with the shorthand syntax `name = value`:

```go
x = 4           // x is value 4 of type int
y = float32(4)  // y is value 4.0 of type float32
z = int64()     // z is value 0 (zero value for int64) of type int64
```


## Variables

A variable is a _storage location_ for holding a value and can be assigned to
using the `:=` operator.
The set of possible values is determined by the variable's _type_.

A variable's value is retrieved by referring to the variable in an expression;
it is the most recent value assigned to the variable. If a variable has not yet
been assigned a value, its value is the [zero value](#zero-value) for its type.

Variables are declared with `var` keyword.

```go
var x int64       // x holds value 0 of type int64
var y = "Y"       // y holds value "Y" of type string
var z int64 = 42  // z holds value 42 of type int64
z := 30           // z holds value 30 of type int64
z := 3.4          // error: trying to assign float64 value to var of type int64
```


## Expressions

An expression specifies the computation of a value by applying operators and
functions to operands.

```php
Expression = UnaryExpr | Expression bin_op Expression
UnaryExpr  = PrimaryExpr | unary_op UnaryExpr
ExprList   = Expression ( ("," | ";") Expression)*
```

### Operands

Operands denote the elementary values in an expression.

```php
Operand     = Literal | OperandName | "(" Expression ")"
Literal     = BasicLit | CompositeLit | FunctionLit
BasicLit    = int_lit | float_lit | ratio_lit | char_lit | string_lit
OperandName = identifier | QualifiedIdent
```

### Operators

Unary operators

```php
unary_op   = "+" | "-" | "!" | "^" | "*" | "&" | "<-"
```

Binary operators

```php
bin_op     = "||" | "&&" | bin_rel_op | bin_add_op | bin_mul_op
bin_rel_op = "==" | "!=" | "<" | "<=" | ">" | ">="
bin_add_op = "+" | "-" | "|" | "^"
bin_mul_op = "*" | "/" | "%" | "<<" | ">>" | "&" | "&^"
```

### Block

A block is a possibly empty sequence of declarations and statements within matching brace brackets.

```php
Block         = "{" StatementList? "}"
StatementList = ( Statement ";" )+
```


## Types

A type determines the _shape_ of a value — the set of values and operations
specific to values of that type. Types may be _named_ or _unnamed_. Named types
are specified by a (possibly qualified) _type name_; unnamed types are specified
using a _type literal_, which composes a new type from existing types.

```php
Type      = TypeName | TypeLit | "(" Type ")"
TypeName  = identifier | QualifiedIdent
TypeLit   = ArrayType | StructureType | FunctionType | SliceType
          | MapType | ChannelType | TupleType
TypeList  = Type ("," Type)*
```

Named instances of the boolean, numeric, and string types are predeclared.
_Composite types_—array, structure, function, list, map, and channel types—may
be constructed using type literals.

Each type T has an _underlying type_: If T is one of the predeclared boolean, numeric, or string types, or a type literal, the corresponding underlying type is T itself. Otherwise, T's underlying type is the underlying type of the type to which T refers in its type declaration.

```go
type T1 string  // underlying type is string
type T2 T1      // underlying type is string
type T3 [T1]    // underlying type is [T1]
type T4 T3      // underlying type is [T1]
```

### Type declarations

Named types can be declared in any scope and has the same visibility as
constants, variables and functions.

```go
type V int                   // type alias
type L [int]                 // list type
type F (int, int) -> string  // function type
type R { x, y int }          // record type
```

### Generalized types

Generalized type parameters are declared after a name, in between `<` and `>`:

- `<A>` — A can be any type
- `<A is B>` — A must be a type compatible with B
- `<A is B | C>` — A must be a type compatible with B or C
- `<A is B & C>` — A must be a type compatible with B _and_ C

```go
type MyList <T> [T]           // list of `T`s wher T is any type
type F <A, R> (A, A) -> R     // parameters and return value are generic
type M <A, B is X> Map<A, B>  // map with value type compatible with X
```

```go
type Foo { name string }
type Bar { age int }

fun greet<A is Foo & Bar>(a A) {
  // ok since A is a Foo and a Bar
  print("Hello ${a.name}, I hear you're ${a.age} years old")
}
greet({ name = "Anne", age int = 35 })
// "Hello Anne, I hear you're 35 years old"
```


### Booleans

A boolean type represents the set of Boolean truth values denoted by the
predeclared constants:

- `true`
- `false`

The predeclared boolean type is `bool`.


### Numeric types

A _numeric type_ represents sets of integer or floating-point values.
The predeclared architecture-independent numeric types are:

```txt
uint8       the set of all unsigned  8-bit integers (0 to 255)
uint16      the set of all unsigned 16-bit integers (0 to 65535)
uint32      the set of all unsigned 32-bit integers (0 to 4294967295)
uint64      the set of all unsigned 64-bit integers (0 to 18446744073709551615)

int8        the set of all signed  8-bit integers (-128 to 127)
int16       the set of all signed 16-bit integers (-32768 to 32767)
int32       the set of all signed 32-bit integers (-2147483648 to 2147483647)
int64       the set of all signed 64-bit integers
            (-9223372036854775808 to 9223372036854775807)

float32     the set of all IEEE-754 32-bit floating-point numbers
float64     the set of all IEEE-754 64-bit floating-point numbers

ratio       the set of all non-zero integers divided by the set of all non-zero
            integers

byte        alias for uint8
char        alias for int32
```

The value of an n-bit integer is n bits wide and represented using
[two's complement arithmetic](http://en.wikipedia.org/wiki/Two's_complement).

There is also a set of predeclared numeric types with implementation-specific sizes:

```
uint    either 32 or 64 bits
int     same size as uint
```

To avoid portability issues all numeric types are distinct except `byte`,
which is an alias for `uint8`, and `char`, which is an alias for `int32`.
Conversions are required when different numeric types are mixed in an expression
or assignment. For instance, `int32` and `int` are not the same type even though
they may have the same size on a particular architecture.


### Strings

A _string type_ represents the set of string values.
A string value is a (possibly empty) sequence of bytes.
Strings are immutable: once created, it is impossible to change the contents of
a string.
The predeclared string type is `string`.

The length of a string `s` (its size in bytes) can be discovered using the
built-in function `len`. The length is a compile-time constant if the string is
a constant.
A string's bytes can be accessed by integer indices `0` through `s.len-1`.

```go
s = "Héllo"  // é = U+00E9 and represented by two bytes in UTF-8
s.len         // 6
```

The length of a string constant is computed at compile-time, meaning that

```go
"Héllo".len  // 6
// is equivalent to:
6
```

In the following case the string constant `Héllo` is still emdebbed into the
program code, though `z` is assigned the integer value `6` of type `uint` at
compile time:

```go
s = "Héllo"
z = s.len
```


### Symbols

Symbols are symbolic names where the value is the symbol itself.

```php
SymbolDecl = "symbol" identifier
```

```
symbol Comment
```

Like string values, symbols are unique across namespaces, independent of scope:

```
// package1
symbol Foo
fun getsym() Foo {
  Foo
}

// package2
import package1
symbol Foo
fun main() {
  s = package1.getsym()
  print(s == Foo)  // true
}
```

This means that a symbol's meaning is contextual and not absolute.
[Constants](#constants) are much better for when you want to export semantic
names.

Symbols can be really useful for type matching and dynamic dispatch:

```go
symbol UTF-8
symbol UTF-16

fun encode(codepoint char, _ UTF-8) byte[] {
  // produces a list of bytes representing the codepoint as UTF8
}

fun encode(codepoint char, _ UTF-16) uint16[] {
  // produces a list of 16-bit integers representing the
  // codepoint as UTF16 
}

grinning-face = char(0x1F600)

a = grinning-face.encode(UTF-8)  // byte[](0xF0, 0x9F, 0x98, 0x80)
b = grinning-face.encode(UTF-16) // uint16[](0xD83D, 0xDE00)
```


### Arrays

An array is a numbered sequence of elements of a single type, called the
element type. The number of elements is called the length and is never negative.

```php
ArrayType   = "array" "<" ArrayLength (space | space? ",") ElementType ">"
ArrayLength = Expression
ElementType = Type

ArrayExpr   = ArrayType "(" [ ExprList [("," | ";")] ] ")"
```

The length is part of the array's type; it must evaluate to a non-negative
constant representable by a value of type `int` or `uint`, and must be a
constant expression.
The length of array a can be discovered using the built-in function `len`.
The elements can be addressed by integer indices `0` through `a.len-1`.
Array types are always one-dimensional but may be composed to form
multi-dimensional types.

```go
type A array<32, byte>
type A array<2*N, { x, y int32 }>
type A array<1000, float64>
type A array<5, array<3, int>>

a = array<4, byte>(1, 2, 3, 4)
b = array<3, int>(
  100
  200                    // multi-line via semicolon rules
  300
)
c = array<3, int>(5, 8; 13)       // semicolons and commas can be used as separators
d = array<3, array<3, float64>>() // 3 arrays, each with 3 zero-value float64's
vowels = array<128, bool>(        // some elements are initialized
  'a': true
  'e': true
  'i': true
  'o': true
  'u': true
  'y': true
)
```

Slice operations (`[s:e]`) on arrays return views into the underlying array
rather than copies of an array:

```go
some-vowels = vowels[:10]
typeof(some-vowels)  // array<10, bool>
```

#### Array mutation

Arrays need to be mutable in order to be efficient as fundamental building blocks.
Perhaps we could take an "isolate" approach, where an array is mutable as long
as its not referenced outside of its own scope:

```go
type Node {
  id       int
  children Node[]
}

fun makeNode(id int) Node {
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


### Lists

A list is a contiguous segment of an _underlying array_
and provides access to a numbered sequence of elements from that array.
A list type denotes the set of all lists of arrays of its element type.
The value of an uninitialized list is equivalent to a list of a
zero-length array.

```php
SliceType = ElementType "[]"

SliceExpr = SliceType "(" ExprList [("," | ";")] ")"
          | "[" ExprList [("," | ";")] "]"
```

Like arrays, lists are indexable and have a length.
The length of a list s can be discovered by the function `len`; unlike with
arrays it may change during execution.
The elements can be addressed by integer indices 0 through `s.len-1`.
The list index of a given element may be less than the index of the same
element in the underlying array.

A list, once initialized, is always associated with an underlying array that
holds its elements. A list therefore shares storage with its array and with
other lists of the same array; by contrast, distinct arrays always represent
distinct storage.

The array underlying a list may extend past the end of the list.
The _capacity_ is a measure of that extent: it is the sum of the length of the
list and the length of the array beyond the list; a list of length up to
that capacity can be created by _slicing_ a new one from the original list.
The capacity of a list a can be discovered using the built-in function `a.cap`.

```
type A byte[]
type A { x, y int32 }[]
type A float64[]
type A int[][]

a = [1, 2, 3, 4]              // type is int[]
const b uint32[] = [1, 2, 3]  // type is uint32[]
c = []  // invalid; no value, no type
const b string[] = []

  100
  200                    // multi-line via semicolon rules
  300
)
d = float64[3][3]()      // 3 arrays, each with 3 zero-value float64's
```


### Records

A record is an immutable set of named values.
Anonymous records can be created with the keyword `rec`.

Records can be used to model hierarchical data,
or to simply group data together.

#### Record types

```php
RecordType     = "{" (FieldDecl ";")* "}"
FieldDecl      = (NameList Type | EmbeddedField | MethodDecl)
EmbeddedField  = TypeName
```

```go
type Account {
  id   int
  name string
}
a = Account(3, name = "Bob")
print(a.name)  // "Bob"
```

Record types can be invoked like functions where its fields can be provided
either by position of declaraction or by name. Calling a record type creates a
new record instance of that type.
The syntax for calling a function type is the same as for functions.


#### Anonymous records

```php
RecordExpr      = "rec" "{" (MemberDecl (";" | ","))* "}"
MemberDecl      = MemberFieldDecl | EmbeddedField | MethodDecl
MemberFieldDecl = NameList "=" ExprList
```

Anonymous records are created "inline":

```go
fun register(account {id int; name string}) {
  // ...
}
register(rec { id = 3, name = "Bob" })
register(Account(3, name = "Bob"))

location = rec { city = "Seattle"; zip = 62110 }
location.zip   // 62110
location.name  // "Seattle"
```

#### Record fields

The fields of records are _writable directly after creation_, inside the
same scope, but becomes read-only as soon as a record is referenced outside the
creating scope, for instance by returning it from a function or passing it to
a another function in a function call.

Instances of records can be created by invoking a record type like a function,
or through a record literal:

```go
var nextAccountId = 0
defaultName = "(Unnamed)"

fun makeAccount(name string?) Account {
  a = Account(nextAccountId++, name=defaultName)
  if name {
    a.name = name  // ok to assign to name; account record is isolated
  }
  a
}

fun main() {
  a = makeAccount("Kenny")
  print(a.name)   // "Kenny"
  a.name = "Bob"  // error: assignment to read-only field "name"
}
```


#### Record methods

Records can contain method declarations, which is syntactic sugar for declaring
functions that take the record type as its first argument:

```go
type Account<T> {
  name T

  foo() int {
    @.name.len
  }
}
```

Method syntax can be especially convenient with anonymous records, saving you
from typing (and maintaining) the record type:

```go
webServerConfig = rec {
  port = 1230
  host = "localhost"

  url(path string = "") string {
    "http://$(@.host):$(@.port)/$path"
  }
}

fun main() {
  print(webServerConfig.url("/hello"))  // "http://localhost:1230/hello"
}
```

See ["Methods"](#methods) for more information.


#### Modifying records through derivation

Although records are immutable outside of their isolated scope, they can still
be modified, or rather: they can be _derived_ to form new records.

Here's an example of a simple stack implementation that returns a new stack
everytime it's modified:

```go
type Link<T> {
  val  T
  next Link<T>
}

type Stack<T> {
  head Link<T>?

  push(s Stack, T val) Stack {
    s(Link(val, next=s.head))
  }

  pop(s Stack) (Stack, T?) {
    l = s.head
    if l {
      (s(head = l.next), l.val)  // Derive s with new value for "head"
    } else {
      (s, nil)
    }
  }
}

fun main() {
  var s = Stack<int>()

  s, v1 = s.pop()
  print(v1) // nil

  s = s.push(1)
  s = s.push(2)

  s, v2 = s.pop()
  print(v2) // 2

  s, v3 = s.pop()
  print(v3) // 1

  s, v4 = s.pop()
  print(v4) // nil
}
```

#### Records as interfaces

A record that forward-declares a method but never implements that method can't
be instantiated, but its _type_ can still be used:


```go
type Reader<T> {
  read() T
}

fun parse(r Reader<byte>) {
  // read from reader
}

type bufReader {
  var i = 0
  bytes array<byte>
  read() byte {
    bytes[i++]
  }
}

fun main() {
  r = Reader() // error: can't instantiate record interface Reader
  r = bufReader(bytes = array<byte>("Hello"))
  parse(r) // ok since r matches Reader<byte>
}
```


### Functions

A function denotes the set of all functions with the same parameter and
result types.

```php
FunctionType  = (Parameters | Type) "->" Result?
FunctionDecl  = "fun" FunctionName Signature FunctionBody?
FunctionExpr  = "fun" FunctionName? Signature FunctionBody
MethodDecl    = FunctionName Signature FunctionBody?

Result        = Parameters | Type
FunctionName  = identifier
Signature     = Parameters Result?
Parameters    = "(" [ ParameterList [ "," ] ] ")"
ParameterList = ParameterDecl ("," ParameterDecl)*
ParameterDecl = [ NameList ] [ "..." ] Type
FunctionBody  = Block
```


```go
// Function types
type F0 ()->
type F1 (x int) -> int
type F1 int -> int
type F2 (x, y int, z float32) -> bool
type F3 (int, int, float32) -> (bool)  // equivalent to F2
type F4 (prefix string, values ...int) ->
type F5 (b byte[]) -> (char, uint)

// Forward function declaration
fun F6 (x int, int) float32

// Function declaration
fun F6 (x, y int) float32 { float32(x) * y }

// Function expression
F7 = fun(x int) int { x * 2 }

// Function literal
F8 = (x int) -> x * 2

// Method declaration
type Person {
  F9(x, y int) float32 {
    float32(x) * y
  }
}
```

Functions can be called with dot notation which acts as syntactic sugar,
passing whatever expression comes before the dot as the first parameter to the
function:

```go
fun foo(s string) int {
  s.len * 2
}

x = "Hello"
x.foo() // 10

type Account {
  name string
}
account = Account(name="Bob")
account.name.foo() // 6
```

#### Methods

When declaring record types, functions that take the record as its first
parameter can be declared using the method shorthand:

```go
type Account<T> {
  name T

  foo() int {
    @name.len
  }
}
```

Which is equivalent to:

```go
type Account<T> {
  name T
}

fun foo(@ Account<T>) int {
  @name.len
}
```

Forward declaration of methods works just the same as for functions:

```go
type Account<T> {
  name T

  foo() int
}
// ...
fun foo(@ Account<T>) int {
  @name.len
}
```

Inside a method the special `@name` syntax can be used to refer to the first
argument (the record instance.) `@name` is equivalent to `@.name` since `@` is
the automatic name of the record instance and can be passed around just like
any other constant name:

```go
type Box<T> {
  value T

  withValue(v T?) {
    if v @(value = v) else @
  }
}

fun main() {
  a = Account<int>()
  a2 = a.withValue(nil)
  print(a == a2)  // true
  a3 = a.withValue(123)
  print(a3.value)  // 123
}
```

Which could alternatively be written using regular function syntax:

```go
type Box<T> {
  value T
}
fun withValue<T>(b Box<T>, v T?) {
  if v b(value = v) else b
}
// ...
```


### Function literals

Function literals allow defining functions "inline".

```php
FuncLit        = FuncLitNParams | FuncLit0Params
FuncLitNParams = (Parameters | identifier) "->" (Expr | FunctionBody)
FuncLit0Params = FunctionBody
```

When a function literal doesn't declare its parameter types, the receiver
must declare a function type:

```go
var sum = (x, y) -> x + y      // error: missing function type in assignment
var sum = (x, y int) -> x + y  // ok; typed parameters
var sum (int, int)->int = (x, y) -> x + y  // ok; typed var declaration
var sum ((int, int)->int)?     // optional; zero-initialized to nil
sayHello = { print("Hello") }  // ok; no parameters
```

The flexible syntax of function literals allow writing code that is
easy to read:

```go
names = ["Bob", "Anne", "Karen"]
fun map<T,R>(c Collection<T>, f T->R) R[]  // declared elsewhere

names.map(name -> name[:2]).sort() // ["An", "Bo", "Ka"]
```

When the last (or only) argument to a function call is a function, that
argument can be passed after the function call instead of as a parameter.
This makes code like the following much easier to read and maintain:

```go
names.map name -> {
  name.filter ch -> {
    'a' >= ch || ch <= 'z'
  }
}

// Without relying on "trailing function parameter":
names.map(name -> {
  name.filter(ch -> {
    'a' >= ch || ch <= 'z'
  })
})
```

A trailing function parameter must _directly follow_ the call and can not
be placed on a new line, since with semicolon insertion rules, that would mean
a separate statement.

```go
names.map       // error: not enough arguments to function map
  name -> name  // error: unexpected ->
```

You'd have to pass the function as a regular (non-trailing) parameter instead,
or end a line with `->`

```go
names.map(
  name -> name  // ok; inside parens
)
// alternatively
names.map name -> // no semicolon inserted in this case
  name
```

For code dealing with short single expressions, we can write as little code
as this:

```go
names.map name -> name.filter ch -> 'a' >= ch || ch <= 'z'
```

However, such code is usually hard to read and should be avoided.
It's better to break code like this up across several lines.
(Because of semicolon rules, we'd have to use parens, braces or end lines
with `->`)

```go
names.map(
  name -> name.filter(
    ch -> 'a' >= ch || ch <= 'z'
  )
)

// or
names.map name ->
  name.filter ch ->
    'a' >= ch || ch <= 'z'

// or
names.map name -> {
  name.filter ch -> { 'a' >= ch || ch <= 'z' }
}
```

When a function literal doesn't take any parameters, it can be written as just
a [block](#block) (`{...}`):

```go
defer () -> print("left scope")
// is equivalent to:
defer { print("left scope") }
```


Another example:

```go
fun max<T>(c Collection<T>, less: (T, T) -> bool): T? {
  var max T?
  for (it in c) {
    if (!max || less(max, it)) {
      max = it
    }
  }
  max
}

max(names, (a, b) -> a.len < b.len)  // "Karen"
```

#### TODO: Consider allowing just an expression for FuncLit0Params

```go
defer print("left scope")
startTimer(1000) print("timer Expired")
var printHello ()-> = print("Hello")
```


### Optional types

TODO


## Declarations

```php
Declaration = ConstDecl | VarDecl | FuncDecl | TypeDecl

ConstDecl   = "const" NameList [Type] "=" ExprList
VarDecl     = "var" NameList ( Type ["=" ExprList] | "=" ExprList )

NameList    = identifier ("," identifier)*
EpxrList    = Expr ("," Expr)*
```

- Constants — `const PI = 3.141592`
- Variables — `var counter = 3`
- Functions — `fun greet(name string, age, height int)`, etc
- Types — `type byte uint8`, `type Account { ... }`, etc



## Program initialization and execution

TODO

### Zero value

TODO
