'use strict'
const test = require('brittle')
const path = require('bare-path')
const { arch, platform } = require('which-runtime')
const build = require('..')
const runtimeDir = path.resolve(__dirname, 'fixtures', 'runtime')

test('build({ dotPear })', async function ({ plan, alike, timeout }) {
  timeout(180000)
  plan(3)
  const dotPear = path.join(runtimeDir, '.pear')
  const host = platform + '-' + arch
  const target = path.join(dotPear, 'target', host)
  const stream = build({ dotPear })
  const outputs = []
  stream.on('data', (msg) => outputs.push(msg))
  await new Promise((resolve) => stream.on('data', (m) => m.tag === 'final' && resolve()))
  alike(outputs[0], { tag: 'init', data: { dotPear } }, 'init')
  alike(outputs[1], { tag: 'build', data: { target } }, 'build')
  alike(outputs[2], { tag: 'complete' }, 'complete')
})
