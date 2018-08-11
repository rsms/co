// straight-line code
(function(slc){


function tokenize(src) {
  return src
    .replace(/^\/\/[^\n]*/gm, '')
    .replace(/[\n;]+/g, ';')
    .split(/[\t ]*\b[\t ]*/)
}

function value(vars, id, op, operands, consts) {
  // console.log('value', id, op, operands)
  if (operands) for (let id of operands) {
    let v = vars.get(id)
    if (!v) {
      vars.set(id, { id: id, type: 'implicit', uses: 1 })
    } else {
      v.uses++
    }
  }

  let v = {
    id,
    op,
    operands,
    consts,
    uses: 0,
  }
  vars.set(id, v)
  return v
}

function parse(src) {
  let tokens = tokenize(src.trim())
  // console.log(tokens.join('  '))
  let dst, op, operands, consts, seenAssign
  let values = []
  let vars = new Map()

  const reset = () => {
    dst = ''
    op = '='
    operands = []
    consts = []
    seenAssign = false
  }

  reset()

  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i]
    switch (t) {

    case '':
      break

    case '=':
      seenAssign = true
      break

    case ';':
      values.push(value(vars, dst, op, operands, consts))
      reset()
      break

    case '+':
    case '-':
    case '*':
    case '/':
      op = t
      break

    default:
      if (!t[0].match(/\w/)) {
        // bad syntax. e.g. "+;" from "a = b +<LF>"
        throw new Error('invalid name ' + JSON.stringify(t))
      }
      if (dst == '') {
        dst = t
      } else {
        if (t.match(/^\d/)) {
          consts.push(t)
        } else {
          operands.push(t)
        }
      }

    }
  }

  if (seenAssign) {
    values.push(value(vars, dst, op, operands, consts))
  }

  return values
}



slc.parse = parse


})(this.slc = {});
