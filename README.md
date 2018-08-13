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
- Setup: `yarn` (or `npm install` if you are using NPM)
- Build incrementally: `./build.js -w`
- Run: `node out/xlang.debug.js`

Building debug version: `./build.js`

Building optimized/production version: `./build.js -O`

Running unit tests:
- `node out/xlang.debug.js -test-only` runs unit tests and exit
- `node out/xlang.debug.js -test` runs unit tests first and then the program

Dependencies: [nodejs](https://nodejs.org/)
