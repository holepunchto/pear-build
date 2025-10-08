'use strict'
const test = require('brittle')
const IPC = require('pear-ipc')
const b4a = require('b4a')
const sodium = require('sodium-native')
const { isWindows } = require('which-runtime')
const path = require('bare-path')
const os = require('bare-os')
const build = require('..')

function pipeId (s) {
  const buf = b4a.allocUnsafe(32)
  sodium.crypto_generichash(buf, b4a.from(s))
  return b4a.toString(buf, 'hex')
}

test('throws if not Pear', t => {
  t.exception(() => build({ link: 'pear://pear', dir: os.tmpdir() }))
})

test('build({ link, dir })', async t => {
  t.plan(0)
  const kIPC = Symbol('test.ipc')
  const socketPath = isWindows
    ? `\\\\.\\pipe\\test-${pipeId(__dirname)}`
    : path.join(os.tmpdir(), 'test.sock')
  const srv = new IPC.Server({ socketPath })
  t.teardown(() => srv.close())
  await srv.ready()
  const ipc = new IPC.Client({ socketPath })
  t.teardown(() => ipc.close())
  await ipc.ready()
  class API {
    static IPC = kIPC
    get [kIPC] () {
      return ipc
    }
  }
  global.Pear = new API()

  const link = 'pear://pear'
  const dir = os.tmpdir()
  const stream = build({ link, dir })
})
