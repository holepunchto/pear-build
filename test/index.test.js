'use strict'
const test = require('brittle')
const path = require('bare-path')
const pearBuild = require('..')
const runtimeDir = path.resolve(__dirname, 'fixtures', 'runtime')

test('build({ dir })', async function ({ plan, alike, timeout }) {
  timeout(900_000)
  plan(4)
  const dir = runtimeDir
  const stream = pearBuild({ dir })
  const outputs = []
  stream.on('data', (msg) => outputs.push(msg))
  await new Promise(resolve => stream.on('data', m => m.tag === 'final' && resolve()))
  alike(outputs[0], { tag: 'init', data: { dir: runtimeDir } }, 'init')
  alike(outputs[1], { tag: 'generate' }, 'generate')
  alike(outputs[2], { tag: 'build' }, 'build')
  alike(outputs[3], { tag: 'complete', data: { dir: path.join(dir, 'build') } }, 'complete')
})
