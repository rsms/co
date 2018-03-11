
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


export interface QuickCheck<T> {
  gen(i :int) :T
  check(v :T) :bool
  timeLimit? :int
}

export function quickcheck<T>(
  range :[int,int],
  c :QuickCheck<T>
) {
  let timeLimit = c.timeLimit ? Math.max(100, c.timeLimit) : 1000 // min 100ms

  let left, right
  if (range[0] < range[1]) {
    left = range[0]
    right = range[1]
  } else {
    left = range[1]
    right = range[0]
  }

  let midpoint = Math.ceil((left + right) / 2)
  let i = 0
  let timeStarted = Date.now()

  while (i > -1 && left < midpoint && right >= midpoint) {
    let seq :int = 0
    if (i % 2 == 0) {
      seq = left
      left++
    } else {
      seq = right
      right--
    }

    let input = c.gen(seq)
    let ok = c.check(input)

    if (!ok) {
      assert(
        false,
        `failure for ${JSON.stringify(input)} (quickcheck #${i} seq=${seq})`,
        quickcheck
      )
    }

    i++

    if (i % 100 == 0) {
      if (Date.now() - timeStarted > timeLimit) {
        console.log(`qc time limit`)
        break
      }
    }
  }
}

