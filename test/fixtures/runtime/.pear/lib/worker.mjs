import { App } from 'fx-native'
import bootstrap from 'pear-updater-bootstrap'
import appling from 'appling-native'
import { encode, decode, format } from './utils'
import { Progress } from './progress'

const app = App.shared()

let config
let platform

function setup(data) {
  config = data
}

async function install() {
  const progress = new Progress(app, [0.3, 0.7])
  let platformFound = false
  let bootstrapInterval = null

  try {
    try {
      platform = await appling.resolve(config.dir)
      platformFound = true
    } catch (e) {
      await bootstrap(config.platform, config.dir, {
        lock: false,
        onupdater: (u) => {
          bootstrapInterval = setInterval(() => {
            progress.update(format(u))
            if (u.downloadProgress === 1) {
              clearInterval(bootstrapInterval)
            }
          }, 300)
        }
      })
      platform = await appling.resolve(config.dir)
    }
    if (platformFound) {
      progress.stage(0, 1)
    }
    await platform.preflight(config.link)
    progress.complete()
    app.broadcast(encode({ type: 'complete' }))
  } catch (e) {
    console.error('Bootstrap error: %o', e)
    app.broadcast(encode({ type: 'error', error: e.message }))
  } finally {
    clearInterval(bootstrapInterval)
  }
}

app.on('message', async (message) => {
  const msg = decode(message)
  switch (msg.type) {
    case 'config':
      setup(msg.data)
      break
    case 'install':
      await install()
      break
  }
})

app.broadcast(encode({ type: 'ready' }))
