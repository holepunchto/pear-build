const EventEmitter = require('events')
const binding = require('../binding')
const constants = require('./constants')
const App = require('./app')
const View = require('./view')

module.exports = class Window extends EventEmitter {
  constructor(x = 0, y = 0, width = 0, height = 0, opts = {}) {
    const app = App.shared()

    super()

    const { frame = true } = opts

    this._state = 0
    this._view = new View()

    this._handle = binding.initWindow(
      app._handle,
      this._view._handle,
      Float32Array.of(x, y, width, height),
      frame,
      this,
      this._onresize,
      this._onmove,
      this._onminimize,
      this._ondeminimize,
      this._onclose
    )
  }

  _ondestroy() {
    binding.destroyWindow(this._handle)
  }

  _onresize(width, height) {
    this.emit('resize', width, height)
  }

  _onmove(x, y) {
    this.emit('move', x, y)
  }

  _onminimize() {
    this.emit('minimize')
  }

  _ondeminimize() {
    this.emit('deminimize')
  }

  _onclose() {
    if (this._state & constants.state.CLOSED) return
    this._state |= constants.state.CLOSED

    this.emit('close')
  }

  get isVisible() {
    return (this._state & constants.state.VISIBLE) !== 0
  }

  get isClosed() {
    return (this._state & constants.state.CLOSED) !== 0
  }

  appendChild(child) {
    this._view.appendChild(child)

    return this
  }

  removeChild(child) {
    this._view.removeChild(child)

    return this
  }

  getBounds() {
    const result = new Float32Array(4)

    binding.getWindowBounds(this._handle, result)

    const [x, y, width, height] = result

    return {
      x,
      y,
      width,
      height
    }
  }

  show() {
    if (this._state & constants.state.VISIBLE) return
    this._state |= constants.state.VISIBLE

    binding.showWindow(this._handle)

    this._view._onattach()

    this.emit('show')

    return this
  }

  hide() {
    if ((this._state & constants.state.VISIBLE) === 0) return
    this._state ^= constants.state.VISIBLE

    binding.hideWindow(this._handle)

    this._view._ondetach()

    this.emit('hide')

    return this
  }

  activate() {
    binding.activateWindow(this._handle)

    return this
  }

  close() {
    binding.closeWindow(this._handle)

    return this
  }

  destroy() {
    if (this._state & constants.state.DESTROYED) return
    this._state |= constants.state.DESTROYED

    this._view.destroy()

    if (this._state & constants.state.ATTACHED) {
      this._state ^= constants.state.ATTACHED
    }

    this._ondestroy()

    this.emit('destroy')
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
