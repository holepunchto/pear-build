'use strict'
const path = require('path')
const fs = require('fs')
const test = require('brittle')
const tmp = require('test-tmp')
const Localdrive = require('localdrive')
const MirrorDrive = require('mirror-drive')
const build = require('../index')

const desktopDir = path.join(__dirname, 'fixtures', 'hello-pear-electron')
const mobileDir = path.join(__dirname, 'fixtures', 'hello-pear-react-native')

test('darwin: deploy directory', async function (t) {
  t.plan(4)
  const out = await tmp()
  const src = new Localdrive(desktopDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const darwinArm64App = path.join(desktopDir, 'out', 'HelloPear-darwin-arm64', 'HelloPear.app')
  const darwinX64App = path.join(desktopDir, 'out', 'HelloPear-darwin-x64', 'HelloPear.app')

  const targets = [
    ['darwin-arm64', darwinArm64App],
    ['darwin-x64', darwinX64App]
  ]

  await build(path.join(desktopDir, 'package.json'), {
    target,
    darwinArm64App,
    darwinX64App
  })

  await expected.put('/package.json', pkg)
  for (const [arch, app] of targets) {
    await new Localdrive(path.dirname(app))
      .mirror(new Localdrive(path.join(expected.root, 'by-arch', arch, 'app')), {
        prefix: '/' + path.basename(app)
      })
      .done()
  }
  const mirror = new MirrorDrive(expected, new Localdrive(target), { dryRun: true })
  await mirror.done()
  t.is(mirror.count.files, 3)
  t.is(mirror.count.add, 0)
  t.is(mirror.count.remove, 0)
  t.is(mirror.count.change, 0)
})

test('linux: deploy directory', async function (t) {
  t.plan(4)
  const out = await tmp()
  const src = new Localdrive(desktopDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const linuxArm64App = path.join(desktopDir, 'out', 'HelloPear-linux-arm64', 'HelloPear.AppImage')
  const linuxX64App = path.join(desktopDir, 'out', 'HelloPear-linux-x64', 'HelloPear.AppImage')

  const targets = [
    ['linux-arm64', linuxArm64App],
    ['linux-x64', linuxX64App]
  ]

  await build(path.join(desktopDir, 'package.json'), {
    target,
    linuxArm64App,
    linuxX64App
  })

  await expected.put('/package.json', pkg)
  for (const [arch, app] of targets) {
    await new Localdrive(path.dirname(app))
      .mirror(new Localdrive(path.join(expected.root, 'by-arch', arch, 'app')), {
        prefix: '/' + path.basename(app)
      })
      .done()
  }
  const mirror = new MirrorDrive(expected, new Localdrive(target), { dryRun: true })
  await mirror.done()
  t.is(mirror.count.files, 3)
  t.is(mirror.count.add, 0)
  t.is(mirror.count.remove, 0)
  t.is(mirror.count.change, 0)
})

test('linux: preserve executable permissions', async function (t) {
  t.plan(2)
  const out = await tmp()
  const target = path.join(out, 'build')
  const linuxArm64App = path.join(desktopDir, 'out', 'HelloPear-linux-arm64', 'HelloPear.AppImage')
  const linuxX64App = path.join(desktopDir, 'out', 'HelloPear-linux-x64', 'HelloPear.AppImage')

  await build(path.join(desktopDir, 'package.json'), {
    target,
    linuxArm64App,
    linuxX64App
  })
  const linuxArm64AppOut = path.join(
    target,
    'by-arch/linux-arm64/app',
    path.basename(linuxArm64App)
  )
  const linuxX86AppOut = path.join(target, 'by-arch/linux-x64/app', path.basename(linuxX64App))

  const inputArm64 = await fs.promises.stat(linuxArm64App)
  const inputX86 = await fs.promises.stat(linuxX64App)
  const outputArm64 = await fs.promises.stat(linuxArm64AppOut)
  const outputX86 = await fs.promises.stat(linuxX86AppOut)

  t.is(inputArm64.mode, outputArm64.mode)
  t.is(inputX86.mode, outputX86.mode)
})

test('win32: deploy directory', async function (t) {
  t.plan(4)
  const out = await tmp()
  const src = new Localdrive(desktopDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const win32X64App = path.join(desktopDir, 'out', 'HelloPear-win32-x64', 'HelloPear.msix')

  const targets = [['win32-x64', win32X64App]]

  await build(path.join(desktopDir, 'package.json'), {
    target,
    win32X64App
  })

  await expected.put('/package.json', pkg)
  for (const [arch, app] of targets) {
    await new Localdrive(path.dirname(app))
      .mirror(new Localdrive(path.join(expected.root, 'by-arch', arch, 'app')), {
        prefix: '/' + path.basename(app)
      })
      .done()
  }
  const mirror = new MirrorDrive(expected, new Localdrive(target), { dryRun: true })
  await mirror.done()
  t.is(mirror.count.files, 2)
  t.is(mirror.count.add, 0)
  t.is(mirror.count.remove, 0)
  t.is(mirror.count.change, 0)
})

test('ios: deploy directory', async function (t) {
  t.plan(4)
  const out = await tmp()
  const src = new Localdrive(mobileDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const iosArm64 = path.join(mobileDir, 'ota', 'ios', 'HelloPear')
  const iosArm64Simulator = iosArm64
  const iosX64Simulator = iosArm64
  const targets = [
    ['ios-arm64', iosArm64],
    ['ios-arm64-simulator', iosArm64Simulator],
    ['ios-x64-simulator', iosX64Simulator]
  ]

  await build(path.join(mobileDir, 'package.json'), {
    target,
    iosArm64,
    iosArm64Simulator,
    iosX64Simulator
  })

  await expected.put('/package.json', pkg)
  for (const [arch, app] of targets) {
    await new Localdrive(path.dirname(app))
      .mirror(new Localdrive(path.join(expected.root, 'by-arch', arch, 'app')), {
        prefix: '/' + path.basename(app)
      })
      .done()
  }
  const mirror = new MirrorDrive(expected, new Localdrive(target), { dryRun: true })
  await mirror.done()
  t.is(mirror.count.files, 4)
  t.is(mirror.count.add, 0)
  t.is(mirror.count.remove, 0)
  t.is(mirror.count.change, 0)
})

test('android: deploy directory', async function (t) {
  t.plan(4)
  const out = await tmp()
  const src = new Localdrive(mobileDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const androidArm64 = path.join(mobileDir, 'ota', 'android', 'HelloPear')
  const targets = [['android-arm64', androidArm64]]

  await build(path.join(mobileDir, 'package.json'), {
    target,
    androidArm64
  })

  await expected.put('/package.json', pkg)
  for (const [arch, app] of targets) {
    await new Localdrive(path.dirname(app))
      .mirror(new Localdrive(path.join(expected.root, 'by-arch', arch, 'app')), {
        prefix: '/' + path.basename(app)
      })
      .done()
  }
  const mirror = new MirrorDrive(expected, new Localdrive(target), { dryRun: true })
  await mirror.done()
  t.is(mirror.count.files, 2)
  t.is(mirror.count.add, 0)
  t.is(mirror.count.remove, 0)
  t.is(mirror.count.change, 0)
})
