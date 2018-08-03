(function(){

// analytics
window.dataLayer = window.dataLayer || [];
function g(){dataLayer.push(arguments);}
g('js', new Date());
g('config', 'UA-105091131-3');

// helpers
function $(q, e) {
  return (e || document).querySelector(q)
}
function $$(q, e) {
  return Array.prototype.slice.call((e || document).querySelectorAll(q))
}

// header anchors
var L = 1;
while (L < 5) {
  $$('.content h'+L+'[id]').forEach(function(e, i) {
    if (e.id) {
      var a = document.createElement('a')
      a.href = '#' + e.id
      a.innerHTML = e.innerHTML
      e.innerText = ''
      e.appendChild(a)
    }
  })
  L++
}

// add'l CSS styles
var _extraStyleSheet
function getExtraStyleSheet() {
  if (!_extraStyleSheet) {
    // Create the <style> tag
    var style = document.createElement("style");
    style.appendChild(document.createTextNode("")); // oh, webkit
    document.head.appendChild(style);
    _extraStyleSheet = style.sheet;
  }
  return _extraStyleSheet
}

function addStyleRuleRaw(ruleCode) {
  var sheet = getExtraStyleSheet();
  return sheet.insertRule(ruleCode, sheet.cssRules.length)
}

function addStyleRule(selector, props) {
  return addStyleRuleRaw(
    selector +
    " {" +
    Object.keys(props).map(function(k) {
      return "\n  " + k + ": " + props[k] + ";"
    }).join("") +
    "\n}"
  )
}

// onload
var _onLoadFuns = []
window.addEventListener('load', function(){
  for (var i = 0; i < onload.length; i++) {
    _onLoadFuns[i]()
  }
})
function onload(fn) {
  _onLoadFuns.push(fn)
}


// sidenotes
var sidenotes = $$('section blockquote.sidenote')
var refs = []
sidenotes.forEach(function(sidenote, i) {
  var ref = sidenote.dataset && sidenote.dataset.ref
  if (ref && (ref = $(ref))) {
    refs[i] = ref
    var addHighlight = function() {
      ref.classList.add('highlighted-by-note')
    }
    var removeHighlight = function() {
      ref.classList.remove('highlighted-by-note')
    }
    if (typeof PointerEvent != 'undefined') {
      sidenote.addEventListener('pointerover', addHighlight, {passive:true})
      sidenote.addEventListener('pointerout', removeHighlight, {passive:true})
    } else {
      sidenote.addEventListener('mouseover', addHighlight)
      sidenote.addEventListener('mouseout', removeHighlight)
      sidenote.addEventListener('mouseleave', removeHighlight)
    }
  }
})

// Adjust sidenotes.
// Needs to happen after page has loaded since height of elements
// like images matters.
onload(function(){
  var sidenoteMaxY = 0
  var spacingY = 14

  sidenotes.forEach(function(sidenote, i) {

    if (!sidenote.getBoundingClientRect) {
      return
    }

    sidenote.classList.add('init')

    // temporarily override any conditionals that set .init
    sidenote.classList.add('force-side')

    var ref = refs[i]
    noterect = sidenote.getBoundingClientRect()

    var refrect, refpos = 0
    if (ref && ref.getBoundingClientRect) {
      refrect = ref.getBoundingClientRect()
      refpos = (refrect.top + window.scrollY) + (refrect.height / 2)
    }

    var noteTop = noterect.top + window.scrollY
    var noteBottom = noterect.bottom + window.scrollY
    var noteHeight = noterect.height

    // add style rules
    if (refpos < noteTop) {
      // ref element is above the note -- offset note upwards
      if (!sidenote.id) {
        sidenote.id = 'sidenote-' + i
      }

      // compute overlap with other sidenote
      var offsetY = -(noteHeight + Math.floor(spacingY / 2))
      var maxAdjustY = Math.max(noteTop + offsetY, sidenoteMaxY)
      offsetY = -(noteTop - maxAdjustY)

      noteTop += offsetY
      noteBottom += offsetY

      // addStyleRule("#" + sidenote.id, { "margin-top": offsetY + "px" })

      addStyleRuleRaw(
        "@media only screen and (min-width: 1321px) {\n" +
        "  #" + sidenote.id + " { margin-top: " + offsetY + "px; }" +
        "}\n"
      )

      sidenoteMaxY = Math.max(sidenoteMaxY, noteBottom)

    // } else if (refpos > noteBottom) {
    //   console.log('TODO sidenote above ref')
    } else if (noteTop < sidenoteMaxY) {
      console.log('TODO sidenotes too close together')
    } else {
      sidenoteMaxY = Math.max(sidenoteMaxY, noteBottom)
    }

    // restore
    sidenote.classList.remove('force-side')

    sidenoteMaxY += spacingY // min space between sidenotes
  })
});

})();
