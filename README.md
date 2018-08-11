# The Co programming lanugage

A programming language and compiler.

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
