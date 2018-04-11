import { exec, execFile } from 'child_process'

import {
  createDir,
  createFile,
  isDirExists,
  isFileExists,
} from '../shared/index'

import { initialConfig } from './config'
import { ExecFileOptions } from './model'


export function runOpenssl(args: string[], options?: ExecFileOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      initialConfig.openssl,
      args,
      (options ? options : {}), (err, stdout) => (err ? reject(err) : resolve(stdout))
    )
  })
}


// validate openssl cli
export function getOpensslVer(openssl: string): Promise<string> {
  /* istanbul ignore else */
  if (! openssl) {
    throw new Error('value of param openssl empty')
  }
  const cmd = `${openssl} version`

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout) => {
      if (err) {
        return reject(err)
      }
      /* istanbul ignore next */
      if (stdout && stdout.indexOf('OpenSSL') >= 0) {
        return resolve(stdout.split(' ')[1])
      }
      else {
        reject('openssl cli error:' + stdout)
      }
    })
  })
}
