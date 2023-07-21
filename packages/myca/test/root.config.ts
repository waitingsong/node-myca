import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { genCurrentDirname } from '@waiting/shared-core'

import { CaOpts } from '../src/index.js'
import { getOpensslVer } from '../src/lib/common.js'
import { initialConfig, initialCaOpts } from '../src/lib/config.js'


export const CI = !! process.env['CI']
export const testBaseDir = genCurrentDirname(import.meta.url)


export const tmpDir = join(tmpdir(), 'myca-tmp')
export const pathPrefix = 'myca-test-center'
const randomPathG = `${tmpDir}/${pathPrefix}-${Math.random()}`

// dir contains conf file and folders
// config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`)
initialConfig.defaultCenterPath = `${randomPathG}/${initialConfig.centerDirName}`

const version = await getOpensslVer(initialConfig.openssl)
initialConfig.opensslVer = version

export const caOptions: CaOpts = {
  ...initialCaOpts,
  alg: 'ec',
  days: 10950,
  pass: 'mycapass',
  hash: 'sha256',
  CN: 'My Root CA',
  C: 'CN',
}

export {
  initialConfig, initialCaOpts,
}

