'use strict'
const bareBuild = require('bare-build')
const path = require('bare-path')
const { Readable } = require('streamx')
const { arch, platform } = require('which-runtime')
const { spawnSync } = require('bare-subprocess')

module.exports = function build({ dotPear }) {
  const output = new Readable({ objectMode: true })
  _build(output, { dotPear })
  return output
}

async function _build(output, { dotPear }) {
  try {
    const appling = path.join(dotPear, 'appling')
    const entry = path.join(dotPear, 'appling', 'app.mjs')
    const icon = path.join(dotPear, 'brand', 'icons', platform, 'icon.png')
    const host = platform + '-' + arch
    const target = path.join(dotPear, 'target', host)
    output.push({ tag: 'init', data: { dotPear } })
    output.push({ tag: 'build' })
    spawnSync('npm', ['install'], { cwd: appling, stdio: 'inherit' })
    for await (const resource of bareBuild(entry, {
      target: [host],
      icon,
      identifier: 'com.example.App',
      package: false,
      out: target
    })) {
      console.log(resource)
    }
    output.push({ tag: 'complete', data: { target } })
    output.push({ tag: 'final', data: { success: true } })
  } catch (err) {
    output.push({ tag: 'error', data: { message: err.message, stack: err.stack } })
    output.push({ tag: 'final', data: { success: false, message: err.message } })
  } finally {
    output.push(null)
  }
}
