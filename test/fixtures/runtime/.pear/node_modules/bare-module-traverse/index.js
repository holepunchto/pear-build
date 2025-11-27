const { lookupPackageScope, conditionMatches } = require('bare-module-resolve')
const lex = require('bare-module-lexer')
const resolve = require('./lib/resolve')
const errors = require('./lib/errors')

const constants = {
  SCRIPT: 1,
  MODULE: 2,
  JSON: 3,
  BUNDLE: 4,
  ADDON: 5,
  BINARY: 6,
  TEXT: 7,
  ASSET: 8
}

module.exports = exports = function traverse(entry, opts, readModule, listPrefix) {
  if (typeof opts === 'function') {
    listPrefix = readModule
    readModule = opts
    opts = {}
  }

  return {
    *[Symbol.iterator]() {
      const artifacts = { addons: [], assets: [] }

      const queue = [exports.module(entry, null, {}, artifacts, new Set(), opts)]

      while (queue.length > 0) {
        const generator = queue.pop()

        let next = generator.next()

        while (next.done !== true) {
          const value = next.value

          if (value.module) {
            next = generator.next(readModule(value.module))
          } else if (value.prefix) {
            const result = []

            if (typeof listPrefix === 'function') {
              for (const url of listPrefix(value.prefix)) {
                result.push(url)
              }
            } else {
              if (readModule(value.prefix) !== null) {
                result.push(value.prefix)
              }
            }

            next = generator.next(result)
          } else {
            if (value.children) queue.push(value.children)
            else yield value.dependency

            next = generator.next()
          }
        }
      }

      return artifacts
    },

    async *[Symbol.asyncIterator]() {
      const artifacts = { addons: [], assets: [] }

      const queue = [exports.module(entry, null, {}, artifacts, new Set(), opts)]

      while (queue.length > 0) {
        const generator = queue.pop()

        let next = generator.next()

        while (next.done !== true) {
          const value = next.value

          if (value.module) {
            next = generator.next(await readModule(value.module))
          } else if (value.prefix) {
            const result = []

            if (typeof listPrefix === 'function') {
              for await (const url of listPrefix(value.prefix)) {
                result.push(url)
              }
            } else {
              if ((await readModule(value.prefix)) !== null) {
                result.push(value.prefix)
              }
            }

            next = generator.next(result)
          } else {
            if (value.children) queue.push(value.children)
            else yield value.dependency

            next = generator.next()
          }
        }
      }

      return artifacts
    }
  }
}

exports.constants = constants
exports.resolve = resolve

exports.module = function* (url, source, attributes, artifacts, visited, opts = {}) {
  const { resolutions = null, defaultType = constants.SCRIPT } = opts

  if (visited.has(url.href)) return false

  if (source === null) {
    source = yield { module: url }

    if (source === null) {
      throw errors.MODULE_NOT_FOUND(`Cannot find module '${url.href}'`, url.href)
    }
  }

  visited.add(url.href)

  if (resolutions) {
    if (yield* exports.preresolved(url, source, resolutions, artifacts, visited, opts)) {
      return true
    }
  }

  attributes = attributes || {}

  const imports = {}

  let info = null

  for (const packageURL of lookupPackageScope(url, opts)) {
    const source = yield { module: packageURL }

    if (source !== null) {
      info = JSON.parse(source)

      imports['#package'] = packageURL.href

      yield {
        children: exports.package(packageURL, source, artifacts, visited, opts)
      }

      break
    }
  }

  if (typeof attributes.imports === 'string') {
    const url = new URL(attributes.imports)

    const source = yield { module: url }

    if (source !== null) {
      opts = {
        ...opts,
        imports: mixinImports(opts.imports, JSON.parse(source), url)
      }
    }
  }

  let type = 0

  if (typeof attributes.type === 'string') {
    switch (attributes.type) {
      case 'script':
        type = constants.SCRIPT
        break
      case 'module':
        type = constants.MODULE
        break
      case 'json':
        type = constants.JSON
        break
      case 'bundle':
        type = constants.BUNDLE
        break
      case 'addon':
        type = constants.ADDON
        break
      case 'binary':
        type = constants.BINARY
        break
      case 'text':
        type = constants.TEXT
        break
    }
  } else {
    const match = url.pathname.match(/\.[a-z]+$/)

    if (match !== null) {
      const [extension] = match

      switch (extension) {
        case '.js':
          const isESM =
            defaultType === constants.MODULE || (info !== null && info.type === 'module')

          type = isESM ? constants.MODULE : constants.SCRIPT
          break
        case '.cjs':
          type = constants.SCRIPT
          break
        case '.mjs':
          type = constants.MODULE
          break
        case '.json':
          type = constants.JSON
          break
        case '.bundle':
          type = constants.BUNDLE
          break
        case '.bare':
        case '.node':
          type = constants.ADDON
          break
        case '.bin':
          type = constants.BINARY
          break
        case '.txt':
          type = constants.TEXT
          break
      }
    }
  }

  const lexer = { imports: [] }

  if (type === constants.SCRIPT || type === constants.MODULE) {
    yield* exports.imports(url, source, imports, artifacts, lexer, visited, opts)
  } else if (type === constants.ADDON) {
    yield* exports.addons(url, artifacts, visited, opts)
  }

  yield {
    dependency: { url, source, imports: compressImportsMap(imports), lexer }
  }

  return true
}

