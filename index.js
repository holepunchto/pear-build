#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const Localdrive = require('localdrive')
const { command, flag, bail } = require('paparam')

const program = command(
  'build',
  flag('--package [path]', 'Path to project package.json'),
  flag('--target [path]', 'Target build dir'),
  flag('--darwin-arm64-app [path]', 'Path to Mac ARM64 app'),
  flag('--darwin-x64-app [path]', 'Path to Mac x64 app'),
  flag('--linux-arm64-app [path]', 'Path to Linux ARM64 app'),
  flag('--linux-x64-app [path]', 'Path to Linux x64 app'),
  flag('--win32-x64-app [path]', 'Path to Windows x64 app'),
  flag('--ios-arm64 [path]', 'Path to iOS ARM64 folder (ota bundle and assets)'),
  flag(
    '--ios-arm64-simulator [path]',
    'Path to iOS ARM64-Simulator folder (ota bundle and assets)'
  ),
  flag('--ios-x64-simulator [path]', 'Path to iOS x64-Simulator folder (ota bundle and assets)'),
  flag('--android-arm64 [path]', 'Path to android ARM64 folder (ota bundle and assets)'),
  async function (cmd) {
    const package = path.resolve(cmd.flags.package)
    const pkg = require(package)
    const productName = pkg.productName ?? pkg.name
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
    const iosArm64 = cmd.flags.iosArm64 ? ['ios-arm64', path.resolve(cmd.flags.iosArm64)] : null
    const iosArm64Sim = cmd.flags.iosArm64Sim
      ? ['ios-arm64-sim', path.resolve(cmd.flags.iosArm64Sim)]
      : null
    const iosx64Sim = cmd.flags.iosx64Sim
      ? ['ios-x64-sim', path.resolve(cmd.flags.iosx64Sim)]
      : null
    const androidArm64 = cmd.flags.win32X64App
      ? ['android-arm64', path.resolve(cmd.flags.androidArm64)]
      : null

    const byArch = path.join(target, 'by-arch')

    await fs.promises.mkdir(byArch, { recursive: true })

    fs.writeFileSync(path.join(target, 'package.json'), fs.readFileSync(package))

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
      if (isMobile && !productName)
        throw new Error('productName or name field in package.json required')
      const archApp = path.join(byArch, arch, 'app', isMobile ? productName : path.basename(app))
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
  },
  bail((bailed) => {
    console.error('bailed', bailed.reason)
  })
)

program.parse(global.Bare ? global.Bare.argv.slice(2) : process.argv.slice(2))
