import assert from 'node:assert'
import { stat } from 'node:fs/promises'

import {
  createDirAsync,
  fileShortPath,
  sleep,
} from '@waiting/shared-core'

import * as myca from '../src/index.js'
import { removeCenterFiles } from '../src/lib/common.js'
import { initialCertOpts, initialDbFiles } from '../src/lib/config.js'

import { caOptions, initialConfig, pathPrefix, tmpDir } from './root.config.js'


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
    await myca.initCaCert({
      ...caOptions,
    })
  })

  afterEach(async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    await sleep(100)
    await removeCenterFiles(initialConfig.defaultCenterPath)
  })

  describe('Should genCert() work', () => {
    it('common', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
      const opts: myca.CertOpts = {
        centerName: 'default',
        caKeyPass: 'mycapass',
        kind: 'client',
        alg: 'ec',
        days: 730,
        pass: 'fooo', // at least 4 letters
        CN: 'www.waitingsong.com', // Common Name
        C: 'CN', // Country Name (2 letter code)
      }

      const ret: myca.IssueCertRet = await myca.genCert(opts)
      console.log(ret)

      assert(ret, 'result empty')
      assert(ret.csrFile, 'value of result.csrFile empty')
      assert(ret.csr && ret.csr.includes('REQUEST'), 'value of result.csr invalid')
      assert(ret.crtFile, 'value of result.certFile empty')
      assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
      assert(ret.privateKeyFile, 'value of result.privateKeyFile empty')
      assert(ret.privateUnsecureKeyFile === '')
      assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
      assert(ret.pfxFile?.endsWith('.p12'), 'value of result.pfxFile invalid')
      assert(
        ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'),
        'value of result.privateKey invalid',
      )
      assert(
        ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'),
        'value of result.privateUnsecureKey invalid',
      )

    })

    it('with ips and SAN', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
      const opts: myca.CertOpts = {
        centerName: 'default',
        caKeyPass: 'mycapass',
        kind: 'client',
        alg: 'ec',
        days: 730,
        pass: 'fooo', // at least 4 letters
        CN: 'www.waitingsong.com', // Common Name
        C: 'CN', // Country Name (2 letter code),
        ips: ['127.0.0.1'],
        SAN: ['localhost'],
      }

      const ret: myca.IssueCertRet = await myca.genCert(opts)

      assert(ret, 'result empty')
      assert(ret.csrFile, 'value of result.csrFile empty')
      assert(ret.csr && ret.csr.includes('REQUEST'), 'value of result.csr invalid')
      assert(ret.crtFile, 'value of result.certFile empty')
      assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
      assert(ret.privateKeyFile, 'value of result.privateKeyFile empty')
      assert(ret.privateUnsecureKeyFile === '')
      assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
      assert(ret.pfxFile?.endsWith('.p12'), 'value of result.pfxFile invalid')
      assert(
        ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'),
        'value of result.privateKey invalid',
      )
      assert(
        ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'),
        'value of result.privateUnsecureKey invalid',
      )
    })

    it('with passing conf', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
      const opts: myca.CertOpts = {
        centerName: 'default',
        caKeyPass: 'mycapass',
        kind: 'client',
        alg: 'ec',
        days: 730,
        pass: 'fooo', // at least 4 letters
        CN: 'www.waitingsong.com', // Common Name
        C: 'CN', // Country Name (2 letter code)
      }

      const ret: myca.IssueCertRet = await myca.genCert(opts, initialConfig)

      assert(ret, 'result empty')
      assert(ret.csrFile, 'value of result.csrFile empty')
      assert(ret.csr && ret.csr.includes('REQUEST'), 'value of result.csr invalid')
      assert(ret.crtFile, 'value of result.certFile empty')
      assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
      assert(ret.privateKeyFile, 'value of result.privateKeyFile empty')
      assert(ret.privateUnsecureKeyFile === '')
      assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
      assert(ret.pfxFile?.endsWith('.p12'), 'value of result.pfxFile invalid')
      assert(
        ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'),
        'value of result.privateKey invalid',
      )
      assert(
        ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'),
        'value of result.privateUnsecureKey invalid',
      )
    })

    it('with invalid param', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
      const opts: myca.CertOpts = {
        ...initialCertOpts,
      }

      try {
        await myca.genCert(opts)
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('length of pass must at least 4'), ex.message)
      }
    })

    it('with blank centerName', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        assert(ex instanceof Error)
        assert(ex.message.includes('centerPath: "" not exits for centerName: "" '), ex.message)
        assert(ex.message.includes('should create center dir by calling initCenter(centerName, path)'), ex.message)
      }
    })

    it('work with fake centerName', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        assert(ex instanceof Error)
        assert(ex.message.includes(`centerPath: "" not exits for centerName: "${opts.centerName}"`), ex.message)
        assert(ex.message.includes('should create center dir by calling initCenter(centerName, path)'), ex.message)
      }
    })

    it('with blank pass', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        assert(ex instanceof Error)
        assert(ex.message.includes('length of pass must at least 4'), ex.message)
      }
    })

    it('with invalid C', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
      const opts: myca.CertOpts = {
        ...initialCertOpts,
        alg: 'ec',
        days: 10950,
        pass: 'mycapass',
        CN: 'My Root CA',
        OU: 'waitingsong.com',
        C: 'CN', // must 2 letters
      }

      opts.C = 'C'
      try {
        await myca.genCert(opts)
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('value of C (Country Name) must be 2 letters'), ex.message)
      }

      opts.C = 'CHS'
      try {
        await myca.genCert(opts)
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('value of C (Country Name) must be 2 letters'), ex.message)
      }
    })

    it('with blank C', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        assert(ex instanceof Error)
        assert(ex.message.includes('value of C (Country Name) must be 2 letters'), ex.message)
      }
    })

    it('with blank CN', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        assert(ex instanceof Error)
        assert(ex.message.includes('value of CN (Common Name) invalid'), ex.message)
      }
    })

    it('with zero days', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        assert(ex instanceof Error)
        assert(ex.message.includes('value of days must greater than zero'), ex.message)
      }
    })

    it('with negative days', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        assert(ex instanceof Error)
        assert(ex.message.includes('value of days must greater than zero'), ex.message)
      }
    })

    it('with invalid alg', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        assert(ex instanceof Error)
        assert(ex.message.includes('value of param invalid'), ex.message)
      }
    })

    it('with invalid hash', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
      const opts: myca.CertOpts = {
        ...initialCertOpts,
        alg: 'ec',
        days: 10950,
        pass: 'mycapass',
        CN: 'My Root CA',
        OU: 'waitingsong.com',
        C: 'CN',
      }

      opts.hash = 'fake' as 'sha256'
      try {
        await myca.genCert(opts)
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('value of hash invalid. must be sha256|sha384'), ex.message)
      }
    })

  })
})
