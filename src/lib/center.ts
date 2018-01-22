import { join, normalize } from 'path'

import {
  copyFileAsync,
  createDir,
  createFile,
  isDirExists,
  isFileExists,
  readFileAsync,
  writeFileAsync } from './common'
import { config } from './config'
import { CenterList, Config } from './model'


// return new serial HEX string
export async function nextSerial(centerName: string, config: Config): Promise<string> {
  const centerPath = await getCenterPath(centerName)
  const serialFile = `${centerPath}/db/serial`

  if ( ! centerPath) {
    return Promise.reject(`centerPath not exists, centerName: "${centerName}"`)
  }
  const buf = await readFileAsync(serialFile)
  const nextHex = buf.toString('utf8').trim()
  const nextDec = parseInt(nextHex, 16)

  if (typeof nextDec !== 'number' || ! nextDec || ! Number.isSafeInteger(nextDec)) {
    throw new Error('retrive nextSerial failed or invalid. value: ' + nextDec)
  }
  return nextHex
}


// copy .config to center
export async function initOpensslConfig(configName: string, centerPath: string) {
  return copyFileAsync(join(__dirname, '../../asset', configName), join(centerPath, configName) )
}


// create defaultCenterPath and center folders/files
export async function initDefaultCenter(): Promise<void> {
  const centerName = 'default'
  const initialFiles: string[] = [config.centerListName]

  if (await isCenterInited(centerName)) {
    return Promise.reject('default center initialized already')
  }

  await createDir(config.defaultCenterPath) // create default ca dir under userHome
  await createInitialFiles(config.defaultCenterPath, initialFiles)  // must before createCenter()
  await createCenter(centerName, config.defaultCenterPath)  // create default cneter dir under userHome
}


// create center path and folders/files
export async function initCenter(centerName: string, path: string): Promise<void> {
  if (centerName === 'default') {
    return Promise.reject('init default center by calling method of initDefaultCenter()')
  }
  if ( ! await isCenterInited('default')) {
    return Promise.reject('default center must be initialized first')
  }
  if (await isCenterInited(centerName)) {
    return Promise.reject(`center of "${centerName}" initialized already.`)
  }

  await createDir(path) // create default ca dir under userHome
  await createCenter(centerName, path)  // create default cneter dir under userHome
  // console.log(`CenterPath name: ${centerName}, path: ${path}`)
}


export async function isCenterInited(centerName: string): Promise<boolean> {
  const centerPath = await getCenterPath(centerName)

  if ( ! centerPath) {
    return false
  }
  if (await isDirExists(centerPath)) {
    return true
  }
  return false
}


// create center dir to store output certifacates
export async function createCenter(centerName: string, path: string): Promise<void> {
  const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

  if ( ! await isCenterInited(centerName)) {
    await createDir(path)
  }
  for (let i = 0, len = folders.length; i < len; i++) {
    const dir = `${path}/${folders[i]}`

    if ( ! await isDirExists(dir)) {
      await createDir(dir)
    }
  }
  await initDbFiles(path)
  await updateCenterList(centerName, path)
  await initOpensslConfig(config.configName, path)
}


async function createInitialFiles(path: string, files: string[]): Promise<void> {
  path = normalize(path)
  for (let i = 0, len = files.length; i < len; i++) {
    const file = `${path}/${files[i]}`
    const data = { default: path }

    await createFile(file, data)
  }
}

async function initDbFiles(path: string): Promise<void> {
  const db = `${path}/${config.dbDir}`

  await createFile(`${db}/serial`, '01', { mode: 0o644 })
  await createFile(`${db}/index`, '', { mode: 0o644 })
  await createFile(`${db}/index.attr`, 'unique_subject = no', { mode: 0o644 })
}


async function updateCenterList(key: string, path: string): Promise<void> {
  if (!key || !path) {
    throw new Error('params key or path is invalid')
  }
  const centerList = await loadCenterList()
  const file = `${config.defaultCenterPath}/${config.centerListName}` // center-list.json

  if ( ! centerList) {
    throw new Error(`file not exists: "${file}"`)
  }

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


async function loadCenterList(): Promise<CenterList | void> {
  const file = `${config.defaultCenterPath}/${config.centerListName}`

  if ( ! await isFileExists(file)) {
    return
  }
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
