import assert from 'assert'
import {
  chmod,
  cp,
  writeFile,
  rm,
} from 'fs/promises'
import { tmpdir } from 'os'
import { basename, join, normalize } from 'path'

import {
  createFileAsync,
  isDirExists,
  isFileExists,
} from '@waiting/shared-core'

import { getCenterPath, nextSerial } from './center.js'
import {
  createRandomConfTpl,
  runOpenssl,
  unlinkRandomConfTpl,
} from './common.js'
import {
  initialCertOpts,
  initialCertRet,
  initialConfig,
  initialPrivateKeyOpts,
  initialSignOpts,
  reqSubjectFields,
} from './config.js'
import {
  CertDN,
  CertOpts,
  Config,
  IssueCertRet,
  IssueOpts,
  KeysRet,
  PfxOpts,
  PrivateKeyOpts,
  SignOpts,
} from './types.js'



/** issue certificate of server or client by ca.key */
export async function genCert(options: CertOpts, conf?: Config): Promise<IssueCertRet> {
  const localConfig: Config = conf ? { ...initialConfig, ...conf } : initialConfig
  const issueOpts = await processGenCertIssueOpts(options, localConfig)
  await validateIssueOpts(issueOpts)

  const { centerPath } = issueOpts

  const csrNkeysRet = await genCsrFile(issueOpts, localConfig)
  const { csr, csrFile, keysRet } = csrNkeysRet
  const caKeyFile = join(centerPath, localConfig.caKeyName) // ca.key
  const caCrtFile = join(centerPath, localConfig.caCrtName) // ca.crt
  const issueCertRet: IssueCertRet = {
    ...initialCertRet,
    ...keysRet,
    centerName: issueOpts.centerName,
    caKeyFile,
    caCrtFile,
    csr,
    csrFile,
    crtFile: join(centerPath, issueOpts.kind, `${issueOpts.serial}.crt`),
  }
  assert(issueOpts.configFile, 'configFile empty')

  const csrTmpName = basename(issueCertRet.csrFile) + '.' + Math.random().toString() + '.tmp'
  // copy private key to center path, cause may not found under sub path under windows os
  await cp(issueCertRet.csrFile, `${centerPath}/${csrTmpName}`)

  const caCertTmpName = basename(issueCertRet.caCrtFile) + '.' + Math.random().toString() + '.tmp'
  await cp(issueCertRet.caCrtFile, `${centerPath}/${caCertTmpName}`)

  const caKeyTmpName = basename(issueCertRet.caKeyFile) + '.' + Math.random().toString() + '.tmp'
  await cp(issueCertRet.caKeyFile, `${centerPath}/${caKeyTmpName}`)

  try {
    const { caKeyPass } = issueOpts
    const signOpts: SignOpts = {
      ...initialSignOpts,
      centerPath,
      // caCrtFile: issueCertRet.caCrtFile,
      // caKeyFile: issueCertRet.caKeyFile,
      // csrFile: issueCertRet.csrFile,
      caCrtFile: caCertTmpName,
      caKeyFile: caKeyTmpName,
      caKeyPass,
      csrFile: csrTmpName,
      configFile: issueOpts.configFile,
      SAN: issueOpts.SAN ?? [],
      ips: issueOpts.ips ?? [],
      days: issueOpts.days,
    }

    const cert = await sign(signOpts, localConfig)
    issueCertRet.cert = cert
    await createFileAsync(issueCertRet.crtFile, issueCertRet.cert, { encoding: 'utf-8', mode: 0o644 })

    // EXPORT TO PKCS#12 FORMAT
    if (issueOpts.kind === 'client') {
      const clientOpts: PfxOpts = {
        privateKeyFile: issueCertRet.privateUnsecureKeyFile,
        crtFile: issueCertRet.crtFile,
        pfxPass: issueCertRet.pass,
      }
      const tmpFile = await outputClientCert(clientOpts)
      issueCertRet.pfxFile = join(issueOpts.centerPath, issueOpts.kind, `${issueOpts.serial}.p12`)
      assert(typeof issueCertRet.pfxFile === 'string', 'pfxFile empty')
      await writeFile(tmpFile, issueCertRet.pfxFile, 'utf-8')
      await chmod(issueCertRet.pfxFile as string, 0o600)
      await rm(issueCertRet.privateUnsecureKeyFile, { force: true })
      await rm(tmpFile, { force: true })

      issueCertRet.privateUnsecureKeyFile = ''
    }

    return issueCertRet
  }
  finally {
    await rm(csrTmpName, { force: true })
    await rm(caCertTmpName, { force: true })
    await rm(caKeyTmpName, { force: true })
  }
}


