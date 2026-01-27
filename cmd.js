'use strict'
const os = require('bare-os')
const fs = require('bare-fs')
const path = require('bare-path')
const pearBuild = require('./index.js')
const plink = require('pear-link')
const opwait = require('pear-opwait')
const hypercoreid = require('hypercore-id-encoding')
const init = require('pear-init')
const { outputter, ansi } = require('pear-terminal')

const output = outputter('build', {
  build: ({ target }) => `\nBuilding target... ${ansi.dim(target)}`,
  complete: () => 'Completed!',
  error: ({ message }) => `Error: ${message}\n`
})

module.exports = (ipc) => {
  const kIPC = global.Pear?.constructor?.IPC || Symbol('ipc')
  if (global.Pear) {
    if (!global.Pear.constructor?.IPC) global.Pear.constructor.IPC = kIPC
    global.Pear[kIPC] = ipc
  } else {
    class API {
      static IPC = kIPC
      get [kIPC]() {
        return ipc
      }
    }
    global.Pear = new API()
  }
  return async function build(cmd) {
    const { json } = cmd.flags
    const link = cmd.args.link
    const { drive } = plink.parse(link)
    const z32 = hypercoreid.encode(drive.key)
    const { manifest } = await opwait(ipc.info({ link, manifest: true }))
    const pkgPear = manifest?.pear
    const { dir = os.cwd() } = cmd.args
    const dotPear = path.join(dir, '.pear')
    if (fs.existsSync(dotPear) === false) {
      await opwait(ipc.dump({ link, dir, only: '.pear', force: true }))
      if (fs.existsSync(dotPear) === false) {
        await fs.promises.mkdir(dotPear, { recursive: true })
        const defaults = {
          id: z32,
          name: `${pkgPear.build?.name || pkgPear.name || manifest.name}`,
          version: `${pkgPear.build?.version || pkgPear.version || manifest.version}`,
          author: `${pkgPear.build?.author || pkgPear.author || manifest.author}`,
          description: `${pkgPear.build?.description || pkgPear.description || manifest.description}`,
          identifier: `${pkgPear.build?.identifier || `pear.${z32}`}`
        }
        const template = path.join(__dirname, 'template')
        await opwait(
          init(template, {
            dir: dotPear,
            cwd: os.cwd(),
            force: true,
            defaults,
            autosubmit: true,
            ask: false,
            header: 'dot-pear',
            pkg: manifest
          })
        )
      }
    }
    await output(json, pearBuild({ dotPear }))
  }
}
