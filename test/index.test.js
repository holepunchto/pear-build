'use strict'
const test = require('brittle')
const path = require('bare-path')
const pearBuild = require('..')
const fixtureDir = path.resolve(__dirname, 'fixtures', 'distributables')

test('build({ dir })', async function ({ plan, alike, timeout }) {
  timeout(1_200_000)
  plan(4)
  const dir = fixtureDir
  const stream = pearBuild({ dir })
  const outputs = []
  stream.on('data', (msg) => outputs.push(msg))
  await new Promise(resolve => stream.on('data', m => m.tag === 'final' && resolve()))
  alike(outputs[0], { tag: 'init', data: { dir: fixtureDir } }, 'init')
  alike(outputs[1], { tag: 'generate' }, 'generate')
  alike(outputs[2], { tag: 'build' }, 'build')
  alike(outputs[3], { tag: 'complete', data: { dir: path.join(dir, 'build') } }, 'complete')
})