async function processGenCertIssueOpts(options: CertOpts, localConfig: Config): Promise<IssueOpts> {
  const issueOpts = await processIssueOpts(localConfig, { ...initialCertOpts, ...options } as IssueOpts)
  assert(issueOpts.kind !== 'ca', 'value of kind can not be "ca", generate CA cert via genCaCert()')
  await validateIssueOpts(issueOpts)

  const serial = await nextSerial(issueOpts.centerName)
  issueOpts.serial = serial
  return issueOpts
}

async function genCsrFile(
  issueOpts: IssueOpts,
  localConfig: Config,
): Promise<{csr: string, csrFile: string, keysRet: KeysRet}> {

  const privateKeyOpts = { ...initialPrivateKeyOpts, ...issueOpts } as PrivateKeyOpts
  const keysRet = await genKeys(privateKeyOpts, localConfig.debug)

  const { privateKeyFile, privateUnsecureKeyFile } = await savePrivateKeys(localConfig, issueOpts, keysRet)
  keysRet.privateKeyFile = privateKeyFile
  keysRet.privateUnsecureKeyFile = privateUnsecureKeyFile

  const csr = await reqServerCert(localConfig, issueOpts, keysRet)
  const csrFile = join(issueOpts.centerPath, issueOpts.kind, `${issueOpts.serial}.csr`)
  await createFileAsync(csrFile, csr, { encoding: 'utf-8', mode: 0o600 })

  return { csr, csrFile, keysRet }
}


export async function genKeys(privateKeyOpts: PrivateKeyOpts, debug = false): Promise<KeysRet> {
  const privateKey = await genPrivateKey(privateKeyOpts, debug)
  const pubKey = await genPubKeyFromPrivateKey(privateKey, privateKeyOpts.pass, privateKeyOpts.alg, debug)
  const privateUnsecureKey = await decryptPrivateKey(privateKey, privateKeyOpts.pass, privateKeyOpts.alg, debug)
  const ret: KeysRet = {
    pubKey,
    privateKey,
    privateUnsecureKey,
    pass: privateKeyOpts.pass,
    privateKeyFile: '',
    privateUnsecureKeyFile: '',
  }
  return ret
}


async function genPrivateKey(options: PrivateKeyOpts, debug = false): Promise<string> {
  let key = ''

  switch (options.alg) {
    case 'rsa':
      key = await genRSAKey(options.pass, options.keyBits, debug)
      break

    case 'ec':
      key = await genECKey(options.pass, options.ecParamgenCurve, debug)
      break

    default:
      throw new Error('value of param invalid')
  }

  return key
}


// generate rsa private key pem
async function genRSAKey(
  pass: PrivateKeyOpts['pass'],
  keyBits: PrivateKeyOpts['keyBits'],
  debug = false,
): Promise<string> {

  const args = [
    'genpkey', '-algorithm', 'rsa',
    '-aes256', '-pass', `pass:${pass}`,
    '-pkeyopt', `rsa_keygen_bits:${keyBits}`,
  ]

  const stdout = await runOpenssl(args, { debug })
  assert(stdout.includes('PRIVATE KEY'), `generate private key failed. stdout: "${stdout}"`)
  return stdout
}


// generate ec private key pem
async function genECKey(
  pass: PrivateKeyOpts['pass'],
  ecParamgenCurve: PrivateKeyOpts['ecParamgenCurve'],
  debug = false,
): Promise<string> {

  assert(ecParamgenCurve, 'ecParamgenCurve can not be empty')

  const args = [
    'genpkey', '-algorithm', 'ec',
    '-aes256', '-pass', `pass:${pass}`,
    '-pkeyopt', `ec_paramgen_curve:${ecParamgenCurve}`,
  ]

  const stdout = await runOpenssl(args, { debug })
  assert(stdout.includes('PRIVATE KEY'), `generate private key failed. stdout: "${stdout}"`)
  return stdout
}


