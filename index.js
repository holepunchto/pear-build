'use strict'
const bareBuild = require('bare-build')
const path = require('bare-path')
const { spawnSync } = require('bare-subprocess')
const { Readable } = require('streamx')
const { arch, platform } = require('which-runtime')

module.exports = function build({ dotPear }) {
  const output = new Readable({ objectMode: true })
  _build(output, { dotPear })
  return output
}

async function _build(output, { dotPear }) {
  try {
    output.push({ tag: 'init', data: { dotPear } })
    const applingDir = path.join(dotPear, 'appling')
    const entry = path.join(applingDir, 'app.cjs')
    const icon = path.join(dotPear, 'brand', 'icons', platform, 'icon.png')
    const entitlements = path.join(applingDir, 'entitlements.plist')
    let manifest
    try {
      manifest = require(path.join(applingDir, 'package.json')).pear.build
    } catch (err) {
      output.push({ tag: 'error', data: { message: 'manifest failed' } })
      output.push(null)
      return
    }
    const host = platform + '-' + arch
    const target = path.join(dotPear, 'target', host)

    output.push({ tag: 'build' })
    try {
      spawnSync('npm', ['install'], { cwd: applingDir, stdio: 'inherit' })
    } catch (err) {
      output.push({ tag: 'error', data: { message: 'npm install failed', error: err.message } })
      output.push(null)
      return
    }
    try {
      for await (const _ of bareBuild(entry, {
        name: manifest.name,
        version: manifest.version,
        author: manifest.author,
        description: manifest.description,
        identifier: manifest.identifier,
        target: [host],
        icon,
        entitlements,
        base: applingDir,
        out: target
      })) {
      }
    } catch (err) {
      output.push({ tag: 'error', data: { message: 'bareBuild failed', error: err.message } })
      output.push(null)
      return
    }
    output.push({ tag: 'complete' })
    output.push({ tag: 'final', data: { success: true } })
  } catch (err) {
    output.push({ tag: 'error', data: { message: err.message, stack: err.stack } })
    output.push({ tag: 'final', data: { success: false, message: err.message } })
  } finally {
    output.push(null)
  }
}
