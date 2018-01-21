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

config.isWin32 = process.platform === 'win32' ? true : false
config.userHome = config.isWin32 ? normalize(process.env.USERPROFILE || '') : normalize(`${process.env.HOME}`)
config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`) // dir contains conf file and folders
config.openssl = normalize(config.openssl)


describe(filename, () => {
  beforeEach(() => {
    config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`)
  })

  it('Should initDefaultCenter() works', async () => {
    const tmp = tmpdir()
    const random = Math.random()
    const randomPath = `${tmp}/myca-test-${random}`

    config.defaultCenterPath = `${randomPath}/${config.centerDirName}`

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

    rmdir(randomPath, (err) => {
      err && console.error(err)
    })
  })


  it('Should getCenterPath() works', async () => {
    const centerPath = await myca.getCenterPath('default')
    const isDefaultCenterInited = await myca.isCenterInited('default')
    const dirExists = await isDirExists(centerPath)

    assert(dirExists ? isDefaultCenterInited : !isDefaultCenterInited)
  })


})
