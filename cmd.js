import os from 'bare-os'
import fs from 'bare-fs'
import fsp from 'bare-fs/promises'
import path from 'bare-path'
import { ansi, outputter, explain } from 'pear-terminal'
import { command, bail } from 'paparam'
import init from 'pear-init'
import pipe from 'pear-pipe'
import plink from 'pear-link'
import opwait from 'pear-opwait'
import hypercoreid from 'hypercore-id-encoding'
import pearBuild from './index.js'
import { pear } from './package.json' with { type: 'json' }

const output = outputter('build', {
  build: ({ target }) => `\nBuilding target... ${ansi.dim(target)}`,
  complete: () => 'Completed!',
  error: ({ message }) => `Error: ${message}\n`
})

const program = command(
  'build',
  pear.platform.command,
  async function (cmd) {
    const cwd = os.cwd()
    const { json } = cmd.flags
    const link = cmd.args.link
    const { dir = cwd } = cmd.args

    const ipc = global.Pear?.[global.Pear?.constructor?.IPC]
    if (!ipc) throw new Error('IPC not available')

    const cmdArgs = cmd.argv

    try {
      const { drive } = plink.parse(link)
      const z32 = hypercoreid.encode(drive.key)

      const { manifest } = await opwait(ipc.info({ link, manifest: true }))
      const pkgPear = manifest?.pear

      const dotPear = path.join(dir, '.pear')
      if (fs.existsSync(dotPear) === false) {
        await opwait(ipc.dump({ link, dir, only: '.pear', force: true }))

        if (fs.existsSync(dotPear) === false) {
          await fsp.mkdir(dotPear, { recursive: true })

          const defaults = {
            id: `${pkgPear.build?.id || pkgPear.id || z32}`,
            name: `${pkgPear.build?.name || pkgPear.name || manifest.name}`,
            version: `${pkgPear.build?.version || pkgPear.version || manifest.version}`,
            author: `${pkgPear.build?.author || pkgPear.author || manifest.author}`,
            description: `${pkgPear.build?.description || pkgPear.description || manifest.description}`,
            identifier: `${pkgPear.build?.identifier || `pear.${z32}`}`,
            entitlements: `${pkgPear.build?.entitlements || pkgPear.entitlements || ''}`
          }

          const template = path.join(path.dirname(new URL(import.meta.url).pathname), 'template')

          await output(
            false,
            init(template, {
              dir: dotPear,
              cwd,
              force: true,
              defaults,
              autosubmit: true,
              ask: false,
              header: 'dot-pear',
              pkg: manifest,
              cmdArgs
            }),
            { paths: [] }
          )
        }
      }

      await output(json, pearBuild({ dotPear }))
    } finally {
      pipe()?.end()
    }
  },
  bail(explain)
)

program.parse(Pear.app.args)
