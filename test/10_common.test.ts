/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import {
  createDir,
  createFile,
  getOpensslVer,
  isDirExists,
  isFileExists,
  readFileAsync } from '../src/lib/common'
import { config } from '../src/lib/config'

const filename = basename(__filename)
const tmpDir = tmpdir()
const pathPrefix = 'myca-test-center'


describe(filename, () => {
  it('Should createDir() works', async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    try {
      await createDir(randomPath)
    }
    catch (ex) {
      return assert(false, ex)
    }

    if ( ! await isDirExists(randomPath)) {
      return assert(false, `folder not exists, path: "${randomPath}"`)
    }

    rmdir(randomPath, (err) => err && console.error(err))
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

    if ( ! await isFileExists(file)) {
      return assert(false, `file not exists, path: "${file}"`)
    }

    try {
      const ret = (await readFileAsync(file)).toString('utf8')
      assert(ret === String(random), `content not equal. write:"${random}", read: "${ret}"`)
    }
    catch (ex) {
      assert(false, ex)
    }

    rmdir(randomPath, (err) => err && console.error(err))
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

    if ( ! await isFileExists(file)) {
      return assert(false, `file not exists, path: "${file}"`)
    }

    try {
      const ret = (await readFileAsync(file)).toString('utf8')

      assert(ret === str, `content not equal. write:"${str}", read: "${ret}"`)
    }
    catch (ex) {
      assert(false, ex)
    }

    rmdir(randomPath, (err) => err && console.error(err))
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

      if ( ! ver) {
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


})
