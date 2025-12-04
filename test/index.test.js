'use strict'
const test = require('brittle')
const path = require('bare-path')
const pearBuild = require('..')
const runtimeDir = path.resolve(__dirname, 'fixtures', 'runtime')

test('build({ dir })', async function ({ plan, alike, timeout }) {
  timeout(180000)
  plan(3)
  const dir = runtimeDir
  const dotPear = path.join(dir, '.pear')
  const manifest = {
    name: 'Runtime',
    version: '1.0.0',
    identifier: 'pear.runtime'
  }
  const stream = pearBuild({ dotPear, manifest })
  const outputs = []
  stream.on('data', (msg) => outputs.push(msg))
  await new Promise((resolve) => stream.on('data', (m) => m.tag === 'final' && resolve()))
  alike(outputs[0], { tag: 'init', data: { dotPear } }, 'init')
  alike(outputs[1], { tag: 'build' }, 'build')
  alike(outputs[2], { tag: 'complete' }, 'complete')
})
