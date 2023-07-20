import assert from 'node:assert'
import { rm } from 'node:fs/promises'

import {
  fileShortPath,
  createDirAsync,
  sleep,
  isFileExists,
} from '@waiting/shared-core'

import * as myca from '../src/index.js'
import { genCaCert } from '../src/lib/cert.ca.js'
import { removeCenterFiles } from '../src/lib/common.js'

import { initialCaOpts, initialConfig, pathPrefix, tmpDir } from './root.config.js'


describe(fileShortPath(import.meta.url), () => {
  before(async () => {
    await createDirAsync(tmpDir)
    if (initialConfig.opensslVer < '1.0.2') {
      console.info('openssl version < "1.0.2" not support ec cert generation, current is: ' + initialConfig.opensslVer)
    }
  })

  beforeEach(async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const random = Math.random().toString()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter()
  })

  afterEach(async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    await sleep(100)
    await removeCenterFiles(initialConfig.defaultCenterPath)
  })

  it('Should initCaCert() work', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      hash: 'sha256',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    await myca.initCaCert(opts)
  })

  it('Should initCaCert() work with invalid param', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
    }

    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('length of pass must at least 4'), ex.message)
    }
  })

  it('Should initCaCert() works with blank centerName', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.centerName = ''
    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('centerName empty'), ex.message)
    }
  })

  it('Should initCaCert() works with fake centerName', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.centerName = 'fake'
    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('center: fake not initialized yet'), ex.message)
    }
  })

  it('Should initCaCert() works with blank pass', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.pass = ''
    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('length of pass must at least 4'), ex.message)
    }
  })

  it('Should initCaCert() works with blank C', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.C = ''
    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of C (Country Name) must be 2 letters'), ex.message)
    }
  })

  it('Should initCaCert() works with blank CN', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.CN = ''
    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of CN (Common Name) invalid'), ex.message)
    }
  })

  it('Should initCaCert() works with zero days', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.days = 0
    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of days must greater than zero'), ex.message)
    }
  })

  it('Should initCaCert() works with negative days', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.days = -1
    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of days must greater than zero'), ex.message)
    }
  })

  it('Should initCaCert() works with invalid alg', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.alg = <'rsa'> ''
    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of param invalid'), ex.message)
    }
  })

  it('Should initCaCert() works with invalid hash', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.hash = <'sha256'> 'fake'
    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of hash invalid. must be sha256|sha384'), ex.message)
    }
  })

  // -------------------------

  it('Should genCaCert() works', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      hash: 'sha256',
      CN: 'My Root CA',
      C: 'CN',
    }

    const ret = await genCaCert(initialConfig, opts)

    assert(ret, 'result empty')
    assert(ret.centerName, 'value of result.centerName invalid')
    assert(ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'), 'value of result.privateKey invalid')
    assert(ret.pass, 'value of result.pass empty')
    assert(ret.privateKeyFile, 'value of result.privateKeyFile invalid')
    assert(await isFileExists(ret.privateKeyFile), `privateKeyFile not exists. path: "${ret.privateKeyFile}"`)
    assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
    assert(! ret.crtFile, 'value of result.crtFile should empty at this time')
    assert(! await isFileExists(ret.crtFile), `crtFile should not exists at this time. path: "${ret.crtFile}"`)
  })

})
