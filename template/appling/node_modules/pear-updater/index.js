const path = require('path')
const fs = require('fs')
const c = require('compact-encoding')
const { waitForLock } = require('fs-native-extensions')
const RW = require('read-write-mutexify')
const ReadyResource = require('ready-resource')
const DriveBundler = require('drive-bundler')
const BareBundle = require('bare-bundle')
const Localdrive = require('localdrive')
const { Readable } = require('streamx')
const safetyCatch = require('safety-catch')
const hypercoreid = require('hypercore-id-encoding')
const speedometer = require('speedometer')
const b4a = require('b4a')
const { isWindows, platform, arch } = require('which-runtime')

const ABI = 0

const STATUS_WAITING = 'waiting'
const STATUS_ASSETS = 'updating-assets'
const STATUS_BUNDLE = 'updating-bundle'
const STATUS_UPDATED = 'updated'

class Watcher extends Readable {
  constructor(updater, opts) {
    super(opts)
    this.updater = updater
    this.updater._watchers.add(this)
  }

  _destroy(cb) {
    this.updater._watchers.delete(this)
    cb(null)
  }
}

module.exports = class PearUpdater extends ReadyResource {
  constructor(
    drive,
    {
      directory,
      abi = ABI,
      lock = null,
      swap = null,
      next = null,
      current = null,
      checkout = null,
      byArch = true,
      force = false,
      host = getDefaultHost(),
      onupdating = noop,
      onupdate = noop,
      onapply = noop
    } = {}
  ) {
    if (!directory) throw new Error('directory must be set')

    super()

    this.drive = drive
    this.checkout = checkout
    this.onupdate = onupdate
    this.onupdating = onupdating
    this.onapply = onapply

    this.directory = directory
    this.swap = swap
    this.lock = lock
    this.abi = abi

    this.swapNumber = 0
    this.swapCurrent = 0
    this.swapDirectory = null

    this.host = host

    this.next = next || path.join(directory, 'next')
    this.current = current || path.join(directory, 'current')

    this.snapshot = null
    this.updated = false
    this.updating = false
    this.frozen = false

    this._mutex = new RW()
    this._running = null
    this._lockFd = 0
    this._shouldUpdateSwap = false
    this._entrypoint = null
    this._byArch = byArch ? '/by-arch/' + host : null
    this._force = force
    this._watchers = new Set()
    this._bumpBound = this._bump.bind(this)

    this.drive.core.on('append', this._bumpBound)
    this.drive.core.on('truncate', this._bumpBound)

    this.status = STATUS_WAITING

    this.downloadedBlocks = 0
    this.downloadedBlocksEstimate = 0
    this.downloadedBytes = 0
    this.downloadSpeed = speedometer()

    this.uploadedBlocks = 0
    this.uploadedBytes = 0
    this.uploadSpeed = speedometer()

    this.ready().catch(safetyCatch)
  }

  get downloadProgress() {
    if (this.status === STATUS_UPDATED) return 1
    if (!this.downloadedBlocksEstimate) return 0
    return Math.min(0.9, this.downloadedBlocks / this.downloadedBlocksEstimate)
  }

  async wait({ length, fork }, opts) {
    for await (const checkout of this.watch(opts)) {
      if (fork < checkout.fork || (fork === checkout.fork && length <= checkout.length)) {
        return checkout
      }
    }

    return null
  }

  watch(opts) {
    return new Watcher(this, opts)
  }

  async update() {
    if (this.opened === false) await this.ready()
    if (this.closing) throw new Error('Updater closing')

    // if updating is set, but nothing is running we need to wait a tick
    // this can only happen if the onupgrading hook/event calls update recursively, so just for extra safety
    while (this.updating && !this._running) await Promise.resolve()

    if (this._running) await this._running
    if (this._running) return this._running // debounce

    if (
      this.drive.core.length === this.checkout.length &&
      this.drive.core.fork === this.checkout.fork &&
      !this._force
    ) {
      return this.checkout
    }

    if (this.frozen) return this.checkout

    try {
      this.updating = true
      this._running = this._update()
      await this._running
    } finally {
      this._running = null
      this.updating = false
    }

    return this.checkout
  }

  _bump() {
    this.update().catch(safetyCatch)
  }

  async _ensureValidCheckout(checkout) {
    const conf = await this._getUpdaterConfig()
    if (conf.abi <= this.abi) return

    let compat = null

    for (const next of conf.compat) {
      if (next.abi > this.abi) break
      compat = next
    }

    if (compat === null) {
      throw new Error('No valid update exist')
    }

    if (compat.length < this.checkout.length) {
      throw new Error('Refusing to go back in time')
    }

    this.frozen = true
    checkout.length = compat.length
    await this.snapshot.close()
    this.snapshot = this.drive.checkout(checkout.length)
  }

  async _update() {
    this.status = STATUS_WAITING

    const old = this.checkout
    const checkout = {
      key: this.drive.core.id,
      length: this.drive.core.length,
      fork: this.drive.core.fork
    }

    this.snapshot = this.drive.checkout(checkout.length)

    try {
      await this._ensureValidCheckout(checkout)

      await this.onupdating(checkout, old)
      this.emit('updating', checkout, old)

      await this._updateToSnapshot(checkout)
    } finally {
      await this.snapshot.close()
      this.snapshot = null
    }

    this.checkout = checkout
    this.updated = true

    await this.onupdate(checkout, old)
    this.emit('update', checkout, old)

    for (const w of this._watchers) w.push(checkout)
  }

  async _getUpdaterConfig() {
    const pkg = await readPackageJSON(this.snapshot)
    const updater = [].concat(pkg.updater || pkg.pear?.updater || [])
    const key = this.snapshot.core.key

    for (const u of updater) {
      const k = hypercoreid.decode(u.key)
      if (!b4a.equals(k, key)) continue
      return { key: k, abi: u.abi || this.abi, compat: (u.compat || []).sort(sortABI) }
    }

    return { key, abi: this.abi, compat: [] }
  }

  async _bundleEntrypointAndWarmup(main, subsystems) {
    if (main === null && (await this.snapshot.entry('/index.js'))) main = '/index.js'

    const b = new DriveBundler(this.snapshot, {
      host: this.host,
      entrypoint: main,
      cwd: this.swap,
      absoluteFiles: false,
      runtimes: ['bare']
    })

    const pending = [main ? b.bundle() : null]
    for (const sub of subsystems) pending.push(b.bundle(sub))

    const [mainBundle] = await Promise.all(pending)
    return mainBundle
  }

  async _monitorBackground() {
    try {
      const blobs = await this.drive.getBlobs()

      blobs.core.on('upload', (index, byteLength) => {
        this.uploadedBlocks++
        this.uploadedBytes += byteLength
        this.uploadSpeed(byteLength)
      })

      blobs.core.on('download', (index, byteLength) => {
        this.downloadedBlocks++
        this.downloadedBytes += byteLength
        this.downloadSpeed(byteLength)
      })
    } catch {
      // ignore
    }
  }

  async _updateToSnapshot(checkout) {
    const pkg = await readPackageJSON(this.snapshot)
    const main = pkg.main || null

    this.status = STATUS_ASSETS
    const updateSwap = await this._updateByArch()
    if (updateSwap) await this._updateSwap()

    const subsystems = pkg.subsystems || pkg.pear?.subsystems || []

    this.status = STATUS_BUNDLE
    const boot = await this._bundleEntrypointAndWarmup(main, subsystems)

    if (!boot) {
      // no main -> no boot.bundle -> return early
      await this._mutex.write.lock()
      this._entrypoint = null
      this._shouldUpdateSwap = updateSwap
      this._mutex.write.unlock()
      this.status = STATUS_UPDATED
      return
    }

    const bundle = new BareBundle()

    bundle.main = boot.entrypoint
    bundle.resolutions = boot.resolutions
    for (const [key, source] of Object.entries(boot.sources)) {
      bundle.write(key, source)
    }

    bundle.write(
      '/checkout.js',
      Buffer.from(
        `module.exports = { key: '${checkout.key}', length: ${checkout.length}, fork: ${checkout.fork} }\n`
      )
    )

    const entrypointNoExt = boot.entrypoint.replace(/\.[^.]+$/, '')
    const bundlePath = entrypointNoExt + (updateSwap ? '.bundle' : '.next.bundle')

    await this._mutex.write.lock()

    try {
      const local = new Localdrive(this.swap, { atomic: true })
      await local.put(bundlePath, bundle.toBuffer())
      await local.close()

      this._entrypoint = path.join(this.swap, entrypointNoExt)
      this._shouldUpdateSwap = updateSwap
    } finally {
      this._mutex.write.unlock()
    }

    this.status = STATUS_UPDATED
  }

  async _getLock() {
    if (this.lock === null) return 0

    const fd = await new Promise((resolve, reject) => {
      fs.open(this.lock, 'w+', function (err, fd) {
        if (err) return reject(err)
        resolve(fd)
      })
    })

    await waitForLock(fd)

    return fd
  }

  async _autocorrect() {
    const lock = await this._getLock()

    if ((await exists(this.next)) && (await exists(this.current))) {
      try {
        await fs.promises.unlink(this.next)
      } catch {
        // just ignore
      }
    }

    if (lock) await closeFd(lock)
  }

  async applyUpdate() {
    await this._mutex.write.lock()
    let lock = 0

    try {
      if (!this.updated) return null

      if (this.onapply) await this.onapply(this.swap)

      lock = await this._getLock()

      if (this._shouldUpdateSwap) {
        await fs.promises.symlink(path.resolve(this.swap), this.next, 'junction')
        if (isWindows && (await exists(this.current))) await fs.promises.unlink(this.current)
        await fs.promises.rename(this.next, this.current)
      } else if (this._entrypoint) {
        await fs.promises.rename(this._entrypoint + '.next.bundle', this._entrypoint + '.bundle')
      }

      // write checkout file
      const local = new Localdrive(this.swap, { atomic: true })
      await local.put(
        'checkout',
        c.encode(checkout, { ...this.checkout, key: this.drive.core.key })
      )
      await local.close()

      this.emit('update-applied', this.checkout)

      return this.checkout
    } finally {
      if (lock) await closeFd(lock)
      this._mutex.write.unlock()
    }
  }

  async _updateByArch() {
    if (this.snapshot.core.length < 1 || this._byArch === null) return false

    const blobs = await this.snapshot.getBlobs()
    const ranges = []
    const libs = []

    let needsFullUpdate = false

    for await (const { left, right } of this.snapshot.diff(this.checkout.length, this._byArch)) {
      const blob = left && left.value.blob

      if (blob) {
        ranges.push({ start: blob.blockOffset, length: blob.blockLength })

        // Just a sanity check so we dont use too much mem (2048 is arbitrary).
        // We just fall back to a full new local mirror if its a really big update
        if (ranges.length >= 2048) {
          needsFullUpdate = true
          break
        }

        // Allow lib updates to be inplace if they are simply a new file addition
        if (
          needsFullUpdate === false &&
          right === null &&
          left.key.startsWith(this._byArch + '/lib')
        ) {
          libs.push(left)
          continue
        }
      }

      needsFullUpdate = true
    }

    const dls = []
    for (const r of ranges) {
      const dl = blobs.core.download(r)
      await dl.ready()
      dls.push(dl)
    }

    this.downloadedBlocksEstimate = this.downloadedBlocks
    for (const r of dls) {
      if (!r.request.context) continue
      this.downloadedBlocksEstimate += r.request.context.end - r.request.context.start
    }

    for (const r of dls) await r.done()
    if (needsFullUpdate || libs.length === 0) return needsFullUpdate

    const local = new Localdrive(this.swap, { atomic: true })
    await this.snapshot.mirror(local, { entries: libs, prune: false }).done()
    await local.close()

    return false
  }

  async _updateSwap() {
    let swapNumber = (this.swapNumber + 1) & 3
    if (swapNumber === this.swapCurrent) swapNumber = (swapNumber + 1) & 3

    const swap = path.join(this.swapDirectory, swapNumber + '')

    const local = new Localdrive(swap)
    await this.snapshot.mirror(local, { prefix: this._byArch }).done()
    await local.close()

    this.swap = swap
    this.swapNumber = swapNumber
  }

  async _open() {
    await this.drive.ready()

    if (this.checkout === null) {
      this.checkout = {
        key: this.drive.core.id,
        length: this.drive.core.length,
        fork: this.drive.core.fork
      }
    }

    if (this.swap) {
      this.swap = await verifySwap(this.swap)
    } else {
      this.swap = path.join(this.directory, 'by-dkey', this.drive.discoveryKey.toString('hex'), '0')
    }

    this.swapNumber = Number(path.basename(this.swap))
    this.swapCurrent = this.swapNumber
    this.swapDirectory = path.dirname(this.swap)

    await this._autocorrect()

    // cleanup unused swaps...
    let target = null
    for (const name of await readdir(this.swapDirectory)) {
      if (!/^\d$/.test(name)) continue // only nuke numeric folders EVER
      const swap = path.join(this.swapDirectory, name)
      if (swap === this.swap) continue
      if (!target) target = await realpath(this.current)
      if (swap === target) continue
      if ((await realpath(swap)) === target) continue
      // TODO: run the nuke after an interval to avoid weird edge cases with someone somehow in the old one
      await nuke(swap) // unused, nuke it
    }

    this._monitorBackground()
    this._bump() // bg
  }

  async _close() {
    if (this.snapshot) await this.snapshot.close()

    this.drive.core.removeListener('append', this._bumpBound)
    this.drive.core.removeListener('truncate', this._bumpBound)

    for (const w of this._watchers) w.push(null)
    this._watchers.clear()
  }
}

