/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join, normalize } from 'path'
import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { isDirExists, isFileExists } from '../src/lib/common'
import { config, initialCaOpts, initialCertOpts } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir = tmpdir()
const random = Math.random()
const pathPrefix = 'myca-test-center'
const randomPath = `${tmpDir}/${pathPrefix}-${random}`
const mods = rewire('../src/lib/cert')

console.log('----------', config.isWin32)
config.isWin32 = process.platform === 'win32' ? true : false
config.userHome = config.isWin32 ? normalize(process.env.USERPROFILE || '') : normalize(`${process.env.HOME}`)
config.openssl = normalize(config.openssl)


describe(filename, () => {
  beforeEach(async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      keyBits: 2048,  // for speed
      hash: 'sha256',
      CN: 'My Root CA',
      C: 'CN',
    }

    config.defaultCenterPath = `${randomPath}/${config.centerDirName}`
    await myca.initDefaultCenter()
    await myca.initCaCert(opts)
  })
  afterEach(() => {
    rmdir(join(config.defaultCenterPath, '../'), (err) => err && console.error(err))
  })


  it('Should genCert() works', async () => {
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
    }

    try {
      const ret: myca.IssueCertRet = await myca.genCert(opts)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should genCert() works with invalid param', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
    }

    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should genCert() works with blank centerName', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.centerName = ''
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should genCert() works with fake centerName', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.centerName = 'fake'
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should genCert() works with blank pass', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.pass = ''
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should genCert() works with blank C', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.C = ''
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })


})
