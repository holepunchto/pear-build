const binding = require('../binding')
const App = require('./app')
const Node = require('./node')

module.exports = class WebView extends Node {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    const app = App.shared()

    super()

    this._handle = binding.initWebView(
      app._handle,
      Float32Array.of(x, y, width, height),
      this,
      this._onmessage
    )
  }

  _ondestroy() {
    binding.destroyWebView(this._handle)
  }

  _onmessage(message) {
    this.emit('message', JSON.parse(message))
  }

  getBounds() {
    const result = new Float32Array(4)

    binding.getWebViewBounds(this._handle, result)

    const [x, y, width, height] = result

    return {
      x,
      y,
      width,
      height
    }
  }

  setBounds(x, y, width, height) {
    binding.setWebViewBounds(this._handle, Float32Array.of(x, y, width, height))

    return this
  }

  postMessage(message) {
    binding.postWebViewMessage(this._handle, JSON.stringify(message))

    return this
  }

  loadURL(url) {
    binding.loadWebViewURL(this._handle, url)

    return this
  }

  loadHTML(html) {
    binding.loadWebViewHTML(this._handle, html)

    return this
  }
}
