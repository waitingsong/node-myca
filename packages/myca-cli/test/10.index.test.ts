import { rm, rename } from 'fs/promises'
import assert from 'node:assert/strict'
import { join } from 'node:path'

import {
  userHome,
  fileShortPath,
  isDirExists,
} from '@waiting/shared-core'

import { runCmd, RunCmdArgs } from '../src/index.js'

import { testBaseDir } from './root.config.js'


const defaultCenterPath = join(userHome, '.myca')
let defaultCenterPathBak = join(userHome, '.myca-' + Math.random().toString())
const initArgs: RunCmdArgs = {
  cmd: 'init',
  options: null,
  debug: true,
}

describe(fileShortPath(import.meta.url), () => {

  before(async () => {
    const exists = await isDirExists(defaultCenterPath)
    if (exists) {
      await rename(defaultCenterPath, defaultCenterPathBak)
    }
    else {
      defaultCenterPathBak = ''
    }
  })

  after(async () => {
    await rm(defaultCenterPath, { recursive: true, force: true })
    if (defaultCenterPathBak) {
      await rename(defaultCenterPathBak, defaultCenterPath)
    }
  })

  describe('Should myca init work', () => {
    it('normal', async () => {
      const ret = await runCmd(initArgs)
      assert(ret.includes('Default center created at path'), ret)
      assert(ret.includes(defaultCenterPath), ret)
    })
  })

  describe('Should myca initca work', () => {
    it('normal', async () => {
      const args: RunCmdArgs = {
        cmd: 'initca',
        options: {
          days: 10950,
          pass: 'mycapass',
          CN: 'my root ca',
          O: 'my company',
          C: 'CN',

        },
        debug: false,
      }
      const ret = await runCmd(args)
      assert(ret.includes('CA certificate created with:'), ret)
      assert(ret.includes('centerName: "default"'), ret)
      assert(ret.includes('crtFile'), ret)
      assert(ret.includes('privateKeyFile'), ret)
      assert(ret.includes(defaultCenterPath), ret)
    })
  })

})
