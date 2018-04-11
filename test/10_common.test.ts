/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'

import { getOpensslVer, runOpenssl } from '../src/lib/common'
import { config } from '../src/lib/config'
import {
  createDir,
  createFile,
  isDirExists,
  isFileExists,
  readFileAsync,
} from '../src/shared/index'

const filename = basename(__filename)
const tmpDir = join(tmpdir(), 'myca-tmp')
const pathPrefix = 'myca-test-center'
const mods = rewire('../src/lib/common')


describe(filename, () => {
  before(async () => {
    await createDir(tmpDir)
  })
  after(done => {
    rmdir(tmpDir, err => err && console.error(err) || done())
  })


  it('Should runOpenssl() works', async () => {
    try {
      await runOpenssl(['version'])
    }
    catch (ex) {
      assert(false, ex)
    }
  })

  it('Should runOpenssl() works with invalid args', async () => {
    try {
      await runOpenssl(['fake'])
      assert(false, 'should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })


  it('Should isDirFileExists() works', async () => {
    const fnName = 'isDirFileExists'
    const fn = <(path: string, type: 'DIR' | 'FILE') => Promise<boolean>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      assert(await fn(tmpDir, 'DIR'), `user tmp dir should exist. path: "${tmpDir}"`)
    }
    catch (ex) {
      assert(false, ex)
    }
  })

  it('Should isDirFileExists() works with blank path', async () => {
    const fnName = 'isDirFileExists'
    const fn = <(path: string, type: 'DIR' | 'FILE') => Promise<boolean>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      assert(! await fn('', 'DIR'), 'should return false with blank path')
    }
    catch (ex) {
      assert(false, ex)
    }
  })


  it('Should createDir() works', async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    try {
      await createDir(randomPath)
    }
    catch (ex) {
      return assert(false, ex)
    }

    if (! await isDirExists(randomPath)) {
      return assert(false, `folder not exists, path: "${randomPath}"`)
    }

    rmdir(randomPath, err => err && console.error(err))
  })

  it('Should createDir() works with blank param', async () => {
    try {
      await createDir('')
      return assert(false, 'should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })


  it('Should createFile() works', async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const file = `${randomPath}/test`

    try {
      await createFile(file, random)
    }
    catch (ex) {
      return assert(false, ex)
    }

    if (! await isFileExists(file)) {
      return assert(false, `file not exists, path: "${file}"`)
    }

    try {
      const ret = (await readFileAsync(file)).toString('utf8')
      assert(ret === String(random), `content not equal. write:"${random}", read: "${ret}"`)
    }
    catch (ex) {
      assert(false, ex)
    }

    rmdir(randomPath, err => err && console.error(err))
  })

  it('Should createFile() works with object data', async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const file = `${randomPath}/test`
    const json = { key: random }
    const str = JSON.stringify(json)

    try {
      await createFile(file, json)
    }
    catch (ex) {
      return assert(false, ex)
    }

    if (! await isFileExists(file)) {
      return assert(false, `file not exists, path: "${file}"`)
    }

    try {
      const ret = (await readFileAsync(file)).toString('utf8')

      assert(ret === str, `content not equal. write:"${str}", read: "${ret}"`)
    }
    catch (ex) {
      assert(false, ex)
    }

    rmdir(randomPath, err => err && console.error(err))
  })

  it('Should createFile() works with blank path', async () => {
    try {
      await createFile('', '')
      return assert(false, 'should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })


  it('Should getOpensslVer() works', async () => {
    try {
      const ver = await getOpensslVer(config.openssl)

      if (! ver) {
        assert(false, 'ver value empty')
      }
    }
    catch (ex) {
      assert(false, ex)
    }
  })

  it('Should getOpensslVer() works with invalid cmd', async () => {
    try {
      const ver = await getOpensslVer('fake')

      if (ver) {
        assert(false, 'ver value should empty, but return: ' + ver)
      }
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should getOpensslVer() works with blank cmd', async () => {
    try {
      const ver = await getOpensslVer('')

      if (ver) {
        assert(false, 'ver value should empty, but return: ' + ver)
      }
    }
    catch (ex) {
      assert(true)
    }
  })


  it('Should isDirExists() works', async () => {
    try {
      assert(await isDirExists(tmpDir), `path should exists: "${tmpDir}"`)
    }
    catch (ex) {
      assert(false, ex)
    }
  })

  it('Should isDirExists() works with invalid path', async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    try {
      assert(! await isDirExists(randomPath), `path should NOT exists: "${randomPath}"`)
    }
    catch (ex) {
      assert(false, ex)
    }
  })

  it('Should isDirExists() works with blank path', async () => {
    try {
      assert(! await isDirExists(''), 'empty path should NOT exists')
    }
    catch (ex) {
      assert(false, ex)
    }
  })


})
