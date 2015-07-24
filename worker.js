var hop = require('ndarray-hop')
var getFrequencies = require('ndsamples-frequencies')

var opts = require('./opts')

module.exports = function (self) {

  var frameLength = opts.buffer * 8

  var sliceOut = hop({
    frame: { shape: [opts.shape[0], frameLength, opts.channels] },
    hop: { shape: [opts.shape[0] / 2, frameLength, opts.channels] }
  }, function (arr) {
    self.postMessage(arr)
  })

  var sliceIn = hop({
    frame: { shape: [frameLength, opts.channels] },
    hop: { shape: [opts.buffer, opts.channels] }
  }, function (arr) {
    sliceOut(getFrequencies(arr))
  })
  
  self.addEventListener('message', function (ev) {
    sliceIn(ev.data)
  })
}
