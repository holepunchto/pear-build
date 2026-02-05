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

const buildOutput = outputter('build', {
  build: ({ target }) => `\nBuilding target... ${ansi.dim(target)}`,
  complete: () => 'Completed!',
  error: ({ message }) => `Error: ${message}\n`
})

const initOutput = outputter('init', {
  writing: () => '',
  wrote: ({ path }, info) => {
    info.paths.push(path)
  },
  written: (_, info) => {
    let written = ''
    for (const path of info.paths) written += '* ' + path + '\n'
    return written
  }
})

const program = command(
  'build',
  pear.platform.command,
  async function (cmd) {
    const cwd = os.cwd()
    const { json } = cmd.flags
    const link = cmd.args.link
    const { dir = os.cwd() } = cmd.args

    try {
      const { drive } = plink.parse(link)
      const z32 = hypercoreid.encode(drive.key)
      const { manifest } = await opwait(info(link, { manifest: true }))
      const pkgPear = manifest?.pear
      const dotPear = path.resolve(dir, '.pear')

      // .pear must exist before building
      if (fs.existsSync(path.join(dotPear, 'appling')) === false) {
        // try to sync staged .pear
        await opwait(dump(link, { dir, only: '.pear', force: true }))
        // if not staged then generate .pear from template
        if (fs.existsSync(path.join(dotPear, 'appling')) === false) {
          await fsp.mkdir(dotPear, { recursive: true })
          const defaults = {
            id: `${drive?.alias || pkgPear.build?.id || pkgPear.id || z32}`,
            name: `${pkgPear.build?.name || pkgPear.name || manifest.name}`,
            version: `${pkgPear.build?.version || pkgPear.version || manifest.version}`,
            author: `${pkgPear.build?.author || pkgPear.author || manifest.author}`,
            description: `${pkgPear.build?.description || pkgPear.description || manifest.description}`,
            identifier: `${pkgPear.build?.identifier || `pear.${z32}`}`,
            entitlements: `${pkgPear.build?.entitlements || pkgPear.entitlements || ''}`
          }
          await initOutput(
            false,
            init('./template', {
              dir: dotPear,
              cwd,
              force: true,
              defaults,
              autosubmit: true,
              ask: false,
              header: 'dot-pear',
              pkg: manifest
            }),
            { paths: [] }
          )
        }
      }
      await buildOutput(json, build({ dotPear }))
    } finally {
      pipe()?.end()
    }
  },
  bail(explain)
)

program.parse(Pear.app.args)
