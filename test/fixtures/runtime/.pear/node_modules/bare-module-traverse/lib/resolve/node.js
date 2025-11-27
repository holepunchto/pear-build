const lex = require('bare-module-lexer')
const resolve = require('../resolve')
const runtime = require('../runtime')

module.exports = function (entry, parentURL, opts = {}) {
  // Handle backwards compatibility with the `target` option
  if (opts.target) {
    const { target, ...rest } = opts
    rest.hosts = target
    opts = rest
  }

  const {
    platform = runtime.platform,
    arch = runtime.arch,
    simulator = runtime.simulator,
    host = `${platform}-${arch}${simulator ? '-simulator' : ''}`,
    hosts = [host]
  } = opts

  let extensions
  let conditions

  if (entry.type & lex.constants.ADDON) {
    extensions = ['.node']
    conditions = hosts.map((host) => ['node', 'addon', ...host.split('-')])

    return resolve.addon(entry.specifier || '.', parentURL, {
      extensions,
      conditions,
      hosts,
      ...opts
    })
  }

  if (entry.type & lex.constants.ASSET) {
    conditions = ['node', 'asset']
  } else if (entry.type & lex.constants.REQUIRE) {
    extensions = ['.js', '.json', '.node']
    conditions = ['node', 'require']
  } else if (entry.type & lex.constants.IMPORT) {
    conditions = ['node', 'import']
  } else {
    conditions = ['node']
  }

  return resolve.module(entry.specifier, parentURL, {
    extensions,
    conditions,
    ...opts
  })
}
