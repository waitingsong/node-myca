/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
// import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { decryptPrivateKey, unlinkCaCrt, unlinkCaKey } from '../src/lib/cert'
import { config, initialCaOpts, initialCertOpts } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir = tmpdir()
const pathPrefix = 'myca-test-center'
// const mods = rewire('../src/lib/cert')

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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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
    const opts: myca.CertOpts = {
      ...initialCertOpts,
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

  it('Should genCert() works with missing caKeyFile', async () => {
    const opts: myca.CertOpts = {
      ...initialCertOpts,
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
    }
    const random = Math.random()
    config.caKeyName = `fake-ca-${random}.key`

    try {
      await myca.genCert(opts)
      assert(false, 'genCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  // --------------

  it('Should decryptPrivateKey() works with invalid privateKey', async () => {
    try {
      await decryptPrivateKey('fake', <myca.PrivateKeyOpts> {})
      assert(false, 'decryptPrivateKey() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  // --------------

  it('Should unlinkCaKey() works with invalid centerName', async () => {
    try {
      await unlinkCaKey(Math.random())
      assert(false, 'unlinkCaKey() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })



})
