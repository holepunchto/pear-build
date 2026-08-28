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

    const isMobile = !!pkg.dependencies?.['react-native-bare-kit'] // in mobile react-native-bare-kit needs to be listed in project's deps
    if (!opts.config && isMobile) throw ERR_INVALID_INPUT('pear.json path must be specified.')
    const configPath = opts.config && path.resolve(opts.config)
    const config = configPath && (await getParsedJSON('pear.json', configPath))

    const { target = path.resolve(pkg.name + '-' + pkg.version) } = opts
    const archs = {
      'darwin-arm64': opts.darwinArm64App,
      'darwin-x64': opts.darwinX64App,
      'linux-arm64': opts.linuxArm64App,
      'linux-x64': opts.linuxX64App,
      'win32-x64': opts.win32X64App,
      'win32-arm64': opts.win32Arm64App,
      'ios-arm64': opts.iosArm64,
      'ios-arm64-simulator': opts.iosArm64Simulator,
      'ios-x64-simulator': opts.iosX64Simulator,
      'android-arm64': opts.androidArm64
    }
    const apps = []
    for (const [arch, app] of Object.entries(archs)) {
      if (!app) continue
      for (const each of Array.isArray(app) ? app : [app]) {
        if (each) apps.push([arch, path.resolve(each)])
      }
    }

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

    const appName = pkg.productName ?? pkg.name
    const binNames = pkg.bin && typeof pkg.bin === 'object' ? Object.keys(pkg.bin) : []
    const appNames = [...new Set([appName, ...binNames])]

    const noop = () => {}
    const promises = []
    for (const [arch, app] of apps) {
      if (!fs.existsSync(app)) {
        throw new Error(`${app} does not exists`)
      }
      if (appNames.includes(path.basename(app, path.extname(app))) === false) {
        throw ERR_INVALID_APP_NAME(
          `expected ${appNames.join(' or ')} but got ${path.basename(app)} for ${arch}`,
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
