var ndarray = require('ndarray')
var vdom = require('virtual-dom')
var main = require('main-loop')
var readAudio = require('read-audio')
var hop = require('ndarray-hop/stream')
var writable = require('writable2')
var h = require('virtual-hyperscript-svg')
var through = require('through2')
var nextTick = require('next-tick')
var work = require('webworkify')

var rainbowGradient = require('rainbow-linear-gradient')
var linearGradientToVsvg = require('linear-gradient-svg')

var Scope = require('./')

var opts = {
  buffer: 256,
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

readAudio(opts, function (err, stream) {
  if (err) { throw err }

  var start = 0
  var inc = opts.inc
  var frameLength = opts.buffer * 8

  stream
  .pipe(hop({
    frame: { shape: [frameLength, opts.channels] },
    hop: { shape: [opts.buffer, opts.channels] },
    dtype: 'float32',
    stream: {
      highWaterMark: 1
    }
  }))
  .pipe(freqWorker())
  .pipe(hop({
    frame: { shape: [opts.shape[0], frameLength, opts.channels] },
    hop: { shape: [opts.shape[0] / 2, frameLength, opts.channels] },
    dtype: 'float32',
    stream: {
      highWaterMark: 1
    }
  }))
  .pipe(writable.obj({
    highWaterMark: 1
  }, function (freqs, enc, cb) {
    loop.update({
      fill: linearGradientToVsvg(
        rainbowGradient({
          start: start,
          length: opts.numStops
        })
      ),
      frequencies: freqs
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
