#!/usr/bin/env node
const { command, flag, summary, argv } = require('paparam')
const pkg = require('./package')
const build = require('.')

const cmd = command(
  pkg.name,
  summary(pkg.description),
  flag('--version|-v', 'Print the current version'),
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
    if (cmd.flags.version) return console.log(`v${pkg.version}`)
    const dir = cmd.flags.package
    const opts = {
      target: cmd.flags.target,
      darwinArm64App: cmd.flags.darwinArm64App,
      darwinX64App: cmd.flags.darwinX64App,
      linuxArm64App: cmd.flags.linuxArm64App,
      linuxX64App: cmd.flags.linuxX64App,
      win32X64App: cmd.flags.win32X64App,
      iosArm64: cmd.flags.iosArm64,
      iosArm64Simulator: cmd.flags.iosArm64Simulator,
      iosX64Simulator: cmd.flags.iosX64Simulator,
      androidArm64: cmd.flags.androidArm64
    }
    try {
      await build(dir, opts)
    } catch (err) {
      if (err) console.error(err)
      if (typeof process !== 'undefined') process.exitCode = 1
    }
  }
)

cmd.parse(argv().length === 0 ? ['--help'] : argv())
