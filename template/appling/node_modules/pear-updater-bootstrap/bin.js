#!/usr/bin/env node
const { command, flag, arg, summary } = require('paparam')
const pkg = require('./package')
const bootstrap = require('.')

const cmd = command(
  pkg.name,
  summary(pkg.description),
  arg('<key>'),
  arg('<dir>'),
  flag('--host <host>'),
  async (cmd) => {
    const { key, dir } = cmd.args
    const { host } = cmd.flags

    await bootstrap(key, dir, { host })
  }
)

cmd.parse()
