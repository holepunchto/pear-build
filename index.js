'use strict'
const fs = require('bare-fs')
const path = require('bare-path')
const dump = require('pear-dump')
const make = require('bare-make')
const { spawnSync } = require('bare-subprocess')
const { arch, platform } = require('which-runtime')

module.exports = async function build ({ link, dir }) {
    const repoDir = dir + '/pear-appling'
    const dumpDir = dir + '/pear-dump'

    if (!fs.existsSync(repoDir)) {
      const resultGit = spawnSync('git', ['clone', 'https://github.com/holepunchto/pear-appling'], { cwd: dir, stdio: 'inherit' })
      if (resultGit.status !== 0) throw new Error(`git error ${resultGit.stderr?.toString()}`)
    }

    console.log('Installing npm packages...')
    const resultNpm = spawnSync('npm', ['i'], { cwd: repoDir, stdio: 'inherit' })
    if (resultNpm.status !== 0) throw new Error(`npm error ${resultNpm.stderr?.toString()}`)

    const stream = dump(link, { dir: dumpDir, list: ['package.json'] })
    await new Promise(resolve => stream.once('end', resolve))

    let pkgBuf = await fs.promises.readFile(dumpDir + '/package.json')
    if (pkgBuf && pkgBuf.value) pkgBuf = pkgBuf.value
    const pkg = JSON.parse(Buffer.from(pkgBuf).toString())
    const build = pkg?.pear?.build
    if (!build) throw Error('package.json is missing field pear.build')

    const cmakeTxt = `
    cmake_minimum_required(VERSION 3.31)
    find_package(cmake-pear REQUIRED PATHS node_modules/cmake-pear)
    project(pear_appling C CXX ASM)
    add_pear_appling(
      pear_appling
      ID "${build.id}"
      NAME "${build.name}"
      LINK "${build.link}"
      VERSION ${build.version}
      AUTHOR "${build.author}"
      DESCRIPTION "${build.description}"
      MACOS_IDENTIFIER "${build.darwin.identifier}"
      MACOS_CATEGORY "${build.darwin.category}"
      MACOS_SIGNING_IDENTITY "${build.darwin.signing-identity}"
      WINDOWS_SIGNING_SUBJECT "${build.win32.signing-subject}"
      WINDOWS_SIGNING_THUMBPRINT "${build.win32.signing-thumbprint}"
      LINUX_CATEGORY "${build.linux.category}"
    )`
    await fs.promises.writeFile(repoDir + '/CMakeLists.txt', cmakeTxt)

    console.log('bare-make generate...')
    await make.generate({ cwd: repoDir })

    console.log('bare-make build...')
    await make.build({ cwd: repoDir })

    console.log('Cleaning up...')
    const srcDir = path.join(repoDir, 'build')
    const dstDir = path.join(dir, 'distributables', `${platform}-${arch}`)
    await fs.promises.mkdir(dstDir, { recursive: true })
    await fs.promises.cp(srcDir, dstDir, { recursive: true })
    await fs.promises.rm(repoDir, { recursive: true, force: true })
    await fs.promises.rm(dumpDir, { recursive: true, force: true })

    console.log(`Built appling at ${dstDir}`)
}
