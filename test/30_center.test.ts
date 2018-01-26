/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { isDirExists, isFileExists, writeFileAsync } from '../src/lib/common'
import { config, initialDbFiles } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir = tmpdir()
const pathPrefix = 'myca-test-center'
const mods = rewire('../src/lib/center')

describe(filename, () => {
  beforeEach(async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    config.defaultCenterPath = `${randomPath}/${config.centerDirName}`
    await myca.initDefaultCenter()
  })
  afterEach(() => {
    rmdir(join(config.defaultCenterPath, '../'), (err) => err && console.error(err))
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

    rmdir(randomPath, (err) => err && console.error(err))
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
    const fnName = 'createCenter'
    const fn = <(centerName: string, path: string) => Promise<void>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(centerName, centerPath)
    }
    catch (ex) {
      return assert(false, ex)
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
    const fnName = 'createCenter'
    const fn = <(centerName: string, path: string) => Promise<void>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(centerName, centerPath)
    }
    catch (ex) {
      return assert(false, ex)
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
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const fnName = 'createCenter'
    const fn = <(centerName: string, path: string) => Promise<void>> mods.__get__(fnName)
    const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn('', centerPath)
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
    const fnName = 'createCenter'
    const fn = <(centerName: string, path: string) => Promise<void>> mods.__get__(fnName)
    const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(centerName, '')
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
    // const centerName = `${pathPrefix}-${random}`
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

  it('Should createInitialFiles() works with invalid param', async () => {
    const random = Math.random()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const fnName = 'createInitialFiles'
    const fn = <(path: string, files: string[]) => Promise<void>> mods.__get__(fnName)
    const files = ['file1', '']

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn('', files)
      return assert(false, 'createInitialFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    try {
      await fn(randomPath, files)
      return assert(false, 'createInitialFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })


  it('Should initDbFiles() works', async () => {
    const random = Math.random()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const fnName = 'initDbFiles'
    const fn = <(path: string, files: myca.InitialFile[]) => Promise<void>> mods.__get__(fnName)
    const db = `${randomPath}/${config.dbDir}`
    const files = initialDbFiles

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
    for (const file of files) {
      const path = `${db}/${file.name}`

      if ( ! await isFileExists(path)) {
        assert(false, `file not exists. path: "${path}"`)
      }
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })

  it('Should initDbFiles() works with invalid param', async () => {
    const random = Math.random()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const fnName = 'initDbFiles'
    const fn = <(path: string, files: myca.InitialFile[]) => Promise<void>> mods.__get__(fnName)
    // const db = `${randomPath}/${config.dbDir}`
    let files: my.InitialFile[] = [
      { name: '', defaultValue: '' },
    ]

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn('', files)
      return assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    try {
      await fn(randomPath, files)
      return assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    files = [
      { name: 'test', defaultValue: null },
    ]
    try {
      await fn(randomPath, files)
      return assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })


  it('Should nextSerial() works', async () => {
    try {
      const serial = await myca.nextSerial('default', config)

      assert(serial === '01', `value of serial should be 01, but got: "${serial}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should nextSerial() works with blank centerName', async () => {
    try {
      const serial = await myca.nextSerial('', config)

      return assert(false, 'should throw error, but NOT')
    }
    catch (ex) {
      return assert(true)
    }
  })

  it('Should nextSerial() works with reading invalid serial', async () => {
    const centerName = 'default'
    const centerPath = await myca.getCenterPath(centerName)
    const serialFile = `${centerPath}/db/serial`

    try {
      await writeFileAsync(serialFile, 'BARZ')
      const serial = await myca.nextSerial(centerName, config)

      return assert(false, `should throw error, but NOT. serial:"${serial}"`)
    }
    catch (ex) {
      return assert(true)
    }
  })

  it('Should nextSerial() works with reading unsafe integer serial', async () => {
    const centerName = 'default'
    const centerPath = await myca.getCenterPath(centerName)
    const serialFile = `${centerPath}/db/serial`

    try {
      await writeFileAsync(serialFile, Math.pow(2, 53).toString(16))
      const serial = await myca.nextSerial(centerName, config)

      return assert(false, `should throw error, but NOT. serial:"${serial}"`)
    }
    catch (ex) {
      return assert(true)
    }
  })


})
