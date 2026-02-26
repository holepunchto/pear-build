const path = require('path')
const fs = require('fs')
const Localdrive = require('localdrive')

module.exports = async function build(dir, opts = {}) {
  const pkgPath = path.resolve(dir)
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
  const androidArm64 = opts.androidArm64 ? ['android-arm64', path.resolve(opts.androidArm64)] : null

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

  const noop = () => {}
  const promises = []
  for (const [arch, app] of apps) {
    const isMobile = arch.startsWith('ios') || arch.startsWith('android')
    const appName = isMobile ? (pkg.productName ?? pkg.name) : path.basename(app)
    if (typeof appName !== 'string') {
      throw new Error('package.json productName or name is a required field string')
    }
    const archApp = path.join(byArch, arch, 'app')
    await fs.promises.mkdir(archApp, { recursive: true })

    const src = new Localdrive(isMobile ? app : path.dirname(app))
    const dst = new Localdrive(isMobile ? path.join(archApp, appName) : archApp)
    const mirror = src.mirror(dst, isMobile ? undefined : { prefix: '/' + appName })

    await src.ready()
    await dst.ready()
    console.log(app, 'mirroring to', archApp)
    const promise = mirror.done()
    promises.push(promise)
    promise.then(() => console.log(app, 'mirrored to', archApp), noop)
    await src.close()
    await dst.close()
  }

  await Promise.all(promises)
}
