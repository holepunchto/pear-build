const lex = require('bare-module-lexer')
const resolve = require('../resolve')

module.exports = function (entry, parentURL, opts) {
  if (entry.type & lex.constants.ADDON) {
    return resolve.addon(entry.specifier || '.', parentURL, opts)
  }

  return resolve.module(entry.specifier, parentURL, opts)
}
