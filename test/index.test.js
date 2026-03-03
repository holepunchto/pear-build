'use strict'
const path = require('path')
const test = require('brittle')
const tmp = require('test-tmp')
const Localdrive = require('localdrive')
const MirrorDrive = require('mirror-drive')
const build = require('../index')

const desktopFixtureDir = path.join(__dirname, 'fixtures', 'hello-pear-electron')
const mobileFixtureDir = path.join(__dirname, 'fixtures', 'hello-pear-react-native')

test('desktop: build outputs expected deploy directory', async function (t) {
  const targets = [
    {
      arch: 'darwin-arm64',
      flag: 'darwinArm64App',
      input: path.join('out', 'HelloPear-darwin-arm64', 'HelloPear.app')
    },
    {
      arch: 'darwin-x64',
      flag: 'darwinX64App',
      input: path.join('out', 'HelloPear-darwin-x64', 'HelloPear.app')
    },
    {
      arch: 'linux-arm64',
      flag: 'linuxArm64App',
      input: path.join('out', 'HelloPear-linux-arm64', 'HelloPear.AppImage')
    },
    {
      arch: 'linux-x64',
      flag: 'linuxX64App',
      input: path.join('out', 'HelloPear-linux-x64', 'HelloPear.AppImage')
    },
    {
      arch: 'win32-x64',
      flag: 'win32X64App',
      input: path.join('out', 'HelloPear-win32-x64', 'HelloPear.exe')
    }
  ]

  await compareBuild(t, desktopFixtureDir, targets)
})

test('mobile: build outputs expected deploy directory', async function (t) {
  const iosBundle = path.join('ota', 'ios', 'app.bundle')
  const androidBundle = path.join('ota', 'android', 'app.bundle')
  const targets = [
    {
      arch: 'ios-arm64',
      flag: 'iosArm64',
      input: iosBundle
    },
    {
      arch: 'ios-arm64-simulator',
      flag: 'iosArm64Simulator',
      input: iosBundle
    },
    {
      arch: 'ios-x64-simulator',
      flag: 'iosX64Simulator',
      input: iosBundle
    },
    {
      arch: 'android-arm64',
      flag: 'androidArm64',
      input: androidBundle
    }
  ]

  await compareBuild(t, mobileFixtureDir, targets)
})

async function compareBuild(t, fixtureDir, targets) {
  const tmpdir = await tmp()
  const target = path.join(tmpdir, 'my-build')
  const expectedRoot = path.join(tmpdir, 'expected-build')
  const fixture = new Localdrive(fixtureDir)
  const expected = new Localdrive(expectedRoot)
  const pkgPath = path.join(fixtureDir, 'package.json')
  const pkgBuffer = await fixture.get('/package.json')
  const pkg = JSON.parse(pkgBuffer)
  const opts = { target }

  for (const { flag, input } of targets) {
    opts[flag] = path.join(fixtureDir, input)
  }

  await build(pkgPath, opts)
  await expected.put('/package.json', pkgBuffer)

  for (const { arch, input } of targets) {
    const isMobile = arch.startsWith('ios') || arch.startsWith('android')
    const output = isMobile ? (pkg.productName ?? pkg.name) : path.basename(input)
    const expectedPath = path.join(expectedRoot, 'by-arch', arch, 'app', output)
    await new Localdrive(path.join(fixtureDir, input)).mirror(new Localdrive(expectedPath)).done()
  }

  const mirror = new MirrorDrive(expected, new Localdrive(target), {
    dryRun: true,
    ignore: '.DS_Store'
  })

  await mirror.done()
  t.is(mirror.count.add, 0)
  t.is(mirror.count.remove, 0)
  t.is(mirror.count.change, 0)
}
