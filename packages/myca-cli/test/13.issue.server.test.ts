import { rm, rename } from 'fs/promises'
import assert from 'node:assert/strict'
import { join, sep } from 'node:path'

import {
  userHome,
  fileShortPath,
  isDirExists,
} from '@waiting/shared-core'
import { CertOpts, getCenterPath } from 'myca'

import { runCmd, RunCmdArgs } from '../src/index.js'


const defaultCenterPath = join(userHome, '.myca')
let defaultCenterPathBak = join(userHome, '.myca-' + Math.random().toString())
const initArgs: RunCmdArgs = {
  cmd: 'init',
  options: null,
  debug: true,
}

describe(fileShortPath(import.meta.url), () => {
  const centerName = 'center-' + Math.random().toString() + '.tmp'

  before(async () => {
    const exists = await isDirExists(defaultCenterPath)
    if (exists) {
      await rename(defaultCenterPath, defaultCenterPathBak)
    }
    else {
      defaultCenterPathBak = ''
    }

    try {
      await runCmd(initArgs)
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(
        ex.message.includes('caKeyFile not exists, file:') || ex.message.includes('default center initialized already'),
        ex.message,
      )
    }

    const args: RunCmdArgs = {
      cmd: 'initcenter',
      options: {
        _: [],
        name: centerName,
      },
      debug: false,
    }
    await runCmd(args)

    const args2: RunCmdArgs = {
      cmd: 'initca',
      options: {
        centerName,
        days: 10950,
        pass: 'mycapass',
        CN: 'my root ca',
        O: 'my company',
        C: 'CN',

      },
      debug: false,
    }
    const ret = await runCmd(args2)
    assert(ret.includes('CA certificate created with:'), ret)
    assert(ret.includes(`centerName: "${centerName}"`), ret)
    assert(ret.includes('crtFile'), ret)
    assert(ret.includes('privateKeyFile'), ret)
    assert(ret.includes(defaultCenterPath), ret)
  })

  after(async () => {
    const path2 = await getCenterPath(centerName)
    await rm(path2, { recursive: true, force: true })

    await rm(defaultCenterPath, { recursive: true, force: true })
    if (defaultCenterPathBak) {
      await rename(defaultCenterPathBak, defaultCenterPath)
    }
  })

  describe('Should issue server work', () => {
    it('with invalid ca', async () => {
      const opts: CertOpts = {
        centerName,
        caKeyPass: 'mycapass',
        kind: 'ca',
        alg: 'ec',
        days: 730,
        pass: 'fooo', // at least 4 letters
        CN: 'www.waitingsong.com', // Common Name
        C: 'CN', // Country Name (2 letter code)
      }

      const args: RunCmdArgs = {
        cmd: 'issue',
        options: {
          _: [],
          ...opts,
        },
        debug: false,
      }
      try {
        await runCmd(args)
        assert(false, 'Should throw')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('value of kind can not be "ca", generate CA cert via cmd:initca'), ex.message)
      }
    })
    it('common', async () => {
      const pass = 'fooo'
      const kind = 'server'
      const opts: CertOpts = {
        centerName,
        caKeyPass: 'mycapass',
        kind,
        alg: 'ec',
        days: 730,
        pass,
        CN: 'www.waitingsong.com', // Common Name
        C: 'CN', // Country Name (2 letter code)
      }

      const args: RunCmdArgs = {
        cmd: 'issue',
        options: {
          _: [],
          ...opts,
        },
        debug: false,
      }
      const ret = await runCmd(args)
      console.log({ ret })
      assert(ret.includes('Issue a Certificate with:'), ret)
      assert(ret.includes('pubKey:'), ret)
      assert(ret.includes('BEGIN PUBLIC KEY'), ret)
      assert(ret.includes('END PUBLIC KEY'), ret)
      assert(ret.includes(`pass: "${pass}"`), ret)
      assert(ret.includes('privateKeyFile:'), ret)
      assert(ret.includes(kind + sep + '01.key'), ret)
      assert(ret.includes('privateUnsecureKeyFile:'), ret)
      assert(ret.includes(kind + sep + '01.key.unsecure'), ret)
      assert(ret.includes(centerName), ret)
      assert(ret.includes('caKeyFile:'), ret)
      assert(ret.includes('caCrtFile:'), ret)
      assert(ret.includes('csrFile:'), ret)
      assert(ret.includes(kind + sep + '01.csr'), ret)
      assert(ret.includes('crtFile:'), ret)
      assert(ret.includes(kind + sep + '01.crt'), ret)
    })
  })

})
