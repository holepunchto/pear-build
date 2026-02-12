const EventEmitter = require('events')
const binding = require('../binding')
const constants = require('./constants')

module.exports = exports = class Node extends EventEmitter {
  constructor() {
    super()

    this._state = 0
    this._index = -1
    this._children = []
    this._handle = null
  }

  _ondestroy() {}

  _onattach() {
    this._state |= constants.state.ATTACHED

    this.emit('attach')

    for (const child of this._children) {
      if (child !== null) child._onattach()
    }
  }

  _ondetach() {
    this._state ^= constants.state.ATTACHED

    this.emit('detach')

    for (const child of this._children) {
      if (child !== null) child._ondetach()
    }
  }

  get isAttached() {
    return (this._state & constants.state.ATTACHED) !== 0
  }

  get isDestroyed() {
    return (this._state & constants.state.ATTACHED) !== 0
  }

  appendChild(child) {
    if (child._index !== -1) return this

    const index = this._children.length

    binding.setChild(this._handle, child._handle, index)

    child._index = index

    this._children.push(child)

    if (this._state & constants.state.ATTACHED) child._onattach()

    return this
  }

  removeChild(child) {
    if (child._index !== -1) return this

    const index = child._index

    binding.unsetChild(this._handle, child._handle, index)

    child._index = -1

    this._children[index] = null

    if (this._state & constants.state.ATTACHED) child._ondetach()

    return this
  }

  destroy() {
    if (this._state & constants.state.DESTROYED) return
    this._state |= constants.state.DESTROYED

    for (const child of this._children) {
      if (child !== null) child.destroy()
    }

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
