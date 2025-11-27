const EventEmitter = require('events')
const binding = require('../binding')
const constants = require('./constants')

module.exports = class App extends EventEmitter {
  constructor() {
    super()

    this._state = 0

    this._handle = binding.init(
      this,
      this._onlaunch,
      this._onterminate,
      this._onsuspend,
      this._onresume,
      this._onmessage
    )

    this._isMain = binding.isMain(this._handle)
  }

  static _instance = null

  static shared() {
    if (this._instance === null) this._instance = new App()
    return this._instance
  }

  _onlaunch() {
    this._state |= constants.state.RUNNING
    this.emit('launch')
  }

  _onterminate() {
    this._state ^= constants.state.RUNNING
    this.emit('terminate')
  }

  _onsuspend() {
    this._state |= constants.state.SUSPENDED
    this.emit('suspend')
  }

  _onresume() {
    this._state ^= constants.state.SUSPENDED
    this.emit('resume')
  }

  _onmessage(message) {
    this.emit('message', Buffer.from(message))
  }

  get isMain() {
    return this._isMain
  }

  get isWorker() {
    return !this._isMain
  }

  get isRunning() {
    return (this._state & constants.state.RUNNING) !== 0
  }

  get isSuspended() {
    return (this._state & constants.state.SUSPENDED) !== 0
  }

  run() {
    if (this._isMain) binding.run(this._handle)
  }

  destroy() {
    if (this._state & constants.state.DESTROYED) return
    this._state |= constants.state.DESTROYED

    binding.destroy(this._handle)

    this._handle = null
  }

  broadcast(message) {
    binding.broadcast(
      this._handle,
      typeof message === 'string' ? Buffer.from(message) : message
    )

    return this
  }

  [Symbol.dispose]() {
    this.destroy()
  }
}
