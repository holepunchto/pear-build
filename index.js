'use strict'
const path = require('path')
const fs = require('fs')
const { EventEmitter } = require('events')
const Localdrive = require('localdrive')

class Build extends EventEmitter {
  constructor(opts) {
    super()
    this.opts = opts
    this._running = this._run()
    this._running.catch(() => {})
  }

  async _run() {
    await new Promise((resolve) => queueMicrotask(resolve))

    try {
      return await this.run(this.opts)
    } catch (err) {
      this.emit('error', err)
      throw err
    }
  }

  async run(opts) {
    const pkgPath = path.resolve(opts.package)
    const pkg = require(pkgPath)
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

    const apps = [
      darwinArm64App,
      darwinX64App,
      linuxArm64App,
      linuxX64App,
      win32X64App,
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
        throw new Error(`expected directory ${appName} but got ${path.basename(app)} for ${arch}`)
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

module.exports = function build(opts) {
  return new Build(opts)
}
