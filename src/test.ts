import { monotime } from './time'

export function assertEq(actual :any, expected :any, context? :string) {
  assert(
    actual === expected,
    `expected ${JSON.stringify(expected)} `+
    `but instead got ${JSON.stringify(actual)}` +
    (context ? ' — ' + context : ''),
    assertEq
  )
}

export function assertEqList(
  actualList :ArrayLike<any>,
  expectedList :ArrayLike<any>,
) {
  if (actualList.length !== expectedList.length) {
    assert(
      false,
      `expected list of length ${expectedList.length} ` +
      `but got ${actualList.length}`,
      assertEqList
    )
  }
  for (let i = 0; i < expectedList.length; i++) {
    assert(
      actualList[i] === expectedList[i],
      `expected list item #${i} to be ${JSON.stringify(expectedList[i])} ` +
      `but got ${JSON.stringify(actualList[i])}`,
      assertEqList
    )
  }
}

export function assertEqObj(
  actualObj :{[k:string]:any},
  expectedObj :{[k:string]:any},
) {
  let actualKeys = Object.keys(actualObj)
  let expectedKeys = Object.keys(expectedObj)
  if (actualKeys.length !== expectedKeys.length) {
    assert(
      false,
      `expected object with ${expectedKeys.length} properties ` +
      `but got one with ${actualKeys.length} properties`,
      assertEqObj
    )
  }
  for (let i = 0; i < expectedKeys.length; i++) {
    let k = expectedKeys[i]
    assert(
      actualObj[k] === expectedObj[k],
      `expected property ${k} to be ${JSON.stringify(expectedObj[k])} ` +
      `but got ${JSON.stringify(actualObj[k])}`,
      assertEqObj
    )
  }
}

export function assertThrows(fn :()=>any) {
  try {
    fn()
    assert(false, 'expected exception to be thrown', assertThrows)
  } catch (e) {
  }
}

// quickcheck options
export interface QCOptions {
  timeout? :int  // milliseconds; default is 1000
}

// quickcheck generator
export interface QCGen<T> extends QCOptions {
  size: int
  gen(i? :int) :T
}


class QCGenBase<T> {
  size: int

  constructor(size :int = 0) {
    this.size = size >>> 0
  }

  gen(i? :int) :T {
    return undefined as any as T
  }
}


class QCF64Gen extends QCGenBase<number> {
  constructor(a :number, b :number) {
    if (a > b) {
      let t = a ; a = b ; b = t
    }
    super(Math.ceil(b - a))
    this.gen = () =>
      Math.random() * (b - a) + a
  }
}

class QCS32Gen extends QCGenBase<int> {
  constructor(a :int, b :int) {
    a = a | 0
    b = b | 0
    if (a > b) {
      let t = a ; a = b ; b = t
    }
    super(b - a)
    this.gen = () =>
      Math.floor(Math.random() * (b + 1 - a) + a) | 0
  }
}

class QCU32Gen extends QCGenBase<int> {
  constructor(a :int, b :int) {
    a = a >>> 0
    b = b >>> 0
    if (a > b) {
      let t = a ; a = b ; b = t
    }
    super(b - a)
    this.gen = () =>
      Math.floor(Math.random() * (b + 1 - a) + a) >>> 0
  }
}

export function quickcheck<T>(
  gen :QCGen<T> | [T,T],
  check :((i :T)=>bool)) :void

export function quickcheck<T>(
  gen :QCGen<T> | [T,T],
  options :QCOptions,
  check :((i :T)=>bool)) :void

export function quickcheck<T>(
  gen :QCGen<T> | [T,T],
  arg1 :QCOptions | ((i :T)=>bool),
  arg2? :(i :T)=>bool,
) :void
{
  let check = arg2 as (i :T)=>bool
  let options = arg1 as QCOptions
  if (arg2 === undefined) {
    check = arg1 as (i :T)=>bool
    options = {}
  } else if (!options || typeof options != 'object') {
    throw new Error('argument 2 is not an options object')
  }

  const opt = Object.assign({
    // default options
    timeout: 1000,
  }, gen as QCOptions, options)

  opt.timeout = Math.max(0, opt.timeout as number)

  let g = gen as QCGen<T>

  if (Array.isArray(gen)) {
    let [a, b] = gen
    if (typeof a == 'number' && typeof b == 'number') {
      if (Math.round(a) != a) {
        g = new QCF64Gen(a, b) as any as QCGen<T>
      } else if (Math.min(a, b) < 0) {
        g = new QCS32Gen(a, b) as any as QCGen<T>
      } else {
        g = new QCU32Gen(a, b) as any as QCGen<T>
      }
    } else {
      throw new Error(`unexpected range type ${typeof a}`)
    }
  }

  let timeStarted = monotime()

  for (let i = 0; i < g.size; i++) {
    let v = g.gen(i)
    let ok = check(v)
    if (!ok) {
      assert(
        false,
        `quickcheck failure for input ${v}, generation ${i}`,
        quickcheck
      )
    }
    if (opt.timeout && i % 100 == 0 && monotime() - timeStarted > opt.timeout) {
      // console.log(`qc time limit`)
      break
    }
  }
}

