'use strict'
const fs = require('bare-fs')
const path = require('bare-path')
const make = require('bare-make')
const dump = require('pear-dump')
const plink = require('pear-link')
const { Readable } = require('streamx')

module.exports = async function build ({ link, dir }) {
    const output = new Readable({ objectMode: true })
    const distributables = path.join(dir, 'distributables')
    output.push({ tag: 'init', data: { dir: distributables } })

    await fs.promises.mkdir(distributables, { recursive: true })
    console.log(Pear)
    const stream = await dump(link, { dir: distributables, list: ['package.json', 'icons'] })
    await new Promise(resolve => stream.once('end', resolve))

    const cmakePear = path.join(Pear.config.pearDir, 'current', 'node_modules', 'cmake-pear')
    // await cpRecursive(cmakePear, path.join(distributables, 'node_modules', 'cmake-pear'))
    const pkg = await import(path.join(distributables, 'package.json'), { assert: { type: 'json' } })
    const build = pkg.default.pear.build
    const { drive } = plink.parse(link)

    const cmakeTxt = `
    cmake_minimum_required(VERSION 3.31)
    find_package(cmake-pear REQUIRED PATHS node_modules/cmake-pear)
    project(pear_appling C CXX ASM)
    add_pear_appling(
      pear_appling
      ID "${drive.key}"
      NAME "${build.name || pkg.default.name}"
      LINK "${link}"
      VERSION "${build.version || pkg.default.version}"
      AUTHOR "${build.author || pkg.default.author}"
      DESCRIPTION "${build.description || pkg.default.description}"
      MACOS_IDENTIFIER "${build.darwin?.identifier || ''}"
      MACOS_CATEGORY "${build.darwin?.category || ''}"
      MACOS_SIGNING_IDENTITY "${build.darwin?.['signing-identity'] || ''}"
      WINDOWS_SIGNING_SUBJECT "${build.win32?.['signing-subject'] || ''}"
      WINDOWS_SIGNING_THUMBPRINT "${build.win32?.['signing-thumbprint'] || ''}"
      LINUX_CATEGORY "${build.linux?.category || ''}"
    )`
    await fs.promises.writeFile(path.join(distributables, 'CMakeLists.txt'), cmakeTxt)

    output.push({ tag: 'generate' })
    await make.generate({ cwd: distributables })

    output.push({ tag: 'build' })
    await make.build({ cwd: distributables })

    output.push({ tag: 'complete', data: { dir: distributables } })
}
