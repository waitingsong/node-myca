/**
 * node-myca
 *
 * @author waiting
 * @license MIT
 * @link https://github.com/waitingsong/node-myca
 */


import { normalize } from 'path'

import { config } from './lib/config'


/* istanbul ignore next */
config.isWin32 = process.platform === 'win32' ? true : false    /* istanbul ignore next */
config.userHome = config.isWin32 ? normalize(process.env.USERPROFILE || '') : normalize(`${process.env.HOME}`)
config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`) // dir contains conf file and folders
config.openssl = normalize(config.openssl)

/* istanbul ignore next */
if ( ! config.userHome) {
  throw new Error('path of user profile empty')
}

export * from './lib/center'
export * from './lib/cert'
export * from './lib/model'
