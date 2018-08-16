class BoundVar {
  constructor(name, e, valueGetter, valueSetter) {
    this.name = name
    this.e = e
    this.valueGetter = valueGetter
    this.valueSetter = valueSetter
    this.isCheckbox = (e.type == 'checkbox')
    this.isNumber = e.type == 'number'
    this.lastValue = this.getValue()
  }

  refreshValue(ev) {
    let value = this.getValue(ev)
    this.setValue(value)
    return value
  }

  getValue(ev) {
    return this.valueGetter ? this.valueGetter(this.e, this.lastValue, ev)
         : this.isCheckbox ? (this.e.checked || null)
         : this.isNumber ? this.e.valueAsNumber
         : this.e.value
  }

  setValue(value) {
    if (this.isCheckbox && typeof value != 'boolean') {
      value = parseInt(value)
      if (isNaN(value)) {
        value = 0
      }
    }

    if (this.valueSetter) {
      const v = this.valueSetter(this.e, value)
      if (v !== undefined) {
        value = v
      }
    }

    if (this.isCheckbox) {
      this.e.checked = !!value
    } else if (this.isNumber && typeof value == 'number') {
      if (this.e.valueAsNumber != value) {
        this.e.valueAsNumber = value
      }
    } else if (this.e.value != value) {
      this.e.value = value
    }

    this.lastValue = value
  }
}

class UIBindings {
  constructor(queryString) {
    this.values = new Map(
      queryString.replace(/^\?+/g,'')
        .split('&')
        .filter(s => s.trim())
        .map(s => s.split('=').map(s =>
          decodeURIComponent(s.replace(/\+/g, '%20'))
        ))
    )
    this.vars = new Map()
  }

  getValue(name) {
    return this.values.get(name)
  }

  setValue(name, value) {
    let v = this.vars.get(name)
    if (!v) {
      return null
    }
    v.setValue(value)
    this._storeValue(name, value)
    return value
  }

  _storeValue(name, value) {
    // if (this.values.get(name) === value) {
    //   return
    // }
    if (value === null || value === undefined) {
      this.values.delete(name)
    } else {
      this.values.set(name, value)
    }
    history.replaceState({} , '', '?' + this.getQueryString())
  }

  refreshValue(name) {
    let v = this.vars.get(name)
    return v ? this._refreshValue(v) : null
  }

  _refreshValue(v, ev) {
    let value = v.refreshValue(ev)
    this._storeValue(v.name, value)
    return value
  }

  getQueryString() {
    let pairs = []
    this.values.forEach((v, k) => {
      v = (v === true) ? 1 : (v === false || v === null) ? 0 : v
      pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v))
    })
    return pairs.join('&')
  }

  // bind(name :string,
  //      sel :Element|string,
  //      valueSetter? :(e:Element, value:any)=>void,
  //      valueGetter? :(e:Element)=>any)
  // bind(name :string,
  //      valueSetter? :(e:Element, value:any)=>void,
  //      valueGetter? :(e:Element, prevValue:any, ev?:Event)=>any)
  bind(name, sel, valueSetter, valueGetter) {
    if (typeof sel == 'function' || sel === undefined) {
      valueGetter = valueSetter
      valueSetter = sel
      sel = '[name="'+name+'"]'
    }
    let e = typeof sel == 'string' ? document.querySelector(sel) : sel;
    let v = new BoundVar(name, e, valueGetter, valueSetter, this)
    this.vars.set(name, v)

    if (v.isNumber) {
      // SHIFT-ARROW = 10 increments
      // SHIFT-ALT-ARROW = x2 increments
      e.addEventListener('keydown', ev => {
        if (!ev.shiftKey) {
          return
        }
        switch (ev.key) {
          case 'ArrowUp': {
            if (ev.altKey) {
              ev.target.valueAsNumber *= 2
            } else {
              ev.target.valueAsNumber += 10
            }
            ev.preventDefault()
            ev.stopPropagation()
            this._refreshValue(v, ev)
            break
          }
          case 'ArrowDown': {
            if (ev.altKey) {
              ev.target.valueAsNumber /= 2
            } else {
              ev.target.valueAsNumber -= 10
            }
            ev.preventDefault()
            ev.stopPropagation()
            this._refreshValue(v, ev)
            break
          }
        }
      }, {capture:true, passive:false})
    }

    let onChange = ev => this._refreshValue(v, ev)
    e.addEventListener('input', onChange)
    if (v.isCheckbox) {
      e.addEventListener('change', onChange)
    }

    let existingValue = this.values.get(name)
    if (existingValue !== null && existingValue !== undefined) {
      if (v.isNumber) {
        existingValue = parseFloat(existingValue)
      } else if (v.isCheckbox) {
        existingValue = existingValue != '0' && existingValue != 'false' && existingValue != 'off'
      }
      v.setValue(existingValue)
    } else {
      onChange(null)
    }

    return v
  }
}
