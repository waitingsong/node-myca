/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, normalize } from 'path'
import * as assert from 'power-assert'
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { isDirExists } from '../src/lib/common'
import { config } from '../src/lib/config'

const filename = basename(__filename)
const tmpDir = tmpdir()
const random = Math.random()
const randomPath = `${tmpDir}/myca-test-${random}`
// console.log(randomPath)

config.isWin32 = process.platform === 'win32' ? true : false
config.userHome = config.isWin32 ? normalize(process.env.USERPROFILE || '') : normalize(`${process.env.HOME}`)
// config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`) // dir contains conf file and folders
config.defaultCenterPath = `${randomPath}/${config.centerDirName}`
config.openssl = normalize(config.openssl)


describe(filename, () => {
  // beforeEach(() => {
  //   config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`)
  // })
  after(() => {
    rmdir(randomPath, (err) => err && console.error(err))
  })

  it('Should initDefaultCenter() works', async () => {
    try {
      await myca.initDefaultCenter()
    }
    catch (ex) {
      return assert(false, ex)
    }

    if ( ! await isDirExists(config.defaultCenterPath)) {
      return assert(false, `default center folder not exists, path: "${config.defaultCenterPath}"`)
    }

    assert(
      await myca.isCenterInited('default'),
      `isCenterInited('default') says folder not exits. path: "${config.defaultCenterPath}"`)

  })


  it('Should getCenterPath() works', async () => {
    const centerPath = await myca.getCenterPath('default')
    const isDefaultCenterInited = await myca.isCenterInited('default')
    const dirExists = await isDirExists(centerPath)

    assert(dirExists ? isDefaultCenterInited : !isDefaultCenterInited)
  })


  it('Should initCenter() works', async () => {
    const random = Math.random()
    const centerName = `center-${random}`
    const randomPath = `${tmpDir}/myca-test-center-${random}`
    const centerPath = `${randomPath}/${config.centerDirName}`

    try {
      await myca.initCenter(centerName, centerPath)
    }
    catch (ex) {
      return assert(false, ex)
    }

    if (! await isDirExists(centerPath)) {
      return assert(false, `spcified center folder not exists, path: "${centerPath}"`)
    }

    assert(
      await myca.isCenterInited(centerName),
      `isCenterInited(${centerName}) says folder not exits. path: "${centerPath}"`)

    rmdir(randomPath, (err) => err && console.error(err))
  })



})
