var ndarray = require('ndarray')
var vdom = require('virtual-dom')
var main = require('main-loop')
var readAudio = require('read-audio')
var writable = require('writable2')
var h = require('virtual-hyperscript-svg')
var through = require('through2')
var nextTick = require('next-tick')
var work = require('webworkify')
var Slider = require('range-slider')

var rainbowGradient = require('rainbow-linear-gradient')
var linearGradientToVsvg = require('linear-gradient-svg')

var Scope = require('./')

var opts = require('./opts')

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
  .pipe(freqWorker())
  .pipe(writable.obj({
    highWaterMark: 1
  }, function (freqs, enc, cb) {

    var min = opts.shape[0]
    var xShape = Math.max(Math.ceil(freqs.shape[0] * zoom), min)
    var xOffset = Math.floor(freqs.shape[0] * (1 - zoom))
    xOffset = freqs.shape[0] - offset < min ? freqs.shape[0] - min : offset
    var offset = freqs.index(xOffset, 0, 0)

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
    nextTick(cb)
  }))
})

function freqWorker () {
  var w = work(require('./worker'))

  var stream = through.obj({
    highWaterMark: 1
  }, function (samples, enc, cb) {
    w.postMessage(samples)
    cb()
  })

  w.addEventListener('message', function (ev) {
    var arr = ev.data
    stream.push(ndarray(arr.data, arr.shape, arr.stride, arr.offset))
  })

  return stream
}

document.body.appendChild(loop.target)
