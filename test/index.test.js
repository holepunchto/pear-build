'use strict'
const path = require('path')
const fs = require('fs')
const test = require('brittle')
const tmp = require('test-tmp')
const Localdrive = require('localdrive')
const MirrorDrive = require('mirror-drive')
const { command } = require('paparam')
const build = require('../index')
const manifest = require('../package')

const desktopDir = path.join(__dirname, 'fixtures', 'hello-pear-electron')
const mobileDir = path.join(__dirname, 'fixtures', 'hello-pear-react-native')
const bareDir = path.join(__dirname, 'fixtures', 'hello-pear-bare')

test('darwin: deploy directory', async function (t) {
  t.plan(6)
  const out = await tmp()
  const src = new Localdrive(desktopDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const darwinArm64App = path.join(desktopDir, 'by-arch', 'HelloPear-darwin-arm64', 'HelloPear.app')
  const darwinX64App = path.join(desktopDir, 'by-arch', 'HelloPear-darwin-x64', 'HelloPear.app')

  const targets = [
    ['darwin-arm64', darwinArm64App],
    ['darwin-x64', darwinX64App]
  ]

  const events = []
  const runner = build({
    package: path.join(desktopDir, 'package.json'),
    target,
    darwinArm64App,
    darwinX64App
  })

  runner.on('mirroring', () => events.push('mirroring'))
  runner.on('mirrored', () => events.push('mirrored'))
  await runner.done()

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
  t.is(events.filter((event) => event === 'mirroring').length, 2)
  t.is(events.filter((event) => event === 'mirrored').length, 2)
})

test('*-app flags are multiple', async function (t) {
  const appFlags = [
    ['--darwin-arm64-app', 'darwinArm64App'],
    ['--darwin-x64-app', 'darwinX64App'],
    ['--linux-arm64-app', 'linuxArm64App'],
    ['--linux-x64-app', 'linuxX64App'],
    ['--win32-x64-app', 'win32X64App'],
    ['--win32-arm64-app', 'win32Arm64App']
  ]
  t.plan(appFlags.length * 2 + 1)

  for (const [flag, name] of appFlags) {
    t.alike(parse([flag, 'a']).flags[name], ['a'], flag + ' once is an array')
    t.alike(parse([flag, 'a', flag, 'b']).flags[name], ['a', 'b'], flag + ' twice is an array')
  }

  t.is(parse(['--target', 'a', '--target', 'b']).flags.target, 'b', '--target is not multiple')

  function parse(args) {
    return command(manifest.name, manifest.command).parse(['--package', 'package.json', ...args])
  }
})

test('deploy directory with the same app flag passed multiple times', async function (t) {
  t.plan(7)
  const out = await tmp()
  const src = new Localdrive(bareDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const darwinArm64App = path.join(bareDir, 'by-arch', 'darwin-arm64', 'app', 'hello-pear')
  const darwinArm64Transport = path.join(
    bareDir,
    'by-arch',
    'darwin-arm64',
    'app',
    'hello-pear-transport'
  )

  const targets = [
    ['darwin-arm64', darwinArm64App],
    ['darwin-arm64', darwinArm64Transport]
  ]

  const { flags } = command(manifest.name, manifest.command).parse([
    '--package',
    path.join(bareDir, 'package.json'),
    '--target',
    target,
    '--darwin-arm64-app',
    darwinArm64App,
    '--darwin-arm64-app',
    darwinArm64Transport
  ])
  t.alike(flags.darwinArm64App, [darwinArm64App, darwinArm64Transport])

  const events = []
  const runner = build(flags)

  runner.on('mirroring', () => events.push('mirroring'))
  runner.on('mirrored', () => events.push('mirrored'))
  await runner.done()

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
  t.is(events.filter((event) => event === 'mirroring').length, 2)
  t.is(events.filter((event) => event === 'mirrored').length, 2)
})

test('bin names are valid app names', async function (t) {
  t.plan(6)
  const out = await tmp()
  const src = new Localdrive(bareDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const linuxX64Transport = path.join(
    bareDir,
    'by-arch',
    'linux-x64',
    'app',
    'hello-pear-transport'
  )
  const win32X64Transport = path.join(
    bareDir,
    'by-arch',
    'win32-x64',
    'app',
    'hello-pear-transport.exe'
  )

  const targets = [
    ['linux-x64', linuxX64Transport],
    ['win32-x64', win32X64Transport]
  ]

  const events = []
  const runner = build({
    package: path.join(bareDir, 'package.json'),
    target,
    linuxX64App: [linuxX64Transport],
    win32X64App: [win32X64Transport]
  })

  runner.on('mirroring', () => events.push('mirroring'))
  runner.on('mirrored', () => events.push('mirrored'))
  await runner.done()

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
  t.is(events.filter((event) => event === 'mirroring').length, 2)
  t.is(events.filter((event) => event === 'mirrored').length, 2)
})

test('app name must be the product name or a bin name', async function (t) {
  t.plan(2)
  const out = await tmp()

  const runner = build({
    package: path.join(bareDir, 'package.json'),
    target: path.join(out, 'build'),
    darwinArm64App: [path.join(bareDir, 'by-arch', 'darwin-arm64', 'app')]
  })
  runner.on('error', () => {})

  const err = await runner.done().then(
    () => null,
    (err) => err
  )

  t.is(err?.code, 'ERR_INVALID_APP_NAME')
  t.is(err?.message, 'expected hello-pear or hello-pear-transport but got app for darwin-arm64')
})

test('linux: deploy directory', async function (t) {
  t.plan(6)
  const out = await tmp()
  const src = new Localdrive(desktopDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const linuxArm64App = path.join(
    desktopDir,
    'by-arch',
    'HelloPear-linux-arm64',
    'HelloPear.AppImage'
  )
  const linuxX64App = path.join(desktopDir, 'by-arch', 'HelloPear-linux-x64', 'HelloPear.AppImage')

  const targets = [
    ['linux-arm64', linuxArm64App],
    ['linux-x64', linuxX64App]
  ]

  const events = []
  const runner = build({
    package: path.join(desktopDir, 'package.json'),
    target,
    linuxArm64App,
    linuxX64App
  })

  runner.on('mirroring', () => events.push('mirroring'))
  runner.on('mirrored', () => events.push('mirrored'))
  await runner.done()

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
  t.is(events.filter((event) => event === 'mirroring').length, 2)
  t.is(events.filter((event) => event === 'mirrored').length, 2)
})

test('linux: preserve executable permissions', async function (t) {
  t.plan(4)
  const out = await tmp()
  const target = path.join(out, 'build')
  const linuxArm64App = path.join(
    desktopDir,
    'by-arch',
    'HelloPear-linux-arm64',
    'HelloPear.AppImage'
  )
  const linuxX64App = path.join(desktopDir, 'by-arch', 'HelloPear-linux-x64', 'HelloPear.AppImage')

  const events = []
  const runner = build({
    package: path.join(desktopDir, 'package.json'),
    target,
    linuxArm64App,
    linuxX64App
  })

  runner.on('mirroring', () => events.push('mirroring'))
  runner.on('mirrored', () => events.push('mirrored'))
  await runner.done()
  const linuxArm64Out = path.join(target, 'by-arch/linux-arm64/app', path.basename(linuxArm64App))
  const linuxX86Out = path.join(target, 'by-arch/linux-x64/app', path.basename(linuxX64App))

  const inputArm64 = await fs.promises.stat(linuxArm64App)
  const inputX86 = await fs.promises.stat(linuxX64App)
  const outputArm64 = await fs.promises.stat(linuxArm64Out)
  const outputX86 = await fs.promises.stat(linuxX86Out)

  t.is(inputArm64.mode, outputArm64.mode)
  t.is(inputX86.mode, outputX86.mode)
  t.is(events.filter((event) => event === 'mirroring').length, 2)
  t.is(events.filter((event) => event === 'mirrored').length, 2)
})

test('win32: deploy directory', async function (t) {
  t.plan(6)
  const out = await tmp()
  const src = new Localdrive(desktopDir)
  const pkg = await src.get('/package.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const win32X64App = path.join(desktopDir, 'by-arch', 'HelloPear-win32-x64', 'HelloPear.msix')
  const win32Arm64App = path.join(desktopDir, 'by-arch', 'HelloPear-win32-arm64', 'HelloPear.msix')

  const targets = [
    ['win32-x64', win32X64App],
    ['win32-arm64', win32Arm64App]
  ]

  const events = []
  const runner = build({
    package: path.join(desktopDir, 'package.json'),
    target,
    win32X64App,
    win32Arm64App
  })

  runner.on('mirroring', () => events.push('mirroring'))
  runner.on('mirrored', () => events.push('mirrored'))
  await runner.done()

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
  t.is(events.filter((event) => event === 'mirroring').length, 2)
  t.is(events.filter((event) => event === 'mirrored').length, 2)
})

test('ios: deploy directory', async function (t) {
  t.plan(6)
  const out = await tmp()
  const src = new Localdrive(mobileDir)
  const pkg = await src.get('/package.json')
  const cfg = await src.get('/pear.json')
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

  const events = []
  const runner = build({
    package: path.join(mobileDir, 'package.json'),
    config: path.join(mobileDir, 'pear.json'),
    target,
    iosArm64,
    iosArm64Simulator,
    iosX64Simulator
  })

  runner.on('mirroring', () => events.push('mirroring'))
  runner.on('mirrored', () => events.push('mirrored'))
  await runner.done()

  await expected.put('/package.json', pkg)
  await expected.put('/pear.json', cfg)
  for (const [arch, app] of targets) {
    await new Localdrive(path.dirname(app))
      .mirror(new Localdrive(path.join(expected.root, 'by-arch', arch, 'app')), {
        prefix: '/' + path.basename(app)
      })
      .done()
  }
  const mirror = new MirrorDrive(expected, new Localdrive(target), { dryRun: true })
  await mirror.done()
  t.is(mirror.count.files, 5)
  t.is(mirror.count.add, 0)
  t.is(mirror.count.remove, 0)
  t.is(mirror.count.change, 0)
  t.is(events.filter((event) => event === 'mirroring').length, 3)
  t.is(events.filter((event) => event === 'mirrored').length, 3)
})

test('android: deploy directory', async function (t) {
  t.plan(6)
  const out = await tmp()
  const src = new Localdrive(mobileDir)
  const pkg = await src.get('/package.json')
  const cfg = await src.get('/pear.json')
  const target = path.join(out, 'build')
  const expected = new Localdrive(path.join(out, 'expected'))

  const androidArm64 = path.join(mobileDir, 'ota', 'android', 'HelloPear')
  const targets = [['android-arm64', androidArm64]]

  const events = []
  const runner = build({
    package: path.join(mobileDir, 'package.json'),
    config: path.join(mobileDir, 'pear.json'),
    target,
    androidArm64
  })

  runner.on('mirroring', () => events.push('mirroring'))
  runner.on('mirrored', () => events.push('mirrored'))
  await runner.done()

  await expected.put('/package.json', pkg)
  await expected.put('/pear.json', cfg)
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
  t.is(events.filter((event) => event === 'mirroring').length, 1)
  t.is(events.filter((event) => event === 'mirrored').length, 1)
})
