import './global'
import * as scanner from './scanner'
import { Position, FileSet } from './pos'
import { token, hasIntValue, hasByteValue, tokstr } from './token'
import * as utf8 from './utf8'
import * as unicode from './unicode'
import * as fs from 'fs'

function main() {
  const s = new scanner.Scanner()
  const onErr = (p :Position, msg :string) => {
    console.error(`[scanner error] ${msg} at ${p}`)
  }

  const fileSet = new FileSet()

  const filename = 'example/in0.go'
  const src = new Uint8Array(fs.readFileSync(filename, {flag:'r'}))
  const file = fileSet.addFile(filename, src.length)

  s.init(file, src, onErr, scanner.Mode.ScanComments)

  for (let t :token; (t = s.scan()) != token.EOF; ) {

    let srcStr = ''
    if (t == token.CHAR) {
      srcStr = unicode.repr(s.intval)
    } else if (hasIntValue(t)) {
      srcStr = s.intval.toString()
    } else if (hasByteValue(t)) {
      srcStr = JSON.stringify(utf8.decodeToString(s.byteValue()))
    }

    console.log(`${tokstr(t)}\t${srcStr}\tat ${file.position(s.pos)}`)
  }

  // while (s.ch != -1) {
  //   console.log(
  //     `rune '${utf8.encodeString(s.ch)}' 0x${s.ch.toString(16)} at ${s.currentPosition()}`
  //   )
  //   s.next()
  // }
}


main()
