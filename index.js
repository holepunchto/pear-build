const path = require('path')
const fs = require('fs')
const Localdrive = require('localdrive')

module.exports = async function build(dir, opts = {}) {
  const pkgPath = path.resolve(dir)
  const pkg = require(pkgPath)
  const { target = path.resolve(pkg.name + '-' + pkg.version) } = opts
    const darwinArm64App = opts.flags.darwinArm64App
      ? ['darwin-arm64', path.resolve(opts.flags.darwinArm64App)]
      : null
    const darwinX64App = opts.flags.darwinX64App
      ? ['darwin-x64', path.resolve(opts.flags.darwinX64App)]
      : null
    const linuxArm64App = opts.flags.linuxArm64App
      ? ['linux-arm64', path.resolve(opts.flags.linuxArm64App)]
      : null
    const linuxX64App = opts.flags.linuxX64App
      ? ['linux-x64', path.resolve(opts.flags.linuxX64App)]
      : null
    const win32X64App = opts.flags.win32X64App
      ? ['win32-x64', path.resolve(opts.flags.win32X64App)]
      : null
    const iosArm64 = opts.flags.iosArm64 ? ['ios-arm64', path.resolve(opts.flags.iosArm64)] : null
    const iosArm64Sim = opts.flags.iosArm64Sim
      ? ['ios-arm64-sim', path.resolve(opts.flags.iosArm64Sim)]
      : null
    const iosx64Sim = opts.flags.iosx64Sim
      ? ['ios-x64-sim', path.resolve(opts.flags.iosx64Sim)]
      : null
    const androidArm64 = opts.flags.win32X64App
      ? ['android-arm64', path.resolve(opts.flags.androidArm64)]
      : null

  const byArch = path.join(target, 'by-arch')

  await fs.promises.mkdir(byArch, { recursive: true })

  fs.writeFileSync(path.join(target, 'package.json'), fs.readFileSync(pkgPath))

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
      const appName = isMobile ? (pkg.productName ?? pkg.name) : basename(app)
      if (typeof appName !== 'string') {
        throw new Error('package.json productName or name is a required field string')
      }
      const archApp = path.join(byArch, arch, 'app', appName)
      await fs.promises.mkdir(archApp, { recursive: true })
      const src = new Localdrive(app)
      const dst = new Localdrive(archApp)
      await src.ready()
      await dst.ready()
      const mirror = src.mirror(dst)
      console.log(app, 'mirroring to', archApp)
      const promise = mirror.done()
      promises.push(promise)
      promise.then(() => {
        console.log(app, 'mirrored to', archApp)
      }, noop)
      await src.close()
      await dst.close()
    }

  await Promise.all(promises)
}
