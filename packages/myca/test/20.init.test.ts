import assert from 'node:assert'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import {
  fileShortPath,
  createDirAsync,
  createFileAsync,
  isDirExists,
} from '@waiting/shared-core'

import * as myca from '../src/index.js'

import { initialCaOpts, initialConfig, pathPrefix, tmpDir } from './root.config.js'


describe(fileShortPath(import.meta.url), () => {
  before(async () => {
    await createDirAsync(tmpDir)
  })

  it('Should initDefaultCenter() work', async () => {
    const centerPath = await myca.initDefaultCenter()
    assert(
      centerPath === initialConfig.defaultCenterPath,
      `result not expected. result: "${centerPath}", expected: "${initialConfig.defaultCenterPath}"`,
    )

    const exists = await isDirExists(initialConfig.defaultCenterPath)
    assert(exists, `centerPath not exists, path: "${initialConfig.defaultCenterPath}"`)

    const centerInited = await myca.isCenterInited('default')
    assert(
      centerInited === true,
      `isCenterInited('default') says folder not exits. path: "${initialConfig.defaultCenterPath}"`,
    )

    // initialize again
    try {
      await myca.initDefaultCenter()
      assert(false, 'should throw error during duplicate initialization, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('default center initialized already'))
    }

    // do not rm for below test
  })


  it('Should getCenterPath() work', async () => {
    const centerPath = await myca.getCenterPath('default')
    console.log({ centerPath })
    const exists = await isDirExists(centerPath)
    assert(exists, `centerPath not exists, path: "${centerPath}"`)
    const isDefaultCenterInited = await myca.isCenterInited('default')
    if (centerPath) {
      assert(isDefaultCenterInited, 'isCenterInited() should return true')
    }
    else {
      assert(! isDefaultCenterInited, 'isCenterInited() should return false')
    }
  })


  // ------------------ at last

  it('Should getCenterPath() work with empty centerList', async () => {
    const file = join(initialConfig.defaultCenterPath, initialConfig.centerListName)
    await rm(file, { recursive: true, force: true })
    await createFileAsync(file, '')
    const path = await myca.getCenterPath('center')
    console.log({ path })
    assert(path === '', 'should return empty')
  })


  it('Should initCenter() work without default Center', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`
    const path = join(initialConfig.defaultCenterPath, '..')

    await rm(path, { recursive: true, force: true })

    try {
      await myca.initCenter(centerName, centerPath)
      assert(false, 'initCenter() should throw error, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('default center must be initialized first'), ex.message)
    }

    assert(! await isDirExists(centerPath), `path should not exists: "${centerPath}"`)
  })

})