async function genPubKeyFromPrivateKey(
  privateKey: string,
  passwd: PrivateKeyOpts['pass'],
  alg: PrivateKeyOpts['alg'],
  debug = false,
): Promise<string> {

  const args = [alg, '-pubout']

  /* istanbul ignore next */
  if (passwd && privateKey.indexOf('ENCRYPTED') > 0) {
    args.push('-passin', `pass:${passwd}`)
  }

  const stdout = await runOpenssl(args, { input: privateKey, debug })
  assert(stdout.includes('PUBLIC KEY'), 'genPubKeyFromPrivateKey() output invalid PUBLIC KEY: ' + stdout.slice(0, 1000))
  return stdout
}


export async function decryptPrivateKey(
  privateKey: string,
  passwd: PrivateKeyOpts['pass'],
  alg: PrivateKeyOpts['alg'],
  debug = false,
): Promise<string> {

  /* istanbul ignore next */
  if (! privateKey.includes('ENCRYPTED')) {
    assert(privateKey.includes('PRIVATE'), 'decryptPrivateKey() Param key not valid **encrypted** private key')
    return privateKey // unsecure private key
  }

  const args: string[] = [alg]
  /* istanbul ignore next */
  if (passwd && privateKey.indexOf('ENCRYPTED') > 0) {
    args.push('-passin', `pass:${passwd}`)
  }

  const stdout = await runOpenssl(args, { input: privateKey, debug })
  assert(stdout.slice(0, 50).includes('PRIVATE KEY'), 'decryptPrivateKey() output invalid PRIVATE KEY: ' + stdout.slice(0, 1000))
  return stdout
}



/** Generate and return csr base64 */
async function reqServerCert(config: Config, options: IssueOpts, keysRet: KeysRet): Promise<string> {
  await validateIssueOpts(options)

  const { privateUnsecureKeyFile } = keysRet
  const args = [
    'req', '-batch', '-utf8', '-new',
    // '-key', privateUnsecureKeyFile,
  ]
  const tplPath = await createRandomConfTpl(config, options)
  const rtpl = normalize(tplPath)
  args.push('-config', rtpl)

  const tplExists = await isFileExists(rtpl)
  assert(tplExists, 'tpl file not exists: ' + rtpl)

  const pkeyTmpName = basename(privateUnsecureKeyFile) + '.' + Math.random().toString() + '.tmp'
  // copy private key to center path, cause may not found under sub path under windows os
  await cp(privateUnsecureKeyFile, `${options.centerPath}/${pkeyTmpName}`)
  args.push('-key', `${options.centerPath}/${pkeyTmpName}`)

  const runOpts = { cwd: options.centerPath, debug: config.debug }
  const stdout = await runOpenssl(args, runOpts)
  await unlinkRandomConfTpl(rtpl)
  await unlinkRandomConfTpl(`${options.centerPath}/${pkeyTmpName}`)
  assert(stdout.includes('CERTIFICATE REQUEST'), 'openssl return value: ' + stdout)

  return stdout
}


export async function validateIssueOpts(options: IssueOpts): Promise<IssueOpts> {
  const { alg, centerPath, hash, kind, pass } = options
  const caKeyFile = `${centerPath}/${initialConfig.caKeyName}`

  /* istanbul ignore next */
  if (alg === 'ec' && initialConfig.opensslVer && initialConfig.opensslVer < '1.0.2') {
    throw new Error('openssl version < "1.0.2" not support ec generation, current is: ' + initialConfig.opensslVer)
  }
  if (! centerPath) {
    throw new Error(`centerPath: "${centerPath}" not exits for centerName: "${options.centerName}" \n
      should create center dir by calling initCenter(centerName, path)
    `)
  }
  assert(typeof pass === 'string', 'pass must be typeof string')
  assert(pass.length >= 4, 'length of pass must at least 4')
  assert(pass.length < 1024, 'length of pass must not greater than 1023 chars if not empty')
  assert(! /\s/u.test(pass), 'pass phrase contains blank or invisible char')
  assert(hash, 'value of hash empty. must be sha256|sha384')
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  assert(hash === 'sha256' || hash === 'sha384', 'value of hash invalid. must be sha256|sha384')
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  assert(kind === 'ca' || kind === 'server' || kind === 'client', 'value of kind invalid. must be ca|server|client')

  if (! options.C || options.C.length !== 2) {
    throw new Error('value of C (Country Name) must be 2 letters')
  }
  if (! options.CN) {
    throw new Error('value of CN (Common Name) invalid')
  }
  // if ( ! options.OU) {
  //   throw new Error('value of OU (Organizational Unit Name) invalid')
  // }

  assert(typeof options.days === 'number', 'value of days must typeof number')
  assert(options.days > 0, 'value of days must greater than zero')

  if (kind !== 'ca') {
    const exists = await isFileExists(caKeyFile)
    assert(exists, `caKeyFile not exists, file: "${caKeyFile}"`)
  }
  return options
}


