type int = number
type byte = number
type bool = boolean

// ArrayLike
// interface Vector<T> {
//   readonly length :int
//   readonly [index :number] :T
// }

const G = global as any

function _stackTrace(cons :Function): string {
  const x = {stack:''}
  Error.captureStackTrace(x, cons)
  const p = x.stack.indexOf('\n')
  return p == -1 ? x.stack : x.stack.substr(p+1)
}

function panic(msg :any, ...v :any[]) {
  console.error('panic:', msg, ...v, '\n' + _stackTrace(panic))
  process.exit(2)
}
G.panic = panic

function assert(cond :any, msg :string = '') {
  if (!cond) {
    console.error('assertion failure:', cond, _stackTrace(assert), msg)
    process.exit(3)
  }
}
G.assert = assert

