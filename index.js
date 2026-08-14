'use strict'
const path = require('path')
const fs = require('fs')
const { EventEmitter } = require('events')
const Localdrive = require('localdrive')
const { ERR_NOT_FOUND, ERR_INVALID_INPUT, ERR_INVALID_APP_NAME } = require('pear-errors')

class Build extends EventEmitter {
  constructor(opts) {
    super()
    this._running = this.run(opts)
    this._running.catch((err) => this.emit('error', err))
  }

  async run(opts) {
    if (!opts.package) throw ERR_INVALID_INPUT('package.json path must be specified.')
    const pkgPath = path.resolve(opts.package)
    const pkg = await getParsedJSON('package.json', pkgPath)

    let configPath, config
    if (opts.config) {
      configPath = path.resolve(opts.config)
      config = await getParsedJSON('pear.json', configPath)
    } else if (pkg.dependencies['react-native-bare-kit']) {
      // in mobile react-native-bare-kit needs to be listed in project's deps
      throw ERR_INVALID_INPUT('pear.json path must be specified.')
    }

    const { target = path.resolve(pkg.name + '-' + pkg.version) } = opts
    const darwinArm64App = opts.darwinArm64App
      ? ['darwin-arm64', path.resolve(opts.darwinArm64App)]
      : null
    const darwinX64App = opts.darwinX64App ? ['darwin-x64', path.resolve(opts.darwinX64App)] : null
    const linuxArm64App = opts.linuxArm64App
      ? ['linux-arm64', path.resolve(opts.linuxArm64App)]
      : null
    const linuxX64App = opts.linuxX64App ? ['linux-x64', path.resolve(opts.linuxX64App)] : null
    const win32X64App = opts.win32X64App ? ['win32-x64', path.resolve(opts.win32X64App)] : null
    const win32Arm64App = opts.win32Arm64App
      ? ['win32-arm64', path.resolve(opts.win32Arm64App)]
      : null
    const iosArm64 = opts.iosArm64 ? ['ios-arm64', path.resolve(opts.iosArm64)] : null
    const iosArm64Sim = opts.iosArm64Simulator
      ? ['ios-arm64-simulator', path.resolve(opts.iosArm64Simulator)]
      : null
    const iosx64Sim = opts.iosX64Simulator
      ? ['ios-x64-simulator', path.resolve(opts.iosX64Simulator)]
      : null
    const androidArm64 = opts.androidArm64
      ? ['android-arm64', path.resolve(opts.androidArm64)]
      : null

    const byArch = path.join(target, 'by-arch')

    await fs.promises.mkdir(byArch, { recursive: true })

    await fs.promises.writeFile(
      path.join(target, 'package.json'),
      await fs.promises.readFile(pkgPath)
    )

    if (config) {
      await fs.promises.writeFile(
        path.join(target, 'pear.json'),
        await fs.promises.readFile(configPath)
      )
    }

    const apps = [
      darwinArm64App,
      darwinX64App,
      linuxArm64App,
      linuxX64App,
      win32X64App,
      win32Arm64App,
      iosArm64,
      iosArm64Sim,
      iosx64Sim,
      androidArm64
    ].filter(Boolean)

    const appName = pkg.productName ?? pkg.name

    const noop = () => {}
    const promises = []
    for (const [arch, app] of apps) {
      if (path.basename(app, path.extname(app)) !== appName) {
        throw ERR_INVALID_APP_NAME(
          `expected directory ${appName} but got ${path.basename(app)} for ${arch}`,
          { arch, app }
        )
      }
      const archApp = path.join(byArch, arch, 'app')
      await fs.promises.mkdir(archApp, { recursive: true })

      const src = new Localdrive(path.dirname(app))
      const dst = new Localdrive(archApp)
      const mirror = src.mirror(dst, { prefix: '/' + path.basename(app) })

      await src.ready()
      await dst.ready()
      this.emit('mirroring', { message: 'mirroring to', from: app, to: archApp })
      const promise = mirror.done()
      promises.push(promise)
      promise.then(
        () => this.emit('mirrored', { message: 'mirrored to', from: app, to: archApp }),
        noop
      )
      await src.close()
      await dst.close()
    }

    await Promise.all(promises)
  }

  async done() {
    return await this._running
  }
}

async function getParsedJSON(name, path) {
  const file = await fs.promises.readFile(path, 'utf8').catch((err) => {
    if (err.code === 'ENOENT') {
      throw ERR_NOT_FOUND(name + ' not found', { path, cause: err })
    }
    if (err.code === 'EISDIR') {
      throw ERR_INVALID_INPUT(name + ' must be a file', { path, cause: err })
    }
    throw err
  })

  try {
    return JSON.parse(file)
  } catch (err) {
    throw ERR_INVALID_INPUT(name + ' is not a valid JSON', { path, cause: err })
  }
}

module.exports = function build(opts) {
  return new Build(opts)
}
