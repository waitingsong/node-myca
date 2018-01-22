import { exec, execFile } from 'child_process'
import { close, copyFile, mkdir, open, readFile, stat, unlink, write, writeFile } from 'fs'
import { normalize, resolve, sep } from 'path'
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

export function runOpenssl(args: string[] = [], options?: ExecFileOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(config.openssl, args, options ? options : {}, (err, stdout) => {
      if (err) {
        return reject(err)
      }
      return resolve(stdout)
    })
  })
}


export function isDirExists(path: string): Promise<boolean> {
  if ( ! path) {
    return Promise.resolve(false)
  }
  return isDirFileExists(path, 'DIR')
}


export function isFileExists(path: string): Promise<boolean> {
  if ( ! path) {
    return Promise.resolve(false)
  }
  return isDirFileExists(path, 'FILE')
}


function isDirFileExists(path: string, type: 'DIR' | 'FILE'): Promise<boolean> {
  if ( ! path) {
    return Promise.resolve(false)
  }
  return new Promise(resolve => {
    stat(path, (err, stats) => {
      if (err) {
        return resolve(false)
      }
      return resolve(type === 'DIR' ? stats.isDirectory() : stats.isFile())
    })
  })
}


// create directories recursively
export async function createDir(path: string): Promise<void> {
  if ( ! path) {
    throw new Error('value of path param invalid')
  }
  path = normalize(path)
  if (!await isDirExists(path)) {
    await path.split(sep).reduce(async (parentDir, childDir) => {
      const curDir = resolve(await parentDir, childDir)

      if ( ! await isDirExists(curDir)) {
        try {
          await mkdirAsync(curDir, 0o755)
        }
        catch (ex) {
          throw ex
        }
      }

      return curDir
    }, Promise.resolve(sep))
  }
}


export async function createFile(path: string, data: any, options?: WriteFileOptions): Promise<void> {
  if (!await isFileExists(path)) {
    if (typeof data === 'object') {
      await writeFileAsync(path, JSON.stringify(data))
    }
    else {
      const opts: WriteFileOptions = options ? options : { mode: 0o640 }

      await writeFileAsync(path, data, opts)
    }
  }
}


// validate openssl cli
export function getOpensslVer(openssl: string): Promise<string> {
  if ( ! openssl) {
    throw new Error('value of param openssl empty')
  }
  const cmd = `${openssl} version`

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout) => {
      if (err) {
        throw err
      }
      if (stdout && stdout.indexOf('OpenSSL') >= 0) {
        return resolve(stdout.split(' ')[1])
      }
      reject('openssl cli error:' + stdout)
    })
  })
}
