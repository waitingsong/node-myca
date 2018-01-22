/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join, normalize } from 'path'
import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { isDirExists, isFileExists } from '../src/lib/common'
import { config } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir = tmpdir()
const random = Math.random()
const pathPrefix = 'myca-test-center'
const randomPath = `${tmpDir}/${pathPrefix}-${random}`
const mods = rewire('../src/lib/center')

config.isWin32 = process.platform === 'win32' ? true : false
config.userHome = config.isWin32 ? normalize(process.env.USERPROFILE || '') : normalize(`${process.env.HOME}`)
// config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`) // dir contains conf file and folders
config.defaultCenterPath = `${randomPath}/${config.centerDirName}`
config.openssl = normalize(config.openssl)


describe(filename, () => {
  // beforeEach(() => {
  //   config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`)
  // })
  after(() => {
    rmdir(randomPath, (err) => err && console.error(err))
  })


  it('Should getCenterPath() works', async () => {
    try {
      const centerPath = await myca.getCenterPath('default')

      centerPath || assert(false, 'getCenterPath("default") should return not empty result, but EMPTY')
    }
    catch (ex) {
      return assert(false, ex)
    }

    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`

    await myca.initCenter(centerName, centerPath)
    try {
      const centerPath = await myca.getCenterPath(centerName)

      centerPath || assert(false, `getCenterPath('${centerName}') should return not empty result, but EMPTY`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should getCenterPath() works with invalid param', async () => {
    const random = Math.random()
    try {
      const centerPath = await myca.getCenterPath(random)

      centerPath && assert(false, 'getCenterPath() should return empty result with invalid centerName, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })


  it('Should createCenter() works', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`

    try {
      await myca.createCenter(centerName, centerPath)
    }
    catch (ex) {
      return asset(false, ex)
    }

    if (! await isDirExists(centerPath)) {
      return assert(false, `spcified center folder not exists, path: "${centerPath}"`)
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })

  it('Should createCenter() works', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

    try {
      await myca.createCenter(centerName, centerPath)
    }
    catch (ex) {
      return asset(false, ex)
    }

    for (const name of folders) {
      const dir = join(centerPath, name)

      if (! await isDirExists(dir)) {
        return assert(false, `spcified center folder not exists, path: "${dir}"`)
      }
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })

  it('Should createCenter() works with invalid param', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

    try {
      await myca.createCenter('', centerPath)
      assert(false, 'createCenter() should throw error with empty value of centerName, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    for (const name of folders) {
      const dir = join(centerPath, name)

      if (await isDirExists(dir)) {
        return assert(false, `spcified center folder should NOT exists, path: "${dir}"`)
      }
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })

  it('Should createCenter() works with invalid param', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

    try {
      await myca.createCenter(centerName, '')
      assert(false, 'createCenter() should throw error with empty value of centerName, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    for (const name of folders) {
      const dir = join(centerPath, name)

      if (await isDirExists(dir)) {
        return assert(false, `spcified center folder should NOT exists, path: "${dir}"`)
      }
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })


  it('Should createInitialFiles() works', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const fnName = 'createInitialFiles'
    const fn = <(path: string, files: string[]) => Promise<void>> mods.__get__(fnName)
    const files = ['file1', 'file2']

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(randomPath, files)
    }
    catch (ex) {
      rmdir(randomPath, (err) => err && console.error(err))
      return assert(false, ex)
    }
    for (const name of files) {
      const file = `${randomPath}/${name}`

      if ( ! await isFileExists(file)) {
        assert(false, `file not exists. path: "${file}"`)
      }
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })


})