export async function processIssueOpts(config: Config, options: IssueOpts): Promise<IssueOpts> {
  const path = await getCenterPath(options.centerName)
  const { keyBits, pass } = options

  options.centerPath = path
  if (! options.configFile) {
    options.configFile = `${options.centerPath}/${config.configName}`
  }

  if (options.alg === 'rsa') {
    if (keyBits && typeof keyBits === 'number') {
      if (keyBits < 2048) {
        options.keyBits = 2048
      }
      if (keyBits > 8192) {
        options.keyBits = 8192
      }
    }
    else {
      options.keyBits = 2048
    }
  }

  if (typeof options.caKeyPass !== 'undefined') {
    options.caKeyPass = options.caKeyPass.toString()
  }

  /* istanbul ignore next */
  if (typeof pass === 'number') {
    options.pass += ''
  }

  for (const prop of reqSubjectFields) {
    // @ts-ignore
    if (typeof options[prop] !== 'undefined' && ! options[prop]) {
      // @ts-ignore
      options[prop] = ''
    }
  }

  return options
}


export function genIssueSubj(options: CertDN): string {
  const arr: string[] = []

  for (const prop of reqSubjectFields) {
    if (typeof options[prop] !== 'undefined' && options[prop]) {
      const value = options[prop]
      if (! value) { continue }
      const val: string | string[] = value
      // if (Array.isArray(value)) {
      //   val = value.map(escapeShell)
      // }
      // else if (value) {
      //   val = escapeShell(value)
      // }

      if (typeof val === 'undefined') { continue }
      if (! val) { continue }
      if (typeof val === 'string') {
        arr.push(`${prop}=${val}`)
      }
      else if (Array.isArray(val)) {
        arr.push(`${prop}=${val.join(',')}`)
      }
    }
  }
  return arr.length ? '/' + arr.join('/') : ''
}


/** Save private keys to path ./server */
async function savePrivateKeys(
  config: Config,
  issueOpts: IssueOpts,
  keysRet: KeysRet,
): Promise<{ privateKeyFile: string, privateUnsecureKeyFile: string }> {

  void config

  const { centerPath, kind, serial } = issueOpts
  const { privateKey, privateUnsecureKey } = keysRet

  const privateKeyFile = join(centerPath, kind, `${serial}.key`)
  const privateUnsecureKeyFile = `${privateKeyFile}.unsecure`

  await writeFile(privateKeyFile, privateKey, { encoding: 'utf-8', mode: 0o600 })
  await writeFile(privateUnsecureKeyFile, privateUnsecureKey, { encoding: 'utf-8', mode: 0o600 })
  const exists = await isFileExists(privateKeyFile)
  assert(exists, `save private key file failed. file: "${privateKeyFile}"`)

  return { privateKeyFile, privateUnsecureKeyFile }
}


/** sign csr with ca.key, return crt */
export async function sign(signOpts: SignOpts, conf?: Config): Promise<string> {
  await validateSignOpts(signOpts)

  const { days, caKeyPass, csrFile } = signOpts
  const args = [
    'ca', '-batch',
    '-days', days.toString(),
    // '-cert', normalize(caCrtFile),
    // '-keyfile', normalize(caKeyFile),
    '-in', normalize(csrFile),
    '-passin', `pass:${caKeyPass}`,
  ] as string[]

  const localConfig: Config = conf ? { ...initialConfig, ...conf } : initialConfig
  const rtpl = await createRandomConfTpl(localConfig, signOpts as IssueOpts)
  args.push('-config', normalize(rtpl))

  // const { configFile, ips, SAN } = signOpts
  // if (SAN?.length || ips?.length) {
  //   const rtpl = await createRandomConfTpl(localConfig, signOpts as IssueOpts)
  //   args.push('-config', normalize(rtpl))
  // }
  // else {
  //   // configFile validated by validateSignOpts()
  //   assert(configFile, 'configFile empty')
  //   args.push('-config', normalize(configFile))
  // }

  const stdout = await runOpenssl(args, { cwd: signOpts.centerPath })
  assert(stdout, 'openssl sign csr return value empty')
  assert(stdout.includes('CERTIFICATE'), 'openssl sign csr return value: ' + stdout)

  return stdout
}


