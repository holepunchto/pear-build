'use strict'
const test = require('brittle')
const path = require('bare-path')
const build = require('..')
const runtimeDir = path.resolve(__dirname, 'fixtures', 'runtime')

test('build({ dotPear })', async function ({ plan, alike, timeout }) {
  timeout(180000)
  plan(3)
  const dir = runtimeDir
  const dotPear = path.join(dir, '.pear')
  const stream = build({ dotPear })
  const outputs = []
  stream.on('data', (msg) => outputs.push(msg))
  await new Promise((resolve) => stream.on('data', (m) => m.tag === 'final' && resolve()))
  alike(outputs[0], { tag: 'init', data: { dotPear } }, 'init')
  alike(outputs[1], { tag: 'build' }, 'build')
  alike(outputs[2], { tag: 'complete' }, 'complete')
})
