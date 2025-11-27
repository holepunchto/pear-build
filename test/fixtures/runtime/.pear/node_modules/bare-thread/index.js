const Bundle = require('bare-bundle')
const traverse = require('bare-module-traverse')
const { startsWithWindowsDriveLetter } = require('bare-module-resolve')

const { imports, resolutions, protocol } = module

module.exports = exports = class Thread {
  constructor(entry, opts = {}) {
    let source

    if (Buffer.isBuffer(entry)) source = entry
    else source = Thread.prepare(entry, { shared: true })

    this._thread = new Bare.Thread('bare:/thread.bundle', { ...opts, source })
  }

  get joined() {
    return this._thread.joined
  }

  join() {
    this._thread.join()
  }

  suspend(linger) {
    this._thread.suspend(linger)
  }

  wakeup(deadline) {
    this._thread.wakeup(deadline)
  }

  resume() {
    this._thread.resume()
  }

  terminate() {
    this._thread.terminate()
  }

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: Thread },

      joined: this.joined
    }
  }
}

exports.isMainThread = Bare.Thread.isMainThread

exports.self = Bare.Thread.self

exports.prepare = function prepare(entry, opts) {
  if (startsWithWindowsDriveLetter(entry)) entry = '/' + entry

  entry = new URL(entry, module.url)

  const bundle = new Bundle()

  for (const dependency of traverse(
    entry,
    {
      imports,
      resolutions,
      resolve: traverse.resolve.bare
    },
    readModule
  )) {
    const { url, source, imports } = dependency

    bundle.write(url.href, source, {
      main: url.href === entry.href,
      imports
    })
  }

  return bundle.toBuffer(opts)
}

function readModule(url) {
  if (protocol.exists(url)) return protocol.read(url)

  return null
}
