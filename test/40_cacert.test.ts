/// <reference types="mocha" />

import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'
import { Observable } from 'rxjs'

import * as myca from '../src/index'
import { initialCaOpts, initialConfig } from '../src/lib/config'
import {
  basename,
  createDirAsync,
  createFileAsync,
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
    await createDirAsync(tmpDir)
  })
  beforeEach(async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter().toPromise()
  })
  afterEach(() => {
    rmdir(join(initialConfig.defaultCenterPath, '../'), err => err && console.error(err))
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })


  it('Should initCaCert() works', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      keyBits: 2048,  // for speed
      hash: 'sha256',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    try {
      await myca.initCaCert(opts).toPromise()
    }
    catch (ex) {
      return assert(false, ex)
    }
  })

  it('Should initCaCert() works with invalid param', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
    }

    try {
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should initCaCert() works with blank centerName', async () => {
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
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should initCaCert() works with fake centerName', async () => {
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
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should initCaCert() works with blank pass', async () => {
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
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should initCaCert() works with blank C', async () => {
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
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should initCaCert() works with blank CN', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.CN = ''
    try {
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should initCaCert() works with zero days', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.days = 0
    try {
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should initCaCert() works with negative days', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.days = -1
    try {
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should initCaCert() works with invalid alg', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.alg = <'rsa'> ''
    try {
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  it('Should initCaCert() works with invalid hash', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      CN: 'My Root CA',
      OU: 'waitingsong.com',
      C: 'CN',
    }

    opts.hash = <'sha256'> 'fake'
    try {
      await myca.initCaCert(opts).toPromise()
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

  // -------------------------

  it('Should genCaCert() works', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      keyBits: 2048,
      hash: 'sha256',
      CN: 'My Root CA',
      C: 'CN',
    }
    const fnName = 'genCaCert'
    const fn = <(config: myca.Config, options: myca.CaOpts) => Observable<myca.IssueCaCertRet>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      const ret = await fn(initialConfig, opts).toPromise()

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

  it('Should genCaCert() works with fake existing caKeyFile', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
      keyBits: 2048,
      hash: 'sha256',
      CN: 'My Root CA',
      C: 'CN',
    }
    const random = Math.random()
    const caKeyName = `fake-ca-${random}.key`
    const caKeyFile = `${initialConfig.defaultCenterPath}/${caKeyName}`  // fake
    const p: myca.Config = {
      ...initialConfig,
      caKeyName,
    }
    const fnName = 'genCaCert'
    const fn = <(config: myca.Config, options: myca.CaOpts) => Observable<myca.IssueCaCertRet>> mods.__get__(fnName)

    if (typeof fn !== 'function') {
      return assert(false, `${fnName} is not a function`)
    }

    try {
      await createFileAsync(caKeyFile, '')
    }
    catch (ex) {
      assert(false, ex)
    }

    try {
      assert(await fn(p, opts).toPromise(), 'should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })


})
