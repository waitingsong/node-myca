import assert from 'node:assert'

import { fileShortPath } from '@waiting/shared-core'

import { decryptPrivateKey } from '../src/index.js'

import { initialConfig, pathPrefix, tmpDir } from './root.config.js'


describe(fileShortPath(import.meta.url), () => {
  describe('Should decryptPrivateKey() works', () => {
    it('invalid privateKey', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }

      const privateKey = 'fake'
      const passwd = 'foo'
      const alg = 'ec'
      try {
        await decryptPrivateKey(privateKey, passwd, alg)
        assert(false, 'Should throw error but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('decryptPrivateKey() Param key not valid **encrypted** private key'), ex.message)
      }
    })

    it('invalid privateKey 2', async () => {
      if (initialConfig.opensslVer < '1.0.2') { return }

      const privateKey = 'fake PRIVATE ' + Math.random().toString()
      const passwd = 'foo'
      const alg = 'ec'
      const pkey = await decryptPrivateKey(privateKey, passwd, alg)
      assert(pkey === privateKey, `pkey: ${pkey}`)
    })

  })
})
