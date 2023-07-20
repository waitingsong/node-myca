import assert from 'node:assert'

import { fileShortPath } from '@waiting/shared-core'

import { genRandomCenterPath } from '../src/lib/common.js'

import { initialConfig } from './root.config.js'


describe(fileShortPath(import.meta.url), () => {
  describe('Should genRandomCenterPath() works', () => {
    it('normal', () => {
      const { defaultCenterPath } = initialConfig
      const rndArr = [
        0,
        Math.random(),
        Math.random().toString(),
        'foo',
        'foo bar   ',
        'foo/bar   ',
      ]

      rndArr.forEach((random) => {
        const needle = random.toString().trim().replace(/\s|\//ug, '_')
        const expect = `${defaultCenterPath}-${needle}`
        const ret = genRandomCenterPath(random)
        assert(
          ret === expect,
          `expect: "${expect}", but got "${ret}"`,
        )
      })

    })

    it('invalid value', () => {
      const rndArr = [
        '',
        '   ',
      ]

      rndArr.forEach((random) => {
        try {
          genRandomCenterPath(random)
          assert(false, 'should throw err, but NOT')
        }
        catch (ex) {
          assert(ex instanceof Error)
          assert(ex.message.includes('genRandomCenterPath()'), ex.message)
          assert(ex.message.includes('param invalid') || ex.message.includes('param empty'), ex.message)
        }
      })

    })

  })
})

