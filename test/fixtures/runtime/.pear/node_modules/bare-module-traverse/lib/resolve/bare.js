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
    linked = false,
    platform = runtime.platform,
    arch = runtime.arch,
    simulator = runtime.simulator,
    host = `${platform}-${arch}${simulator ? '-simulator' : ''}`,
    hosts = [host]
  } = opts

  let extensions
  let conditions = hosts.map((host) => ['bare', 'node', ...host.split('-')])

  if (entry.type & lex.constants.ADDON) {
    extensions = linked ? [] : ['.bare', '.node']
    conditions = conditions.map((conditions) => ['addon', ...conditions])

    return resolve.addon(entry.specifier || '.', parentURL, {
      extensions,
      conditions,
      hosts,
      linked,
      ...opts
    })
  }

  if (entry.type & lex.constants.ASSET) {
    conditions = conditions.map((conditions) => ['asset', ...conditions])
  } else {
    extensions = ['.js', '.cjs', '.mjs', '.json', '.bare', '.node']

    if (entry.type & lex.constants.REQUIRE) {
      conditions = conditions.map((conditions) => ['require', ...conditions])
    } else if (entry.type & lex.constants.IMPORT) {
      conditions = conditions.map((conditions) => ['import', ...conditions])
    }
  }

  return resolve.module(entry.specifier, parentURL, {
    extensions,
    conditions,
    ...opts
  })
}
