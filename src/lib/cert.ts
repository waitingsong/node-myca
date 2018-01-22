import { execFile } from 'child_process'
import { tmpdir } from 'os'
import { join, normalize } from 'path'

import { getCenterPath, isCenterInited, nextSerial } from './center'
import {
  createFile,
  isDirExists,
  isFileExists,
  readFileAsync,
  runOpenssl,
  unlinkAsync,
  writeFileAsync } from './common'
import {
  config,
  initialCaOpts,
  initialCertOpts,
  initialCertRet,
  initialPrivateKeyOpts,
  initialSignOpts,
  reqSubjectFields } from './config'
import {
  CaOpts,
  CertOpts,
  Config,
  IssueCertRet,
  IssueOpts,
  KeysRet,
  PrivateKeyOpts,
  SignOpts } from './model'


export async function initCaCert(issueOpts: CaOpts): Promise<void> {
  const opts = <CertOpts> { ...initialCaOpts, ...issueOpts }

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


// generate certificate of self-signed CA
async function genCaCert(options: CertOpts): Promise<IssueCertRet> {
  const issueOpts = await processIssueOpts(config, <IssueOpts> { ...initialCertOpts, ...options })

  issueOpts.kind = 'ca'
  validateIssueOpts(issueOpts)
  const privateKeyOpts = <PrivateKeyOpts> { ...initialPrivateKeyOpts, ...issueOpts }
  const keysRet: KeysRet = await genKeys(privateKeyOpts)
  const caKeyFile = `${issueOpts.centerPath}/${config.caKeyName}` // ca.key

  // console.log(issueOpts)
  if (await isFileExists(caKeyFile)) {
    return Promise.reject(`caKeyFile exists: "${caKeyFile}"`)
  }
  await createFile(caKeyFile, keysRet.privateKey, { mode: 0o600 })
  const cert = await reqCaCert(issueOpts) // ca cert
  const ret: IssueCertRet = { ...initialCertRet, ...keysRet, cert }

  return Promise.resolve(ret)
}


// issue certificate of server or client by ca.key
export async function genCert(options: CertOpts): Promise<IssueCertRet> {
  const issueOpts = await processIssueOpts(config, <IssueOpts> { ...initialCertOpts, ...options })
  const centerPath = issueOpts.centerPath

  if (issueOpts.kind === 'ca') {
    return Promise.reject('value of kind can not be "ca", generate CA cert via genCaCert()')
  }
  validateIssueOpts(issueOpts)
  const privateKeyOpts = <PrivateKeyOpts> { ...initialPrivateKeyOpts, ...issueOpts }
  const caKeyFile = normalize(`${centerPath}/${config.caKeyName}`) // ca.key
  const caCrtFile = `${centerPath}/${config.caCrtName}` // ca.crt
  let keysRet: KeysRet = await genKeys(privateKeyOpts)

  if ( ! await isFileExists(caKeyFile)) {
    return Promise.reject(`caKeyFile not exists: "${caKeyFile}"`)
  }
  issueOpts.serial = await nextSerial(issueOpts.centerName, config)
  keysRet = await savePrivateKeys(config, issueOpts, keysRet)
  const csr = await reqServerCert(config, issueOpts, keysRet) // csr string
  const csrFile = `${centerPath}/server/${issueOpts.serial}.csr`
  const ret: IssueCertRet = { ...initialCertRet, ...keysRet, csr, csrFile }

  await createFile(csrFile, csr, { mode: 0o600 })
  ret.crtFile = normalize(`${centerPath}/server/${issueOpts.serial}.crt`)

  const signOpts: SignOpts = {
    ...initialSignOpts,
    centerPath,
    caCrtFile,
    caKeyFile,
    caKeyPass: issueOpts.caKeyPass,
    csrFile,
    configFile: issueOpts.configFile,
  }

  ret.cert = await sign(signOpts)
  await createFile(ret.crtFile, ret.cert, { mode: 0o644 })

  return Promise.resolve(ret)
}


export async function genKeys(privateKeyOpts: PrivateKeyOpts): Promise<KeysRet> {
  const privateKey = await genPrivateKey(privateKeyOpts)
  const pubKey = await genPubKeyFromPrivateKey(privateKey, privateKeyOpts)
  const privateUnsecureKey = privateKeyOpts.pass ? await decryptPrivateKey(privateKey, privateKeyOpts) : privateKey
  // console.log(`centerPath: ${issueOpts.centerPath}`)
  // console.log('key::', key)
  // console.log('pub:', pubKey)
  // console.log('unsecure key:', privateUnsecureKey)

  return { pubKey, privateKey, privateUnsecureKey,
    pass: privateKeyOpts.pass,
    privateKeyFile: '',
    privateUnsecureKeyFile: '',
  }
}


async function genPrivateKey(options: PrivateKeyOpts): Promise<string> {
  let key = ''

  switch (options.alg) {
    case 'rsa':
      key = await genRSAKey(options)
      break

    case 'ec':
      key = await genECKey(options)
      break

    default:
      throw new Error('value of param invalid')
  }

  return key
}


// generate rsa private key pem
function genRSAKey(options: PrivateKeyOpts): Promise<string> {
  const { keyBits, pass } = options
  const args = ['genpkey', '-algorithm', 'rsa', '-pkeyopt', `rsa_keygen_bits:${keyBits}`]

  if (pass) {
    if (/\s/.test(pass)) {
      return Promise.reject('pass phrase contains blank or invisible char during generate private key')
    }
    args.push('-aes256', '-pass', `pass:${pass}`)
  }

  return runOpenssl(args).then(stdout => {
    if (stdout && stdout.indexOf('PRIVATE KEY') > 0) {
      return stdout
    }
    throw new Error(`generate private key failed. stdout: "${stdout}"`)
  })
}


// generate ec private key pem
function genECKey(options: PrivateKeyOpts): Promise<string> {
  const { ecParamgenCurve, pass } = options
  const args = ['genpkey', '-algorithm', 'ec', '-pkeyopt', `ec_paramgen_curve:${ecParamgenCurve}`]

  if (pass) {
    if (/\s/.test(pass)) {
      return Promise.reject('pass phrase contains blank or invisible char during generate private key')
    }
    args.push('-aes256', '-pass', `pass:${pass}`)
  }

  return runOpenssl(args).then(stdout => {
    if (stdout && stdout.indexOf('PRIVATE KEY') > 0) {
      return stdout
    }
    throw new Error(`generate private key failed. stdout: "${stdout}"`)
  })
}


function genPubKeyFromPrivateKey(privateKey: string, options: PrivateKeyOpts): Promise<string> {
  const openssl = config.openssl
  const { alg, pass } = options

  return new Promise((resolve, reject) => {
    const args = [alg, '-pubout']

    if (pass && privateKey.indexOf('ENCRYPTED') > 0) {
      args.push('-passin', `pass:${pass}`)
    }

    const child = execFile(openssl, args, (err, stdout, stderr) => {
      if (err) {
        return reject(err)
      }
      if (stdout && stdout.indexOf('PUBLIC KEY') > 0) {
        return resolve(stdout)
      }
      if (stderr) { // must after stdout
        return reject(stderr)
      }
      return reject(stdout)
    })

    child.stdin.write(privateKey)
    child.stdin.write(pass)
    child.stdin.end()
  })
}


export function decryptPrivateKey(privateKey: string, options: PrivateKeyOpts): Promise<string> {
  const openssl = config.openssl
  const { alg, pass } = options

  if ( ! privateKey.includes('ENCRYPTED')) {
    if (privateKey.includes('PRIVATE')) {  // unsecure private key
      return Promise.resolve(privateKey)
    }
    throw new Error('param key not valid **encrypted** private key')
  }

  return new Promise((resolve, reject) => {
    const args: string[] = [alg]

    if (pass && privateKey.indexOf('ENCRYPTED') > 0) {
      args.push('-passin', `pass:${pass}`)
    }
    const child = execFile(openssl, args, (err, stdout, stderr) => {
      if (err) {
        return reject(err)
      }
      if (stdout && stdout.includes('PRIVATE KEY')) {
        return resolve(stdout)
      }
      if (stderr) { // must after stdout
        return reject(stderr)
      }
      return reject(stdout)
    })

    child.stdin.write(privateKey)
    child.stdin.end()
  })
}


// return cert
async function reqCaCert(options: IssueOpts): Promise<string> {
  await validateIssueOpts(options)

  const { days, centerPath, pass } = options
  const keyFile = `${config.caKeyName}`
  const args = [
    'req', '-batch', '-utf8', '-x509', '-new',
    '-days', days + '',
    '-key', keyFile,
  ]
  const runOpts = { cwd: centerPath }
  let rtpl = ''

  if (config.isWin32) { // use config file
    rtpl = await createRandomConfTpl(config, options)
    args.push('-config', rtpl)
  }
  else {  // pass args by -subj
    const subj = genIssueSubj(options)

    subj && args.push('-subj', subj)
  }
  pass && args.push('-passin', `pass:${pass}`)
  // console.log('issueOpts:', options)
  // console.log('args:', args)

  return runOpenssl(args, runOpts)
    .then((stdout: string) => {
      if (stdout && stdout.includes('CERTIFICATE')) {
        // console.log(stdout)
        rtpl && unlinkRandomConfTpl(rtpl)
        return stdout
      }
      throw new Error('openssl return value: ' + stdout)
    })
    .catch(err => {
      rtpl && unlinkRandomConfTpl(rtpl)
      throw err
    })
}


// return csr
async function reqServerCert(config: Config, options: IssueOpts, keysRet: KeysRet): Promise<string> {
  await validateIssueOpts(options)

  const { centerPath } = options
  const privateUnsecureKeyFile = keysRet.privateUnsecureKeyFile
  const args = [
    'req', '-batch', '-utf8', '-new',
    '-days', '30',
    '-key', privateUnsecureKeyFile,
  ]
  const runOpts = { cwd: centerPath }
  const rtpl = await createRandomConfTpl(config, options)

  args.push('-config', rtpl)
  // console.log('issueOpts:', options)
  // console.log('keysRet:', keysRet)
  // console.log('args', args)

  return runOpenssl(args, runOpts)
    .then((stdout: string) => {
      if (stdout && stdout.includes('REQUEST')) {
        // console.log(stdout)
        unlinkRandomConfTpl(rtpl)
        return stdout
      }
      throw new Error('openssl return value: ' + stdout)
    })
    .catch(err => {
      unlinkRandomConfTpl(rtpl)
      throw err
    })
}


async function validateIssueOpts(options: IssueOpts): Promise<void> {
  const { centerPath, pass } = options
  const caKeyFile = `${centerPath}/${config.caKeyName}`

  if ( ! centerPath) {
    throw new Error(`centerPath: "${centerPath}" not exits for centerName: "${options.centerName}" \n
      should create center dir by calling initCenter(centerName, path)
    `)
  }
  if (typeof pass !== 'string') {
    throw new Error('pass must be typeof string')
  }
  if (pass.length < 4) {
    throw new Error('length of pass must at least 4')
  }
  if (pass.length > 1023) {
    throw new Error('length of pass must not greater than 1023 chars if not empty')
  }

  if (options.kind !== 'ca' && ! await isFileExists(caKeyFile)) {
    throw new Error(`caKeyFile not exists, file: "${caKeyFile}"`)
  }
  if ( ! options.C || options.C.length !== 2) {
    throw new Error('value of C (Country Name) must be 2 letters')
  }
  if ( ! options.CN) {
    throw new Error('value of CN (Common Name) invalid')
  }
  // if ( ! options.OU) {
  //   throw new Error('value of OU (Organizational Unit Name) invalid')
  // }
  if (typeof options.days !== 'number') {
    throw new Error('value of days must typeof number')
  }
  if (options.days <= 0) {
    throw new Error('value of days must greater than zero')
  }
}


async function processIssueOpts(config: Config, options: IssueOpts): Promise<IssueOpts > {
  const { keyBits, pass } = options

  options.centerPath = await getCenterPath(options.centerName)
  options.configFile || (options.configFile = `${options.centerPath}/${config.configName}`)

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

  if (typeof pass === 'number') {
    options.pass += ''
  }

  for (const prop of reqSubjectFields) {
    if ( ! options[prop]) {
      options[prop] = ''
    }
  }

  return options
}



function genIssueSubj(options: IssueOpts): string {
  const arr: string[] = []

  for (let prop of reqSubjectFields) {
    if (typeof options[prop] !== 'undefined' && options[prop]) {
      const value = options[prop]

      value && arr.push(`${prop}=${value}`)
    }
  }
  return arr.length ? '/' + arr.join('/') : ''
}


// return random file path
async function createRandomConfTpl(config: Config, issueOpts: IssueOpts): Promise<string> {
  const tmp = tmpdir()
  const rfile = `${tmp}/openssl-` + Math.random() + '.conf'
  let tpl = (await readFileAsync(join(__dirname, '../../asset', `/${config.confTpl}`))).toString()

  if ( ! tpl) {
    throw new Error('loaded openssl config tpl is empty')
  }

  for (const prop of reqSubjectFields) {
    let value = ''
    const regx = new RegExp(`%${prop}%`)

    if (typeof issueOpts[prop] !== 'undefined' && issueOpts[prop]) {
      value = issueOpts[prop]
    }
    tpl = tpl.replace(regx, value)
  }
  tpl = tpl.replace(/%hash%/g, issueOpts.hash)  // global

  return createFile(rfile, tpl).then(() => {
    return rfile
  })
}


async function unlinkRandomConfTpl(file: string): Promise<void> {
  await isFileExists(file) && unlinkAsync(file)
}


export async function saveCaCrt(config: Config, issueOpts: CertOpts, data: string): Promise<void> {
  const centerPath = await getCenterPath(issueOpts.centerName)
  const file = `${centerPath}/${config.caCrtName}`

  await writeFileAsync(file, data, { mode: 0o644 })
}

export async function unlinkCaCrt(centerName: string): Promise<void> {
  const centerPath = await getCenterPath(centerName)
  const file = `${centerPath}/${config.caCrtName}`

  if (await isFileExists(file)) {
    return unlinkAsync(file)
  }
}


// unlink ca.key
export async function unlinkCaKey(centerName: string): Promise<void> {
  const centerPath = await getCenterPath(centerName)

  if ( ! centerPath) {
    return Promise.reject(`centerPath empty for centerName: "${centerName}"`)
  }
  const file = `${centerPath}/${config.caKeyName}` // ca.key

  try {
    if (await isFileExists(file)) {
      await unlinkAsync(file) // unlink ca.key
    }
  }
  catch (ex) {
    return
  }
}

// save private keys to server/
async function savePrivateKeys(config: Config, issueOpts: IssueOpts, keysRet: KeysRet): Promise<KeysRet> {
  const { centerPath, serial } = issueOpts
  const { privateKey, privateUnsecureKey } = keysRet

  keysRet.privateKeyFile = `${centerPath}/server/${serial}.key`
  keysRet.privateUnsecureKeyFile = `${keysRet.privateKeyFile}.unsecure`
  await writeFileAsync(keysRet.privateKeyFile, privateKey, { mode: 0o644 })
  await writeFileAsync(keysRet.privateUnsecureKeyFile, privateUnsecureKey, { mode: 0o600 })

  if ( ! await isFileExists(keysRet.privateKeyFile)) {
    throw new Error(`save private key file failed. file: "${keysRet.privateKeyFile}"`)
  }
  return keysRet
}


// sign csr with ca.key, return crt
export async function sign(signOpts: SignOpts): Promise<string> {
  const { days, caCrtFile, caKeyFile, caKeyPass, csrFile, configFile, centerPath } = signOpts
  const args = <string[]> [
    'ca', '-batch',
    '-config', configFile,
    '-days', days + '',
    '-cert', caCrtFile,
    '-keyfile', caKeyFile,
    '-in', csrFile,
    '-passin', `pass:${caKeyPass}`,
  ]

  await validateSignOpts(signOpts)
  // console.log('signOpts:', signOpts)
  // console.log('args:', args)

  return runOpenssl(args, { cwd: centerPath })
    .then((stdout: string) => {
      if (stdout && stdout.includes('CERTIFICATE')) {
        return stdout
      }
      throw new Error('openssl sign csr return value: ' + stdout)
    })
}


/* istanbul ignore next */
async function validateSignOpts(signOpts: SignOpts): Promise<void> {
  const { centerPath, days, hash, caCrtFile, caKeyFile, caKeyPass, csrFile, configFile } = signOpts

  if ( ! await isDirExists(centerPath)) {
    return Promise.reject(`folder of param centerPath of signOpts not exists: "${centerPath}"`)
  }
  if (typeof +days !== 'number') {
    return Promise.reject(`value of param days of signOpts inavlid: "${days}"`)
  }
  if (+days <= 0) {
    return Promise.reject(`value of param days of signOpts inavlid: "${days}"`)
  }
  if ( ! hash) {
    return Promise.reject(`value of param hash of signOpts inavlid: "${hash}"`)
  }
  if ( ! await isFileExists(caCrtFile)) {
    return Promise.reject(`file of param caCrtFile of signOpts not exists: "${caCrtFile}"`)
  }
  if ( ! await isFileExists(caKeyFile)) {
    return Promise.reject(`file of param caKeyFile of signOpts not exists: "${caKeyFile}"`)
  }
  if ( ! await isFileExists(csrFile)) {
    return Promise.reject(`file of param csrFile of signOpts not exists: "${csrFile}"`)
  }
  if ( ! configFile) {
    return Promise.reject(`value of param configFile of signOpts empty: "${configFile }"`)
  }
  if ( ! await isFileExists(configFile)) {
    return Promise.reject(`file of param configFile  of signOpts not exists: "${configFile }"`)
  }
  if ( ! caKeyPass) {
    return Promise.reject(`value of param caKeyPass of signOpts inavlid: "${caKeyPass}"`)
  }
}

