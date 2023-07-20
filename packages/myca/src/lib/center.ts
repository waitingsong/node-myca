import assert from 'assert'
import {
  readFile,
  writeFile,
} from 'fs/promises'
import { join, normalize } from 'path'

import {
  createDirAsync,
  createFileAsync,
  isDirExists,
  isFileExists,
} from '@waiting/shared-core'

import { genRandomCenterPath, initOpensslConfig } from './common.js'
import { initialConfig, initialDbFiles } from './config.js'
import { CenterList, Config, InitialFile } from './types.js'


export async function getCenterPath(centerName: string | void): Promise<string> {
  // assert(typeof centerName === 'string', 'value of centerName invalid')
  // assert(centerName, 'value of centerName invalid')

  if (centerName === 'default') {
    return initialConfig.defaultCenterPath
  }

  const list = await loadCenterList(initialConfig)
  assert(typeof list === 'object', 'center list invalid')
  const path = list && centerName ? list[centerName] : ''
  return path ?? ''
}


/** Get serial HEX string */
export async function nextSerial(centerName: string): Promise<string> {
  const centerPath = await getCenterPath(centerName)
  assert(centerPath, `centerPath not exists, centerName: "${centerName}"`)

  const serialPath = `${centerPath}/db/serial`
  const serialExists = await isFileExists(serialPath)
  assert(serialExists, `serial file not exists, path: "${serialPath}"`)
  const serialContent = await readFile(serialPath, 'utf8')
  const dec = parseInt(serialContent, 16)
  const hex = serialContent

  if (typeof dec !== 'number' || ! dec || dec < 1) {
    throw new Error(`retrive nextSerial failed nextDec not typeof number or invalid.
      value: "${hex}", Dec: ${dec}`)
  }
  assert(Number.isSafeInteger(dec), `retrive nextSerial failed. not save integer. value: "${hex}", Dec: ${dec}`)

  if (hex.replace(/^0+/u, '').toLocaleLowerCase() !== dec.toString(16)) {
    throw new Error(`retrive nextSerial failed or invalid.
      hex formatted: "${hex.replace(/^0+/u, '').toLocaleLowerCase()}",
      Dec to hex: ${dec.toString(16)}`)
  }

  return hex
}


/** Create defaultCenterPath and center folders/files, return centerPath */
export async function initDefaultCenter(): Promise<Config['defaultCenterPath']> {
  const centerName = 'default'
  // const centerPathErr = await getCenterPath(centerName)
  // assert(! centerPathErr, `default center initialized already. path: "${centerPathErr}"`)

  const inited = await isCenterInited(centerName)
  assert(! inited, `default center initialized already. centerName: "${centerName}", path: "${initialConfig.defaultCenterPath}"`)

  // create default ca dir under userHome
  await createDirAsync(initialConfig.defaultCenterPath)

  // must before createCenter()
  await createCenterListFile(join(initialConfig.defaultCenterPath, initialConfig.centerListName))

  // create default cneter dir under userHome
  await createCenter(initialConfig, centerName, initialConfig.defaultCenterPath)

  return initialConfig.defaultCenterPath
}


/** Create center path and folders/files, return center path */
export async function initCenter(centerName: string, path?: string): Promise<string> {
  const defaultInitedValid = await isCenterInited('default')

  const centerPath = path ? path : genRandomCenterPath(centerName)
  assert(centerName !== 'default', 'Calling method of initDefaultCenter() to init default center')

  assert(defaultInitedValid, 'default center must be initialized first')

  const inited = await getCenterPath(centerName)
  assert(! inited, `Center of "${centerName}" initialized already. path: "${inited}"`)


  const validDirs = [
    initialConfig.dbDir,
    initialConfig.serverDir,
    initialConfig.clientDir,
    initialConfig.dbCertsDir,
  ]
  for (const dir of validDirs) {
    const dir2 = `${centerPath}/${dir}` // or only dir
    // eslint-disable-next-line no-await-in-loop
    const exists = await isDirExists(dir2)
    assert(! exists, `Folder(s) exists already during initCenter: ${dir2}`)
  }

  await createDirAsync(centerPath)
  await createCenter(initialConfig, centerName, centerPath)
  const ret = normalize(centerPath)
  return ret
}


