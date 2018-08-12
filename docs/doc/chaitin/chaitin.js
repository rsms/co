
class InterferenceGraph {
  constructor(svg) {
    this.nodes = {}
    this.edges = {}
    this.svg = Svg(svg)
  }

  // renderGraph( svgel : SvgElement, graph : Map<name,Set<name>> ) : void
  renderGraph(values) {
    // console.log('edges', JSON.stringify(edges))
    let nvals = values.size

    // 360 deg in radians = PI•2
    let radmax = Math.PI * 2

    // radius and text offset of a value circle
    let circleR = 18
    let circleSpacing = circleR * 2
    let textYOffset = 4

    // guide outer margin
    let guideMargin = circleR

    // graph svg object
    let svg = this.svg

    // empty svg
    while (svg.n.childNodes.length) {
      svg.n.removeChild(svg.n.childNodes[0])
    }

    // guide radius
    // maximum guide is size of graph minus some outer margin
    let guideRMax = (Math.min(svg.height, svg.width) / 2) - guideMargin
    // guide size is circumference computed from number of values + spacing
    // Circumference -> Radius: R = C/(2•PI)
    let guideR = (((circleR * 2) + circleSpacing) * nvals) / radmax
    // scale down if guideR > guideRMax
    let scale = 1, pt = 1
    if (guideR > guideRMax) {
      scale = guideRMax / guideR
      pt = 1 / scale
      let width = svg.width / scale
      let height = svg.height / scale
      svg.viewBox = {
        x: -(width - svg.width) / 2,
        y: -(height - svg.height) / 2,
        width,
        height
      }
    }

    let sceneCenter = { x: svg.width/2, y: svg.height/2 }

    let guideCircle = svg.add('circle', {
      class: 'guide',
      cx: sceneCenter.x, cy: sceneCenter.y,
      r: guideR,
    })

    // nodes contains info on all node graphics
    let nodes = {} // { id : { x : int, y : int, circleNode : SvgNode } }

    // groups for nodes
    let nodesg = svg.add('g', { class: 'nodes' })

    // // reverse order of names since the graph is built bottom-up, but
    // // really we want to think of it as top-down (the SLC, that is.)
    // let names = Array.from(values.keys()).reverse()

    // sort order of names since the graph is built bottom-up
    let names = Array.from(values.keys()).sort()

    // create nodes for names
    for (let i = 0; i < names.length; i++) {
      let name = names[i]

      let rad = ((i / nvals) * radmax) + (Math.PI*1.5)
        // Math.PI*1.5 = start at top
      let x = sceneCenter.x + (guideR * Math.cos(rad))
      let y = sceneCenter.y + (guideR * Math.sin(rad))

      let g = nodesg.add('g', { class: 'val' })
      let circleNode = g.add('circle', {
        class: 'node',
        cx: x,
        cy: y,
        r: circleR,
        'stroke-width': 1 * pt,
        fill: 'none',
      })
      g.add('text', { x, y: y + textYOffset, 'text-anchor': 'middle' }, name)

      nodes[name] = { x, y, g, circleNode }
    }

    // relationships
    let relsg = svg.add('g', { class: 'rels' })
    let edges = {}

    for (let p of values) {
      let id1 = p[0]
      for (let id2 of p[1]) {
        let key = this.edgeKey(id1, id2)
        if (!(key in edges)) {
          edges[key] = { ids: [ id1, id2 ] }
        }
      }
    }

    for (let key in edges) {
      let v = edges[key]

      let node1 = nodes[v.ids[0]]
      let node2 = nodes[v.ids[1]]

      let x1 = node1.x, y1 = node1.y
      let x2 = node2.x, y2 = node2.y

      // move line points out to edges of the circles (offset by circleR)
      let angle = Math.atan2(y2 - y1, x2 - x1)
      let offsx = Math.cos(angle) * circleR
      let offsy = Math.sin(angle) * circleR
      x1 += offsx
      y1 += offsy
      x2 -= offsx
      y2 -= offsy

      let line = relsg.add('line', {
        x1, y1, x2, y2,
        'stroke-width': 1 * pt,
        class: 'rel',
      })

      v.line = line
    }

    this.nodes = nodes
    this.edges = edges
  }


  edgeKey(id1, id2) {
    return id1 < id2 ? (id1 + " " + id2) : (id2 + " " + id1)
  }

} // class Chaitin
