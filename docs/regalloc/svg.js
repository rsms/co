
function SvgNode(tag, attrs, text) {
  var n = document.createElementNS('http://www.w3.org/2000/svg', tag)
  if (attrs) for (let k in attrs) {
    n.setAttributeNS(null, k, attrs[k])
  }
  if (text) n.textContent = text
  return Object.create(SvgNode.prototype, {
    n: {enumerable:true, value:n},
    _attrs: { value:attrs },
  })
}

// add(tag, attrs?, text?)
SvgNode.prototype.add = function (tag, attrs, text) {
  let n = SvgNode(tag, attrs, text)
  this.n.appendChild(n.n)
  return n
}

// get attr(name) => value
// set attr(name, value)
SvgNode.prototype.attr = function (name, value) {
  if (arguments.length > 1) {
    this._attrs[name] = value
    this.n.setAttributeNS(null, name, value)
  } else {
    return (
      name in this._attrs ? this._attrs[name] :
      this.n.getAttributeNS(null, name)
    )
  }
}



function Svg(n) {
  return Object.create(Svg.prototype, {
    n: {enumerable:true, value:n},
    _attrs: { value: {} },
  })
}

Svg.prototype.add = SvgNode.prototype.add
Svg.prototype.attr = SvgNode.prototype.attr

Object.defineProperties(Svg.prototype, {

  width: { enumerable: true,
    set(width) { this.n.setAttribute('width', this._width = width) },
    get() {
      return (
        this._width !== undefined ? this._width :
        this._width = +this.n.getAttribute('width')
      )
    }
  },

  height: { enumerable: true,
    set(height) { this.n.setAttribute('height', this._height = height) },
    get() {
      return (
        this._height !== undefined ? this._height :
        this._height = +this.n.getAttribute('height')
      )
    }
  },

  viewBox: { enumerable: true,
    set({x=0, y=0, width=100, height=100}) {
      this._viewBox = {x, y, width, height}
      this.n.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
    },
    get() {
      if (!this._viewBox) {
        let v = this.n.getAttribute('viewBox').split(/\s+/)
        this._viewBox = {x:0, y:0, width: this.width, height: this.height}
        if (v.length == 4) {
          this._viewBox.x = +v[0]
          this._viewBox.y = +v[1]
          this._viewBox.width = +v[2]
          this._viewBox.height = +v[3]
        }
      }
      return this._viewBox
    }
  }
})
