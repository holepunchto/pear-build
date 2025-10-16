'use strict'
const path = require('bare-path')
const make = require('bare-make')
const { arch, platform } = require('which-runtime')
const { spawnSync } = require('bare-subprocess')
const { Readable } = require('streamx')

module.exports = async function build ({ dir }) {
    const output = new Readable({ objectMode: true })
    const distributables = path.join(dir, 'distributables', platform + '-' + arch)
    output.push({ tag: 'init', data: { distributables } })

    output.push({ tag: 'npm' })
    const result = spawnSync('npm', ['i', 'cmake-pear', '--no-save', '--no-package-lock', '--force'], { cwd: distributables, stdio: 'inherit' })
    if (result.status !== 0) throw new Error('npm install failed')

    output.push({ tag: 'generate' })
    await make.generate({ cwd: distributables })

    output.push({ tag: 'build' })
    await make.build({ cwd: distributables })

    output.push({ tag: 'complete', data: { dir: distributables } })
}
