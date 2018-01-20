import { exec, execFile } from 'child_process'
import { close, copyFile, mkdir, open, readFile, stat, unlink, write, writeFile } from 'fs'
import { normalize } from 'path'
import { promisify } from 'util'

import { config } from './config'
import { CenterList, ExecFileOptions, WriteFileOptions } from './model'

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
  return isDirFileExists(path, 'DIR')
}


export function isFileExists(path: string): Promise<boolean> {
  return isDirFileExists(path, 'FILE')
}


function isDirFileExists(path: string, type: 'DIR' | 'FILE'): Promise<boolean> {
  return new Promise(resolve => {
    stat(path, (err, stats) => {
      if (err) {
        return resolve(false)
      }
      return resolve(type === 'DIR' ? stats.isDirectory() : stats.isFile())
    })
  })
}


export async function createDir(path: string): Promise<void> {
  if (!await isDirExists(path)) {
    await mkdirAsync(path, 0o755)
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


export async function getCenterPath(centerName: string | void): Promise<string> {
  if ( ! centerName) {
    return Promise.resolve('')
  }
  if (centerName === 'default') {
    return Promise.resolve(config.defaultCenterPath)
  }
  const centerList = await loadCenterList()

  if (typeof centerList === 'object' && centerList) {
    return Promise.resolve(centerList[centerName])
  }
  return Promise.resolve('')
}


export async function loadCenterList(): Promise<CenterList> {
  const file = `${config.defaultCenterPath}/${config.centerListName}`
  const buf = await readFileAsync(file)
  const str = buf.toString()

  if (typeof str === 'string' && str) {
    const centerList: CenterList = JSON.parse(str)

    if (centerList && centerList.default) {
      return centerList
    }
    else {
      throw new Error('centerList invalid or contains not key of default')
    }
  }
  throw new Error(`Content from loading file: ${file} is blank or invalid.`)
}


export async function updateCenterList(key: string, path: string): Promise<void> {
  if (!key || !path) {
    throw new Error('params key or path is invalid')
  }
  const centerList = await loadCenterList()
  const file = `${config.defaultCenterPath}/${config.centerListName}`

  path = normalize(path)
  if (key === 'default') {
    if (centerList.default) {
      return
    }
  }
  else if (centerList[key]) {
    throw new Error(`center list exists already, can not create more. key: "${key}", path: "${path}"`)
  }
  centerList[key] = path

  writeFileAsync(file, JSON.stringify(centerList))
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
