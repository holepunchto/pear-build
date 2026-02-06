'use strict'
const bareBuild = require('bare-build')
const path = require('bare-path')
const Opstream = require('pear-opstream')
const { arch, platform } = require('which-runtime')
const { readFile } = require('bare-fs/promises')

class Build extends Opstream {
  constructor(...args) {
    super((...args) => this.#op(...args), ...args)
  }

  async #op({ dotPear } = {}) {
    this.push({ tag: 'init', data: { dotPear } })
    const applingDir = path.join(dotPear, 'appling')
    const entry = path.join(applingDir, 'app.cjs')
    const iconFile = platform === 'darwin' ? 'icon.icns' : 'icon.png'
    const iconPath = path.join(dotPear, 'brand', 'icons', platform, iconFile)
    const entitlements = path.join(applingDir, 'entitlements.plist')
    const manifest = JSON.parse(await readFile(path.join(applingDir, 'package.json'))).pear.build
    const host = platform + '-' + arch
    const target = path.join(dotPear, 'target', host)

    this.push({ tag: 'build', data: { target } })
    for await (const _ of bareBuild(entry, {
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      description: manifest.description,
      identifier: manifest.identifier,
      hosts: [host],
      icon: iconPath,
      entitlements,
      base: applingDir,
      out: target,
      standalone: false,
      package: manifest?.[platform]?.package,
      sign: false
    })) {
    }
    this.push({ tag: 'complete' })
  }
}

module.exports = function build({ dotPear }) {
  return new Build({ dotPear })
}
