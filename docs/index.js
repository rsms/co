(function($, $$){

function array(collection) {
  return collection.length ? Array.prototype.slice.call(collection) : []
}

// $(selector :string, startNode? :Node) -> Node
function $(selector, startNode) {
  return (startNode || document).querySelector(selector)
}

// $$(selector :string, startNode? :Node) -> Node[]
function $$(selector, startNode) {
  return array((startNode || document).querySelectorAll(selector))
}

function encodeQueryString(q) {
  return Object.keys(q).map(function(k) {
    if (k) {
      var v = q[k]
      return encodeURIComponent(k) + (v ? '=' + encodeURIComponent(v) : '')
    }
  }).filter(function(s) { return !!s }).join('&')
}

function parseQueryString(qs) {
  var q = {}
  qs./*replace(/^\?/,'').*/split('&').forEach(function(c) {
    var kv = c.split('=')
    var k = decodeURIComponent(kv[0])
    if (k) {
      q[k] = kv[1] ? decodeURIComponent(kv[1]) : null
    }
  })
  return q
}

// httpget(url :string, cb :(err :Error|null, r :XMLHttpRequest)=>void)
function httpget(url, cb) {
  var req = new XMLHttpRequest()
  req.addEventListener("load", function() { cb(null, this) })
  req.addEventListener("error", function(err) { cb(err, this) })
  req.open("GET", url)
  req.send()
}

// ---------------------------------------------------------------------------


var isMac = false

if (!window.MSStream &&
    /mac|ipad|iphone|ipod/i.test(navigator.userAgent))
{
  isMac = true
  document.body.classList.add('mac_or_ios')
  if (navigator.userAgent.indexOf('Safari') != -1) {
    document.body.classList.add('safari')
  }
}


// removeIndent removes common indentation of a string, based on the (if any)
// indentation of the first line.
//
//`
//    Foo
//      bar
//    baz
//   lol
//` =>
//`Foo
//  bar
//baz
//lol
//`
//
function removeIndent(text) {
  // strip trailing whitespace
  text = text.trimRight ? text.trimRight() : text.replace(/[\r\n\s\t]+$/, '')

  // drop leading linebreak
  var indentStart = (text.charCodeAt(0) == 0xA) ? 1 : 0

  // find indentation end
  var indentEnd = indentStart
  var c = text.charCodeAt(indentEnd)
  while (c <= 0x20) {
    c = text.charCodeAt(++indentEnd)
  }

  if (indentEnd == indentStart) {
    return indentEnd != 0 ? text.substr(indentEnd) : text
  }

  var indentLen = indentEnd - indentStart

  return text.substr(indentStart).split('\n').map(function(line) {
    var i = 0, e = Math.min(line.length, indentLen)
    while (i < e) {
      if (line.charCodeAt(i) != text.charCodeAt(indentStart + i)) {
        break
      }
      ++i
    }
    return i > 0 ? line.substr(i) : line
  }).join('\n')
}


// Markdown <script type="text/markdown">...</script>
showdown.setFlavor('github')
var mdconverter = new showdown.Converter({
  omitExtraWLInCodeBlocks: true, // Omit the trailing newline in a code block
  tables: true,
  ghCompatibleHeaderId: true, // GitHub-style header IDs
  ghCodeBlocks: true,
  tasklists: true,
  disableForced4SpacesIndentedSublists: true, // only 2 spaces needed
  encodeEmails: false,
  simpleLineBreaks: false, // [bug] workaround for GitHub flavor bug
})

function markdownify(screenNode) {
  var i, e, e2, mdscripts = screenNode.querySelectorAll('script[type="text/markdown"]')
  for (i = 0; i < mdscripts.length; i++) {
    e = mdscripts[i]
    e2 = document.createElement('div')
    e2.className = e.className ? e.className + ' markdown' : 'markdown'
    e2.innerHTML = mdconverter.makeHtml(removeIndent(e.text))
    e.parentNode.replaceChild(e2, e)
  }
}

function makeDOMId(s) {
  return s.replace(/[^0-9A-Za-z_\-\:\.]/g, '-')
}

// Screen–URL routing
var screens = {}

$$('screen').forEach(function(screen) {
  var path = screen.dataset.path
  if (path in screens) {
    console.error('duplicate routes to same path "' + path + '"')
  }
  var src = screen.dataset.src
  screens[path] = {
    path: path,
    id: makeDOMId(path),
    node: screen,
    src: src,
    isInitialized: false,
    state: {},
  }
  screen.parentNode.removeChild(screen)
  screen.classList.add('active')
})

function storeScreenState(screen) {
  var state = screen.state
  state.scroll = { x: window.scrollX, y: window.scrollY }
}

function loadScreenState(screen) {
  var state = screen.state
  var didScroll = false

  if (currentLocation.screen === screen && currentLocation.hash) {
    var e = document.getElementById(screen.id + '#' + currentLocation.hash)
    if (e) {
      didScroll = true
      e.scrollIntoView()
    }
  }

  if (state.scroll && !didScroll) {
    window.scrollTo(state.x, state.y)
  }
}

function initScreen(screen) {
  var ev = $$('h2[id]', screen.node).concat(
    $$('h3[id]', screen.node)
  ).concat(
    $$('h4[id]', screen.node)
  )
  ev.forEach(e => {
    e.id = screen.id + '#' + e.id
    var pe = e.parentElement
    var a
    if (pe.nodeName == 'A') {
      a = pe
    } else {
      a = document.createElement('a')
      pe.replaceChild(a, e)
      a.appendChild(e)
    }
    a.href = '#' + e.id
  })

  var codeBlocks = null, codeBlockIndex = 0
  function highlightNextCode() {
    if (!window.hljs) {
      // poll for hljs
      return setTimeout(highlightNextCode, 100)
    }
    if (codeBlocks == null) {
      codeBlocks = $$('code[class*="language-"]')
    }
    var codeBlock = codeBlocks[codeBlockIndex++];
    if (!codeBlock) { return } // done
    window.hljs.highlightBlock(codeBlock.parentElement);
    requestAnimationFrame(highlightNextCode)
  }
  highlightNextCode()
}

window._remoteScreen = {}
var nextLoadID = 0

function loadRemoteScreen(screen) {
  var url = screen.src
  var loadID = nextLoadID++
  window._remoteScreen[loadID] = screen

  httpget(url, function(err, r) {
    if (err) {
      console.error('HTTP GET error:', err)
      screenNode.textContent = 'Error: ' + err
      return
    }

    var contentType = r.getResponseHeader('Content-Type')
    // console.log('contentType:', contentType)

    if (contentType == 'text/javascript') {
      var script = document.createElement('script')
      script.text = '(function(screen){' + r.responseText + '\n})'+
        '(window._remoteScreen[' + loadID + ']);'+
        'delete window._remoteScreen[' + loadID + '];'
      document.head.appendChild(script)
    } else {
      delete window._remoteScreen[loadID]
      if (contentType == 'text/markdown') {
        screen.node.innerHTML =
          '<div class="row"><div>' +
          mdconverter.makeHtml(r.responseText) +
          '</div></div>'
      } else {
        screen.node.innerHTML = r.responseText
      }
    }

    initScreen(screen)
    loadScreenState(screen)
  })
}

var currentLocation = {
  path: '',
  query: {},
  hash: '',
  screen: null,
}

function updateScreen() {
  var path = location.hash
  var query = {}
  var hash = ''

  if (path != '') {
    path = path.substr(1) // strip leading '#'

    var i = path.indexOf('#')
    if (i != -1) {
      hash = path.substr(i+1)
      path = path.substr(0, i)
    }

    i = path.indexOf('?')
    if (i != -1) {
      query = parseQueryString(path.substr(i+1))
      path = path.substr(0, i)
    }
    
    path = path.replace(/^\/+|\/+$/, '')
  }

  var screen = screens[path]
  var screenNode

  console.log('[updateScreen]', {
    path: path, query: query, hash: hash, screen: screen
  })

  currentLocation.path = path
  currentLocation.query = query
  currentLocation.hash = hash

  if (screen) {
    if (screen === currentLocation.screen) {
      return
    }
    screenNode = screen.node
  } else {
    screenNode = document.createElement('p')
    screenNode.className = 'error-message'
    screenNode.textContent = 'Not found'
  }

  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild)
  }

  // store screen state and swap active screen
  if (currentLocation.screen) {
    storeScreenState(currentLocation.screen)
  }
  currentLocation.screen = screen

  document.body.appendChild(screenNode)

  if (!screen.isInitialized) {
    screen.isInitialized = true
    if (screen.src) {
      loadRemoteScreen(screen)
      return
    }
    markdownify(screenNode)
    initScreen(screen)
  }

  loadScreenState(screen)
}


updateScreen()
window.onpopstate = function(ev) {
  // console.log('onpopstate', ev, location.hash)
  updateScreen()
}


// Google Analytics
;(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-105091131-2', 'auto');
ga('send', 'pageview');


})();