/// <reference types="node" />
/// <reference types="mocha" />

import { tmpdir } from 'os'
import { basename, join } from 'path'
import * as assert from 'power-assert'
import * as rmdir from 'rimraf'

import * as myca from '../src/index'
import { createDir, isDirExists } from '../src/lib/common'
import { config } from '../src/lib/config'

const filename = basename(__filename)
const tmpDir = tmpdir()
const pathPrefix = 'myca-test-center'


describe(filename, () => {
  it('Should createDir() works', async () => {
    const random = Math.random()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    try {
      await createDir(randomPath)
    }
    catch (ex) {
      return assert(false, ex)
    }

    if ( ! await isDirExists(randomPath)) {
      return assert(false, `folder not exists, path: "${randomPath}"`)
    }

    rmdir(randomPath, (err) => err && console.error(err))
  })

  it('Should createDir() works with blank param', async () => {
    try {
      await createDir('')
      return assert(false, 'should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })

})
