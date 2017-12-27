class ConstData {
  constructor(name /*string*/) {
    this.name = name
    this.bytes = [] // byte[]
  }

  alloc(bytes /*ArrayLike<byte>*/) {
    const start = this.bytes.length
    const end = start + bytes.length
    this.bytes = this.bytes.concat(bytes)
    return `${this.name}.subarray(${start},${end})`
  }

  getInitJS() {
    let bytesStr = ''
    let lineStart = 0
    for (const b of this.bytes) {
      const s = b.toString()
      if ((bytesStr.length + 1 + s.length) - lineStart >= 80) {
        lineStart = bytesStr.length
        bytesStr += '\n  '
      }
      bytesStr = bytesStr ? bytesStr + ',' + s : s
    }
    return `const ${this.name} = new Uint8Array([${lineStart == 0 ? '' : '\n  '}${bytesStr}])`
  }
}

function genBTree(cdat /*ConstData*/, m /*Map*/) {
  const jsIdRe = /^[a-zA-Z0-9_]+$/

  const indentation = '  '
  const pairs = []
  const sortedKeys = Array.from(m.keys())
  sortedKeys.sort()

  for (let i = 0; i < sortedKeys.length; ++i) {
    const k = sortedKeys[i]
    pairs.push({ key: k, value: m.get(k)})
  }

  const genBranch = (pairs, indent) => {
    let pair, leftPairs, rightPairs

    if (pairs.length == 1) {
      pair = pairs[0]
    } else {
      const midIndex = Math.floor(pairs.length / 2)-1
      pair = pairs[midIndex]
      leftPairs = pairs.slice(0, midIndex)
      rightPairs = pairs.slice(midIndex + 1)
    }

    let s = `{ k: ${cdat.alloc(strbytes(pair.key))} /*${pair.key.replace('*/','*-/')}*/, v: ${pair.value}`
    if (leftPairs && leftPairs.length) {
      s += `,\n${indent}  L:${genBranch(leftPairs, indent + indentation)}`
    }
    if (rightPairs && rightPairs.length) {
      s += `,\n${indent}  R:${genBranch(rightPairs, indent + indentation)}`
    }
    return s + `}`
  }

  return genBranch(pairs, indentation)
}

function strbytes(s) {
  return Array.from(s).map(s => s.charCodeAt(0))
}

const cdat = new ConstData('cdat')

const keywordsJS = genBTree(cdat, new Map([
  ["break",   "token.BREAK"],
  //["case",  "token.CASE"],
  //["chan",  "token.CHAN"],
  //["const",   "token.CONST"],
  ["continue",  "token.CONTINUE"],
  ["default",   "token.DEFAULT"],
  ["defer",   "token.DEFER"],
  ["else",  "token.ELSE"],
  ["enum",  "token.ENUM"],
  ["fallthrough", "token.FALLTHROUGH"],
  ["for",   "token.FOR"],
  ["fun",  "token.FUN"],
  ["go",  "token.GO"],
  //["goto",  "token.GOTO"],
  ["if",  "token.IF"],
  ["import",  "token.IMPORT"],
  ["interface",  "token.INTERFACE"],
  ["in",  "token.IN"],
  //["map",   "token.MAP"],
  //["package",   "token.PACKAGE"],
  //["range",   "token.RANGE"],
  ["return",  "token.RETURN"],
  ["select",  "token.SELECT"],
  //["struct",  "token.STRUCT"],
  ["switch",  "token.SWITCH"],
  ["symbol",  "token.SYMBOL"],
  ["type",  "token.TYPE"],
  ["var",   "token.VAR"],
]))

console.log(
  cdat.getInitJS() + ';\n' +
  'const keywords = new BTree<token>(\n  ' + keywordsJS + '\n)'
)
