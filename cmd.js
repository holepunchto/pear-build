const os = require('bare-os')
const fs = require('bare-fs')
const fsp = require('bare-fs/promises')
const path = require('bare-path')
const { ansi, outputter, explain } = require('pear-terminal')
const { command, bail } = require('paparam')
const init = require('pear-init')
const pipe = require('pear-pipe')
const plink = require('pear-link')
const info = require('pear-info')
const dump = require('pear-dump')
const opwait = require('pear-opwait')
const hypercoreid = require('hypercore-id-encoding')
const build = require('./index.js')
const { pear } = require('./package.json')

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
    const cmdArgs = cmd.argv

    try {
      const { drive } = plink.parse(link)
      const z32 = hypercoreid.encode(drive.key)
      const { manifest } = await opwait(info(link, { manifest: true }))
      const pkgPear = manifest?.pear
      const dotPear = path.join(dir, '.pear')

      if (fs.existsSync(dotPear) === false) {
        await opwait(dump({ link, dir, only: '.pear', force: true }))
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

          const template = path.join(__dirname, 'template')
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
      await output(json, build({ dotPear }))
    } finally {
      pipe()?.end()
    }
  },
  bail(explain)
)

program.parse(Pear.app.args)
