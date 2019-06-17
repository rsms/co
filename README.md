# The Co programming lanugage

A programming language and optimizing compiler.

This is a project about:

- Designing a practical, general programming language
  - static types, but doing as much for you as possible
  - simple syntax, few built-ins
  - more like Go than JavaScript
- Building an optimizing compiler
  - Input-language agnostic
  - Intermediate Representation in SSA form
  - Flexible target architecture (x86, amd64, internal vm, wasm, etc.)
- Pipelined rather than progressive
  - scanning source code into the parser
  - parser passes AST chunks to the IR builder
  - IR builder optimizes the chunks and then passes them to the code generator
  - All this happens in a streaming fashion
  - But each step can be easily separated and run independendly, making
    it easy to inspect the state of the compiler at various steps of the
    process.
- Using no exernal libraries; minimize dependencies


## Using

Building:
- Setup: `yarn` or `npm install`
- Build incrementally: `./build.js -w`
- Run: `./dist/co.g`

Building debug version: `./build.js`

Building optimized/production version: `./build.js -O`

Running unit tests:
- `./dist/co.g -test-only` runs unit tests and exit
- `./dist/co.g -test` runs unit tests first and then the program

Dependencies: [nodejs](https://nodejs.org/)


### Exploratory live-coding setup

- Terminal 1: `./build.js -w`
- Terminal 2: `autorun dist/co.g`

You can get autorun here: https://github.com/rsms/autorun
