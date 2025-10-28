'use strict'
const test = require('brittle')
const path = require('bare-path')
const pearBuild = require('..')
const fixtureDir = path.resolve(__dirname, 'fixtures', 'distributables')

test('build({ dir })', async function ({ plan, alike, timeout }) {
  timeout(1_800_000) // 30 minutes
  plan(5)
  const dir = fixtureDir
  const stream = pearBuild({ dir })
  alike(await new Promise(r => stream.once('data', r)), { tag: 'init', data: { dir: fixtureDir } })
  alike(await new Promise(r => stream.once('data', r)), { tag: 'generate' })
  alike(await new Promise(r => stream.once('data', r)), { tag: 'build' })
  alike(await new Promise(r => stream.once('data', r)), { tag: 'complete', data: { dir: fixtureDir } })
  alike(await new Promise(r => stream.once('data', r)), { tag: 'final', data: { success: true } })
})
