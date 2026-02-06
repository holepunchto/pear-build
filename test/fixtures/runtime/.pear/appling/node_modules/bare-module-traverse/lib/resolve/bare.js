const lex = require('bare-module-lexer')
const resolve = require('../resolve')
const runtime = require('../runtime')

module.exports = function (entry, parentURL, opts = {}) {
  const { linked = false, host = runtime.host, hosts = [host] } = opts

  let extensions
  let conditions = hosts.map((host) => ['bare', 'node', ...host.split('-')])

  if (entry.type & lex.constants.ADDON) {
    extensions = linked ? [] : ['.bare', '.node']
    conditions = conditions.map((conditions) => ['addon', ...conditions])

    return resolve.addon(entry.specifier || '.', parentURL, {
      ...opts,
      extensions,
      conditions,
      hosts,
      linked
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
    ...opts,
    extensions,
    conditions
  })
}
