/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { decryptPrivateKey, unlinkCaCrt, unlinkCaKey } from '../src/lib/cert'
import { createDir, isFileExists, readFileAsync } from '../src/lib/common'
import { config, initialCaOpts, initialCertOpts } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir =  join(tmpdir(), 'myca-tmp')
const pathPrefix = 'myca-test-center'
const mods = rewire('../src/lib/cert')

describe(filename, () => {
  before(async () => {
    await createDir(tmpDir)
  })
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
  after((done) => {
    rmdir(tmpDir, (err) => err && console.error(err) || done())
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

  it('Should unlinkCaCrt() works', async () => {
    try {
      await unlinkCaCrt('default')
    }
    catch (ex) {
      assert(false, ex)
    }
  })


  it('Should genCert() works generate client pfx', async () => {
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'client',   // pfx
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
      assert(! ret.privateUnsecureKeyFile, 'value of result.privateUnsecureKeyFile should deleted') // deleted
      assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
      assert(ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'), 'value of result.privateKey invalid')
      assert(ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'), 'value of result.privateUnsecureKey invalid')
      assert(ret.pfxFile && (await isFileExists(ret.pfxFile)), `value of result.pfxFile empty or file not exists. path: "${ret.pfxFile}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should outputClientCert() works', async () => {
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
    }
    const fnName = 'outputClientCert'
    const fn = <(options: myca.PfxOpts) => Promise<string>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret: myca.IssueCertRet = await myca.genCert(opts)
      const clientOpts: myca.PfxOpts = {
        privateKeyFile: ret.privateUnsecureKeyFile,
        crtFile: ret.crtFile,
        pfxPass: ret.pass,
      }
      let file = await fn(clientOpts)

      assert(file && (await isFileExists(file)), `value of file empty or file not exists. path:"${file}"`)

      // with key pass
      clientOpts.privateKeyFile = ret.privateKeyFile
      clientOpts.privateKeyPass = ret.pass
      file = await fn(clientOpts)
      assert(file && (await isFileExists(file)), `value of file empty or file not exists. path:"${file}"`)

      // with blank pfxPass
      clientOpts.pfxPass = ''
      file = await fn(clientOpts)
      assert(file && (await isFileExists(file)), `value of file empty or file not exists. path:"${file}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })


  it('Should processIssueOpts() works with invalid lesser keyBits', async () => {
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
      keyBits: 2047,
      alg: 'rsa',   // must specify
    }
    const fnName = 'processIssueOpts'
    const fn = <(config: myca.Config, options: myca.IssueOpts) => Promise<myca.IssueOpts>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret = await fn(config, opts)

      assert(ret.keyBits === 2048, `processed keyBits value should be 2048, but got "${ret.keyBits}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should processIssueOpts() works with invalid bigger keyBits', async () => {
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
      keyBits: 8193,
      alg: 'rsa',
    }
    const fnName = 'processIssueOpts'
    const fn = <(config: myca.Config, options: myca.IssueOpts) => Promise<myca.IssueOpts>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret = await fn(config, opts)

      assert(ret.keyBits === 8192, `processed keyBits value should be 2048, but got "${ret.keyBits}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should processIssueOpts() works with 0 keyBits', async () => {
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
      keyBits: 0,
      alg: 'rsa',
    }
    const fnName = 'processIssueOpts'
    const fn = <(config: myca.Config, options: myca.IssueOpts) => Promise<myca.IssueOpts>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret = await fn(config, opts)

      assert(ret.keyBits === 2048, `processed keyBits value should be 2048, but got "${ret.keyBits}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should genIssueSubj() works', async () => {
    const opts = <myca.CertDN> {
      CN: 'waitingsong',
      C: 'CN',
    }
    const fnName = 'genIssueSubj'
    const fn = <(options: myca.CertDN) => string> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret = await fn(opts)
      const str = `/CN=${opts.CN}/C=${opts.C}`

      assert(ret === str, `result should be "${str}", but got "${ret}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should genIssueSubj() works with Chinese', async () => {
    const opts = <myca.CertDN> {
      CN: 'waitingsong中文',
      C: 'CN',
    }
    const fnName = 'genIssueSubj'
    const fn = <(options: myca.CertDN) => string> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret = await fn(opts)
      const str = `/CN=${opts.CN}/C=${opts.C}`

      assert(ret === str, `result should be "${str}", but got "${ret}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })


  it('Should createRandomConfTpl() works', async () => {
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
      keyBits: 2048,
      alg: 'rsa',
      SAN: ['foo.com', 'bar.com', '中文'],
    }
    const fnName = 'createRandomConfTpl'
    const fn = <(config: myca.Config, signOpts: myca.SignOpts) => Promise<string>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const tpl = await fn(config, opts)

      if (! await isFileExists(tpl)) {
        return assert(false, `tpl file crated failed. path: "${$tpl}"`)
      }
      const content = await readFileAsync(tpl)

      for (const vv of opts.SAN) {
        assert(content.includes(vv))
      }
    }
    catch (ex) {
      return assert(false, ex)
    }
  })


  it('Should createRandomConfTpl() works for ips', async () => {
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
      keyBits: 2048,
      alg: 'rsa',
      ips: ['127.0.0.1', '192.168.0.1'],
    }
    const fnName = 'createRandomConfTpl'
    const fn = <(config: myca.Config, signOpts: myca.SignOpts) => Promise<string>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const tpl = await fn(config, opts)

      if (! await isFileExists(tpl)) {
        return assert(false, `tpl file crated failed. path: "${$tpl}"`)
      }
      const content = await readFileAsync(tpl)

      for (const vv of opts.ips) {
        assert(content.includes(vv))
      }
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should createRandomConfTpl() works for ips and SAN', async () => {
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
      keyBits: 2048,
      alg: 'rsa',
      SAN: ['foo.com', 'bar.com', '中文'],
      ips: ['127.0.0.1', '192.168.0.1'],
    }
    const fnName = 'createRandomConfTpl'
    const fn = <(config: myca.Config, signOpts: myca.SignOpts) => Promise<string>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const tpl = await fn(config, opts)

      if (! await isFileExists(tpl)) {
        return assert(false, `tpl file crated failed. path: "${$tpl}"`)
      }
      const content = await readFileAsync(tpl)

      for (const vv of opts.SAN) {
        assert(content.includes(vv))
      }
      for (const vv of opts.ips) {
        assert(content.includes(vv))
      }
    }
    catch (ex) {
      return assert(false, ex)
    }
  })




  // --------------

  // at last!
  it('Should unlinkCaKey() works with invalid centerName', async () => {
    try {
      await unlinkCaKey(Math.random() + '')
      assert(false, 'unlinkCaKey() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  // at last run
  it('Should unlinkCaKey() works', async () => {
    try {
      await unlinkCaKey('default')
    }
    catch (ex) {
      assert(false, ex)
    }
  })


})
