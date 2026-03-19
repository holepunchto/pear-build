#!/usr/bin/env node
const { command, argv } = require('paparam')
const pkg = require('./package')
const build = require('.')

const cmd = command(pkg.name, pkg.command, async function (cmd) {
  if (cmd.flags.version) return console.log(`v${pkg.version}`)
  try {
    const runner = build(cmd.flags)
    runner.on('mirrored', (data) => console.log(data.from, data.message, data.to))
    runner.on('error', (err) => console.error(err))
    await runner.done()
  } catch (err) {
    if (typeof Bare !== 'undefined') Bare.exitCode = 1
    else if (typeof process !== 'undefined') process.exitCode = 1
  }
})

cmd.parse(argv().length === 0 ? ['--help'] : argv())
