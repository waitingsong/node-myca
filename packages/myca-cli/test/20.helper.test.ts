import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'

import { cmdSet } from '../src/lib/config.js'
import { genCmdHelp } from '../src/lib/helper.js'


describe(fileShortPath(import.meta.url), () => {
  describe('Should myca help works', () => {
    it('without args', async () => {
      const help = genCmdHelp('')
      assert(help.includes('Standard commands'), help)

      cmdSet.forEach((cmd) => {
        assert(help.includes(cmd), help)
      })
    })

    it('with initca -h', () => {
      const help = genCmdHelp('initca')
      assert(help.includes('--centerName'), help)
    })

    it('with issue -h', () => {
      const help = genCmdHelp('issue')
      assert(help.includes('--kind'), help)
    })

    it('with initcenter -h', () => {
      const help = genCmdHelp('initcenter')
      assert(help.includes('--path'), help)
    })

  })
})
