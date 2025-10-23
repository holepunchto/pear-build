'use strict'
const make = require('bare-make')
const { Readable } = require('streamx')

module.exports = async function build ({ dir }) {
  const output = new Readable({ objectMode: true })
  setImmediate(async () => {
    try {
      output.push({ tag: 'init', data: { dir } })
      output.push({ tag: 'generate' })
      await make.generate({ cwd: dir })
      output.push({ tag: 'build' })
      await make.build({ cwd: dir })
      output.push({ tag: 'complete', data: { dir } })
      output.push({ tag: 'final', data: { success: true } })
    } catch (err) {
      output.push({ tag: 'error', data: { message: err.message, stack: err.stack } })
      output.push({ tag: 'final', data: { success: false, message: err.message } })
    } finally {
      output.push(null)
    }
  })
  return output
}
