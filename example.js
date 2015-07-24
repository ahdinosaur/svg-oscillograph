var ndarray = require('ndarray')
var vdom = require('virtual-dom')
var main = require('main-loop')
var readAudio = require('read-audio')
var hop = require('ndarray-hop/stream')
var writable = require('writable2')
var h = require('virtual-hyperscript-svg')
var Slider = require('range-slider')
var getFrequencies = require('ndsamples-frequencies/stream')
var through = require('through2')

var rainbowGradient = require('rainbow-linear-gradient')
var linearGradientToVsvg = require('linear-gradient-svg')

var Scope = require('./')

var opts = {
  buffer: 512,
  channels: 1,
  inc: 1,
  shape: [64, 64],
  numStops: 32
}

var scope = Scope(opts)

var loop = main(
  null,
  scope,
  vdom
)

var zoom = 1
var slider = Slider(
  document.querySelector('#slider'),
  zoom,
  function (newZoom) {
    zoom = newZoom
  }
)

readAudio(opts, function (err, stream) {
  if (err) { throw err }

  var start = 0
  var inc = opts.inc

  stream
  .pipe(hop({
    frame: { shape: [opts.buffer, opts.channels] },
    hop: { shape: [opts.buffer / 2, opts.channels] },
    dtype: 'float32'
  }))
  .pipe(getFrequencies())
  .pipe(hop({
    frame: { shape: [opts.shape[0], opts.buffer, opts.channels] },
    hop: { shape: [opts.shape[0], opts.buffer, opts.channels] },
    dtype: 'float32'
  }))
  .pipe(writable.obj({
    highWaterMark: 1
  }, function (freqs, enc, cb) {
    var min = opts.shape[0]
    var xShape = Math.max(Math.ceil(freqs.shape[0] * zoom), min)
    var offset = Math.floor(freqs.data.length * (1 - zoom), 0)
    offset = freqs.shape[0] - offset < min ? freqs.shape[0] - min : offset

    var frequencies = ndarray(
      freqs.data,
      [xShape, freqs.shape[1], freqs.shape[2]],
      freqs.stride,
      offset
    )

    loop.update({
      fill: linearGradientToVsvg(
        rainbowGradient({
          start: start,
          length: opts.numStops
        })
      ),
      frequencies: frequencies
    })

    start += inc
    process.nextTick(cb)
  }))
})

document.body.appendChild(loop.target)
