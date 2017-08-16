/*import "foo"
import bar "bar"
import . "lol/cat"
import (
  "bob-hello"
  bar "alt/bar"
  . "meow"
)

const (
  a int = 0
  b, c
  d
)

const (
  aaa int = 0
  bbb
  ccc
  ddd
)

var (
  g int = 0
  h Foo
)*/

var n int
var n = 3
var n int = 3
var a, b, c = 1, 2, 3
var a, b, c int = 1, 2, 3

const x foo.bar.lol.cat = -123

type A B    // concrete
type C = B  // alias (b/c of `=`)

// Diverging from Go syntax here
type S {
  // foo() {}
}

// interface I {
//   n int
// }

// func foo() {
//   a := 4
// }
