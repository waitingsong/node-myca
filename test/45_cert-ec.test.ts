/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
// import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { getOpensslVer } from '../src/lib/common'
import { config, initialCaOpts, initialCertOpts } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir = tmpdir()
const pathPrefix = 'myca-test-center'
// const mods = rewire('../src/lib/cert')

describe(filename, () => {
  before(async () => {
    config.opensslVer = await getOpensslVer(config.openssl)
  })
  beforeEach(async () => {
    if (config.opensslVer < '1.0.2') { return }
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      hash: 'sha256',
      CN: 'My Root CA',
      C: 'CN',
    }

    config.defaultCenterPath = `${randomPath}/${config.centerDirName}`
    await myca.initDefaultCenter()
    await myca.initCaCert(opts)
  })
  afterEach(() => {
    if (config.opensslVer < '1.0.2') { return }
    rmdir(join(config.defaultCenterPath, '../'), (err) => err && console.error(err))
  })


  it('Should genCert() works', async () => {
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      alg: 'ec',
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
    }

    try {
      const ret: myca.IssueCertRet = await myca.genCert(opts)

      assert(ret, 'result empty')
      assert(ret.csrFile, 'value of result.csrFile empty')
      assert(ret.csr && ret.csr.includes('REQUEST'), 'value of result.csr invalid')
      assert(ret.crtFile, 'value of result.certFile empty')
      assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
      assert(ret.privateKeyFile, 'value of result.privateKeyFile empty')
      assert(ret.privateUnsecureKeyFile, 'value of result.privateUnsecureKeyFile empty')
      assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
      assert(ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'), 'value of result.privateKey invalid')
      assert(ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'), 'value of result.privateUnsecureKey invalid')
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should genCert() works with invalid param', async () => {
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
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
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
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
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
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

  it('Should genCert() works with invalid C', async () => {
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',    // must 2 letters
    }

    opts.C = 'C'
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    opts.C = 'CHS'
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should genCert() works with blank C', async () => {
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
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

  it('Should genCert() works with blank CN', async () => {
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.CN = ''
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should genCert() works with zero days', async () => {
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.days = 0
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should genCert() works with negative days', async () => {
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.days = -1
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should genCert() works with invalid alg', async () => {
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.alg = <'rsa'> ''
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should genCert() works with invalid hash', async () => {
    if (config.opensslVer < '1.0.2') { return }
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      alg: 'ec',
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.hash = <'sha256'> 'fake'
    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

})