/**
 * Check whether specified cenerName initialized.
 * Return center path, blank if not initialized yet
 */
export async function isCenterInited(centerName: string): Promise<boolean> {
  assert(centerName, 'value of centerName invalid')

  const path = await getCenterPath(centerName)
  if (! path) {
    return false
  }
  const exists = await isDirExists(path)
  return exists
}


/** Create center dirs to store output certifacates */
export async function createCenter(config: Config, centerName: string, path: string): Promise<string> {
  const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]

  assert(path, 'value of path invalid')
  const path2 = normalize(path)

  assert(centerName, 'value of centerName invalid')

  const inited = await isCenterInited(centerName)
  if (! inited) {
    await createDirAsync(path2)
  }

  for (const folder of folders) {
    const dir = `${path2}/${folder}`
    // eslint-disable-next-line no-await-in-loop
    const exists = await isDirExists(dir)
    if (! exists) {
      // eslint-disable-next-line no-await-in-loop
      await createDirAsync(dir)
    }
  }

  await initDbFiles(config, path2, initialDbFiles)
  await addCenterList(config, centerName, path2)
  await initOpensslConfig(config.configName, path2)
  return path2
}

export async function createCenterListFile(file: string): Promise<void> {
  if (await isFileExists(file)) {
    throw new Error(`CenterList file exists. path: "${file}"`)
  }
  else {
    await createFileAsync(file, '')
  }
}



export async function initDbFiles(config: Config, path: string, files: InitialFile[]): Promise<void> {
  assert(path, 'value of path empty initDbFiles()')
  assert(Array.isArray(files), 'value of param files invalid initDbFiles()')
  assert(files.length, 'value of param files invalid initDbFiles()')

  const db = `${path}/${config.dbDir}`

  for (const file of files) {
    if (! file.name) {
      throw new Error('file name empty within initDbFiles()')
    }
    /* istanbul ignore next */
    if (typeof file.defaultValue === 'undefined') {
      throw new Error('file defaultValue empty')
    }
    if (typeof file.defaultValue !== 'string' && typeof file.defaultValue !== 'number') {
      throw new Error('file defaultValue invalid, must be typeof string or number')
    }
    // eslint-disable-next-line no-await-in-loop
    await createFileAsync(`${db}/${file.name}`, file.defaultValue, file.mode ? { mode: file.mode } : {})
  }
}


export async function addCenterList(config: Config, key: string, path: string): Promise<void> {
  assert(key, 'key empty addCenterList()')
  assert(path, 'path empty addCenterList()')

  const centerList = await loadCenterList(config)
  const opts = {
    k: key,
    path: normalize(path),
    defaultCenterPath: config.defaultCenterPath,
    centerListName: config.centerListName,
  }
  assert(
    ! centerList?.[opts.k],
    `center list exists already, can not create more. key: "${opts.k}", path: "${path}", target: "${opts.path}"`,
  )

  const file = `${opts.defaultCenterPath}/${opts.centerListName}` // center-list.json
  const data = {
    ...centerList,
    [key]: opts.path,
  }
  await writeFile(file, JSON.stringify(data), { encoding: 'utf8' })
}


export async function loadCenterList(config: Config): Promise<CenterList | null> {
  const file = `${config.defaultCenterPath}/${config.centerListName}`
  const fileExist = await isFileExists(file)
  assert(fileExist, `center file not exists. path: "${file}"`)

  const content = await readFile(file, { encoding: 'utf8' })
  const json = content ? JSON.parse(content) as CenterList : null
  return json
}


