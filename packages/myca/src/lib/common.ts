import assert from 'assert'
import { copyFile, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import { createFileAsync } from '@waiting/shared-core'
import { $, cd } from 'zx'

import { initialConfig, reqSubjectFields } from './config.js'
import { CertDNkeys, Config, IssueOpts } from './types.js'


export async function runOpenssl(args: string[], options?: { cwd?: string, input?: string }): Promise<string> {
  let currDir = ''

  // await $`export`
  const script = initialConfig.openssl
  if (options?.cwd) {
    currDir = process.cwd()
    cd(options.cwd)
  }
  try {
    let stdout = ''
    if (options?.input?.length) {
      const resp = await $`echo ${options.input} | ${script} ${args}`
      stdout = resp.stdout
    }
    else {
      const ret = await $`${script} ${args}`
      stdout = ret.stdout
    }
    currDir && cd(currDir)
    return stdout
  }
  catch (ex) {
    currDir && cd(currDir)
    throwMaskError(ex)
  }
}


export function maskPasswdInString(command: string): string {
  let ret = command.replace(/(?<=pass:)(.+?[\b\s])/ug, (word: string) => {
    return '*'.repeat(word.length)
  })
  ret = ret.replace(/(?<=pass:)(.+)$/ug, (word: string) => {
    return '*'.repeat(word.length)
  })
  return ret
}


export function throwMaskError(exception: unknown): never {
  const error = new Error()
  const err = exception instanceof Error
    ? exception
    : new Error(typeof exception === 'string' ? exception : 'unknown error')
  error.name = maskPasswdInString(err.name) || 'Error'
  error.message = maskPasswdInString(err.message)
  throw error
}


/**
 * Failed if run in vscode F5 debug mode under windows
 */
export async function getOpensslVer(openssl: string): Promise<string> {
  assert(openssl && typeof openssl === 'string', 'param openssl invalid')
  // await $`echo $SHELL`
  // if (initialConfig.isWin32 && process.env['NODE_ENV']?.includes('test')) {
  //   console.info('getOpensslVer() skip for test')
  //   return '999.0.0'
  // }

  try {
    const ret = await $`${openssl} version`
    const stedout = ret.stdout
    assert(stedout.includes('OpenSSL'), 'openssl cli error:' + stedout)
    const ver = stedout.split(' ')[1]
    assert(ver, 'openssl cli error:' + stedout)
    return ver
  }
  catch (ex) {
    console.error(ex)
    throw ex
  }
}


export async function unlinkRandomConfTpl(file: string): Promise<void> {
  assert(file && typeof file === 'string', 'param file invalid')
  await rm(file, { force: true })
}


export function genRandomCenterPath(suffix: string | number): string {
  if (! suffix && suffix !== 0) {
    throw new TypeError('genRandomCenterPath() param invalid')
  }
  const str = suffix.toString().trim().replace(/\s|\//ug, '_')
  if (! str) {
    throw new TypeError('genRandomCenterPath() param empty')
  }
  return initialConfig.defaultCenterPath + '-' + str
}

/** return random config file path */
export async function createRandomConfTpl(config: Config, signOpts: IssueOpts): Promise<string> {
  const { kind } = signOpts
  assert(typeof kind === 'string', 'param kind invalid')

  const rfile = `${tmpdir()}/openssl-` + Math.random().toString() + `.conf.${kind}`
  const confTplPath = join(initialConfig.appDir, 'asset', `${config.confTpl}.${kind}`)

  let tplContent = await readFile(confTplPath, 'utf8')
  assert(tplContent, `loaded openssl config tpl is empty, file: "${confTplPath}"`)

  reqSubjectFields.forEach((field: CertDNkeys) => {
    let value = ''
    const regx = new RegExp(`%${field}%`, 'u')

    if (typeof signOpts[field] === 'string' && signOpts[field]) {
      value = signOpts[field] as string
    }
    tplContent = tplContent.replace(regx, value)
  })

  tplContent = tplContent.replace(/%hash%/ug, signOpts.hash) // global

  const sans = signOpts.SAN
  const { ips } = signOpts

  const names = '\nsubjectAltName='
  let dn = ''
  let ip = ''

  // subjectAltName=DNS:www.foo.com,DNS:www.bar.com
  if (sans && Array.isArray(sans) && sans.length) {
    dn = sans.map(name => 'DNS:' + name).join(',')
  }

  // subjectAltName=IP:127.0.0.1,IP:192.168.0.1
  if (ips && Array.isArray(ips) && ips.length) {
    ip = ips.map(name => 'IP:' + name).join(',')
    dn && (ip = ',' + ip)
  }
  if (dn || ip) {
    tplContent += names + dn + ip
  }

  const ret = await createFileAsync(rfile, tplContent)
  return ret
}

/** Copy .config to centerPath(~/.myca/)  */
export async function initOpensslConfig(configName: string, centerPath: string): Promise<void> {
  const src = join(initialConfig.appDir, 'asset', configName)
  const target = join(centerPath, configName)
  await copyFile(src, target)
}


export async function removeCenterFiles(dir: string): Promise<void> {
  const list = [
    'center-list.json',
    'ca.key',
    'ca.crt',
    '.config',
    'client',
    'server',
    'db',
  ]
  for (const file of list) {
    const path = join(dir, file)
    // eslint-disable-next-line no-await-in-loop
    await rm(path, { recursive: true, force: true })
  }
}

export function escapeShell(cmd: string): string {
  return cmd.replace(/(["\s'$`\\])/ug, '\\$1')
}
