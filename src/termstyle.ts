// provides styling via shell color codes
//
// A Style object provides a number of functions named after their effect,
// like "boldRed". A style function takes a single argument which is interpreted
// as a string, and returns a string with the appropriate style codes
// surrounding the string argument.
//
// Additionally, each such function has two properties: open and close, each
// which are strings containing the starting (or ending) code(s) for the
// appropriate style.
//
// Examples:
//
//   style.boldRed("hello")    // => "\x1b[1;31mhello\x1b[0;39m"
//   stdoutStyle.cyan("hello") // => "\x1b[36mhello\x1b[39m"
//

// progressively support nodejs
interface has_isTTY { isTTY? :bool }
declare var process :undefined | {
  env :{[k:string]:string},
  stdout: has_isTTY,
  stderr: has_isTTY,
}
const TERM = typeof process != 'undefined' && process.env.TERM || ''

export type StyleFun = (s: string) => string

function sfn(open :string, close :string) :StyleFun {
  open = '\x1b[' + open + 'm'
  close = '\x1b[' + close + 'm'
  return (s :string) => open + s + close
}

// number of colors that the terminal probably supports
export const termColorSupport :number = (
  TERM && ['xterm','screen','vt100'].some(s => TERM.indexOf(s) != -1) ? (
    TERM.indexOf('256color') != -1 ? 256 :
    16
  ) : 0
)

const passThrough = ((s :string) => s) as StyleFun

export interface Style {
  'clear'         :string

  'bold'          :StyleFun
  'italic'        :StyleFun
  'underline'     :StyleFun
  'inverse'       :StyleFun

  'white'         :StyleFun
  'grey'          :StyleFun
  'black'         :StyleFun

  'blue'          :StyleFun
  'cyan'          :StyleFun
  'green'         :StyleFun
  'magenta'       :StyleFun
  'purple'        :StyleFun
  'pink'          :StyleFun
  'red'           :StyleFun
  'yellow'        :StyleFun
  'lightyellow'   :StyleFun
  'orange'        :StyleFun
}

export const noStyle :Style = {
  // no colors
  'clear'         : "",

  'bold'          : passThrough,
  'italic'        : passThrough,
  'underline'     : passThrough,
  'inverse'       : passThrough,

  'white'         : passThrough,
  'grey'          : passThrough,
  'black'         : passThrough,
  'blue'          : passThrough,
  'cyan'          : passThrough,
  'green'         : passThrough,
  'magenta'       : passThrough,
  'purple'        : passThrough,
  'pink'          : passThrough,
  'red'           : passThrough,
  'yellow'        : passThrough,
  'lightyellow'   : passThrough,
  'orange'        : passThrough,
}

export const style :Style = (
  termColorSupport == 0 ? noStyle :
  termColorSupport < 256 ? {
    // 16 colors
    'clear'         : "\e[0m",

    'bold'          : sfn('1', '22'),
    'italic'        : sfn('3', '23'),
    'underline'     : sfn('4', '24'),
    'inverse'       : sfn('7', '27'),

    'white'         : sfn('37', '39'),
    'grey'          : sfn('90', '39'),
    'black'         : sfn('30', '39'),
    'blue'          : sfn('34', '39'),
    'cyan'          : sfn('36', '39'),
    'green'         : sfn('32', '39'),
    'magenta'       : sfn('35', '39'),
    'purple'        : sfn('35', '39'),
    'pink'          : sfn('35', '39'),
    'red'           : sfn('31', '39'),
    'yellow'        : sfn('33', '39'),
    'lightyellow'   : sfn('93', '39'),
    'orange'        : sfn('33', '39'),
  } : {
    // 256 colors
    'clear'         : "\e[0m",

    'bold'          : sfn('1', '22'),
    'italic'        : sfn('3', '23'),
    'underline'     : sfn('4', '24'),
    'inverse'       : sfn('7', '27'),

    'white'         : sfn('38;2;255;255;255', '39'),
    'grey'          : sfn('38;5;244', '39'),
    'black'         : sfn('38;5;16',  '39'),
    'blue'          : sfn('38;5;75',  '39'), // '38;2;120;160;255'
    'cyan'          : sfn('38;5;87',  '39'),
    'green'         : sfn('38;5;84',  '39'),
    'magenta'       : sfn('38;5;213', '39'),
    'purple'        : sfn('38;5;141', '39'),
    'pink'          : sfn('38;5;211', '39'),
    'red'           : sfn('38;2;255;110;80', '39'),
    'yellow'        : sfn('38;5;227', '39'),
    'lightyellow'   : sfn('38;5;229', '39'),
    'orange'        : sfn('38;5;215', '39'),
  }
)

// demo
// for (let k in style) {
//   if (k != 'clear') {
//     console.log((style as any)[k](k))
//   }
// }
// for (let mod of ['bold','italic','underline','inverse']) {
//   for (let col of [
//     'white','grey','black','blue','cyan','green','magenta','red','yellow'
//   ]) {
//     console.log(
//       (style as any)[col](
//         (style as any)[mod](mod + ' ' + col)
//       )
//     )
//   }
// }
// ;(process as any).exit(0)


// streamStyle returns the most appropriate Style object for `w`
export function streamStyle(w :has_isTTY) {
  return termColorSupport && w.isTTY ? style : noStyle
}

export const stdoutStyle = (
  typeof process != 'undefined' && streamStyle(process.stdout) || noStyle
)

export const stderrStyle = (
  typeof process != 'undefined' && streamStyle(process.stderr) || noStyle
)

export const stdoutSupportsStyle = stdoutStyle !== noStyle
export const stderrSupportsStyle = stderrStyle !== noStyle
