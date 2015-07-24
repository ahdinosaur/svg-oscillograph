var getFrequencies = require('ndsamples-frequencies')

module.exports = function (self) {
  self.addEventListener('message', function (ev) {
    self.postMessage(getFrequencies(ev.data))
  })
}
