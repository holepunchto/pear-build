const binding = require('../binding')
const App = require('./app')

module.exports = class Screen {
  constructor() {
    this._handle = null
  }

  static main() {
    const app = App.shared()

    const screen = new Screen()

    screen._handle = binding.getMainScreen(app._handle, screen)

    return screen
  }

  getBounds() {
    const result = new Float32Array(4)

    binding.getScreenBounds(this._handle, result)

    const [x, y, width, height] = result

    return {
      x,
      y,
      width,
      height
    }
  }
}
