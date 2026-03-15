#!/usr/bin/env node
const { command, argv } = require('paparam')
const pkg = require('./package')
const build = require('.')

const cmd = command(pkg.name, pkg.command, async function (cmd) {
  if (cmd.flags.version) return console.log(`v${pkg.version}`)
  try {
    await build(cmd.flags, ({ data }) => console.log(data.from, data.message, data.to))
  } catch (err) {
    if (err) console.error(err)
    if (typeof Bare !== 'undefined') Bare.exitCode = 1
    else if (typeof process !== 'undefined') process.exitCode = 1
  }
})

cmd.parse(argv().length === 0 ? ['--help'] : argv())
