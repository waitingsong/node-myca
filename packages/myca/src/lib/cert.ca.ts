import assert from 'assert'
import {
  rm,
  writeFile,
} from 'fs/promises'
import { join, normalize } from 'path'

import {
  createFileAsync,
  isFileExists,
} from '@waiting/shared-core'

import { getCenterPath } from './center.js'
import { genIssueSubj, genKeys, processIssueOpts, validateIssueOpts } from './cert.js'
import { createRandomConfTpl, runOpenssl, unlinkRandomConfTpl } from './common.js'
import {
  initialCaCertRet,
  initialCaOpts,
  initialCertOpts,
  initialConfig,
  initialPrivateKeyOpts,
} from './config.js'
import {
  CaOpts,
  Config,
  IssueCaCertRet,
  IssueOpts,
  PrivateKeyOpts,
  StreamOpts,
} from './types.js'


export async function initCaCert(issueOpts: CaOpts): Promise<IssueCaCertRet> {
  const opts: CaOpts = {
    ...initialCaOpts,
    ...issueOpts,
  }
  assert(opts.centerName, 'centerName empty')

  const centerPath = await getCenterPath(opts.centerName)
  assert(centerPath, `center: ${opts.centerName} not initialized yet`)
  const file = normalize(`${centerPath}/${initialConfig.caCrtName}`)
  const exists = await isFileExists(file)
  assert(! exists, `CA file exists, should unlink it via unlinkCaCert(centerName). file: "${file}"`)

  const { centerName } = opts
  const certRet = await genCaCert(initialConfig, opts)
  const crtFile = await saveCaCrt(initialConfig.caCrtName, centerName, certRet.cert)
  certRet.crtFile = crtFile
  return certRet
}


/** Generate certificate of self-signed CA */
export async function genCaCert(config: Config, options: CaOpts): Promise<IssueCaCertRet> {
  const issueOpts: IssueOpts = await processIssueOpts(config, { ...initialCertOpts, ...options } as IssueOpts)
  issueOpts.kind = 'ca'
  await validateIssueOpts(issueOpts)
  const caKeyFile = join(issueOpts.centerPath, config.caKeyName) // ca.key
  const exists = await isFileExists(caKeyFile)
  assert(! exists, `caKeyFile already exists: "${caKeyFile}"`)

  const privateKeyOpts = { ...initialPrivateKeyOpts, ...issueOpts } as PrivateKeyOpts
  const keysRet = await genKeys(privateKeyOpts)

  await createFileAsync(caKeyFile, keysRet.privateKey, { encoding: 'utf-8', mode: 0o600 })
  const cert = await reqCaCert(config, issueOpts)
  const ret: IssueCaCertRet = { // crtFile empty here
    ...initialCaCertRet,
    cert,
    privateKeyFile: caKeyFile,
    centerName: issueOpts.centerName,
    privateKey: keysRet.privateKey,
    pass: keysRet.pass,
  }
  return ret
}


/** return cert file path */
export async function saveCaCrt(caCrtName: string, centerName: string, data: string): Promise<string> {
  const centerPath = await getCenterPath(centerName)
  const file = join(centerPath, caCrtName)
  await writeFile(file, data, { encoding: 'utf-8', mode: 0o644 })
  return file
}

export async function unlinkCaCrt(centerName: string): Promise<void> {
  const centerPath = await getCenterPath(centerName)
  const file = `${centerPath}/${initialConfig.caCrtName}`
  await rm(file, { force: true })
}


/** unlink ca.key */
export async function unlinkCaKey(centerName: string): Promise<void> {
  const centerPath = await getCenterPath(centerName)
  assert(centerPath, `centerPath empty for centerName: "${centerName}"`)
  const file = `${centerPath}/${initialConfig.caKeyName}` // ca.key
  await rm(file, { force: true })
}


/** Return cert */
async function reqCaCert(config: Config, options: IssueOpts): Promise<string> {
  await validateIssueOpts(options)

  const { days, centerPath, pass } = options
  const keyFile = `${config.caKeyName}`
  const streamOpts: StreamOpts = {
    args: [
      'req', '-batch', '-utf8', '-x509', '-new',
      '-days', days.toString(),
      '-key', keyFile,
    ],
    runOpts: { cwd: centerPath, debug: config.debug },
    rtpl: '',
  }

  const rtpl = await createRandomConfTpl(config, options)
  const exists = await isFileExists(rtpl)
  assert(exists, 'reqCaCert() rtpl blank')
  streamOpts.args.push('-config', rtpl)
  streamOpts.rtpl = rtpl
  if (config.isWin32) {
    void 0
  }
  else {
    const subj = genIssueSubj(options)
    subj && streamOpts.args.push('-subj', subj)
    // console.info('reqCaCert() debug::', { subj, options }) // @DEBUG
  }

  if (pass) {
    streamOpts.args.push('-passin', `pass:${pass}`)
  }

  const stdout = await runOpenssl(streamOpts.args, streamOpts.runOpts)
  await unlinkRandomConfTpl(streamOpts.rtpl)
  assert(stdout.includes('CERTIFICATE'), 'reqCaCert() openssl return value: ' + stdout)

  return stdout
}
