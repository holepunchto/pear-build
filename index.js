#!/usr/bin/env bare
const path = require('bare-path')
const os = require('bare-os')
const fs = require('bare-fs')
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
  flag('--root', 'Project root dir, default cwd'),
  async function (cmd) {
    const { root = os.cwd() } = cmd.flags
    const package = path.join(root, cmd.flags.package) // TODO
    const darwinArm64App = cmd.flags.darwinArm64App ? ['darwin-arm64', path.join(root, cmd.flags.darwinArm64App)] : null
    const darwinX64App = cmd.flags.darwinX64App ? ['darwin-x64', path.join(root, cmd.flags.darwinX64App)] : null
    const linuxArm64App = cmd.flags.linuxArm64App ? ['linux-arm64', path.join(root, cmd.flags.linuxArm64App)] : null
    const linuxX64App = cmd.flags.linuxX64App ? ['linux-x64', path.join(root, cmd.flags.linuxX64App)] : null
    const win32X64App = cmd.flags.win32X64App ? ['window-x64', path.join(root, cmd.flags.win32X64App)] : null
    
    const byArch = path.join(root, 'by-arch')

    const apps = [darwinArm64App, darwinX64App, linuxArm64App, linuxX64App, win32X64App].filter(Boolean)
    const noop = () => {}
    const promises = []
    for (const [arch, app] of apps) {
      const archApp = path.join(byArch, arch, 'app')
      await fs.mkdir(archApp, { recursive: true })
      const src = new Localdrive(app)
      const dst = new Localdrive(archApp)
      const mirror = src.mirror(dst)
      console.log(app, 'mirroring to', archApp)
      const promise = mirror.done()
      promises.push(promise)
      promise.then(() => { console.log(app, 'mirrored to', archApp) }, noop)
    }

    await Promise.all(promises)

  },
  bail((bail) => {
    console.error('bailed', bail)
  })
)

program.parse(Bare.argv.slice(2))
