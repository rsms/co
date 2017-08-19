# Grammar

Describes the language grammar.

### Characters

The following terms are used to denote specific Unicode character classes:

```php
newline        = /* the Unicode code point U+000A */
unicode_char   = /* an arbitrary Unicode code point except newline */
unicode_letter = /* a Unicode code point classified as "Letter" */
unicode_digit  = /* a Unicode code point classified as "Number, decimal digit" */
```

### Letters and digits

```php
letter        = unicode_letter | "_" | "$"
decimal_digit = "0" ... "9"
octal_digit   = "0" ... "7"
hex_digit     = "0" ... "9" | "A" ... "F" | "a" ... "f"
```

### Comments

Comments have no semantic effect on a program. There are two forms:

```php
Comment        = LineComment | GeneralComment
LineComment    = "//" /* anything except newline */ newline
GeneralComment = "/*" /* anything except the terminator: */ "*/"
```

### Semicolons

The formal grammar uses semicolons ";" as terminators in a number of productions.
However, most of these semicolons can be omitted using the following two rules:

1. When the input is broken into tokens, a semicolon is automatically inserted
   into the token stream immediately after a line's final token if that token is
    - an identifier
    - an integer, floating-point, imaginary, char, or string literal
    - one of the keywords `break`, `continue`, `fallthrough`, or `return`
    - one of the operators and delimiters `++`, `--`, `)`, `]`, or `}`
2. To allow complex statements to occupy a single line, a semicolon may be
   omitted before a closing ")" or "}".

To reflect idiomatic use, code examples elide semicolons using these rules.


## Identifiers

```php
identifier = letter (letter | unicode_digit)*
```

```
a
_3
HelloWorld
αβ
```


## Keywords

The following keywords are reserved and may not be used as identifiers

```
break        default      for          import       switch
case         defer        func         package      type
chan         else         go           range        var
const        enum         goto         return       while
continue     fallthrough  if           select       
```


## Operators and Delimiters

The following character sequences represent operators, delimiters, and other special tokens:

```
+    &     +=    &=     &&    ==    !=    (    )
-    |     -=    |=     ||    <     <=    [    ]
*    ^     *=    ^=     <-    >     >=    {    }
/    <<    /=    <<=    ->    =     :=    ,    ;
%    >>    %=    >>=    ++    !     ...   .    :
     &^          &^=    --          ..
```


## Literals

```php
Literal   = int_lit | float_lit | ratio_lit | char_lit | string_lit
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
\'   U+0027 single quote  (valid escape only within rune literals)
\"   U+0022 double quote  (valid escape only within string literals)
```

All other sequences starting with a backslash are illegal inside character
literals.

```php
rune_lit       = "'" ( unicode_value | byte_value ) "'"
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

**Multiline strings**

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
func usage() {
  msg := "
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

1. The initial newline is ignored (i.e. `usage := "<newline>` => `usage := "`)
2. The whitespace of the trailing newline is recorded as 4 space characters.
3. The trailing newline is ignored
4. Four space characters are removed from the beginning of each line of the string
   literal.

Here's a crude illustration of what whitespace is removed, marked with `×`:

```
  msg := "
××××usage
××××usage: ${program} [options]
××××options:
××××  -h   Show help
××××  -v   Print version
××××"
}
```


## Declarations

```php
Declaration = ConstDecl | VarDecl | FuncDecl | TypeDecl

ConstDecl   = "const" NameList [Type] "=" ExprList
VarDecl     = "var" NameList ( Type ["=" ExprList] | "=" ExprList )

NameList    = Name ("," Name)*
EpxrList    = Expr ("," Expr)*
```

- Constants — `const PI = 3.141592`
- Variables — `var counter = 3`
- Functions — `func greet(name string, age, height int)`, etc
- Types — `type byte uint8`, `type Account { ... }`, etc
