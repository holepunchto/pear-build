'use strict'
const bareBuild = require('bare-build')
const path = require('bare-path')
const { Readable } = require('streamx')
const { arch, platform } = require('which-runtime')

module.exports = function build ({ dotPear }) {
  const output = new Readable({ objectMode: true })
  _build(output, { dotPear })
  return output
}

async function _build (output, { dotPear }) {
  try {
    const entry = path.join(dotPear, 'app.mjs')
    const icon = path.join(dotPear, platform, 'icon.png') || path.join(dotPear, 'icon.png')
    const host = platform + '-' + arch
    const target = path.join(dotPear, 'target', host)
    output.push({ tag: 'init', data: { dotPear } })
    output.push({ tag: 'build' })

    for await (const resource of bareBuild(entry, {
      target: [host],
      icon,
      identifier: 'com.example.App',
      // out: target,
      package: true
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
