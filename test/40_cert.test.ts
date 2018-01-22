/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join, normalize } from 'path'
import * as assert from 'power-assert'
import rewire = require('rewire')
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { isDirExists, isFileExists } from '../src/lib/common'
import { config, initialCaOpts } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir = tmpdir()
const random = Math.random()
const pathPrefix = 'myca-test-center'
const randomPath = `${tmpDir}/${pathPrefix}-${random}`
const mods = rewire('../src/lib/cert')

config.isWin32 = process.platform === 'win32' ? true : false
config.userHome = config.isWin32 ? normalize(process.env.USERPROFILE || '') : normalize(`${process.env.HOME}`)
config.defaultCenterPath = `${randomPath}/${config.centerDirName}`
config.openssl = normalize(config.openssl)


describe(filename, () => {
  after(() => {
    rmdir(randomPath, (err) => err && console.error(err))
  })


  it('Should initCaCert() works', async () => {
    const opts: myca.CaOpts = {
      ...initialCaOpts,
      days: 10950,
      pass: 'mycapass',
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

  it('Should initCaCert() works with invalid centerName', async () => {
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
      await myca.initCaCert(opts)
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
      await myca.initCaCert(opts)
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
      await myca.initCaCert(opts)
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
      await myca.initCaCert(opts)
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
      await myca.initCaCert(opts)
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
      await myca.initCaCert(opts)
      assert(false, 'initCaCert() should throw err, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })



})
