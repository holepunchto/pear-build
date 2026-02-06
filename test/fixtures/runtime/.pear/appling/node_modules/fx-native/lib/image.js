const binding = require('../binding')
const App = require('./app')
const Node = require('./node')

module.exports = class Image extends Node {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    const app = App.shared()

    super()

    this._handle = binding.initImage(
      app._handle,
      Float32Array.of(x, y, width, height),
      this
    )
  }

  _ondestroy() {
    binding.destroyImage(this._handle)
  }

  getBounds() {
    const result = new Float32Array(4)

    binding.getImageBounds(this._handle, result)

    const [x, y, width, height] = result

    return {
      x,
      y,
      width,
      height
    }
  }

  setBounds(x, y, width, height) {
    binding.setImageBounds(this._handle, Float32Array.of(x, y, width, height))

    return this
  }

  loadFile(path) {
    binding.loadImageFile(this._handle, path)

    return this
  }

  loadPixels(pixels, width, height, stride = -1) {
    binding.loadImagePixels(this._handle, pixels, width, height, stride)

    return this
  }
}
