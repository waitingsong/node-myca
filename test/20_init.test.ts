/// <reference types="mocha" />

import * as assert from 'power-assert'
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { initialConfig } from '../src/lib/config'
import {
  basename,
  createDir,
  createFile,
  isDirExists,
  isFileExists,
  join,
  promisify,
  tmpdir,
  unlinkAsync,
} from '../src/shared/index'


const filename = basename(__filename)
const tmpDir = join(tmpdir(), 'myca-tmp')
const random = Math.random()
const pathPrefix = 'myca-test-center'
const randomPath = `${tmpDir}/${pathPrefix}-${random}`

// dir contains conf file and folders
// config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`)
initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`

describe(filename, () => {
  before(async () => {
    await createDir(tmpDir)
  })
  after(done => {
    rmdir(tmpDir, err => err && console.error(err) || done())
  })

  it('Should initDefaultCenter() works', async () => {
    try {
      const centerPath = await myca.initDefaultCenter()

      assert(
        centerPath === initialConfig.defaultCenterPath,
        `result not expected. result: "${centerPath}", expected: "${initialConfig.defaultCenterPath}"`
      )
    }
    catch (ex) {
      return assert(false, ex)
    }

    if (! await isDirExists(initialConfig.defaultCenterPath)) {
      return assert(false, `default center folder not exists, path: "${initialConfig.defaultCenterPath}"`)
    }

    assert(
      await myca.isCenterInited('default'),
      `isCenterInited('default') says folder not exits. path: "${initialConfig.defaultCenterPath}"`
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
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`

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

    rmdir(randomPath, err => err && console.error(err))
  })


  it('Should initCenter() works with invalid param', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`

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

    rmdir(randomPath, err => err && console.error(err))
  })


  // ------------------ at last

  it('Should getCenterPath() works with empty centerList', async () => {
    const file = join(initialConfig.defaultCenterPath, initialConfig.centerListName)

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
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`
    const path = join(initialConfig.defaultCenterPath, '..')

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

    assert(! await isDirExists(centerPath), `path should not exists: "${centerPath}"`)
  })



})
