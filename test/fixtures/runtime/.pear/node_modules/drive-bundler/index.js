const fs = require('fs')
const path = require('path')
const b4a = require('b4a')
const Deps = require('dependency-stream')
const mutex = require('mutexify/promise')
const sodium = require('sodium-native')
const unixResolve = require('unix-path-resolve')
const { pipelinePromise } = require('streamx')
const { pathToFileURL } = require('url-file-url')

module.exports = class DriveBundle {
  constructor (drive, {
    cwd = path.resolve('.'),
    mount = '',
    cache = null,
    host = require.addon ? require.addon.host : process.platform + '-' + process.arch,
    prebuilds = true,
    assets = true,
    absoluteFiles = !!mount,
    inlineAssets = false,
    packages = true,
    entrypoint = '.'
  } = {}) {
    this.drive = drive
    this.packages = packages
    this.cwd = cwd
    this.prebuilds = prebuilds ? path.resolve(cwd, typeof prebuilds === 'string' ? prebuilds : 'prebuilds') : null
    this.assets = assets ? path.resolve(cwd, typeof assets === 'string' ? assets : 'assets') : null
    this.cache = cache
    this.mount = typeof mount === 'string' ? mount : mount.href.replace(/[/]$/, '')
    this.absoluteFiles = absoluteFiles
    this.inlineAssets = inlineAssets
    this.host = host
    this.entrypoint = entrypoint
    this.lock = mutex()
  }

  static async stringify (drive, opts) {
    const d = new this(drive, opts)
    return await d.stringify()
  }

  async stringify (entrypoint = this.entrypoint) {
    const b = await this.bundle(entrypoint)
    const addons = {}
    let wrap = ''

    for (const [key, source] of Object.entries(b.sources)) {
      if (wrap) wrap += ',\n'
      wrap += JSON.stringify(key) + ': { resolutions: ' + JSON.stringify(b.resolutions[key] || {}) + ', '
      wrap += 'source (module, exports, __filename, __dirname, require) {'
      wrap += (key.endsWith('.json') ? 'module.exports = ' : '') + source
      wrap += '\n}}'
    }

    for (const [key, map] of Object.entries(b.resolutions)) {
      if (map['bare:addon']) addons[key] = map['bare:addon']
    }

    return `{
      const __bundle__ = {
        builtinRequire: typeof require === 'function' ? require : null,
        cache: Object.create(null),
        addons: ${JSON.stringify(addons)},
        bundle: {${wrap}},
        require (filename) {
          let mod = __bundle__.cache[filename]
          if (mod) return mod

          const b = __bundle__.bundle[filename]
          if (!b) throw new Error('Module not found')

          mod = __bundle__.cache[filename] = {
            filename,
            dirname: filename.slice(0, filename.lastIndexOf('/')),
            exports: {},
            require
          }

          require.resolve = function (req) {
            const res = b.resolutions[req]
            if (!res) throw new Error('Could not find module "' + req + '" from "' + mod.filename + '"')
            return res
          }

          require.addon = function (dir = '.') {
            if (!__bundle__.builtinRequire || !__bundle__.builtinRequire.addon) throw new Error('Addons not supported')

            let d = dir.startsWith('/') ? dir : mod.dirname + '/' + dir
            let p = 1
            let addon = ''

            while (p < d.length) {
              let n = d.indexOf('/', p)
              if (n === -1) n = d.length

              const part = d.slice(p, n)

              p = n + 1

              if (part === '.' || part === '') continue
              if (part === '..') {
                addon = addon.slice(0, addon.lastIndexOf('/'))
                continue
              }

              addon += '/' + part
            }

            if (!addon.endsWith('/')) addon += '/'

            const mapped = __bundle__.addons[addon]
            return mapped ? __bundle__.builtinRequire(mapped) : __bundle__.builtinRequire.addon(addon)
          }

          require.asset = function () {
            const res = b.resolutions[req]
            if (!res || !res.asset) throw new Error('Could not find asset "' + req + '" from "' + mod.filename + '"')
            return res.asset
          }

          b.source(mod, mod.exports, mod.filename, mod.dirname, require)
          return mod

          function require (req) {
            return __bundle__.require(require.resolve(req)).exports
          }
        }
      }

      __bundle__.require(${JSON.stringify(b.entrypoint)})
    }`.replace(/\n[ ]{4}/g, '\n').trim() + '\n'
  }

  static async bundle (drive, opts) {
    const d = new this(drive, opts)
    return await d.bundle()
  }

  static id (bundle) {
    const buffers = []

    buffers.push(b4a.from('sources\n'))
    for (const [key, data] of Object.entries(bundle.sources)) {
      buffers.push(b4a.from(key + '\n'))
      buffers.push(b4a.from(data))
    }

    buffers.push(b4a.from('assets\n'))
    for (const [key, data] of Object.entries(bundle.assets)) {
      buffers.push(b4a.from(key + '\n'))
      buffers.push(data.value)
    }

    const out = b4a.allocUnsafe(32)
    sodium.crypto_generichash_batch(out, buffers)
    return out
  }

  async bundle (entrypoint = this.entrypoint) {
    let main = null

    const resolutions = {}
    const imports = {}
    const sources = {}
    const assets = {}
    const stream = new Deps(this.drive, { host: this.host, packages: this.packages, source: true, entrypoint })

    const addonsPending = []
    const assetsPending = []

    for await (const data of stream) {
      const u = this._resolutionKey(data.key, false)
      if (!main) main = u

      if (this.cache && Object.hasOwn(this.cache, u)) continue

      const r = {}
      let save = false

      sources[u] = data.source

      for (const { input, output } of data.resolutions) {
        if (!input || !output) continue
        r[input] = this._resolutionKey(output, false)
        save = true
      }

      if (save) resolutions[u] = r

      if (this.prebuilds) {
        for (const { input, output } of data.addons) {
          if (!input || !output) continue
          addonsPending.push(this._mapPrebuild(data.key, input, output))
        }
      }

      if (this.assets) {
        for (const { input } of data.assets) {
          assetsPending.push(this._mapAsset(data.key, input))
        }
      }
    }

    for (const addon of await Promise.all(addonsPending)) {
      if (!addon) continue

      const dir = this._resolutionKey(unixResolve(unixResolve(addon.referrer, '..'), addon.input), true)
      let r = resolutions[dir] = resolutions[dir] || {}
      r['bare:addon'] = addon.output

      const referrer = this._resolutionKey(addon.referrer, false)
      r = resolutions[referrer] = resolutions[referrer] || {}

      const def = r[addon.input]
      r[addon.input] = { addon: addon.output }
      if (def) r[addon.input].default = def
    }

    for (const asset of await Promise.all(assetsPending)) {
      if (!asset) continue

      const referrer = this._resolutionKey(asset.referrer, false)
      const r = resolutions[referrer] = resolutions[referrer] || {}

      const def = r[asset.input]
      r[asset.input] = { asset: asset.output.key }
      if (def) r[asset.input].default = def

      assets[asset.output.key] = { executable: asset.output.executable, value: asset.output.value }
    }

    return {
      entrypoint: main,
      resolutions,
      imports,
      sources,
      assets
    }
  }

  _resolutionKey (key, dir) {
    const trail = dir && !key.endsWith('/') ? '/' : ''
    return this.mount ? this.mount + encodeURI(key) + trail : key + trail
  }

  async _extractAssetToDisk (entry) {
    const out = path.join(this.assets, entry.key)

    await fs.promises.mkdir(path.dirname(out), { recursive: true })
    const mode = entry.value.executable ? 0o744 : 0o644

    const driveStream = this.drive.createReadStream(entry)
    const fsStream = fs.createWriteStream(out, { mode })

    await pipelinePromise(driveStream, fsStream)

    const key = this.absoluteFiles ? pathToFileURL(out).href : this._toRelative(out)
    return { key, executable: entry.value.executable, value: null }
  }

  async _extractAndInlineAsset (entry) {
    const value = await this.drive.get(entry)

    return {
      key: entry.key,
      executable: entry.value.executable,
      value
    }
  }

  async extractAsset (key) {
    try {
      const entry = await this.drive.entry(key)

      if (entry === null) return null
      if (this.inlineAssets) return await this._extractAndInlineAsset(entry)
      if (hasToPath(this.drive)) return { key: pathToFileURL(this.drive.toPath(key)).href, executable: false, value: null }

      return await this._extractAssetToDisk(entry)
    } catch {
      return null
    }
  }

  async extractPrebuild (key) {
    const m = key.match(/\/([^/@]+)(@[^/]+)?(\.node|\.bare)$/)
    if (!m) return null

    const buf = await this.drive.get(key)
    if (!buf) return null

    const name = hash(buf) + m[3]
    const dir = path.join(this.prebuilds, this.host)
    const out = path.join(dir, name)

    await writeAtomic(dir, out, buf, this.lock)

    return this.absoluteFiles ? pathToFileURL(out).href : this._toRelative(out)
  }

  async _mapAsset (referrer, input) {
    const dir = unixResolve(referrer, '..')
    const key = unixResolve(dir, input)
    const output = await this.extractAsset(key)
    return { referrer, input, output }
  }

  async _mapPrebuild (referrer, input, output) {
    const prebuild = await this.extractPrebuild(output)
    return { referrer, input, output: prebuild }
  }

  _toRelative (out) {
    return '/..' + unixResolve('/', path.relative(this.cwd, out))
  }
}

function hash (buf) {
  const out = b4a.allocUnsafe(32)
  sodium.crypto_generichash(out, buf)
  return b4a.toString(out, 'hex')
}

async function writeAtomic (dir, out, buf, lock) {
  try {
    await fs.promises.stat(out)
    return
  } catch {}

  const release = await lock()

  try {
    await writeToTmpAndSwap(dir, out, buf)
  } finally {
    release()
  }
}

async function writeToTmpAndSwap (dir, out, buf) {
  const tmp = out + '.tmp'

  await fs.promises.mkdir(dir, { recursive: true })
  await fs.promises.writeFile(tmp, buf)

  try {
    await fs.promises.rename(tmp, out)
  } catch {
    await fs.promises.stat(out)
    try {
      await fs.promises.unlink(tmp)
    } catch {}
  }
}

function hasToPath (drive) {
  return typeof drive.toPath === 'function'
}