async function verifySwap(swap) {
  const st = await fs.promises.lstat(swap)
  if (st.isSymbolicLink()) return verifySwap(await fs.promises.realpath(swap))
  if (st.isDirectory()) return swap
  throw new Error('Swap must be a directory')
}

async function nuke(path) {
  try {
    await fs.promises.rm(path, { recursive: true })
  } catch {}
}

async function realpath(path) {
  try {
    return await fs.promises.realpath(path)
  } catch (err) {
    if (err.code === 'ENOENT') return path
    throw err
  }
}

async function readdir(path) {
  try {
    return await fs.promises.readdir(path)
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

async function exists(path) {
  try {
    await fs.promises.lstat(path)
    return true
  } catch {
    return false
  }
}

async function readPackageJSON(drive, pkg) {
  return JSON.parse(((await drive.get('/package.json')) || '{}').toString())
}

function noop() {}

function getDefaultHost() {
  return require.addon ? require.addon.host : platform + '-' + arch
}

function sortABI(a, b) {
  if (a.abi === b.abi) return a.length - b.length
  return a.abi - b.abi
}

function closeFd(fd) {
  return new Promise((resolve) => {
    fs.close(fd, () => resolve())
  })
}

const checkout = {
  preencode(state, m) {
    c.fixed32.preencode(state, m.key)
    c.uint.preencode(state, m.length)
    c.uint.preencode(state, m.fork)
    c.string.preencode(state, platform)
    c.string.preencode(state, arch)
  },
  encode(state, m) {
    c.fixed32.encode(state, m.key)
    c.uint.encode(state, m.length)
    c.uint.encode(state, m.fork)
    c.string.encode(state, platform)
    c.string.encode(state, arch)
  },
  decode(state) {
    return {
      key: c.fixed32.decode(state),
      length: c.uint.decode(state),
      fork: c.uint.decode(state),
      platform: c.string.decode(state),
      arch: c.string.decode(state)
    }
  }
}
