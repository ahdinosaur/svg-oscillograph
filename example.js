var ndarray = require('ndarray')
var vdom = require('virtual-dom')
var main = require('main-loop')
var readAudio = require('read-audio')
var hop = require('ndarray-hop/stream')
var writable = require('writable2')
var h = require('virtual-hyperscript-svg')
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

readAudio(opts, function (err, stream) {
  if (err) { throw err }

  var start = 0
  var inc = opts.inc

  stream
  .pipe(hop({
    frame: { shape: [opts.buffer, opts.channels] },
    hop: { shape: [64, opts.channels] },
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
    process.nextTick(cb)
  }))
})

document.body.appendChild(loop.target)
