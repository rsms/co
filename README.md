# The Co programming language

A programming language and optimizing compiler.

This is a project about:

- Designing a practical, general-purpose programming language
  - Statically typed, but the compiler does as much for you as possible
  - Simple syntax, few built-ins
  - More like Go than JavaScript
- Optimizing compiler
  - Input-language agnostic
  - Intermediate Representation in SSA form
  - Flexible target architecture (x86, amd64, vm, wasm, etc.)
- Pipelined rather than progressive
  - scanning source code into the parser
  - parser passes AST chunks to the IR builder
  - IR builder optimizes the chunks and then passes them to the code generator
  - All this happens in a streaming fashion
  - But each step can be easily separated and run independendly, making
    it easy to inspect the state of the compiler at various steps of the
    process.
- Using no exernal libraries
  - Portable (can run in a web browser)
  - Simplify codebase
  - Minimize risk of security concerns
  - Maximize startup performance


## Using

Requirements: [nodejs](https://nodejs.org/) >=8.0

Building:
- Setup: `npm install`
- Build incrementally: `./build.js -w`
- Run: `./dist/co.g`

Some useful things:
- Build debug version in one go: `./build.js`
- Build optimized production version: `./build.js -O`
- Run unit tests before main program: `./dist/co.g -test`
- Run unit tests and exit: `./dist/co.g -test-only`
- Print source diagnostics report and exit: `./dist/co.g -nobuild`
- Live coding setup:
  - Terminal 1: `./build.js -w`
  - Terminal 2: `autorun dist/co.g`
  - You'll need [`autorun`](https://github.com/rsms/autorun)
