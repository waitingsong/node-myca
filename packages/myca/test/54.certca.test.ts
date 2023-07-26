import assert from 'node:assert'

import { fileShortPath } from '@waiting/shared-core'

import { CaCertDN, genIssueSubj } from '../src/index.js'

import { initialConfig } from './root.config.js'


describe(fileShortPath(import.meta.url), () => {
  describe('Should genIssueSubj() work', () => {
    it('common', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }

      const opts: Required<CaCertDN > = {
        CN: 'My Root CA',
        OU: 'OU',
        O: 'O',
        C: 'C',
        ST: 'ST',
        L: 'L',
        emailAddress: 'emailAddress',
      }
      const ret = genIssueSubj(opts)
      assert(ret.includes(`CN=${opts.CN}`), ret)
      assert(ret.includes(`OU=${opts.OU}`), ret)
      assert(ret.includes(`O=${opts.O}`), ret)
      assert(ret.includes(`C=${opts.C}`), ret)
      assert(ret.includes(`ST=${opts.ST}`), ret)
      assert(ret.includes(`L=${opts.L}`), ret)
      assert(ret.includes(`emailAddress=${opts.emailAddress}`), ret)
    })

  })
})
