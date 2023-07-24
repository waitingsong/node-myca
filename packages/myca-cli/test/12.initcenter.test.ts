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
  beforeEach(async () => {
    const ret = await runCmd(initArgs)
    assert(ret.includes('Default center created at path'), ret)
    assert(ret.includes(defaultCenterPath), ret)
  })

  after(async () => {
    await rm(defaultCenterPath, { recursive: true, force: true })
    if (defaultCenterPathBak) {
      await rename(defaultCenterPathBak, defaultCenterPath)
    }
  })

  describe('Should myca initcenter works', () => {
    it('normal', async () => {
      const name = 'center-' + Math.random().toString()
      const args: RunCmdArgs = {
        cmd: 'initcenter',
        options: {
          _: [],
          name,
        },
        debug: false,
      }
      const ret = await runCmd(args)
      assert(ret)
      assert(ret.includes('path:'), ret)
      const expectName = `.myca-${name}`
      assert(ret.includes(expectName), ret)
    })
  })

})