exports.package = function* (url, source, artifacts, visited, opts = {}) {
  if (visited.has(url.href)) return false

  visited.add(url.href)

  const info = JSON.parse(source)

  if (info) {
    yield { dependency: { url, source, imports: {}, lexer: { imports: [] } } }

    if (info.assets) {
      yield {
        children: exports.assets(info.assets, url, artifacts, visited, opts)
      }
    }

    return true
  }

  return false
}

exports.preresolved = function* (url, source, resolutions, artifacts, visited, opts = {}) {
  const {
    builtinProtocol = 'builtin:',
    linkedProtocol = 'linked:',
    deferredProtocol = 'deferred:'
  } = opts

  const imports = resolutions[url.href]

  if (typeof imports !== 'object' || imports === null) return false

  for (const [specifier, entry] of Object.entries(imports)) {
    const stack = [entry]

    while (stack.length > 0) {
      const entry = stack.pop()

      if (typeof entry === 'string') {
        const url = new URL(entry)

        if (specifier === '#package') {
          yield {
            children: exports.package(url, null, artifacts, visited, opts)
          }
        } else if (
          url.protocol !== builtinProtocol &&
          url.protocol !== linkedProtocol &&
          url.protocol !== deferredProtocol
        ) {
          yield {
            children: exports.module(url, null, {}, artifacts, visited, opts)
          }
        }
      } else {
        stack.unshift(...Object.values(entry))
      }
    }
  }

  yield {
    dependency: {
      url,
      source,
      imports: compressImportsMap(imports),
      lexer: { imports: [] }
    }
  }

  return true
}

exports.imports = function* (parentURL, source, imports, artifacts, lexer, visited, opts = {}) {
  // Handle backwards compatibility with the `target` option
  if (opts.target) opts = { ...opts, hosts: opts.target }

  const {
    resolve = exports.resolve.default,
    builtinProtocol = 'builtin:',
    linkedProtocol = 'linked:',
    deferredProtocol = 'deferred:',
    matchedConditions = []
  } = opts

  let yielded = false

  const queue = []

  for (const entry of lex(source).imports) {
    let specifier = entry.specifier
    let condition = 'default'

    if (entry.type & lex.constants.ADDON) {
      specifier = specifier || '.'
      condition = 'addon'
    } else if (entry.type & lex.constants.ASSET) {
      condition = 'asset'
    }

    if (entry.attributes.imports) {
      const specifier = entry.attributes.imports

      queue.push({
        entry: {
          type: 0,
          specifier,
          names: [],
          attributes: {},
          position: [0, 0, 0]
        },
        specifier,
        condition: 'default'
      })
    }

    lexer.imports.push(entry)

    queue.push({ entry, specifier, condition })
  }

  while (queue.length > 0) {
    const { entry, specifier, condition } = queue.shift()

    matchedConditions.push(condition)

    const resolver = resolve(entry, parentURL, { ...opts, matchedConditions })
    const candidates = []

    let next = resolver.next()
    let resolutions = 0

    while (next.done !== true) {
      const value = next.value

      if (value.package) {
        next = resolver.next(JSON.parse(yield { module: value.package }))
      } else {
        const url = value.resolution

        candidates.push(url)

        let resolved = false

        if (
          url.protocol === builtinProtocol ||
          url.protocol === linkedProtocol ||
          url.protocol === deferredProtocol
        ) {
          addResolution(imports, specifier, matchedConditions, url)

          resolved = yielded = true
        } else if (condition === 'asset') {
          const prefix = url

          for (const url of yield { prefix }) {
            yield {
              children: exports.module(url, null, {}, artifacts, visited, opts)
            }

            addURL(artifacts.assets, url)

            resolved = yielded = true
          }

          if (resolved) addResolution(imports, specifier, matchedConditions, url)
        } else {
          const source = yield { module: url }

          if (source !== null) {
            addResolution(imports, specifier, matchedConditions, url)

            const attributes = entry.attributes

            if (attributes.imports) {
              attributes.imports = imports[attributes.imports].default
            }

            yield {
              children: exports.module(url, source, attributes, artifacts, visited, opts)
            }

            resolved = yielded = true
          }
        }

        if (resolved) {
          if (condition === 'addon') addURL(artifacts.addons, url)

          resolutions++
        }

        next = resolver.next(resolved)
      }
    }

    matchedConditions.pop()

    if (resolutions === 0) {
      let message = `Cannot find ${condition === 'default' ? 'module' : condition} '${specifier}' imported from '${parentURL.href}'`

      if (candidates.length > 0) {
        message += '\nCandidates:'
        message += '\n' + candidates.map((url) => '- ' + url.href).join('\n')
      }

      switch (condition) {
        case 'addon':
          throw errors.ADDON_NOT_FOUND(message, specifier, parentURL, candidates)
        case 'asset':
          throw errors.ASSET_NOT_FOUND(message, specifier, parentURL, candidates)
        default:
          throw errors.MODULE_NOT_FOUND(message, specifier, parentURL, candidates)
      }
    }
  }

  return yielded
}

