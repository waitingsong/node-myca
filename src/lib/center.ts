import { join, normalize } from 'path'

import {
  copyFileAsync,
  createDir,
  createFile,
  isDirExists,
  isFileExists,
  readFileAsync,
  writeFileAsync } from './common'
import { config, initialDbFiles } from './config'
import { CenterList, Config, InitialFile } from './model'


// return new serial HEX string
export async function nextSerial(centerName: string, config: Config): Promise<string> {
  const centerPath = await getCenterPath(centerName)
  const serialFile = `${centerPath}/db/serial`

  if ( ! centerPath) {
    return Promise.reject(`centerPath not exists, centerName: "${centerName}"`)
  }
  const buf = await readFileAsync(serialFile)
  const nextHex = buf.toString('utf8').trim() // 'BARZ' -> 186
  const nextDec = parseInt(nextHex, 16)

  if (typeof nextDec !== 'number' || ! nextDec || nextDec < 1) {
    throw new Error(`retrive nextSerial failed nextDec not typeof number or invalid. value: "${nextHex}", Dec: ${nextDec}`)
  }
  if ( ! Number.isSafeInteger(nextDec) ) {
    throw new Error(`retrive nextSerial failed. not save integer. value: "${nextHex}", Dec: ${nextDec}`)
  }
  if (nextHex.replace(/^0+/, '').toLocaleLowerCase() !== nextDec.toString(16)) {
    throw new Error(`retrive nextSerial failed or invalid.
      hex formatted: "${ nextHex.replace(/^0+/, '').toLocaleLowerCase() }",
      Dec to hex: ${ nextDec.toString(16) }`)
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
  const centerPath = await isCenterInited(centerName)

  if (centerPath) {
    return Promise.reject(`default center initialized already. path: "${centerPath}"`)
  }
  await createDir(config.defaultCenterPath) // create default ca dir under userHome
  await createCenterListFile(join(config.defaultCenterPath, config.centerListName))  // must before createCenter()
  await createCenter(config, centerName, config.defaultCenterPath)  // create default cneter dir under userHome
}


// create center path and folders/files
export async function initCenter(centerName: string, path: string): Promise<void> {
  if (centerName === 'default') {
    return Promise.reject('init default center by calling method of initDefaultCenter()')
  }
  if ( ! await isCenterInited('default')) {
    return Promise.reject('default center must be initialized first')
  }
  const centerPath = await isCenterInited(centerName)
  if (centerPath) {
    return Promise.reject(`center of "${centerName}" initialized already. path: "${centerPath}"`)
  }

  await createDir(path) // create default ca dir under userHome
  await createCenter(config, centerName, path)  // create default cneter dir under userHome
  // console.log(`centerPath name: ${centerName}, path: ${path}`)
}


export async function isCenterInited(centerName: string): Promise<string | false> {
  if ( ! centerName) {
    throw new Error('value of path param invalid')
  }
  const centerPath = await getCenterPath(centerName)

  if ( ! centerPath) {
    return false
  }
  if (await isDirExists(centerPath)) {
    return centerPath
  }
  return false
}


// create center dir to store output certifacates
async function createCenter(config: Config, centerName: string, path: string): Promise<void> {
  const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

  if ( ! centerName) {
    throw new Error('value of centerName invalid')
  }

  if ( ! await isCenterInited(centerName)) {
    await createDir(path)
  }
  for (let i = 0, len = folders.length; i < len; i++) {
    const dir = `${path}/${folders[i]}`

    /* istanbul ignore else */
    if ( ! await isDirExists(dir)) {
      await createDir(dir)
    }
  }
  await initDbFiles(config, path, initialDbFiles)
  await addCenterList(config, centerName, path)
  await initOpensslConfig(config.configName, path)
}

async function createCenterListFile(file: string): Promise<void> {
  if (await isFileExists(file)) {
    throw new Error(`centerList file exists. path: "${file}"`)
  }
  else {
    await createFile(file, '')
  }
}



async function initDbFiles(config: Config, path: string, files: InitialFile[]): Promise<void> {
  const db = `${path}/${config.dbDir}`

  if ( ! path) {
    throw new Error('value of path empty initDbFiles()')
  }
  if ( ! files || ! Array.isArray(files) || ! files.length) {
    throw new Error('value of param files empty initDbFiles()')
  }

  for (const file of files) {
    if ( ! file.name) {
      throw new Error('file name empty within initDbFiles()')
    }
    /* istanbul ignore next */
    if (typeof file.defaultValue === 'undefined') {
      throw new Error('file defaultValue empty')
    }
    if (typeof file.defaultValue !== 'string' && typeof file.defaultValue !== 'number') {
      throw new Error('file defaultValue invalid, must be typeof string or number')
    }
    await createFile(`${db}/${file.name}`, file.defaultValue, (file.mode ? { mode: file.mode } : {}))
  }
}


async function addCenterList(config: Config, key: string, path: string): Promise<void> {
  if (!key || !path) {
    throw new Error('params key or path is invalid')
  }
  const centerList = await loadCenterList(config) || <CenterList> {}
  const file = `${config.defaultCenterPath}/${config.centerListName}` // center-list.json

  path = normalize(path)
  if (centerList[key]) {
    throw new Error(`center list exists already, can not create more. key: "${key}", path: "${path}", target: "${path}"`)
  }
  else {
    centerList[key] = path
    await writeFileAsync(file, JSON.stringify(centerList))
  }
}



async function loadCenterList(config: Config): Promise<CenterList | null> {
  const file = `${config.defaultCenterPath}/${config.centerListName}`

  if ( ! await isFileExists(file)) {
    throw new Error(`center file not exists. path: "${file}"`)
  }
  const buf = await readFileAsync(file)
  const str = buf.toString()

  return (typeof str === 'string' && str) ? <CenterList> JSON.parse(str) : null
}


export async function getCenterPath(centerName: string | void): Promise<string> {
  if ( ! centerName) {
    return Promise.resolve('')
  }
  if (centerName === 'default') {
    return Promise.resolve(config.defaultCenterPath)
  }
  const centerList = await loadCenterList(config)

  if (typeof centerList === 'object' && centerList) {
    return Promise.resolve(centerList[centerName])
  }
  else {
    return Promise.resolve('')
  }
}
