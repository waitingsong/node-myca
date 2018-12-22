/// <reference types="mocha" />

import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { getOpensslVer } from '../src/lib/common'
import { initialCaOpts, initialConfig } from '../src/lib/config'
import {
  basename,
  createDir,
  isFileExists,
  join,
  tmpdir,
 } from '../src/shared/index'


const filename = basename(__filename)
const tmpDir = join(tmpdir(), 'myca-tmp')
const pathPrefix = 'myca-test-center'
const mods = rewire('../src/lib/cert')


describe(filename, () => {
  before(async () => {
    await createDir(tmpDir)
    initialConfig.opensslVer = await getOpensslVer(initialConfig.openssl)
    if (initialConfig.opensslVer < '1.0.2') {
      console.info('openssl version < "1.0.2" not support ec cert generation, current is: ' + initialConfig.opensslVer)
    }
  })
  beforeEach(async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter()
  })
  afterEach(() => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })


  it('Should initCaCert() works', async () => {
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

    try {
      await myca.initCaCert(opts)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should initCaCert() works with invalid param', async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    const opts: myca.CaOpts = {
      ...initialCaOpts,
    }

    try {
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
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
      assert(true)
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
      assert(true)
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
      assert(true)
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
      assert(true)
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
      assert(true)
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
      assert(true)
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
      assert(true)
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
      assert(true)
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
      assert(true)
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
    const fnName = 'genCaCert'
    const fn = <(config: myca.Config, options: myca.CaOpts) => Promise<myca.IssueCaCertRet>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret = await fn(initialConfig, opts)

      assert(ret, 'result empty')
      assert(ret.centerName, 'value of result.centerName invalid')
      assert(ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'), 'value of result.privateKey invalid')
      assert(ret.pass, 'value of result.pass empty')
      assert(ret.privateKeyFile, 'value of result.privateKeyFile invalid')
      assert(await isFileExists(ret.privateKeyFile), `privateKeyFile not exists. path: "${ret.privateKeyFile}"`)
      assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
      assert(! ret.crtFile, 'value of result.crtFile should empty at this time')
      assert(! await isFileExists(ret.crtFile), `crtFile should not exists at this time. path: "${ret.crtFile}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })


})
