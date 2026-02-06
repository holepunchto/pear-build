const Thread = require('bare-thread')
const { App, Screen, Window, WebView } = require('fx-native')
const appling = require('appling-native')
const hypercoreid = require('hypercore-id-encoding')
const { ALIASES } = require('pear-aliases')
const { preflight } = require('./preflight')
const view = require('./view.html.cjs')

const WINDOW_HEIGHT = 548
const WINDOW_WIDTH = 500

async function install(id, opts = {}) {
  const { platform = hypercoreid.encode(ALIASES.pear), name } = opts
  const html = view({ name: name || id })

  using lock = await preflight(id)

  const config = {
    dir: lock.dir,
    platform,
    link: `pear://${id}`
  }

  const app = App.shared()

  let window
  let webview

  function onViewMessage(message) {
    const msg = message.toString()
    switch (msg) {
      case 'quit':
        window.close()
        break
      case 'install':
        app.broadcast(JSON.stringify({ type: 'install' }))
        break
      case 'launch': {
        lock.unlock()
        const app = new appling.App(id)
        app.open()
        window.close()
        break
      }
    }
  }

  function onWorkerMessage(message) {
    const msg = JSON.parse(message)
    switch (msg.type) {
      case 'ready':
        app.broadcast(JSON.stringify({ type: 'config', data: config }))
        break
      case 'download':
        webview.postMessage({ type: 'progress', data: msg.data })
        break
      case 'complete':
        webview.postMessage({ type: 'state', state: 'complete' })
        break
      case 'error':
        webview.postMessage({ type: 'state', state: 'error' })
        break
    }
  }

  app
    .on('launch', () => {
      new Thread(require.resolve('./worker'))

      const { width, height } = Screen.main().getBounds()

      window = new Window(
        (width - WINDOW_WIDTH) / 2,
        (height - WINDOW_HEIGHT) / 2,
        WINDOW_WIDTH,
        WINDOW_HEIGHT,
        { frame: false }
      )

      webview = new WebView(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT)
      webview.on('message', onViewMessage).loadHTML(html)

      window.appendChild(webview)
      window.show()
    })
    .on('terminate', () => {
      window.destroy()
    })
    .on('message', onWorkerMessage)
    .run()
}

module.exports = install
