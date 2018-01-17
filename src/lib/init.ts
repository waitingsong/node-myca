import { exec } from 'child_process'
import { normalize } from 'path'

import { genCaCert, saveCaCrt } from './cert'
import {
  createDir,
  createFile,
  getCenterPath,
  isDirExists,
  isFileExists,
  updateCenterList } from './common'
import { config, initialCaOptions } from './config'
import { CaOpts, CertOpts } from './model'

config.isWin32 = process.platform === 'win32' ? true : false
config.isWin32 && (config.randomConfigFile = Math.random() + '.conf' )
config.userHome = config.isWin32 ? normalize(process.env.USERPROFILE || '') : normalize(`${process.env.HOME}`)
config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`) // dir contains conf file and folders
config.openssl = normalize(config.openssl)

if ( ! config.opensslVer) {
  getOpensslVer(config.openssl).then(ver => {
    config.opensslVer = ver
  })
}
if ( ! config.userHome) {
  throw new Error('value of user profile (path) empty')
}

const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]
const initialFiles: string[] = [config.centerListName]
export const userHome = config.userHome


// create defaultCenterPath and center folders/files
export async function initDefaultCenter(): Promise<void> {
  const centerName = 'default'

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
  console.log(`CenterPath name: ${centerName}, path: ${path}`)
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
}


async function createInitialFiles(path: string, files: string[]): Promise<void> {
  for (let i = 0, len = files.length; i < len; i++) {
    const file = `${path}/${files[i]}`
    const data = { default: path }

    await createFile(file, data)
  }
}

async function initDbFiles(path: string): Promise<void> {
  const dir = `${path}/${config.dbDir}`

  await createFile(`${dir}/serial`, '', { mode: 0o644 })
  await createFile(`${dir}/index`, '', { mode: 0o644 })
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

export async function initCaCert(issueOpts: CaOpts): Promise<void> {
  const opts = <CertOpts> { ...initialCaOptions, ...issueOpts }

  if ( ! opts.centerName) {
    return Promise.reject('centerName empty')
  }
  if ( ! await isCenterInited(opts.centerName)) {
    return Promise.reject(`center: ${opts.centerName} not initialized yes`)
  }
  const centerPath = await getCenterPath(opts.centerName)
  const file = normalize(`${centerPath}/${config.caCrtName}`)

  if (await isFileExists(file)) {
    return Promise.reject(`CA file exists, should unlink it via unlinkCaCert(centerName). file: "${file}"`)
  }
  const certRet = await genCaCert(opts)

  await saveCaCrt(config, opts, certRet.cert)
}
