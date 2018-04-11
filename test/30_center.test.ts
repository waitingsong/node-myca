/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { config, initialDbFiles } from '../src/lib/config'
import {
  createDir,
  isDirExists,
  isFileExists,
  unlinkAsync,
  writeFileAsync,
} from '../src/shared/index'


const filename = basename(__filename)
const tmpDir = join(tmpdir(), 'myca-tmp')
const pathPrefix = 'myca-test-center'
const mods = rewire('../src/lib/center')

describe(filename, () => {
  before(async () => {
    await createDir(tmpDir)
  })
  beforeEach(async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    config.defaultCenterPath = `${randomPath}/${config.centerDirName}`
    await myca.initDefaultCenter()
  })
  afterEach(() => {
    rmdir(join(config.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err && console.error(err) || done())
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

    rmdir(randomPath, err => err && console.error(err))
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
    const fn = <(config: myca.Config, centerName: string, path: string) => Promise<void>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(config, centerName, centerPath)
    }
    catch (ex) {
      return assert(false, ex)
    }

    if (! await isDirExists(centerPath)) {
      return assert(false, `spcified center folder not exists, path: "${centerPath}"`)
    }

    rmdir(randomPath, err => err && console.error(err))
  })

  it('Should createCenter() works', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]
    const fnName = 'createCenter'
    const fn = <(config: myca.Config, centerName: string, path: string) => Promise<void>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(config, centerName, centerPath)
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

    rmdir(randomPath, err => err && console.error(err))
  })

  it('Should createCenter() works with invalid param', async () => {
    const random = Math.random()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const fnName = 'createCenter'
    const fn = <(config: myca.Config, centerName: string, path: string) => Promise<void>> mods.__get__(fnName)
    const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(config, '', centerPath)
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

    rmdir(randomPath, err => err && console.error(err))
  })

  it('Should createCenter() works with invalid param', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const fnName = 'createCenter'
    const fn = <(config: myca.Config, centerName: string, path: string) => Promise<void>> mods.__get__(fnName)
    const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(config, centerName, '')
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

    rmdir(randomPath, err => err && console.error(err))
  })


  it('Should createCenterListFile() works', async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const randomFile = `${randomPath}/test`
    const fnName = 'createCenterListFile'
    const fn = <(file: string) => Promise<void>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(randomFile)
    }
    catch (ex) {
      return assert(false, ex)
    }

    try {
      await fn(randomFile)
      assert(false, `should throw error during create duplicate file, but NOT. file: "${randomFile}"`)
    }
    catch (ex) {
      return assert(true)
    }

    rmdir(randomPath, err => err && console.error(err))
  })


  it('Should initDbFiles() works', async () => {
    const random = Math.random()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const fnName = 'initDbFiles'
    const fn = <(config: myca.Config, path: string, files: myca.InitialFile[]) => Promise<void>> mods.__get__(fnName)
    const db = `${randomPath}/${config.dbDir}`
    const files = initialDbFiles

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(config, randomPath, files)
    }
    catch (ex) {
      rmdir(randomPath, err => err && console.error(err))
      return assert(false, ex)
    }
    for (const file of files) {
      const path = `${db}/${file.name}`

      if (! await isFileExists(path)) {
        assert(false, `file not exists. path: "${path}"`)
      }
    }

    rmdir(randomPath, err => err && console.error(err))
  })

  it('Should initDbFiles() works without mode value', async () => {
    const random = Math.random()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const fnName = 'initDbFiles'
    const fn = <(config: myca.Config, path: string, files: myca.InitialFile[]) => Promise<void>> mods.__get__(fnName)
    const db = `${randomPath}/${config.dbDir}`
    const files = [
      {
        name: 'serial',
        defaultValue: '01',
      },
      {
        name: 'index',
        defaultValue: '',
        mode: 0o644,
      },
    ]

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(config, randomPath, files)
    }
    catch (ex) {
      rmdir(randomPath, err => err && console.error(err))
      return assert(false, ex)
    }
    for (const file of files) {
      const path = `${db}/${file.name}`

      if (! await isFileExists(path)) {
        assert(false, `file not exists. path: "${path}"`)
      }
    }

    rmdir(randomPath, err => err && console.error(err))
  })


  it('Should initDbFiles() works with invalid param', async () => {
    const random = Math.random()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const fnName = 'initDbFiles'
    const fn = <(config: myca.Config, path: string, files: myca.InitialFile[]) => Promise<void>> mods.__get__(fnName)
    // const db = `${randomPath}/${config.dbDir}`
    let files: my.InitialFile[] = [
      { name: '', defaultValue: '' },
    ]

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await fn(config, '', files)
      return assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    try {
      await fn(config, randomPath, files)
      return assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    files = [
      { name: 'test', defaultValue: null },
    ]
    try {
      await fn(config, randomPath, files)
      return assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    files = []
    try {
      await fn(config, randomPath, files)
      return assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    rmdir(randomPath, err => err && console.error(err))
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

      return assert(serial, 'should throw error, but NOT')
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

  it('Should nextSerial() works with reading 0', async () => {
    const centerName = 'default'
    const centerPath = await myca.getCenterPath(centerName)
    const serialFile = `${centerPath}/db/serial`

    try {
      await writeFileAsync(serialFile, 0)
      const serial = await myca.nextSerial(centerName, config)

      return assert(false, `should throw error, but NOT. serial:"${serial}"`)
    }
    catch (ex) {
      return assert(true)
    }
  })


  it('Should addCenterList() works', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const fnName = 'addCenterList'
    const fn = <(config: myca.Config, key: string, path: string) => Promise<void>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await createDir(centerPath)
      await fn(config, centerName, centerPath)
    }
    catch (ex) {
      return assert(false, ex)
    }

    if (! await isDirExists(centerPath)) {
      return assert(false, `spcified center folder not exists, path: "${centerPath}"`)
    }

    rmdir(randomPath, err => err && console.error(err))
  })

  it('Should addCenterList() works with invalid param', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`
    const fnName = 'addCenterList'
    const fn = <(config: myca.Config, key: string, path: string) => Promise<void>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    await createDir(centerPath)

    try {
      await fn(config, '', centerPath)
      return assert(false, 'should throw error with blank centerName, but NOT')
    }
    catch (ex) {
      assert(true)
    }
    try {
      await fn(config, centerName, '')
      return assert(false, 'should throw error with blank centerPath, but NOT')
    }
    catch (ex) {
      assert(true)
    }
    try {
      await fn(config, 'default', centerPath)
      return assert(false, 'should throw error with blank centerPath, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    if (! await isDirExists(centerPath)) {
      return assert(false, `spcified center folder not exists, path: "${centerPath}"`)
    }

    rmdir(randomPath, err => err && console.error(err))
  })


  it('Should loadCenterList() works', async () => {
    const fnName = 'loadCenterList'
    const fn = <(config: myca.Config) => Promise<myca.CenterList | null>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret = await fn(config)

      if (! ret || ! ret.default) {
        assert(false, 'should return valid centerList object')
      }
    }
    catch (ex) {
      assert(false, ex)
    }
  })


  // --------------- at last

  it('Should loadCenterList() works without centerList file', async () => {
    const fnName = 'loadCenterList'
    const fn = <(config: myca.Config) => Promise<myca.CenterList | null>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }
    const file = join(config.defaultCenterPath, config.centerListName)

    try {
      await unlinkAsync(file)
      await fn(config)
      assert(false, 'should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })


})
