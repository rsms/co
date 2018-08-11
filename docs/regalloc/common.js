function $(q, e) {
  return (e || document).querySelector(q)
}

function $$(q, e) {
  return [].slice.apply((e || document).querySelectorAll(q))
}

// monotime() :number
let monotime = (
  typeof performance != 'undefined' && performance.now ?
    performance.now.bind(performance) :
  () => (new Date()).getTime() * 1000
)

let _templateCache = {}
function template(id) {
  let t = _templateCache[id]
  if (!t) {
    t = document.getElementById('template-' + id)
    if (!t) {
      console.error('template "'+id+'" not found')
      return
    }
    t.parentNode.removeChild(t)
    t.removeAttribute('id')
    _templateCache[id] = t
  }
  return t.cloneNode(true)
}
