import { exec, execFile } from 'child_process'
import { chmod, close, copyFile, mkdir, open, readFile, stat, unlink, write, writeFile } from 'fs'
import { dirname, normalize, resolve, sep } from 'path'
import { promisify } from 'util'

import { config } from './config'
import { ExecFileOptions, WriteFileOptions } from './model'

export const mkdirAsync = promisify(mkdir)
export const readFileAsync = promisify(readFile)
export const writeAsync = promisify(write)
export const writeFileAsync = promisify(writeFile)
export const unlinkAsync = promisify(unlink)
export const openAsync = promisify(open)
export const closeAsync = promisify(close)
export const copyFileAsync = promisify(copyFile)
export const chmodAsync = promisify(chmod)

export function runOpenssl(args: string[], options?: ExecFileOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(config.openssl, args, (options ? options : {}), (err, stdout) => (err ? reject(err) : resolve(stdout)))
  })
}


export function isDirExists(path: string): Promise<boolean> {
  return path ? isDirFileExists(path, 'DIR') : Promise.resolve(false)
}


export function isFileExists(path: string): Promise<boolean> {
  return path ? isDirFileExists(path, 'FILE') : Promise.resolve(false)
}


function isDirFileExists(path: string, type: 'DIR' | 'FILE'): Promise<boolean> {
  return path
    ? new Promise(resolve => {
      stat(path, (err, stats) => ( err ? resolve(false) : resolve(type === 'DIR' ? stats.isDirectory() : stats.isFile())) )
    })
    : Promise.resolve(false)
}


// create directories recursively
export async function createDir(path: string): Promise<void> {
  if ( ! path) {
    throw new Error('value of path param invalid')
  }
  else {
    path = normalize(path)
    if (!await isDirExists(path)) {
      await path.split(sep).reduce(async (parentDir, childDir) => {
        const curDir = resolve(await parentDir, childDir)

        await isDirExists(curDir) || await mkdirAsync(curDir, 0o755)

        return curDir
      }, Promise.resolve(sep))
    }

  }
}


export async function createFile(file: string, data: any, options?: WriteFileOptions): Promise<void> {
  const path = dirname(file)

  /* istanbul ignore next */
  if ( ! path) {
    throw new Error('path empty')
  }
  if ( ! await isDirExists(path)) {
    await createDir(path)
  }

  /* istanbul ignore else */
  if (!await isFileExists(file)) {
    if (typeof data === 'object') {
      await writeFileAsync(file, JSON.stringify(data))
    }
    else {
      const opts: WriteFileOptions = options ? options : { mode: 0o640 }

      await writeFileAsync(file, data, opts)
    }
  }
}


// validate openssl cli
export function getOpensslVer(openssl: string): Promise<string> {
  /* istanbul ignore else */
  if ( ! openssl) {
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
