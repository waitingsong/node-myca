import { rm, rename } from 'fs/promises'
import assert from 'node:assert/strict'
import { join } from 'node:path'

import {
  userHome,
  fileShortPath,
  isDirExists,
} from '@waiting/shared-core'
import { $ } from 'zx'

import { runCmd, RunCmdArgs } from '../../src/index.js'


const defaultCenterPath = join(userHome, '.myca')
let defaultCenterPathBak = join(userHome, '.myca-' + Math.random().toString())
const initArgs: RunCmdArgs = {
  cmd: 'init',
  options: null,
  debug: true,
}

describe(fileShortPath(import.meta.url), () => {
  const cli = './dist/bin/cli.js'

  before(async () => {
    const exists = await isDirExists(defaultCenterPath)
    if (exists) {
      await rename(defaultCenterPath, defaultCenterPathBak)
    }
    else {
      defaultCenterPathBak = ''
    }

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

  describe('Should initca work', () => {
    it('normal', async () => {
      const cmd = 'initca'
      const opts = {
        days: 10950,
        pass: 'mycapass',
        CN: 'my root ca',
        O: 'my company',
        C: 'CN',
      }
      const args: (string|number)[] = [
        '--days', opts.days,
        '--pass', opts.pass,
        '--CN', opts.CN,
        '--O', opts.O,
        '--C', opts.C,
      ]

      await $`pwd`
      const { stdout } = await $`${cli} ${cmd} ${args}`
      assert(stdout)
      assert(stdout.includes('CA certificate created with:'), stdout)
      assert(stdout.includes('centerName: "default"'), stdout)
      assert(stdout.includes('crtFile:'), stdout)
      assert(stdout.includes('ca.crt'), stdout)
      assert(stdout.includes('privateKeyFile'), stdout)
      assert(stdout.includes('ca.key'), stdout)
    })
  })

})
