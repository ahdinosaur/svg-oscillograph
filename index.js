var defined = require('defined')
var ndarray = require('ndarray')
var h = require('virtual-hyperscript-svg')
var isVnode = require('virtual-dom/vnode/is-vnode')
var getFrequencies = require('ndsamples-frequencies')

module.exports = oscilloscope

function oscilloscope (opts) {
  opts = defined(opts, {})

  var shape = defined(opts.shape) || [64, 64]

  return render

  function render (state) {
    state = state == null ? {} : state

    var fill = state.fill
    var fillDef = getStrokeDef(fill)

    //console.log("state", state)
    return h('svg', {
      height: '100%',
      width: '100%',
      viewBox: '0 0 1 1',
      preserveAspectRatio: 'none'
    }, [
      h('defs', [
        fillDef
      ]),
      h('g', {
        fill: defined(
          fillDef && getDefId(fillDef),
          fill,
          'magenta'
        ),
      }, getFrequencies(state.frequencies).data
        .map(function (p) {
          if (p[2] < 1e-5) return
          return h('circle', {
            cx: p[0],
            cy: p[1],
            r: p[2]
          })
        })
      )
    ])
  }

  function getFrequencies (frequencies) {
    if (!defined(frequencies)) {
      return ndarray([])
    }

    var array = ndarray(frequencies.data, frequencies.shape, frequencies.stride, frequencies.offset)
    var ret = ndarray(new Array(opts.shape[0] * opts.shape[1]), array.shape, array.stride)

    for (var x = 0; x < opts.shape[0]; x++) {
      var t = Math.floor(x / opts.shape[0] * array.shape[0])
      for (var y = 0; y < opts.shape[1]; y++) {
        var a = Math.floor(y / opts.shape[1] * array.shape[1])
        for (var c = 0; c < array.shape[2]; c++) {
          ret.set(x, y, c, new Float32Array([
            1 - t / array.shape[0],
            Math.pow(a, 4) / Math.pow(array.shape[1], 4),
            Math.log(array.get(t, a, c)) / 1e2
          ]))
        }
      }
    }

    return ret
  }
}

function getStrokeDef (fill) {
  if (isVnode(fill)) {
    var fill = fill
    setDefId(fill, 'fill')
    return fill
  }
}

function getDefId (def) {
  return 'url(#' + def.properties.id + ')'
}

function setDefId (def, id) {
  def.properties.id = 'oscilloscope-' + id
}
