'use strict'
const make = require('bare-make')
const path = require('bare-path')
const { Readable } = require('streamx')

module.exports = function build ({ dir }) {
  const output = new Readable({ objectMode: true })
  _build(output, { dir })
  return output
}

async function _build (output, { dir }) {
  try {
    output.push({ tag: 'init', data: { dir } })
    output.push({ tag: 'generate' })
    await make.generate({ cwd: dir, stdio: 'inherit' })
    output.push({ tag: 'build' })
    await make.build({ cwd: dir, stdio: 'inherit' })
    output.push({ tag: 'complete', data: { dir: path.join(dir, 'build') } })
    output.push({ tag: 'final', data: { success: true } })
  } catch (err) {
    output.push({ tag: 'error', data: { message: err.message, stack: err.stack } })
    output.push({ tag: 'final', data: { success: false, message: err.message } })
  } finally {
    output.push(null)
  }
}
