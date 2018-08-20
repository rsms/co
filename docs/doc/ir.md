---
layout: page
title: IR
---

# Intermediate Representation (IR)

When a program is compiled, it passes through a "pipeline"
which can be visualized like this:

`source text` —> `tokens` —> `AST` —> `IR code` —> `target code`

First, source text is parsed into an Abstract Syntax tree. This is where
syntactic transformations, scope resolution, variable resolution and
type resolution happens, as well as most error checking.
After some piece of source code has been successfully
translated into AST, Intermediate Representation (just "IR" from here on) is
built from the AST.

Here's a short example, starting with source code:

```kt
fun foo(x, y int) int {
  if x > 3 {
    y++
  }
  x + y
}
```

The following AST is built from parsing the `foo` function:

```txt
(fun <(int, int)->int> foo ((x int) (y int))
  (block
    (if (<bool>GT <int>x <int>3)
      (assign (<int>y) INC)
    )
    (return (<int>ADD <int>x <int>y))
  )
)
```

And here is the IR generated for that function's AST:

```go
foo (int int)->int
  b0:                          // function's entry block
    v1 = LoadParam <int> [0]   // load parameter x
    v2 = LoadParam <int> [1]   // load parameter y
    v3 = i32Const <int> [3]    // load constant 3
    v4 = i32Gt_u <bool> v1 v3  // x > 3
    v5 = i32Const <int> [1]    // load constant 1
  if v4 —> b1 b2               // if ... then goto b1, else goto b2

  b1: <— b0                    // "then" branch of "if"
    v6 = i32Add <int> v2 v5    // y + 1
  cont —> b2                   // unconditionally continue to block 2

  b2: <— b0, b1                // end "if" ("else" branch)
    v8 = Phi <int> v2 v6       // note that y varies with entry branch
    v9 = i32Add <int> v1 v8    // x + y
  ret v9                       // return x from function
```

We can observe a few things about this process:

- The AST could be converted back to source code without loss of information,
  but the IR couldn't.
- The IR is more verbose than the AST, but also a lot simpler,
  with just a single basic operation per line.
- Branches are separated into blocks (aka "basic blocks") that connect to
  each other (`b0`, `b1`, etc are "blocks".)
- The IR uses
  [SSA form](https://en.wikipedia.org/wiki/Static_single_assignment_form) which
  is why we don't see any traditional variable assignments, but instead just
  numbered variables (e.g. `v3`, `v10` etc.)
- `x++` was simplified to `x = x + 1`
- It looks similar to assembly language. This makes it easier to translate the
  IR to the target code.


## Internal constructs

**Op** is an enum representing all basic operations (instructions).
e.g. `i32Gt_u` for "compare two unsigned 32-bit integers with greater-then".
There are a few special operations, like `Phi` which represents a SSA phi
(branch merge point.) The set of operations closely matches the
[instruction set of WebAssembly](https://webassembly.github.io/spec/core/syntax/instructions.html)

**Value** is "a line of IR"; holds operation and operands in a
Three-Address Code fashion. Uniquely numbered within a function.

**Block** is basic block containing `Value`s.
Contains links to predecessor blocks in `.preds` and to successors in `.succs`.
Blocks forms the
[Control Flow Graph](https://en.wikipedia.org/wiki/Control_flow_graph)
of a function.

**BlockKind** denotes what specific kind a block is; how a block exists.
The `.control` property of the block controls the path taken from a block.

| kind       | control (x)    | successors     | notes
| ---------- | -------------- | -------------- | --------
| `Plain`    | *(nil)*        | next           | e.g. cont/goto
| `If`       | boolean        | then, else
| `Ret`      | memory         | *(none)*
| `First`    |                | next           | used by lowering pass

**Fun** represents a function and contains a list of all blocks that comprises
the function. `Fun` also maintains a constant cache and handles value and block
ID allocation.

**IRBuilder** builds IR for a package on a per-function basis
