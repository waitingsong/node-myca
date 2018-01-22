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


})