const ADDON_EXTENSION = /\.(bare|node)$/

exports.addons = function* (parentURL, artifacts, visited, opts = {}) {
  let yielded = false

  if (ADDON_EXTENSION.test(parentURL.pathname)) {
    const prefix = new URL(parentURL)

    prefix.pathname = prefix.pathname.replace(ADDON_EXTENSION, '') + '/'

    for (const url of yield { prefix }) {
      yield {
        children: exports.module(url, null, {}, artifacts, visited, opts)
      }

      addURL(artifacts.addons, url)

      yielded = true
    }
  }

  return yielded
}

exports.assets = function* (patterns, parentURL, artifacts, visited, opts = {}) {
  const matches = yield* exports.patternMatches(patterns, parentURL, [], opts)

  let yielded = false

  for (const url of matches) {
    const source = yield { module: url }

    if (source !== null) {
      addURL(artifacts.assets, url)

      yield {
        children: exports.module(url, source, {}, artifacts, visited, opts)
      }

      yielded = true
    }
  }

  return yielded
}

exports.patternMatches = function* patternMatches(pattern, parentURL, matches, opts = {}) {
  const { conditions = [], matchedConditions = [] } = opts

  if (typeof pattern === 'string') {
    let patternNegate = false
    let patternBase
    let patternTrailer

    if (pattern[0] === '!') {
      pattern = pattern.substring(1)
      patternNegate = true
    }

    const patternIndex = pattern.indexOf('*')

    if (patternIndex === -1) {
      patternBase = pattern
      patternTrailer = ''
    } else {
      patternBase = pattern.substring(0, patternIndex)
      patternTrailer = pattern.substring(patternIndex + 1)
    }

    const prefix = new URL(patternBase, parentURL)

    for (const url of yield { prefix }) {
      if (patternIndex === -1) {
        if (patternNegate) removeURL(matches, url)
        else addURL(matches, url)
      } else if (patternTrailer === '' || url.href.endsWith(patternTrailer)) {
        addURL(matches, url)
      } else if (patternNegate) {
        removeURL(matches, url)
      }
    }
  } else if (Array.isArray(pattern)) {
    for (const patternValue of pattern) {
      yield* patternMatches(patternValue, parentURL, matches, opts)
    }
  } else if (typeof pattern === 'object' && pattern !== null) {
    let yielded = false

    for (const [condition, patternValue, subset] of conditionMatches(pattern, conditions, opts)) {
      matchedConditions.push(condition)

      if (
        yield* patternMatches(patternValue, parentURL, matches, {
          ...opts,
          conditions: subset
        })
      ) {
        yielded = true
      }

      matchedConditions.pop()
    }

    if (yielded) return true
  }

  return matches
}

function addURL(array, url) {
  let lo = 0
  let hi = array.length - 1

  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1)
    const found = array[mid]

    if (found.href === url.href) return

    if (found.href < url.href) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  array.splice(lo, 0, url)
}

function removeURL(array, url) {
  let lo = 0
  let hi = array.length - 1

  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1)
    const found = array[mid]

    if (found.href === url.href) break

    if (found.href < url.href) {
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  if (array[lo].href === url.href) array.splice(lo, 1)
}

function addResolution(imports, specifier, conditions, url) {
  imports[specifier] = imports[specifier] || {}

  let current = imports[specifier]

  for (let i = 0, n = conditions.length - 1; i < n; i++) {
    const key = conditions[i]

    if (key in current === false) {
      current[key] = {}
    } else if (typeof current[key] !== 'object') {
      current[key] = { default: current[key] }
    }

    current = current[key]
  }

  const last = conditions[conditions.length - 1]

  current[last] = url.href

  if ('default' in current) {
    const value = current.default

    delete current.default

    current.default = value
  }
}

function compressImportsMap(imports) {
  const entries = []

  for (const entry of Object.entries(imports)) {
    entry[1] = compressImportsMapEntry(entry[1])

    entries.push(entry)
  }

  return Object.fromEntries(entries)
}

function compressImportsMapEntry(resolved) {
  if (typeof resolved === 'string') return resolved

  let entries = []
  let primary = null

  for (const entry of Object.entries(resolved)) {
    entry[1] = compressImportsMapEntry(entry[1])

    entries.push(entry)

    if (entry[0] === 'default') primary = entry[1]
  }

  entries = entries.filter(
    ([condition, resolved]) => condition === 'default' || resolved !== primary
  )

  if (entries.length === 1) return entries[0][1]

  return Object.fromEntries(entries)
}

function mixinImports(target, imports, url) {
  if (typeof imports === 'object' && imports !== null && 'imports' in imports) {
    imports = imports.imports
  }

  if (typeof imports !== 'object' || imports === null) {
    throw errors.INVALID_IMPORTS_MAP(`Imports map at '${url.href}' is not valid`)
  }

  return { ...target, ...imports }
}
