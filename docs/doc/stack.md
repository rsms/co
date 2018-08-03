---
layout: page
title: Stack
---

# Call stack

To understand how Co's call stack works, let's explore a simple program:

```erl
fun twice(x i32) i32 {
  x * 2
}

fun add(a, b, c i32) (i32, bool) {
  b = twice(b)
  (a + b + c, true)
}

fun main {
  add(10, 20, 30)
}
```

Before we dig in, consider the following:

- This example assumes an intel-like architecture with 64-bit (8 byte) addressing.
- **SP** is the stack pointer — points to the top of the stack.
- **SB** is the base pointer — value of the beginning of program address space.
- **BP** is the frame pointer ("base pointer")

Okay.

When we enter `main` the stack looks like this:

![](stack-01.svg)

`SP` is the _stack pointer_—a register value that is used to refer to the
current address in the stack memory. We use this value to address nearby
values in the current _stack frame._ In these illustrations, the number next
to `SP` indicates an offset from `SP`, for instance `SP +4` means
"SP plus 4 bytes".

In this example, memory is addressed with 64-bits (8 bytes.)

The `main` function first grows the stack to make room for
frame pointer address, call arguments and return values:

```s
SUBQ  $32, SP     # grow stack
MOVQ  BP, 24(SP)  # store frame-pointer in stack memory at SP+24
LEAQ  24(SP), BP  # load new frame pointer addr into BP (excl return address)
```

![](stack-02.svg)

Since stack memory is pre-allocated, "growing" the stack really just means
to change the value of `SP`.
As the stack grows, the stack pointer (SP) _decreases_ in value.

Next, `main` writes the arugments to the `add` function we're about to call:

```s
MOVL  $10, (SP)   # store arg 1 at memory address SP=50=50
MOVL  $20, 4(SP)  # store arg 2 at memory address SP=50+4=54
MOVL  $30, 8(SP)  # store arg 3 at memory address SP=50+8=58
```

![](stack-03.svg)

But hey, we need 36 bytes of memory here, not 32 right? What about moving SP
past the end of the 4-byte storage for "Arg 1 for foo"?
Intel architecture-like CPUs will automatically decrement SP by 8 (address size)
before writing the return address to SP, thus we have 8 bytes of space in the
stack after our SP.

Finally the `CALL` instruction is issued, causing execution to jump from the
`main` function to the `add` function.

```s
CALL  add(SB)
```

![](stack-04.svg)

The `CALL` instruction performs the following:

1. Increment IP (instruction pointer) register
2. Subtract 8 from SP (8 = address size)
3. Copy IP to address stored at SP —
   this effectively writes the return addressat SP; the program-memory address
   just after our CALL instruction (value of IP.)
4. Set IP to address given with CALL operand (`add(SB)`)

We're now in the `add` function which does the same thing that the `main`
function did in it's "prologue", namely to grow the stack and save its
frame pointer:

```s
SUBQ  $24, SP     # grow stack
MOVQ  BP, 16(SP)  # store frame-pointer in stack memory at SP+16
LEAQ  16(SP), BP  # load new frame pointer addr into BP (excl return address)
```

![](stack-05.svg)

The `RET` instruction performs the following:

1. Copy SP to IP
2. Add 8 to SP (8 = address size), effectively "popping" the return address
   off the stack


```txt
GOOS=linux GOARCH=amd64 go tool compile -S main.go
```


```s
twice
  TEXT  twice(SB), NOSPLIT, $0-16  # locals size = 0, args size = 16
  MOVL  x+8(SP), AX
  SHLL  $1, AX
  MOVL  AX, ~r1+16(SP)
  RET


add
  TEXT  add(SB), $24-24    # locals size: 24, args size: 24
  
  SUBQ  $24, SP         # grow stack for call args + retvals + retaddr
  MOVQ  BP, 16(SP)      # store current frame pointer at SP+16
  LEAQ  16(SP), BP      # compute & store new frame pointer addr
  
  MOVL  b+36(SP), AX # load add's 2nd arg into register AX
  MOVL  AX, (SP)        # push arg 1
  
  CALL  twice(SB)       # call "twice" function

  MOVL  a+32(SP), AX    # load return value from "twice" into AX
  ADDL  8(SP), AX       # add args a and b; result stored to AX

  MOVL  c+40(SP), CX    # load arg c into CX
  ADDL  CX, AX          # add result of above and arg c

  # store return values (for the current function)
  MOVL  AX, ~r3+48(SP)  # store result of addition to SP+48 (retv 1)
  MOVB  $1, ~r4+52(SP)  # store constant 1 to sp+52 (retv 2)

  # restore stack
  MOVQ  16(SP), BP      # restore stack pointer (unwind by one stack frame)
  ADDQ  $24, SP         # shrink stack (balances growth by SUBQ $24, SP)

  RET


main
  TEXT  main(SB), $32-0  # locals size: 32, args size: 0

  SUBQ  $32, SP        # grow stack for call args + retvals
  MOVQ  BP, 24(SP)     # store current frame pointer at SP+24
  LEAQ  24(SP), BP     # compute & store new frame pointer addr

  # prepare for call to "add"
  MOVL  $10, (SP)      # push arg 1
  MOVL  $20, 4(SP)     # push arg 2
  MOVL  $30, 8(SP)     # push arg 3

  # call "add" function
  CALL  add(SB)
    # Note that CALL also pushes the return-address (8 bytes) at the top
    # of the stack; so every references to SP made from within our add
    # function end up being offsetted by 8 bytes.

  # restore stack
  MOVQ  24(SP), BP     # unwind stack pointer by one stack frame
  ADDQ  $32, SP        # shrink stack (balances growth by SUBQ $32, SP)

  RET
```


Notes:

- **SP** is the stack pointer.<br>
  The SP pseudo-register is a virtual stack pointer used to refer
  to frame-local variables and the arguments being prepared for
  function calls. It points to the top of the local stack frame,
  so references should use negative offsets in the range
  `[−framesize, 0)`: `x-8(SP)`, `y-4(SP)`, and so on.

- **SB** is the static base pointer.<br>
  SB is a presudo-register that holds the "static-base" pointer,
  i.e. the address of the beginning of the program address space.

- **BP** is the frame pointer ("base pointer").

- **LEAQ** (or just LEA) stands for Load Effective Address.<br>
  LEA, the only instruction that performs memory addressing calculations but doesn't actually address memory. LEA accepts a standard memory addressing operand, but does nothing more than store the calculated memory offset in the specified register, which may be any general purpose register.

  What does that give us? Two things that ADD doesn't provide:

  - the ability to perform addition with either two or three operands, and
  - the ability to store the result in any register; not just one of the source operands
