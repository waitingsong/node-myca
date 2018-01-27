/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
import * as rmdir from 'rimraf'
import { promisify } from 'util'

import * as myca from '../src/index'
import { createFile, isDirExists, isFileExists, unlinkAsync, writeFileAsync } from '../src/lib/common'
import { config } from '../src/lib/config'

const filename = basename(__filename)
const tmpDir = tmpdir()
const random = Math.random()
const pathPrefix = 'myca-test-center'
const randomPath = `${tmpDir}/${pathPrefix}-${random}`

// config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`) // dir contains conf file and folders
config.defaultCenterPath = `${randomPath}/${config.centerDirName}`

describe(filename, () => {
  after(() => {
    rmdir(join(config.defaultCenterPath, '../'), (err) => err && console.error(err))
  })

  it('Should initDefaultCenter() works', async () => {
    try {
      await myca.initDefaultCenter()
    }
    catch (ex) {
      return assert(false, ex)
    }

    if ( ! await isDirExists(config.defaultCenterPath)) {
      return assert(false, `default center folder not exists, path: "${config.defaultCenterPath}"`)
    }

    assert(
      await myca.isCenterInited('default'),
      `isCenterInited('default') says folder not exits. path: "${config.defaultCenterPath}"`
    )

    // initialize again
    try {
      await myca.initDefaultCenter()
      assert(false, 'should throw error during duplicate initialization, but NOT')
    }
    catch {
      assert(true)
    }

    // not rm for below test
    // rmdir(join(config.defaultCenterPath, '../'), (err) => err && console.error(err))
  })


  it('Should getCenterPath() works', async () => {
    const centerPath = await myca.getCenterPath('default')
    const isDefaultCenterInited = await myca.isCenterInited('default')
    const dirExists = await isDirExists(centerPath)

    assert(dirExists ? isDefaultCenterInited : !isDefaultCenterInited)
  })


  it('Should initCenter() works', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`

    try {
      await myca.initCenter(centerName, centerPath)
    }
    catch (ex) {
      return assert(false, ex)
    }

    if (! await isDirExists(centerPath)) {
      return assert(false, `spcified center folder not exists, path: "${centerPath}"`)
    }

    assert(
      await myca.isCenterInited(centerName),
      `isCenterInited(${centerName}) says folder not exits. path: "${centerPath}"`)

    // create again
    try {
      await myca.initCenter(centerName, centerPath)
      return assert(false, 'initCenter() should throw error for already created folder, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })


  it('Should initCenter() works with invalid param', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`

    try {
      await myca.initCenter('default', centerPath)  // 'default' not allowed
      return assert(false, 'initCenter("default") should throw error for value default not allowed, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    try {
      await myca.initCenter('', centerPath)
      return assert(false, 'initCenter() should throw error for invalid param of centerName, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    if (await isDirExists(centerPath)) {
      return assert(false, `spcified center folder should not exists, but did exists, path: "${centerPath}"`)
    }

    assert(
      ! await myca.isCenterInited(centerName),
      `isCenterInited(${centerName}) says folder exits, but should NOT. path: "${centerPath}"`)

    rmdir(randomPath, (err) => err && console.error(err))
  })


  // ------------------ at last

  it('Should getCenterPath() works with empty centerList', async () => {
    const file = join(config.defaultCenterPath, config.centerListName)
    console.log('file:::', file)

    try {
      if (await isFileExists(file)) {
        await unlinkAsync(file)
      }
      await createFile(file, '')
      assert(! await myca.getCenterPath('center'), 'should return empty')
    }
    catch (ex) {
      assert(false, ex)
    }
  })


  it('Should initCenter() works without default Center', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const path = join(config.defaultCenterPath, '..')

    if (await isDirExists(path)) {
      const rmdirAsync = promisify(rmdir)

      try {
        await rmdirAsync(path)
      }
      catch (ex) {
        assert(false, `unlink default Center failed. path: "${path}"`)
      }
    }

    try {
      await myca.initCenter(centerName, centerPath)
      assert(false, 'initCenter() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    assert( ! await isDirExists(centerPath), `path should not exists: "${centerPath}"`)
  })



})
