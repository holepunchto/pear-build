#!/usr/bin/env node
const path = require('path')
const os = require('os')
const fs = require('fs')
const Localdrive = require('localdrive')
const { command, flag, bail } = require('paparam')

const program = command(
  'build',
  flag('--package [path]', 'Path to project package.json'),
  flag('--darwin-arm64-app [path]', 'Path to Mac ARM64 app'),
  flag('--darwin-x64-app [path]', 'Path to Mac x64 app'),
  flag('--linux-arm64-app [path]', 'Path to Linux ARM64 app'),
  flag('--linux-x64-app [path]', 'Path to Linux x64 app'),
  flag('--win32-x64-app [path]', 'Path to Windows x64 app'),
  flag('--target [path]', 'Target build dir'),
  async function (cmd) {
    const cwd = os.cwd ? os.cwd() : process.cwd()
    const package = path.join(cwd, cmd.flags.package)
    const pkg = require(package)
    const { target = path.join(cwd, pkg.name + '-' + pkg.version) } = cmd.flags
    const darwinArm64App = cmd.flags.darwinArm64App
      ? ['darwin-arm64', path.join(cwd, cmd.flags.darwinArm64App)]
      : null
    const darwinX64App = cmd.flags.darwinX64App
      ? ['darwin-x64', path.join(cwd, cmd.flags.darwinX64App)]
      : null
    const linuxArm64App = cmd.flags.linuxArm64App
      ? ['linux-arm64', path.join(cwd, cmd.flags.linuxArm64App)]
      : null
    const linuxX64App = cmd.flags.linuxX64App
      ? ['linux-x64', path.join(cwd, cmd.flags.linuxX64App)]
      : null
    const win32X64App = cmd.flags.win32X64App
      ? ['window-x64', path.join(cwd, cmd.flags.win32X64App)]
      : null

    const byArch = path.join(target, 'by-arch')

    await fs.promises.mkdir(byArch, { recursive: true })

    fs.writeFileSync(path.join(target, 'package.json'), fs.readFileSync(package))

    const apps = [darwinArm64App, darwinX64App, linuxArm64App, linuxX64App, win32X64App].filter(
      Boolean
    )
    const noop = () => {}
    const promises = []
    for (const [arch, app] of apps) {
      const archApp = path.join(byArch, arch, 'app')
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
