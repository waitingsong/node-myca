/// <reference types="node" />
/// <reference types="mocha" />

import { basename, normalize } from 'path'
import * as assert from 'power-assert'

import * as myca from '../src/index'
import { isDirExists } from '../src/lib/common'
import { config } from '../src/lib/config'

const filename = basename(__filename)

config.isWin32 = process.platform === 'win32' ? true : false
config.userHome = config.isWin32 ? normalize(process.env.USERPROFILE || '') : normalize(`${process.env.HOME}`)
config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`) // dir contains conf file and folders
config.openssl = normalize(config.openssl)

let isDefaultCenterInited = false

describe(filename, () => {

  it('Should getCenterPath() works', async () => {
    const centerPath = await myca.getCenterPath('default')
    const isDefaultCenterInited = await myca.isCenterInited('default')
    const dirExists = await isDirExists(centerPath)

    assert(dirExists ? isDefaultCenterInited : ! isDefaultCenterInited)
  })


})
