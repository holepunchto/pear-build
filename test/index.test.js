'use strict'
const fs = require('fs')
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
      input: path.join('out', 'HelloPear-darwin-arm64', 'HelloPear.app'),
      output: 'HelloPear.app'
    },
    {
      arch: 'darwin-x64',
      flag: 'darwinX64App',
      input: path.join('out', 'HelloPear-darwin-x64', 'HelloPear.app'),
      output: 'HelloPear.app'
    },
    {
      arch: 'linux-arm64',
      flag: 'linuxArm64App',
      input: path.join('out', 'HelloPear-linux-arm64', 'HelloPear.AppImage'),
      output: 'HelloPear.AppImage'
    },
    {
      arch: 'linux-x64',
      flag: 'linuxX64App',
      input: path.join('out', 'HelloPear-linux-x64', 'HelloPear.AppImage'),
      output: 'HelloPear.AppImage'
    },
    {
      arch: 'win32-x64',
      flag: 'win32X64App',
      input: path.join('out', 'HelloPear-win32-x64', 'HelloPear.exe'),
      output: 'HelloPear.exe'
    }
  ]

  await compareBuild(t, desktopFixtureDir, targets)
})

test('mobile: build outputs expected deploy directory', async function (t) {
  const targets = [
    {
      arch: 'ios-arm64',
      flag: 'iosArm64',
      input: path.join('dist', 'by-arch', 'ios-arm64', 'app', 'app.bundle'),
      output: 'HelloPearReactNative'
    },
    {
      arch: 'ios-arm64-simulator',
      flag: 'iosArm64Simulator',
      input: path.join('dist', 'by-arch', 'ios-arm64-simulator', 'app', 'app.bundle'),
      output: 'HelloPearReactNative'
    },
    {
      arch: 'ios-x64-simulator',
      flag: 'iosX64Simulator',
      input: path.join('dist', 'by-arch', 'ios-x64-simulator', 'app', 'app.bundle'),
      output: 'HelloPearReactNative'
    },
    {
      arch: 'android-arm64',
      flag: 'androidArm64',
      input: path.join('dist', 'by-arch', 'android-arm64', 'app', 'app.bundle'),
      output: 'HelloPearReactNative'
    }
  ]

  await compareBuild(t, mobileFixtureDir, targets)
})

async function compareBuild(t, fixtureDir, targets) {
  const tmpdir = await tmp()
  const target = path.join(tmpdir, 'my-build')
  const expected = path.join(tmpdir, 'expected-build')
  const pkgPath = path.join(fixtureDir, 'package.json')
  const opts = { target }

  for (const { flag, input } of targets) {
    opts[flag] = path.join(fixtureDir, input)
  }

  await build(pkgPath, opts)
  await fs.promises.mkdir(expected, { recursive: true })
  await fs.promises.copyFile(pkgPath, path.join(expected, 'package.json'))

  for (const { arch, input, output } of targets) {
    const expectedPath = path.join(expected, 'by-arch', arch, 'app', output)
    await fs.promises.mkdir(expectedPath, { recursive: true })
    await new Localdrive(path.join(fixtureDir, input)).mirror(new Localdrive(expectedPath)).done()
  }

  const mirror = new MirrorDrive(new Localdrive(expected), new Localdrive(target), {
    dryRun: true,
    ignore: '.DS_Store'
  })

  await mirror.done()
  t.is(mirror.count.add, 0)
  t.is(mirror.count.remove, 0)
  t.is(mirror.count.change, 0)
}
