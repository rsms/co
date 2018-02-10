//
// Text EDitor -- a simple text editor
//
this.ted = (function(){

// stylesheet, placed at lowest priority so that any user stylesheet
// can override these styles.
let style = document.createElement('style')
style.setAttribute('type', 'text/css')
style.innerText = `
.ted.file {
  display: flex;
  flex-direction: column;
}
  .ted.file .name {
    flex: 0 0 auto;
  }
  .ted.file .content {
    flex: 1 1 auto;
    line-height: 18px;
    font-size: 16px;
    font-family: monospace;
    background: #eee;
  }
  .ted.file .inner-content {
    display: flex;
  }
  .ted.file textarea {
    display: block;
    border: none;
    outline: none;
    resize: none; /* since we control the size automatically */
    color: rgba(0,0,0,0.6);
    flex: 1 1 auto;
    font: inherit;
    line-height: inherit;
    background: transparent;
    overflow-y: hidden;
    -moz-tab-size: 2;
      -o-tab-size: 2;
         tab-size: 2;
  }
  .ted.file textarea:focus {
    color: black;
  }
  .ted textarea, .ted.linenos {
    padding: 5px;
    white-space: pre;
  }
  .ted .linenos {
    flex: 0 1 auto;
    color: rgba(0,0,0,0.3);
    padding-left: 0;
    padding-right: 0;
  }
  .ted .lineno {
    padding-left: 8px;
    padding-right: 10px;
    transition: 100ms all ease;
  }
  .ted .lineno.error {
    background: pink;
    color: maroon;
  }
  .ted .lineno.warn {
    background: #f9f39d;
    color: black;
  }
  .ted .lineno.info {
    background: lightblue;
    color: black;
  }
`
let head = (document.head || document.body || document.documentElement)
if (head.children.length) {
  head.insertBefore(style, head.children[0])
} else {
  head.appendChild(style)
}

// HTML templates
let templates = {
lineno: `<div class="lineno">0</div>`,

file: `
<div class="ted file">
  <h3 class="name">name</h2>
  <div class="content">
    <div class="inner-content">
      <div class="ted linenos"></div>
      <textarea
        class="ted"
        autocapitalize="none"
        autocomplete="off"
        spellcheck="false"
        wrap="soft"
        autofocus
      ></textarea>
    </div>
  </div>
</div>`
}

let templateCache = {}
function template(id) {
  let t = templateCache[id]
  if (!t) {
    let html = templates[id]
    if (!html) {
      console.error('template "'+id+'" not found')
      return
    }
    let e = document.createElement('div')
    e.innerHTML = html.trim()
    t = e.firstChild
    templateCache[id] = t
  }
  return t.cloneNode(true)
}

// ----------------------------------------------------------------------

function $(q, e) {
  return (e || document).querySelector(q)
}

function $$(q, e) {
  return [].slice.apply((e || document).querySelectorAll(q))
}

let tabw = 2 // number of SP per TAB
let spaces = '                                 '

// find start of line in s at pos
function lnstartindex(s, pos) {
  let i = pos
  while (i > 0) {
    if (s.charCodeAt(--i) == 0xA) {
      return i + 1
    }
  }
  return i // no linebreak
}

// find end of line in s at pos
function lnendindex(s, pos) {
  let i = pos
  while (i < s.length) {
    if (s.charCodeAt(i) == 0xA) {
      return i
    }
    i++
  }
  return i // no linebreak
}

// find index of first non-whitespace char
// the returned index is exclusive.
// whitespace does not include LF.
function nwsindex(s, start) {
  let i = start
  while (i < s.length) {
    let c = s.charCodeAt(i)
    if (c > 0x20 || c == 0xA) {
      return i
    }
    i++
  }
  return i // all whitespace
}

// find position after start that constitutes
// one step of indentation.
function indentindex(s, start) {
  let nsp = 0 // SPs encountered
  for (let i = start; i < s.length; ++i) {
    let c = s.charCodeAt(i)
    if (c > 0x20) {
      return i
    }
    if (c == 0x9) {
      // eat first TAB and any nsp
      // invariant: nsp < tabw
      return i + 1
    }
    nsp++
    if (nsp == tabw) {
      return i + 1
    }
  }
  return start // no indentation
}

function negindentindex(s, start) {
  let nsp = 0, spi = 0 // SPs encountered, last SP index
  for (let i = start; i > 0; ) {
    let c = s.charCodeAt(--i)
    if (c > 0x20 || c == 0x9 || c == 0xA) {
      if (nsp) {
        // up to closest SPs
        return spi
      } else {
        return i
      }
      break
    }
    nsp++
    spi = i
    if (nsp == tabw) {
      return i
    }
  }
  return 0
}


// lnbreakat returns a positive number if offs in text is a linebreak.
// The number returned is the number of characters the linebreak occupies.
//
function lnbreakat(s, offs) {
  let c = s.charCodeAt(offs)
  return (
    c == 0xA ? 1 :  // LF
    c == 0xD && s.charCodeAt(offs + 1) == 0xA ? 2 :  // CRLF
    0
  )
}

// schednext schedules a function to be called as soon as possible, but not
// in the current runloop iteration.
//
let schednext = (
  typeof requestAnimationFrame == 'function' ? requestAnimationFrame :
  typeof setImmediate == 'function' ? setImmediate :
  f => setTimeout(f, 0)
)

// ----------------------------------------------------------------------


// TextView represents the user's perspective and state of a text area.
//
class TextView {
  constructor(el) {
    this.el = el
    this.insertTextCounter = 0 // tracks programmatic inserts
  }

  text() {
    return this.el.value
  }

  curPos() {
    // TODO: track movement position.
    // When start!=end: If the user expanded range in left direction prior,
    // then return start, else return end.
    return this.el.selectionStart
  }

  curStart() {
    return this.el.selectionStart
  }

  // cursor range; [start, end]
  curRange() {
    return [this.el.selectionStart, this.el.selectionEnd]
  }

  setCurRange(range) {
    this.el.selectionStart = range[0]
    this.el.selectionEnd = range[1]
  }

  setCurPos(pos) {
    this.setCurRange([pos, pos])
  }

  // lineStart returns the offset into text for the first character of the
  // line at which the cursor is currently at.
  // if pos is not provided, then curStart() is used.
  //
  lineStart(pos) {
    if (pos === undefined) {
      pos = this.curStart()
    }
    return lnstartindex(this.text(), pos)
  }

  // lineEnd returns the offset of the first linebreak at or after pos
  // if pos is not provided, then curEnd() is used.
  //
  lineEnd(pos) {
    if (pos === undefined) {
      pos = this.curRange()[1]
    }
    return lnendindex(this.text(), pos)
  }

  // indentRange returns the range of the indentation (whitespace)
  // of the line where curPos is at.
  // if curPos is not provided, then curStart() is used.
  //
  indentRange(curPos) {
    let t = this
    if (curPos === undefined) {
      curPos = t.curStart()
    }
    let text = t.text()
    let lnstart = lnstartindex(text, curPos)
    let wsend = nwsindex(text, lnstart) // leading whitespace end index
    return [lnstart, wsend]
  }

  // deletes one char before the cursor. If there's a selection, the selection
  // is instead deleted.
  //
  deleteBackward() {
    document.execCommand('delete', false)
  }

  // deletes one char ahead of the cursor.
  // If there's a selection, the selection is instead deleted.
  //
  deleteForward() {
    document.execCommand('forwardDelete', false)
  }

  // insert inserts text at the current cursor position.
  // If there's a selection, the selection is first deleted.
  //
  insertText(text) {
    this.insertTextCounter++
    document.execCommand('insertText', false, text)
  }

  // deleteRange removes the specificed range without moving the cursor.
  // Note that if range start==end, this function does nothing and returns
  // false. If this is not what you want, see deleteForward() and
  // deleteBackward().
  //
  deleteRange(range) {
    if (range[1] == range[0]) {
      return false
    }
    let t = this
    let cr = t.curRange()
    let lnstart = t.lineStart(cr[0])
    // TODO: optimize the case where we delete one char left or right of cusors
    // and cursor range start==end; make use of just delete and forwardDelete.
    t.setCurRange(range)
    t.deleteBackward()
    // TODO: handle case where the deleted range intersect cr
    let d = range[1] - range[0] // chars delta
    t.setCurRange([
      Math.max(cr[0] - d, lnstart), // max: limit to line start
      Math.max(cr[1] - d, lnstart),
    ])
    return true
  }

  // clear deletes all content, adding to the undo stack
  //
  clear() {
    t.setCurRange([0, t.text().length])
    t.deleteBackward()
  }

  // insertText inserts text at range.
  // If range is a selection, it's first deleted (effectively "replace".)
  // If moveCursor is not falsey, the cursor is move by that delta.
  //
  insertTextAt(range, text, moveCursor) {
    let t = this
    let cr = t.curRange()
    t.setCurRange(range)
    t.insertText(text)
    let move = 0
    //
    //  ir = range // insertion range
    //
    // a) AB|C   ->  AB|Cxx    ir 3,3  cr 2,2  ndel 0  nins 2  move 0
    //        ^
    //
    // b) AB|C   ->  xxAB|C    ir 0,0  cr 2,2  ndel 0  nins 2  move 2
    //   ^
    //
    // b) AB|C|  ->  xxAB|C|   ir 0,0  cr 2,3  ndel 0  nins 2  move 2
    //   ^
    //
    // c) AB|C|  ->  xxB|C     ir 0,1  cr 2,2  ndel 1  nins 2  move 1
    //   ^^
    //
    //
    if (range[0] < cr[1]) {
      // insertion before cursor
      let nins = text.length // number of chars inserted
      let ndel = (range[1] - range[0]) // number of chars deleted
      move = nins - ndel
    }
    if (!moveCursor) {
      moveCursor = 0
    }
    // console.log(
    //   `text length: ${text.length}, `+
    //   `curRange: [${cr.join(', ')}),  `+
    //   `replaceRange: [${range.join(', ')}), ` +
    //   `move: ${move}`
    // )
    t.setCurRange([ cr[0] + move + moveCursor, cr[1] + move + moveCursor ])
  }

  // isProbablyInString returns true if pos is inside string literals.
  // esc should be a string that negates open and end (or falsy to disable.)
  // "probably" because it only looks at a small window around pos since this
  // has linear time complexity and we mustn't block the UI thread.
  //
  isProbablyInString(pos) {
    let t = this
    let maxwinz = 1000 // max window size
    let text = t.text()
    let i = Math.max(pos - text.length, pos - maxwinz)
    let stack = [] // stack of chars
    let top = 0 // top-of-stack char (or 0 if none)
    let lastwasparam = false // last char was '$'

    function spush(c) {
      stack.push(c)
      top = c
    }

    function spopif(c) {
      if (c == top) {
        stack.pop()
        top = stack[stack.length-1] || 0
        return true
      }
      return false
    }

    while (i < pos) {
      let c = text.charCodeAt(i)
      // console.log(`c ${repr(text[i])} 0x${c.toString(16)}`)
      i++

      switch (c) {

      case 0x5C: // \
        i++ // ignore next char
        break

      case 0x24: // $
        if (top) {
          lastwasparam = true
          continue // since we reset it at end of switch
        }
        break

      case 0x7b: // {
        if (lastwasparam) {
          spush(c)
        }
        break

      case 0x7d: // }
        spopif(0x7b)
        break

      case 0x22: // "
      case 0x27: // '
        if (!spopif(c)) {
          spush(c)
        }
        break

      case 0x60: break // `

      } // switch(c)

      lastwasparam = false
    }

    return !!top
  }

  // insertPair inserts two strings at the cursor, placing the cursor in
  // between. It does this in one undo frame.
  //
  insertPair(left, right) {
    let t = this
    let cur = t.curRange()
    if (cur[1] > cur[0]) {
      // wrap range
      let ss = t.text().substring(cur[0], cur[1])
      t.insertText(left + ss + right)
      t.setCurRange([cur[0] + left.length, cur[1] + left.length])
    } else if (t.isProbablyInString(cur[0])) {
      // just insert `left` inside string literals
      t.insertText(left)
    } else {
      // insert `left` + `right` and place cursor in between
      t.insertText(left + right)
      t.setCurRange([cur[0] + left.length, cur[0] + left.length])
    }
  }

  // insertPairTerminal inserts the end of a pair.
  // May make clever indentation choices.
  //
  insertPairTerminal(left, right) {
    let t = this
    let cur = t.curRange()
    if (cur[0] == cur[1]) {

      let text = this.text()
      let nwspos = nwsindex(text, cur[0]) // find first non-whitespace
      if (text.substr(nwspos, right.length) == right) {
        // terminal is already immediately to the right of the cursor.
        // just move the cursor.
        t.setCurPos(nwspos + right.length)
        return
      }

      let ir = t.indentRange(cur[0])
      if (
        cur[0] <= ir[1] &&
        ir[1] > ir[0] &&
        lnbreakat(this.text(), cur[0]) &&
        !t.isProbablyInString(cur[0])
      ) {
        // there's some indentation and the cursor is at a line break
        // reduce indentation and insert "}".
        let ind1r = [negindentindex(t.text(), ir[1]), ir[1]]
        t.insertTextAt(ind1r, right)
        return
      }
    }
    // plain `right`
    t.insertText(right)
  }

  // lineBreak breaks the line at the cursor,
  // replacing the selection if any.
  // if afterCurrentLine is true, the current line is not divided, but the
  // cursor is first moved to the end of the current line.
  //
  lineBreak(withoutSplittingLine) {
    let t = this
    let cur = t.curStart()
    let text = t.text()

    if (withoutSplittingLine) {
      // move cursor to end of line
      t.setCurPos(lnendindex(text, cur))
    }

    let indr = t.indentRange(cur)
    let indent = text.substring(indr[0], indr[1])
    let leading = text.substring(cur - 20, cur)

    // These regexps are matched against some amount of preceeding characters
    // and thus must handle arbitrary beginnings.
    //
    // regex that, when matches text before cursor, causes an increment to
    // indentation for new lines.
    let incregex = /([\{\[\(]|\->)[\t ]*(?:\/\/[^\r\n]*|)$/
    let m = incregex.exec(leading)
    let pairs = {
      '{':'}', '(':')', '[':']',
    }
    if (m) {
      let right = pairs[m[1]]
      let rightpos = 0
      if (
        right &&
        (rightpos = nwsindex(text, cur)) != -1 &&
        text.substr(rightpos, right.length) == right
      ) {
        // `right` is right of cursor (ignoring whitespace)
        if (rightpos == cur) {
          // `right` immediately after cursor
          let tail = '\n' + indent
          let str = '\n' + indent + '\t' + tail
          t.insertText(str)
          t.setCurPos(cur + str.length - tail.length)
          return
        }
        // else: `right` NOT immediately after cursor.
        // indentation is unchanged (match current line)
      } else {
        // `right` not found; increment indentation
        indent += '\t'
      }
    }

    t.insertText('\n' + indent)
  }

  // decIndent reduces indentation of current line
  //
  decIndent() {
    let t = this
    let lnstart = t.lineStart() // line start index
    let ind1i = indentindex(t.text(), lnstart)
    t.deleteRange([lnstart, ind1i])
  }

  // incIndent increases indentation of current line
  //
  incIndent() {
    let t = this
    let sstart = t.curStart() // original selection start
    let text = t.text()
    let lnstart = t.lineStart(sstart) // line start index
    let c = text.charCodeAt(lnstart)
    t.insertTextAt([lnstart, lnstart], '\t')
  }


  // reduce indentation of current line with respect to cursor position.
  // if the cursor is inside the leading whitespace (indentation) of a line,
  // then reduce the indentation. Otherwise return false and do nothing.
  decIndentIfAtLineStart() {
    let t = this
    let sstart = t.curStart() // original selection start
    let text = t.text()

    let inr = t.indentRange(sstart)
    let lnstart = inr[0]
    let wsend = inr[1]

    if (sstart > wsend) {
      // cursor inside line; insert tab (or autocomplete?)
      return false // signal that we didn't complete the task
    }

    if (wsend == lnstart) {
      // no leading whitespace; do nothing
      return // we technically did complete the task (no indentation)
    }

    let srange = [sstart, sstart]
    let lc = text.charCodeAt(sstart - 1) // char left or cursor
    let rc = text.charCodeAt(sstart) // char right or cursor

    if (lc == 0x9) {
      // optimal case: TAB just left of cursor
      // srange[0] = sstart - 1
      t.deleteBackward()
      return
    } else if (rc == 0x9) {
      // optimal case: TAB just right of cursor
      // srange[1] = sstart + 1
      t.deleteForward()
      return

    // else: must be SP left and/or right of cursor
    } else if (sstart == wsend) {
      // cursor at end of whitespace. Only eat left
      srange[0] = sstart - 1 // at least one space
      if (sstart > lnstart + 1 && text.charCodeAt(sstart - 2) != 0x9) {
        // eat two chars (unless it's a tab)
        srange[0] = sstart - 2
      }
    } else if (sstart > lnstart + 1) {
      // cursor is neither at line start or indent end, and is surrounded by
      // whitespace that is not TAB. Eat a space in each direction
      srange[0] = sstart - 1
      srange[1] = sstart + 1
    } else {
      // cursor is at beginning of line and rc is whitespace that is not TAB.
      // eat rightwards
      srange[1] = sstart + 1
      if (sstart < wsend - 1 && text.charCodeAt(sstart + 1) != 0x9) {
        // eat two chars (unless it's a tab)
        srange[1] = sstart + 2
      }
    }

    t.setCurRange(srange)
    t.deleteBackward()
  }


  toggleLineComment() {
    console.log('TODO TextView.toggleLineComment')
  }



  onKeyDown(ev) {
    // console.log('keydown', ev.key)
    let t = this
    try { switch (ev.key) {

    case "Enter": {
      t.lineBreak(ev.metaKey || ev.ctrlKey)
      return ev.preventDefault()
    }

    case "Tab": {
      if (!ev.shiftKey || t.decIndentIfAtLineStart() === false) {
        // SHIFT was not pressed, or indent line failed.
        let cur = t.curStart()
        let indr = t.indentRange(cur)
        if (cur > indr[1]) {
          // middle of line; insert SP equivalent to one TAB
          t.insertText(spaces.substr(0, tabw))
        } else {
          // beginning of line; insert TAB
          t.insertText('\t')
        }
      }
      return ev.preventDefault()
    }

    case "[": {
      if (ev.metaKey || ev.ctrlKey) {
        t.decIndent()
      } else {
        t.insertPair('[',']')
      }
      return ev.preventDefault()
    }

    case "]": {
      if (ev.metaKey || ev.ctrlKey) {
        t.incIndent()
      } else {
        t.insertPairTerminal('[',']')
      }
      return ev.preventDefault()
    }

    case "(": {
      t.insertPair('(',')')
      return ev.preventDefault()
    }

    case ")": {
      t.insertPairTerminal('(',')')
      return ev.preventDefault()
    }

    case "{": {
      t.insertPair('{','}')
      return ev.preventDefault()
    }

    case "}": {
      t.insertPairTerminal('{','}')
      return ev.preventDefault()
    }

    case "'": {
      t.insertPair("'","'")
      return ev.preventDefault()
    }

    case '"': {
      t.insertPair('"','"')
      return ev.preventDefault()
    }

    case "/": {
      if (ev.metaKey || ev.ctrlKey) {
        t.toggleLineComment()
        return ev.preventDefault()
      }
      break
    }

    } // switch(ev.key)
    } catch (err) {
      console.error(err.stack || err)
      // cancel event in case of an exception.
      // This prevents programming errors from doing things like
      // causing web browser history naviation.
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  // onInput is called after some input event happened.
  // This is a passive handler, so this code can't directly alter the effect
  // of the input, but it can of course apply additional editing.
  //
  onInput(ev) {
  }
}


class File {
  // name     :string       // name of file
  // el       :HTMLElement  // root element of file
  // view    :TextView     // the user-view of the file
  // onChange :()=>         // passive callback when contents changed

  constructor(name, sourceText) {
    this.name = name
    this.el = template('file')
    $$('.name', this.el).forEach(e => e.innerText = name)
    this.textarea = $('textarea', this.el)
    this._linecount = 0
    this.onChange = null
    this.lineDiagnostics = []
    this.view = new TextView(this.textarea)
    this._lastTrimmedText = null
    
    this.setText(sourceText || '')
    
    this.__onInput = ev => this._onInput(ev)
    this.__onKeyDown = ev => this.view.onKeyDown(ev)
    this.__onPointerDown = ev => {
      if (ev.target !== this.textarea) {
        schednext(() => this.textarea.focus())
      }
    }
  }

  // setText replaces the entire contents of the file buffer.
  // This clears the undo stack. If you want to erase the content and allow
  // the user to undo, use view.clear() or view.deleteRange().
  //
  setText(s) {
    this.textarea.value = s
    this._onChange()
  }

  // text returns the current contents of the file buffer
  //
  text() {
    return this.textarea.value
  }

  clearLineDiags() {
    this.lineDiagnostics = []
    this.updateLines()
  }

  setLineDiag(line, diag) {
    if (line < 1 || typeof line != 'number') {
      throw new Error('line must be a positive, non-zero integer')
    }
    this.lineDiagnostics[line - 1] = diag
    this.updateLines()
  }

  // mount adds the file's HTML element to parent and initializes its event
  // handlers.
  // Returns this file's HTML element.
  //
  mount(parent/*? :HTMLElement*/) { //:HTMLElement
    let ta = this.textarea
    let passive = {passive:true}
    let active = {passive:false, capture:true}
    this.el.addEventListener('pointerdown', this.__onPointerDown, passive)
    ta.addEventListener('input', this.__onInput, passive)
    ta.addEventListener('keydown', this.__onKeyDown, active)
    if (parent) {
      parent.appendChild(this.el)
    }
    return this.el
  }

  // unmount disables event handlers and removes the file from its parent
  // HTML element.
  //
  unmount() {
    let ta = this.textarea
    let passive = {passive:true}
    let active = {passive:false, capture:true}
    this.el.removeEventListener('pointerdown', this.__onPointerDown, passive)
    ta.removeEventListener('input', this.__onInput, passive)
    ta.removeEventListener('keydown', this.__onKeyDown, active)
    let parent = this.el.parentElement
    if (parent) {
      parent.removeChild(this.el)
    }
  }

  _onInput(ev) {
    // console.log('input', ev, repr(ev, 1))
    // this.view.onInput(ev)
    this._onChange()
  }

  _onChange() {
    let text = this.textarea.value

    // count lines
    let linecount = 0
    for (let i = 0; i < text.length; i++) {
      linecount += text.charCodeAt(i) == 0xA
    }

    // updateLines if line count changed
    if (this._linecount != linecount) {
      this._linecount = linecount
      this.updateLines()
    }

    // call user listener, if any (when source changed in a significant way)
    if (this.onChange) {
      let trimmedText = text.trim()
      if (this._lastTrimmedText != trimmedText) {
        this._lastTrimmedText = trimmedText
        this.onChange()
      }
    }
  }

  updateLines() {
    let pn = $('.linenos', this.el)
    pn.style.visibility = 'hidden'
    pn.innerText = ''

    for (let i = 0; i <= this._linecount; i++) {
      let e = template('lineno')
      let lineno = i + 1
      e.innerText = lineno
      e.classList.add('L' + lineno)

      let diag = this.lineDiagnostics[i]
      if (diag) {
        e.classList.add(diag.type) // info | warn | error
        e.title = diag.message
      }

      pn.appendChild(e)
    }

    pn.style.visibility = null

    // adjust height of code element (a vertical flexbox)
    const vpadding = 5  // must match CSS padding
    const lineHeight = 18  // must match CSS line-height
    let extraHeight = lineHeight * 2
    let height = (this._linecount * lineHeight) + (vpadding * 2) + extraHeight
    height = Math.max(20, height)
    let codeel = $('.inner-content', this.el)
    codeel.style.height = height + 'px'
  }
}

// exported API
return {
  File,
  TextView,
}

})();
