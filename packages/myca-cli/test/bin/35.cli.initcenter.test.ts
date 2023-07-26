import { rm, rename } from 'fs/promises'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { sep } from 'path'

import {
  userHome,
  fileShortPath,
  isDirExists,
} from '@waiting/shared-core'
import semver from 'semver'
import { $, ProcessOutput } from 'zx'

import { runCmd, RunCmdArgs } from '../../src/index.js'


const defaultCenterPath = join(userHome, '.myca')
let defaultCenterPathBak = join(userHome, '.myca-bak-' + Math.random().toString())
const initArgs: RunCmdArgs = {
  cmd: 'init',
  options: null,
  debug: true,
}

const requiredVersion = '>=16 <20'
const currentVersion = process.version
const isVersionMatch = semver.satisfies(currentVersion, requiredVersion)

describe(fileShortPath(import.meta.url), () => {
  const cli = './src/bin/cli.ts'

  before(async () => {
    if (! isVersionMatch) {
      console.info(`Skip test, required node version: ${requiredVersion}, current version: ${currentVersion}`)
      return
    }

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
    await $`node --enable-source-maps --loader ts-node/esm ${cli} ${cmd} ${args} `
  })

  after(async () => {
    if (! isVersionMatch) {
      console.info(`Skip test, required node version: ${requiredVersion}, current version: ${currentVersion}`)
      return
    }

    await rm(defaultCenterPath, { recursive: true, force: true })
    if (defaultCenterPathBak) {
      await rename(defaultCenterPathBak, defaultCenterPath)
    }
  })

  describe('Should initcenter work', () => {
    if (! isVersionMatch) {
      console.info(`Skip test, required node version: ${requiredVersion}, current version: ${currentVersion}`)
      return
    }

    it('common', async () => {
      const cmd = 'initcenter'
      const name = 'center-' + Math.random().toString()
      const args: (string)[] = ['--name', name]

      await $`pwd`
      const { stdout } = await $`node --enable-source-maps --loader ts-node/esm ${cli} ${cmd} ${args} `
      // const { stdout } = await $`ts-node-esm ${cli} ${cmd} ${args} `
      assert(stdout)
      assert(stdout.includes('center created with:'), stdout)
      assert(stdout.includes('centerName:'), stdout)
      assert(stdout.includes('path:'), stdout)
      assert(stdout.includes(name), stdout)
    })

    it('empty name', async () => {
      const cmd = 'initcenter'
      const name = ''
      const args: (string)[] = ['--name', name]

      await $`pwd`
      try {
        await $`node --enable-source-maps --loader ts-node/esm ${cli} ${cmd} ${args} `
        assert(false, 'should throw')
      }
      catch (ex) {
        assert(ex instanceof Error)
        const output = ex as ProcessOutput
        assert(output.exitCode === 1, output)
        assert(output.stdout.length > 0, `stderr: ${output.stdout}`)
        assert(output.stdout.includes('value of name should be a string'), `stdout: ${output.stdout}`)
      }
    })

  })
})