/** generate pfx file, return file path(under user tmp folder) */
export async function outputClientCert(options: PfxOpts): Promise<string> {
  await validatePfxOpts(options)

  const { privateKeyFile, privateKeyPass, crtFile, pfxPass } = options
  const pfxFile = join(tmpdir(), `/tmp-${Math.random()}.p12`)
  const args = [
    'pkcs12', '-export', '-aes256',
    '-in', crtFile,
    '-inkey', privateKeyFile,
    '-out', pfxFile,
  ] as string[]

  if (privateKeyPass) {
    args.push('-passin', `pass:${privateKeyPass}`)
  }
  args.push('-passout', pfxPass ? `pass:${pfxPass}` : 'pass:')

  const stdout = await runOpenssl(args)
  assert(! stdout, 'openssl output pkcs12 failed, return value: ' + stdout)

  return pfxFile
}


async function validateSignOpts(signOpts: SignOpts): Promise<SignOpts> {
  const { SAN, ips, days, hash, caKeyPass } = signOpts

  assert(typeof +days === 'number', `value of param days of signOpts inavlid: "${days}"`)
  assert(+days > 0, `value of param days of signOpts inavlid: "${days}"`)
  assert(signOpts.configFile, 'value of param configFile of signOpts empty')

  if (typeof SAN !== 'undefined') {
    assert(Array.isArray(SAN), `value of param SAN of signOpts, must Array<string>, inavlid: "${SAN.toString()}"`)
    for (const name of SAN) {
      assert(name, 'item value of SAN of signOpts empty')
    }
  }
  if (typeof ips !== 'undefined') {
    assert(Array.isArray(ips), `value of param ips of signOpts, must Array<string>, inavlid: "${ips.toString()}"`)
    for (const name of ips) {
      assert(name, 'item value of ips of signOpts empty')
    }
  }

  assert(hash, `value of param hash of signOpts inavlid: "${hash}"`)

  assert(typeof caKeyPass === 'string', `value of param caKeyPass of signOpts inavlid: "${caKeyPass}"`)
  assert(caKeyPass.length > 0, `value of param caKeyPass of signOpts inavlid: "${caKeyPass}"`)

  const exists = await isDirExists(signOpts.centerPath)
  assert(exists, `folder of param centerPath of signOpts not exists: "${signOpts.centerPath}"`)

  if (basename(signOpts.caCrtFile) !== signOpts.caCrtFile) {
    const exists2 = await isFileExists(signOpts.caCrtFile)
    assert(exists2, `file of param caCrtFile of signOpts not exists: "${signOpts.caCrtFile}"`)
  }

  if (basename(signOpts.caKeyFile) !== signOpts.caKeyFile) {
    const exists3 = await isFileExists(signOpts.caKeyFile)
    assert(exists3, `file of param caKeyFile of signOpts not exists: "${signOpts.caKeyFile}"`)
  }

  if (basename(signOpts.caKeyFile) !== signOpts.caKeyFile) {
    const exists4 = await isFileExists(signOpts.csrFile)
    assert(exists4, `file of param csrFile of signOpts not exists: "${signOpts.csrFile}"`)
  }

  if (basename(signOpts.caKeyFile) !== signOpts.caKeyFile) {
    const exists5 = await isFileExists(signOpts.configFile)
    assert(exists5, `file of param configFile of signOpts not exists: "${signOpts.configFile}"`)
  }

  return signOpts
}


/* istanbul ignore next */
async function validatePfxOpts(pfxOpts: PfxOpts): Promise<void> {
  const { privateKeyFile, privateKeyPass, crtFile, pfxPass } = pfxOpts

  assert(await isFileExists(privateKeyFile), `privateKeyFile not exists: "${privateKeyFile}"`)
  assert(await isFileExists(crtFile), `crtFile not exists: "${crtFile}"`)

  if (privateKeyPass) { // can be blank
    assert(privateKeyPass.length >= 4, 'length of privateKeyPass must at least 4 if not empty')
    assert(! /\s/u.test(privateKeyPass), 'privateKeyPass phrase contains blank or invisible char')
  }
  if (pfxPass) { // can be blank
    assert(! /\s/u.test(pfxPass), 'pfxPass phrase contains blank or invisible char')
    assert(pfxPass.length >= 4, 'length of pfxPass must at least 4 if not empty')
  }
}
