/**
 * node-myca
 *
 * @author waiting
 * @license MIT
 * @link https://github.com/waitingsong/node-myca
 */


import { normalize } from 'path'

import { initialConfig } from './lib/config'


/* istanbul ignore next */
initialConfig.isWin32 = process.platform === 'win32' ? true : false    /* istanbul ignore next */
initialConfig.userHome = initialConfig.isWin32
  ? normalize(process.env.USERPROFILE || '')
  : normalize(`${process.env.HOME}`)
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
