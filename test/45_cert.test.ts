/// <reference types="mocha" />

import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'
import { Observable } from 'rxjs'

import * as myca from '../src/index'
import { decryptPrivateKey, sign, unlinkCaCrt, unlinkCaKey } from '../src/lib/cert'
import {
  initialCaOpts,
  initialCertOpts,
  initialConfig,
  initialIssueOpts,
  initialSignOpts,
} from '../src/lib/config'
import {
  basename,
  createDirAsync,
  isFileExists,
  join,
  readFileAsync,
  statAsync,
  tmpdir,
 } from '../src/shared/index'


const filename = basename(__filename)
const tmpDir = join(tmpdir(), 'myca-tmp')
const pathPrefix = 'myca-test-center'
const mods = rewire('../src/lib/cert')


describe(filename, () => {
  before(async () => {
    await createDirAsync(tmpDir)
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

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter().toPromise()
    await myca.initCaCert(opts).toPromise()
  })
  afterEach(() => {
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })


  describe('Should genCert() works', () => {
    it('common', async () => {
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

        if (! initialConfig.isWin32) {
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
      const opts: myca.CertOpts = {
        centerName: 'default',
        caKeyPass: 'mycapass',
        kind: 'server',   // server cert
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

        if (! initialConfig.isWin32) {
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
      const opts: myca.CertOpts = {
        ...initialCertOpts,
        days:  10950,
        pass:  'mycapass',
        CN:  'My Root CA',
        OU:  'waitingsong.com',
        C:  'CN',
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

    it('with fake centerName', async () => {
      const opts: myca.CertOpts = {
        ...initialCertOpts,
        days:   10950,
        pass:   'mycapass',
        CN:   'My Root CA',
        OU:   'waitingsong.com',
        C:   'CN',
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    it('with invalid C', async () => {
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    it('with blank CN', async () => {
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    it('with zero days', async () => {
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    it('with negative days', async () => {
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    it('with invalid alg', async () => {
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    it('with invalid hash', async () => {
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
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    it('with missing caKeyFile', async () => {
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
      initialConfig.caKeyName = `fake-ca-${random}.key`

      try {
        await myca.genCert(opts).toPromise()
        assert(false, 'genCert() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    it('generate client pfx', async () => {
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
        const ret: myca.IssueCertRet = await myca.genCert(opts).toPromise()

        assert(ret, 'result empty')
        assert(ret.csrFile, 'value of result.csrFile empty')
        assert(ret.csr && ret.csr.includes('REQUEST'), 'value of result.csr invalid')
        assert(ret.crtFile, 'value of result.certFile empty')
        assert(ret.cert && ret.cert.includes('CERTIFICATE'), 'value of result.cert invalid')
        assert(ret.privateKeyFile, 'value of result.privateKeyFile empty')
        assert(! ret.privateUnsecureKeyFile, 'value of result.privateUnsecureKeyFile should deleted') // deleted
        assert(ret.pubKey && ret.pubKey.includes('PUBLIC KEY'), 'value of result.pubKey invalid')
        assert(ret.privateKey && ret.privateKey.includes('ENCRYPTED PRIVATE KEY'), 'value of result.privateKey invalid')
        assert(
          ret.privateUnsecureKey && ret.privateUnsecureKey.includes('PRIVATE KEY'),
          'value of result.privateUnsecureKey invalid',
        )
        assert(
          ret.pfxFile && (await isFileExists(ret.pfxFile)),
          `value of result.pfxFile empty or file not exists. path: "${ret.pfxFile}"`,
        )

        if (! initialConfig.isWin32) {
          if (ret.pfxFile) {
            const fileMode = (await statAsync(ret.pfxFile)).mode.toString(8)

            assert(fileMode.slice(-3) === '600', `should pfxFile file mode be 0o600, but is ${fileMode}`)
          }
        }
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

  })
})


describe(filename, () => {
  before(async () => {
    await createDirAsync(tmpDir)
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

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter().toPromise()
    await myca.initCaCert(opts).toPromise()
  })
  afterEach(() => {
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })


  it('Should decryptPrivateKey() works with invalid privateKey', async () => {
    try {
      await decryptPrivateKey('fake', 'foopasswd', 'rsa').toPromise()
      assert(false, 'decryptPrivateKey() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })


  it('Should unlinkCaCrt() works', async () => {
    try {
      await unlinkCaCrt('default').toPromise()
    }
    catch (ex) {
      assert(false, ex)
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
    const fn = <(options: myca.PfxOpts) => Observable<string>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret: myca.IssueCertRet = await myca.genCert(opts).toPromise()
      const clientOpts: myca.PfxOpts = {
        privateKeyFile: ret.privateUnsecureKeyFile,
        crtFile: ret.crtFile,
        pfxPass: ret.pass,
      }
      let file = await fn(clientOpts).toPromise()

      assert(file && (await isFileExists(file)), `value of file empty or file not exists. path:"${file}"`)

      // with key pass
      clientOpts.privateKeyFile = ret.privateKeyFile
      clientOpts.privateKeyPass = ret.pass
      file = await fn(clientOpts).toPromise()
      assert(file && (await isFileExists(file)), `value of file empty or file not exists. path:"${file}"`)

      // with blank pfxPass
      clientOpts.pfxPass = ''
      file = await fn(clientOpts).toPromise()
      assert(file && (await isFileExists(file)), `value of file empty or file not exists. path:"${file}"`)
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

})



describe(filename, () => {
  before(async () => {
    await createDirAsync(tmpDir)
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

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter().toPromise()
    await myca.initCaCert(opts).toPromise()
  })
  afterEach(() => {
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })


  describe('Should processIssueOpts() works', () => {
    it('with invalid lesser keyBits', async () => {
      const opts: myca.IssueOpts = {
        ...initialIssueOpts,
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
      const fn = <(config: myca.Config, options: myca.IssueOpts) => Observable<myca.IssueOpts>> mods.__get__(fnName)

      if (typeof fn !== 'function') {
        return assert(false, `${fnName} is not a function`)
      }

      try {
        const ret = await fn(initialConfig, opts).toPromise()

        assert(ret.keyBits === 2048, `processed keyBits value should be 2048, but got "${ret.keyBits}"`)
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

    it('with invalid bigger keyBits', async () => {
      const opts: myca.IssueOpts = {
        ...initialIssueOpts,
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
      const fn = <(config: myca.Config, options: myca.IssueOpts) => Observable<myca.IssueOpts>> mods.__get__(fnName)

      if (typeof fn !== 'function') {
        return assert(false, `${fnName} is not a function`)
      }

      try {
        const ret = await fn(initialConfig, opts).toPromise()

        assert(ret.keyBits === 8192, `processed keyBits value should be 2048, but got "${ret.keyBits}"`)
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

    it('with 0 keyBits', async () => {
      const opts: myca.IssueOpts = {
        ...initialIssueOpts,
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
      const fn = <(config: myca.Config, options: myca.IssueOpts) => Observable<myca.IssueOpts>> mods.__get__(fnName)

      if (typeof fn !== 'function') {
        return assert(false, `${fnName} is not a function`)
      }

      try {
        const ret = await fn(initialConfig, opts).toPromise()

        assert(ret.keyBits === 2048, `processed keyBits value should be 2048, but got "${ret.keyBits}"`)
      }
      catch (ex) {
        return assert(false, ex)
      }
    })
  })

})


describe(filename, () => {
  before(async () => {
    await createDirAsync(tmpDir)
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

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter().toPromise()
    await myca.initCaCert(opts).toPromise()
  })
  afterEach(() => {
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })


  describe('Should genIssueSubj() works', () => {
    it('common', () => {
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
        const ret = fn(opts)
        const str = `/CN=${opts.CN}/C=${opts.C}`

        assert(ret === str, `result should be "${str}", but got "${ret}"`)
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

    it('with Chinese', () => {
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
        const ret = fn(opts)
        const str = `/CN=${opts.CN}/C=${opts.C}`

        assert(ret === str, `result should be "${str}", but got "${ret}"`)
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

    it('with empty DN', () => {
      const opts = <myca.CertDN> {
      }
      const fnName = 'genIssueSubj'
      const fn = <(options: myca.CertDN) => string> mods.__get__(fnName)

      if (typeof fn !== 'function') {
        return assert(false, `${fnName} is not a function`)
      }

      try {
        const ret = fn(opts)

        assert(ret === '', `result should be blank, but got "${ret}"`)
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

  })
})


describe(filename, () => {
  before(async () => {
    await createDirAsync(tmpDir)
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

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter().toPromise()
    await myca.initCaCert(opts).toPromise()
  })
  afterEach(() => {
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })


  describe('Should createRandomConfTpl() works', () => {
    it('common', async () => {
      const opts: myca.SignOpts = {
        ...initialSignOpts,
        centerPath: 'fake',
        caKeyPass: 'mycapass',
        kind: 'server',   // server cert
        days: 730,
        SAN: ['foo.com', 'bar.com', '中文'],
      }
      const fnName = 'createRandomConfTpl'
      const fn = <(config: myca.Config, signOpts: myca.SignOpts) => Observable<string>> mods.__get__(fnName)

      if (typeof fn !== 'function') {
        return assert(false, `${fnName} is not a function`)
      }

      try {
        const tpl = await fn(initialConfig, opts).toPromise()

        if (! await isFileExists(tpl)) {
          return assert(false, `tpl file crated failed. path: "${tpl}"`)
        }
        const content = await readFileAsync(tpl)

        // @ts-ignore
        for (const vv of opts.SAN) {
          assert(content.includes(vv))
        }
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

    it('for ips', async () => {
      const opts: myca.SignOpts = {
        ...initialSignOpts,
        caKeyPass: 'mycapass',
        kind: 'server',   // server cert
        days: 730,
        ips: ['127.0.0.1', '192.168.0.1'],
      }
      const fnName = 'createRandomConfTpl'
      const fn = <(config: myca.Config, signOpts: myca.SignOpts) => Observable<string>> mods.__get__(fnName)

      if (typeof fn !== 'function') {
        return assert(false, `${fnName} is not a function`)
      }

      try {
        const tpl = await fn(initialConfig, opts).toPromise()

        if (! await isFileExists(tpl)) {
          return assert(false, `tpl file crated failed. path: "${tpl}"`)
        }
        const content = await readFileAsync(tpl)

        // @ts-ignore
        for (const vv of opts.ips) {
          assert(content.includes(vv))
        }
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

    it('for ips and SAN', async () => {
      const opts: myca.SignOpts = {
        ...initialSignOpts,
        caKeyPass: 'mycapass',
        kind: 'server',   // server cert
        days: 730,
        SAN: ['foo.com', 'bar.com', '中文'],
        ips: ['127.0.0.1', '192.168.0.1'],
      }
      const fnName = 'createRandomConfTpl'
      const fn = <(config: myca.Config, signOpts: myca.SignOpts) => Observable<string>> mods.__get__(fnName)

      if (typeof fn !== 'function') {
        return assert(false, `${fnName} is not a function`)
      }

      try {
        const tpl = await fn(initialConfig, opts).toPromise()

        if (! await isFileExists(tpl)) {
          return assert(false, `tpl file crated failed. path: "${tpl}"`)
        }
        const content = await readFileAsync(tpl)

        // @ts-ignore
        for (const vv of opts.SAN) {
          assert(content.includes(vv))
        }
        // @ts-ignore
        for (const vv of opts.ips) {
          assert(content.includes(vv))
        }
      }
      catch (ex) {
        return assert(false, ex)
      }
    })

  })
})


describe(filename, () => {
  before(async () => {
    await createDirAsync(tmpDir)
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

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter().toPromise()
    await myca.initCaCert(opts).toPromise()
  })
  afterEach(() => {
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })


  it('Should sign() works', async () => {
    // copy from Should genCert() works
    const opts: myca.CertOpts = {
      centerName: 'default',
      caKeyPass: 'mycapass',
      kind: 'server',   // server cert
      days: 730,
      pass: 'fooo',   // at least 4 letters
      CN: 'www.waitingsong.com',    // Common Name
      C: 'CN',   // Country Name (2 letter code)
      SAN: ['foo.com', 'bar.com', '中文'],
      ips: ['127.0.0.1', '192.168.0.1'],
    }
    let ret: myca.IssueCertRet

    try {
      ret = await myca.genCert(opts).toPromise()

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

    ret.cert = ''
    ret.crtFile = ''
    const issueOpts = <myca.IssueOpts> { ...initialCertOpts, ...opts }

    issueOpts.centerPath = await myca.getCenterPath(issueOpts.centerName).toPromise()
    issueOpts.configFile || (issueOpts.configFile = `${issueOpts.centerPath}/${initialConfig.configName}`)
    const centerPath = issueOpts.centerPath

    // issueOpts.serial = await myca.nextSerial(issueOpts.centerName, config)
    // const csrFile = `${centerPath}/${issueOpts.kind}/${issueOpts.serial}.csr`
    const caKeyFile = join(centerPath, initialConfig.caKeyName) // ca.key
    const caCrtFile = `${centerPath}/${initialConfig.caCrtName}` // ca.crt
    const signOpts: myca.SignOpts = {
      ...initialSignOpts,
      centerPath,
      caCrtFile,
      caKeyFile,
      caKeyPass: issueOpts.caKeyPass,
      csrFile: ret.csrFile,
      configFile: issueOpts.configFile,
      SAN: issueOpts.SAN,
      ips: issueOpts.ips,
    }

    try {
      let cert: string = await sign(signOpts, initialConfig).toPromise()

      assert(cert && cert.includes(opts.CN), `result invalid. value: "${cert}"`)

      delete signOpts.SAN
      cert = await sign(signOpts, initialConfig).toPromise()
      assert(cert && cert.includes(opts.CN), `result invalid without SAN. value: "${cert}"`)

      delete signOpts.ips
      // use default config file instead of created tpl
      cert = await sign(signOpts, initialConfig).toPromise()
      assert(cert && cert.includes(opts.CN), `result invalid without configFile. value: "${cert}"`)

      cert = await sign(signOpts).toPromise()
      assert(cert && cert.includes(opts.CN), `result invalid without argument conf. value: "${cert}"`)
    }
    catch (ex) {
      assert(false, ex)
    }
  })

})


describe(filename, () => {
  before(async () => {
    await createDirAsync(tmpDir)
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

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter().toPromise()
    await myca.initCaCert(opts).toPromise()
  })
  afterEach(() => {
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })


  // at last!

  describe('Should unlinkCaKey() works', () => {

    it('with invalid centerName', async () => {
      try {
        await unlinkCaKey(Math.random() + '').toPromise()
        assert(false, 'unlinkCaKey() should throw err, but NOT')
      }
      catch (ex) {
        assert(true)
      }
    })

    // at last run
    it('common', async () => {
      try {
        await unlinkCaKey('default').toPromise()
      }
      catch (ex) {
        assert(false, ex)
      }
    })

  })
})
