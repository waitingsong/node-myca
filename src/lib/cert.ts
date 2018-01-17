import { execFile } from 'child_process'

import {
  createFile,
  getCenterPath,
  isFileExists,
  readFileAsync,
  runOpenssl,
  unlinkAsync,
  writeFileAsync } from './common'
import {
  config,
  initialCertOpts,
  initialCertRet,
  initialPrivateKeyOpts,
  reqSubjectFields } from './config'
import {
  CertOpts,
  Config,
  IssueCertRet,
  IssueOpts,
  PrivateKeyOpts } from './model'


export async function genCaCert(options: CertOpts): Promise<IssueCertRet> {
  const issueOpts = await processIssueOpts(<IssueOpts> { ...initialCertOpts, ...options })
  const privateKeyOpts = <PrivateKeyOpts> { ...initialPrivateKeyOpts, ...issueOpts }
  const privateKey = await genPrivateKey(privateKeyOpts)
  const pubKey = await genPubKeyFromPrivateKey(privateKey, privateKeyOpts)
  const privateUnsecureKey = privateKeyOpts.pass ? await decryptPrivateKey(privateKey, privateKeyOpts) : privateKey
  const keyFile = `${issueOpts.centerPath}/${config.caKeyName}` // ca.key

  // console.log(`centerPath: ${issueOpts.centerPath}`)
  // console.log('key::', key)
  // console.log('pub:', pubKey)
  // console.log('unsecure key:', privateUnsecureKey)
  console.log(issueOpts)
  if (await isFileExists(keyFile)) {
    return Promise.reject(`keyFile exists: "${keyFile}"`)
  }
  await createFile(keyFile, privateKey, { mode: 0o600 })
  const cert = await reqCert(issueOpts) // ca cert
  const ret = { ...initialCertRet, pubKey, privateKey, privateUnsecureKey, cert }

  return Promise.resolve(ret)
}


async function genPrivateKey(options: PrivateKeyOpts): Promise<string> {
  let key = ''

  switch (options.alg) {
    case 'rsa':
      key = await genRSAKey(options)
      break

    case 'ec':
      // key = await genECKey(options)
      break

  }

  return key
}


// generate rsa private key pem
function genRSAKey(options: PrivateKeyOpts): Promise<string> {
  let { keyBits, pass } = options

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
    return ''
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


async function reqCert(options: IssueOpts): Promise<string> {
  await validateIssueOpts(options)

  const { days, serial, centerPath, pass } = options
  const keyFile = `${config.caKeyName}`
  const args = [
    'req', '-batch', '-utf8', '-x509', '-new',
    '-days', days + '',
    '-set_serial', serial + '',
    '-key', keyFile,
  ]
  const runOpts = { cwd: centerPath }

  if (config.isWin32) {
    await createRandomConfTpl(config, options)
    args.push('-config', config.randomConfigFile)
  }
  else {
    const subj = genIssueSubj(options)

    subj && args.push('-subj', subj)
  }
  pass && args.push('-passin', `pass:${pass}`)

  return runOpenssl(args, runOpts)
    .then((stdout: string) => {
      if (stdout && stdout.includes('CERTIFICATE')) {
        console.log(stdout)
        config.isWin32 && unlinkRandomConfTpl(config, options)
        return stdout
      }
      throw new Error('openssl return value: ' + stdout)
    })
    .catch(err => {
      config.isWin32 && unlinkRandomConfTpl(config, options)
      throw err
    })
}


async function validateIssueOpts(options: IssueOpts): Promise<void> {
  const { centerPath, pass } = options
  const caKeyFile = `${centerPath}/${config.caKeyName}`

  if ( ! centerPath) {
    throw new Error(`centerPath: "${centerPath}" not exits for centerName: "${options.centerName}" \n
      should create center dir by calling createCenter(centerName, path)
    `)
  }
  if (pass) {
    if (typeof pass !== 'string') {
      throw new Error('pass must be typeof string')
    }
    if (pass.length < 4) {
      throw new Error('length of pass must at least 4 chars if not empty')
    }
    if (pass.length > 1023) {
      throw new Error('length of pass must not greater than 1023 chars if not empty')
    }
  }

  if ( ! await isFileExists(caKeyFile)) {
    throw new Error(`caKeyFile not exists, file: "${caKeyFile}"`)
  }
  if ( ! options.C || options.C.length !== 2) {
    throw new Error('value of C (Country Name) must be 2 letters')
  }
  if ( ! options.CN) {
    throw new Error('value of CN (Common Name) invalid')
  }
  if ( ! options.OU) {
    throw new Error('value of OU (Organizational Unit Name) invalid')
  }
  if (typeof options.days !== 'number') {
    throw new Error('value of days must typeof number')
  }
  if (options.days <= 0) {
    throw new Error('value of days must greater than zero')
  }
}


async function processIssueOpts(options: IssueOpts): Promise<IssueOpts > {
  const { keyBits, pass } = options

  options.centerPath = await getCenterPath(options.centerName)

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


async function createRandomConfTpl(config: Config, issueOpts: IssueOpts): Promise<void> {
  const rfile = `${issueOpts.centerPath}/${config.randomConfigFile}`
  const path = __dirname + `/${config.confTpl}`
  let tpl = (await readFileAsync(path)).toString()

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

  return createFile(rfile, tpl)
}


function unlinkRandomConfTpl(config: Config, issueOpts: IssueOpts): void {
  unlinkAsync(`${issueOpts.centerPath}/${config.randomConfigFile}`)
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

  if (await isFileExists(file)) {
    await unlinkAsync(file) // unlink ca.key
  }
}
