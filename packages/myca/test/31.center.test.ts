import assert from 'node:assert'
import { rm } from 'node:fs/promises'

import {
  fileShortPath,
  createDirAsync,
  isDirExists,
  sleep,
} from '@waiting/shared-core'

import * as myca from '../src/index.js'
import { genRandomCenterPath, removeCenterFiles } from '../src/lib/common.js'

import { initialCaOpts, initialConfig, pathPrefix, tmpDir } from './root.config.js'


describe(fileShortPath(import.meta.url), () => {
  beforeEach(async () => {
    const random = Math.random().toString()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await createDirAsync(tmpDir)
    await myca.initDefaultCenter()
  })
  afterEach(async () => {
    await sleep(100)
    await removeCenterFiles(initialConfig.defaultCenterPath)
  })

  describe('Should initCenter() work', () => {
    it('normal', async () => {
      const random = Math.random().toString()
      const centerName = `${pathPrefix}-${random}`
      const randomPath = `${tmpDir}/${pathPrefix}-${random}`
      const centerPath = `${randomPath}/${initialConfig.centerDirName}`

      await myca.initCenter(centerName, centerPath)

      if (! await isDirExists(centerPath)) {
        assert(false, `spcified center folder not exists, path: "${centerPath}"`)
      }

      assert(
        await myca.isCenterInited(centerName),
        `isCenterInited(${centerName}) says folder not exits. path: "${centerPath}"`,
      )

      // create again
      try {
        await myca.initCenter(centerName, centerPath)
        assert(false, 'initCenter() should throw error for already created folder, but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes(`Center of "${centerName}" initialized already`), ex.message)
      }

      try {
        await myca.initCenter(centerName, 'fakePath')
        assert(false, 'initCenter() should throw error for already created centerName, but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes(`Center of "${centerName}" initialized already`), ex.message)
      }

      try {
        await myca.initCenter('fakeName', centerPath)
        assert(false, 'initCenter() should throw error for already created folder(s), but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('Folder(s) exists already during initCenter:'), ex.message)
      }

      await rm(randomPath, { recursive: true, force: true })
    })

    it('without centerPath param (use centerName as suffix)', async () => {
      const random = Math.random().toString()
      const centerName = `${pathPrefix}-${random}`
      const centerPath = genRandomCenterPath(centerName)

      await myca.initCenter(centerName)

      if (! await isDirExists(centerPath)) {
        assert(false, `spcified center folder not exists, path: "${centerPath}"`)
      }

      assert(
        await myca.isCenterInited(centerName),
        `isCenterInited(${centerName}) says folder not exits`,
      )
    })


    it('with invalid param', async () => {
      const random = Math.random().toString()
      const centerName = `${pathPrefix}-${random}`
      const randomPath = `${tmpDir}/${pathPrefix}-${random}`
      const centerPath = `${randomPath}/${initialConfig.centerDirName}`

      try {
        await myca.initCenter('default', centerPath) // 'default' not allowed
        return assert(false, 'initCenter("default") should throw error for value default not allowed, but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('Calling method of initDefaultCenter() to init default center'), ex.message)
      }
      assert(! await isDirExists(centerPath), `spcified center folder should not exists, but did exists, path: "${centerPath}"`)

      try {
        await myca.initCenter('', centerPath)
        assert(false, 'initCenter() should throw error for invalid param of centerName, but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('value of centerName invalid'), ex.message)
      }
      assert(await isDirExists(centerPath), `path should exists event through exception: "${centerPath}"`)

      try {
        await myca.initCenter('', centerPath)
        assert(false, 'initCenter() should throw error for invalid param of centerName, but NOT')
      }
      catch (ex) {
        assert(ex instanceof Error)
        assert(ex.message.includes('value of centerName invalid'), ex.message)
      }
      assert(await isDirExists(centerPath), `path should exists event through exception: "${centerPath}"`)

      assert(
        ! await myca.isCenterInited(centerName),
        `isCenterInited(${centerName}) says folder exits, but should NOT. path: "${centerPath}"`,
      )

      await rm(randomPath, { recursive: true, force: true })
    })

  })
})
