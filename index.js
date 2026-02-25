const path = require('path')
const fs = require('fs')
const Localdrive = require('localdrive')

module.exports = async function (cmd) {
  const pkgPath = path.resolve(cmd.flags.package)
  const pkg = require(pkgPath)
  const { target = path.resolve(pkg.name + '-' + pkg.version) } = cmd.flags
  const darwinArm64App = cmd.flags.darwinArm64App
    ? ['darwin-arm64', path.resolve(cmd.flags.darwinArm64App)]
    : null
  const darwinX64App = cmd.flags.darwinX64App
    ? ['darwin-x64', path.resolve(cmd.flags.darwinX64App)]
    : null
  const linuxArm64App = cmd.flags.linuxArm64App
    ? ['linux-arm64', path.resolve(cmd.flags.linuxArm64App)]
    : null
  const linuxX64App = cmd.flags.linuxX64App
    ? ['linux-x64', path.resolve(cmd.flags.linuxX64App)]
    : null
  const win32X64App = cmd.flags.win32X64App
    ? ['win32-x64', path.resolve(cmd.flags.win32X64App)]
    : null

  const byArch = path.join(target, 'by-arch')

  await fs.promises.mkdir(byArch, { recursive: true })

  fs.writeFileSync(path.join(target, 'package.json'), fs.readFileSync(pkgPath))

  const apps = [darwinArm64App, darwinX64App, linuxArm64App, linuxX64App, win32X64App].filter(
    Boolean
  )
  const noop = () => {}
  const promises = []
  for (const [arch, app] of apps) {
    const archApp = path.join(byArch, arch, 'app', path.basename(app))
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
