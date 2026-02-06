const binding = require('../binding')
const App = require('./app')
const Node = require('./node')

module.exports = class Text extends Node {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    const app = App.shared()

    super()

    this._handle = binding.initText(
      app._handle,
      Float32Array.of(x, y, width, height),
      this
    )
  }

  _ondestroy() {
    binding.destroyText(this._handle)
  }

  appendChild(child) {
    if (typeof child === 'string') return this.appendSpan(child)

    return super.appendChild(child)
  }

  appendSpan(value) {
    Text.createSpan(value).appendTo(this)

    return this
  }

  getBounds() {
    const result = new Float32Array(4)

    binding.getTextBounds(this._handle, result)

    const [x, y, width, height] = result

    return {
      x,
      y,
      width,
      height
    }
  }

  getBoundsUsed() {
    const result = new Float32Array(4)

    binding.getTextBoundsUsed(this._handle, result)

    const [x, y, width, height] = result

    return {
      x,
      y,
      width,
      height
    }
  }

  setBounds(x, y, width, height) {
    binding.setTextBounds(this._handle, Float32Array.of(x, y, width, height))

    return this
  }

  static createSpan(value) {
    return new TextSpan(value)
  }
}

class TextSpan {
  constructor(value) {
    this._value = value
    this._handle = binding.initTextSpan()
  }

  get value() {
    return this._value
  }

  appendTo(text) {
    binding.appendTextSpan(text._handle, this._handle, this._value)

    return this
  }
}
