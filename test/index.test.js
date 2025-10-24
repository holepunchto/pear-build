'use strict'
const test = require('brittle')
const path = require('bare-path')
const pearBuild = require('..')
const fixtureDir = path.resolve(__dirname, 'fixtures', 'distributables')

test('build({ dir })', async t => {
  t.plan(0)
  const dir = fixtureDir
  const stream = await pearBuild({ dir })
  stream.on('data', (msg) => {
    console.log('DATA === ', msg)
  })
})
