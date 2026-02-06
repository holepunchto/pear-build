const binding = require('../binding')
const App = require('./app')
const Node = require('./node')

module.exports = class View extends Node {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    const app = App.shared()

    super()

    this._handle = binding.initView(
      app._handle,
      Float32Array.of(x, y, width, height),
      this
    )
  }

  _ondestroy() {
    binding.destroyView(this._handle)
  }

  getBounds() {
    const result = new Float32Array(4)

    binding.getViewBounds(this._handle, result)

    const [x, y, width, height] = result

    return {
      x,
      y,
      width,
      height
    }
  }

  setBounds(x, y, width, height) {
    binding.setViewBounds(this._handle, Float32Array.of(x, y, width, height))

    return this
  }
}
