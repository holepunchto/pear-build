'use strict'
const fs = require('bare-fs')
const path = require('bare-path')
const make = require('bare-make')
const dump = require('pear-dump')

async function cpRecursive (src, dest) {
  // @TODO: replace with bare-fs once it supports `fs.cpSync { recursive: true }`
  await fs.promises.mkdir(dest, { recursive: true })
  const entries = await fs.promises.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await cpRecursive(from, to)
    } else if (entry.isSymbolicLink && entry.isSymbolicLink()) {
      const target = await fs.promises.readlink(from)
      await fs.promises.symlink(target, to)
    } else {
      await fs.promises.copyFile(from, to)
    }
  }
}

module.exports = async function build ({ link, dir }) {
    // const output = new Readable({ objectMode: true })
    const distributables = path.join(dir, 'distributables')
    console.log(`build ${link} -> ${distributables}`)

    await fs.promises.mkdir(distributables, { recursive: true })

    const stream = await dump(link, { dir: distributables, list: ['package.json', 'appling-assets'] })
    await new Promise(resolve => stream.once('end', resolve))

    const cmakePear = path.join(Pear.config.pearDir, 'current', 'node_modules', 'cmake-pear')
    await cpRecursive(cmakePear, path.join(distributables, 'node_modules', 'cmake-pear'))
    const pkgJson = await import(path.join(distributables, 'package.json'), { assert: { type: 'json' } })
    const build = pkgJson.default.pear.build

    const cmakeTxt = `
    cmake_minimum_required(VERSION 3.31)
    find_package(cmake-pear REQUIRED PATHS node_modules/cmake-pear)
    project(pear_appling C CXX ASM)
    add_pear_appling(
      pear_appling
      ID "${build.id}"
      NAME "${build.name}"
      LINK "${build.link}"
      VERSION "${build.version}"
      AUTHOR "${build.author}"
      DESCRIPTION "${build.description}"
      MACOS_IDENTIFIER "${build.darwin.identifier}"
      MACOS_CATEGORY "${build.darwin.category}"
      MACOS_SIGNING_IDENTITY "${build.darwin['signing-identity']}"
      WINDOWS_SIGNING_SUBJECT "${build.win32['signing-subject']}"
      WINDOWS_SIGNING_THUMBPRINT "${build.win32['signing-thumbprint']}"
      LINUX_CATEGORY "${build.linux.category}"
    )`
    await fs.promises.writeFile(path.join(distributables, 'CMakeLists.txt'), cmakeTxt)

    console.log('bare-make generate...')
    await make.generate({ cwd: distributables })

    console.log('bare-make build...')
    await make.build({ cwd: distributables })

    console.log(`Built appling at ${distributables}`)
}
