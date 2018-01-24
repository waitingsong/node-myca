/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { getOpensslVer } from '../src/lib/common'
import { config, initialCaOpts } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir = tmpdir()
const pathPrefix = 'myca-test-center'
const mods = rewire('../src/lib/cert')


describe(filename, () => {
  before(async () => {
    config.opensslVer = await getOpensslVer(config.openssl)
    if (config.opensslVer < '1.0.2') {
      console.info('openssl version < "1.0.2" not support ec cert generation, current is: ' + config.opensslVer)
    }
  })
  beforeEach(async () => {
    if (config.opensslVer < '1.0.2') { return }
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    config.defaultCenterPath = `${randomPath}/${config.centerDirName}`
    await myca.initDefaultCenter()
  })
  afterEach(() => {
    if (config.opensslVer < '1.0.2') { return }
    rmdir(join(config.defaultCenterPath, '../'), (err) => err && console.error(err))
  })


  it('Should initCaCert() works', async () => {
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    if (config.opensslVer < '1.0.2') { return }
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
    const fn = <(options: myca.CaOpts) => Promise<myca.IssueCertRet>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret = await fn(opts)

      assert(ret, 'result empty')
      assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
      assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
      assert(ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'), 'value of result.privateKey invalid')
      assert(ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'), 'value of result.privateUnsecureKey invalid')
    }
    catch (ex) {
      return assert(false, ex)
    }
  })


})
