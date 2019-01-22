/**
 * node-myca
 *
 * @author waiting
 * @license MIT
 * @link https://github.com/waitingsong/node-myca
 */


import { isWin32, userHome } from '@waiting/shared-core'
import { normalize } from 'path'

import { initialConfig } from './lib/config'

/* istanbul ignore next */
initialConfig.appDir = __dirname + '/..'

/* istanbul ignore next */
initialConfig.isWin32 = isWin32
initialConfig.userHome = userHome
// dir contains conf file and folders
initialConfig.defaultCenterPath = normalize(`${initialConfig.userHome}/${initialConfig.centerDirName}`)
initialConfig.openssl = normalize(initialConfig.openssl)

/* istanbul ignore next */
if (! initialConfig.userHome) {
  throw new Error('path of user profile empty')
}

export * from './lib/center'
export * from './lib/cert'
export * from './lib/model'
export { initialCaOpts, initialCertOpts } from './lib/config'
