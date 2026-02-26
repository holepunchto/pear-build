'use strict'
const path = require('path')
const test = require('brittle')
const tmp = require('test-tmp')
const Localdrive = require('localdrive')
const build = require('../index')

const appDir = path.join(__dirname, 'fixtures', 'basic')

test('build and check output structure', async function (t) {
  const tmpdir = await tmp()
  const target = path.join(tmpdir, 'out')
  const fixture = new Localdrive(appDir)
  const pkgFixture = JSON.parse(await fixture.get('/package.json'))
  const pkgPath = path.join(appDir, 'package.json')
  const darwinArm64App = path.join(appDir, 'by-arch', 'darwin-arm64', 'app', 'Basic.app')

  await build(pkgPath, { darwinArm64App, target })

  const copied = new Localdrive(target)
  const copiedPkg = JSON.parse(await copied.get('/package.json'))
  t.alike(copiedPkg, pkgFixture)

  const arm64Content = await copied.get('/by-arch/darwin-arm64/app/Basic.app/stub.txt')
  t.is(arm64Content.toString(), 'aabbcc')
})
