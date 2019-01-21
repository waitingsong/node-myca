/// <reference types="mocha" />

import {
  basename,
  createDir,
  join,
  statAsync,
  tmpdir,
 } from '@waiting/shared-core'
import * as assert from 'power-assert'
// import rewire = require('rewire')
import * as rmdir from 'rimraf'
import { defer } from 'rxjs'
import { concatMap } from 'rxjs/operators'

import * as myca from '../src/index'
import { getOpensslVer } from '../src/lib/common'
import { initialCaOpts, initialCertOpts, initialConfig } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir = join(tmpdir(), 'myca-tmp')
const pathPrefix = 'myca-test-center'
// const mods = rewire('../src/lib/cert')

describe(filename, () => {
  before(done => {
    defer(() => createDir(tmpDir))
      .pipe(
        concatMap(() => getOpensslVer(initialConfig.openssl)),
      )
      .subscribe(
        version => {
          initialConfig.opensslVer = version
          if (initialConfig.opensslVer < '1.0.2') {
            console.info('openssl version < "1.0.2" not support ec cert generation, current is: ' +
             initialConfig.opensslVer)
          }
        },
        (err: Error) => {
          assert(false, err.message)
        },
        done,
      )
  })
  beforeEach(async () => {
    if (initialConfig.opensslVer < '1.0.2') { return }
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

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter().toPromise()
    await myca.initCaCert(opts).toPromise()
  })
  afterEach(() => {
    if (initialConfig.opensslVer < '1.0.2') { return }
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })

  describe('Should genCert() works', () => {
    it('common', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        const ret: myca.IssueCertRet = await myca.genCert(opts).toPromise()

        assert(ret, 'result empty')
        assert(ret.csrFile, 'value of result.csrFile empty')
        assert(ret.csr && ret.csr.includes('REQUEST'), 'value of result.csr invalid')
        assert(ret.crtFile, 'value of result.certFile empty')
        assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
        assert(ret.privateKeyFile, 'value of result.privateKeyFile empty')
        assert(ret.privateUnsecureKeyFile, 'value of result.privateUnsecureKeyFile empty')
        assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
        assert(
          ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'),
          'value of result.privateKey invalid',
        )
        assert(
          ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'),
          'value of result.privateUnsecureKey invalid',
        )

        if (!initialConfig.isWin32) {
          let fileMode = (await statAsync(ret.privateKeyFile)).mode.toString(8)

          assert(fileMode.slice(-3) === '600', `should privateKeyFile file mode be 0o600, but is ${fileMode}`)
          fileMode = (await statAsync(ret.privateUnsecureKeyFile)).mode.toString(8)
          assert(fileMode.slice(-3) === '600', `should privateUnsecureKeyFile file mode be 0o600, but is ${fileMode}`)
        }
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

    it('with ips and SAN', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
      const opts: myca.CertOpts = {
        centerName: 'default',
        caKeyPass: 'mycapass',
        kind: 'server',   // server cert
        alg: 'ec',
        days: 730,
        pass: 'fooo',   // at least 4 letters
        CN: 'www.waitingsong.com',    // Common Name
        C: 'CN',   // Country Name (2 letter code),
        ips: ['127.0.0.1'],
        SAN: ['localhost'],
      }

      try {
        const ret: myca.IssueCertRet = await myca.genCert(opts).toPromise()

        assert(ret, 'result empty')
        assert(ret.csrFile, 'value of result.csrFile empty')
        assert(ret.csr && ret.csr.includes('REQUEST'), 'value of result.csr invalid')
        assert(ret.crtFile, 'value of result.certFile empty')
        assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
        assert(ret.privateKeyFile, 'value of result.privateKeyFile empty')
        assert(ret.privateUnsecureKeyFile, 'value of result.privateUnsecureKeyFile empty')
        assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
        assert(
          ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'),
          'value of result.privateKey invalid',
        )
        assert(
          ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'),
          'value of result.privateUnsecureKey invalid',
        )

        if (!initialConfig.isWin32) {
          let fileMode = (await statAsync(ret.privateKeyFile)).mode.toString(8)

          assert(fileMode.slice(-3) === '600', `should privateKeyFile file mode be 0o600, but is ${fileMode}`)
          fileMode = (await statAsync(ret.privateUnsecureKeyFile)).mode.toString(8)
          assert(fileMode.slice(-3) === '600', `should privateUnsecureKeyFile file mode be 0o600, but is ${fileMode}`)
        }
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

    it('with passing conf', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
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
        const ret: myca.IssueCertRet = await myca.genCert(opts, initialConfig).toPromise()

        assert(ret, 'result empty')
        assert(ret.csrFile, 'value of result.csrFile empty')
        assert(ret.csr && ret.csr.includes('REQUEST'), 'value of result.csr invalid')
        assert(ret.crtFile, 'value of result.certFile empty')
        assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
        assert(ret.privateKeyFile, 'value of result.privateKeyFile empty')
        assert(ret.privateUnsecureKeyFile, 'value of result.privateUnsecureKeyFile empty')
        assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
        assert(
          ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'),
          'value of result.privateKey invalid',
        )
        assert(
          ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'),
          'value of result.privateUnsecureKey invalid',
        )
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

    it('with invalid param', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }
      const opts: myca.CertOpts = {
        ...initialCertOpts,
      }

      try {
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    it('works with fake centerName', async () => {
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
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
        C: 'CN',    // must 2 letters
      }

      opts.C = 'C'
      try {
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }

      opts.C = 'CHS'
      try {
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
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

      opts.hash = <'sha256'> 'fake'
      try {
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })


  })
})
