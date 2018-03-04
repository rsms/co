
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
