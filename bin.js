#!/usr/bin/env node
const { command, flag, summary } = require('paparam')
const pkg = require('./package')
const build = require('.')

const cmd = command(
  pkg.name,
  summary(pkg.description),
  flag('--version|-v', 'Print the current version'),
  flag('--package [path]', 'Path to project package.json'),
  flag('--darwin-arm64-app [path]', 'Path to Mac ARM64 app'),
  flag('--darwin-x64-app [path]', 'Path to Mac x64 app'),
  flag('--linux-arm64-app [path]', 'Path to Linux ARM64 app'),
  flag('--linux-x64-app [path]', 'Path to Linux x64 app'),
  flag('--win32-x64-app [path]', 'Path to Windows x64 app'),
  flag('--target [path]', 'Target build dir'),
  async function (cmd) {
    if (cmd.flags.version) return console.log(`v${pkg.version}`)
    try {
      await build(cmd)
    } catch (err) {
      if (err) console.error(err)
      if (typeof process !== 'undefined') process.exitCode = 1
    }
  }
)

cmd.parse()
