import { execFile } from 'child_process'

import {
  chmodAsync,
  copyFileAsync,
  createFile,
  isDirExists,
  isFileExists,
  join,
  normalize,
  readFileAsync,
  tmpdir,
  unlinkAsync,
  writeFileAsync,
} from '../shared/index'

import { getCenterPath, isCenterInited, nextSerial } from './center'
import { runOpenssl  } from './common'
import {
  config,
  initialCaCertRet,
  initialCaOpts,
  initialCertOpts,
  initialCertRet,
  initialPrivateKeyOpts,
  initialSignOpts,
  reqSubjectFields } from './config'
import {
  CaOpts,
  CertDN,
  CertOpts,
  Config,
  IssueCaCertRet,
  IssueCertRet,
  IssueOpts,
  KeysRet,
  PfxOpts,
  PrivateKeyOpts,
  SignOpts } from './model'


export async function initCaCert(issueOpts: CaOpts): Promise<IssueCaCertRet> {
  const opts = <CaOpts> { ...initialCaOpts, ...issueOpts }

  if (! opts.centerName) {
    return Promise.reject('centerName empty')
  }
  if (! await isCenterInited(opts.centerName)) {
    return Promise.reject(`center: ${opts.centerName} not initialized yet`)
  }
  const centerPath = await getCenterPath(opts.centerName)
  const file = normalize(`${centerPath}/${config.caCrtName}`)

  /* istanbul ignore next */
  if (await isFileExists(file)) {
    return Promise.reject(`CA file exists, should unlink it via unlinkCaCert(centerName). file: "${file}"`)
  }
  const certRet = await genCaCert(config, opts)

  certRet.crtFile = await saveCaCrt(config, opts, certRet.cert)
  return certRet
}


// generate certificate of self-signed CA
async function genCaCert(config: Config, options: CaOpts): Promise<IssueCaCertRet> {
  const issueOpts = await processIssueOpts(config, <IssueOpts> { ...initialCertOpts, ...options })

  issueOpts.kind = 'ca'
  await validateIssueOpts(issueOpts)
  const caKeyFile = join(issueOpts.centerPath, config.caKeyName) // ca.key

  // console.log(issueOpts)
  if (await isFileExists(caKeyFile)) {
    return Promise.reject(`caKeyFile exists: "${caKeyFile}"`)
  }
  const privateKeyOpts = <PrivateKeyOpts> { ...initialPrivateKeyOpts, ...issueOpts }
  const keysRet: KeysRet = await genKeys(privateKeyOpts)

  await createFile(caKeyFile, keysRet.privateKey, { mode: 0o600 })

  const cert = await reqCaCert(config, issueOpts) // ca cert
  const ret: IssueCaCertRet = { // crtFile empty here
    ...initialCaCertRet,
    cert,
    privateKeyFile: caKeyFile,
    centerName: issueOpts.centerName,
    privateKey: keysRet.privateKey,
    pass: keysRet.pass,
  }

  return Promise.resolve(ret)
}


// issue certificate of server or client by ca.key
export async function genCert(options: CertOpts, conf?: Config): Promise<IssueCertRet> {
  const localConfig = conf ? { ...config, ...conf } : config
  const issueOpts = await processIssueOpts(localConfig, <IssueOpts> { ...initialCertOpts, ...options })
  const centerPath = issueOpts.centerPath

  /* istanbul ignore next */
  if (issueOpts.kind === 'ca') {
    return Promise.reject('value of kind can not be "ca", generate CA cert via genCaCert()')
  }
  await validateIssueOpts(issueOpts)
  const privateKeyOpts = <PrivateKeyOpts> { ...initialPrivateKeyOpts, ...issueOpts }
  const caKeyFile = join(centerPath, localConfig.caKeyName) // ca.key
  const caCrtFile = join(centerPath, localConfig.caCrtName) // ca.crt
  let keysRet: KeysRet = await genKeys(privateKeyOpts)

  issueOpts.serial = await nextSerial(issueOpts.centerName, localConfig)
  keysRet = await savePrivateKeys(localConfig, issueOpts, keysRet)
  const csr = await reqServerCert(localConfig, issueOpts, keysRet) // csr string
  const csrFile = join(centerPath, issueOpts.kind, `${issueOpts.serial}.csr`)
  const ret: IssueCertRet = {
    ...initialCertRet,
    ...keysRet,
    centerName: issueOpts.centerName,
    caKeyFile,
    caCrtFile,
    csr,
    csrFile,
    crtFile: join(centerPath, issueOpts.kind, `${issueOpts.serial}.crt`),
  }

  await createFile(csrFile, csr, { mode: 0o600 })
  const signOpts: SignOpts = {
    ...initialSignOpts,
    centerPath,
    caCrtFile,
    caKeyFile,
    caKeyPass: issueOpts.caKeyPass,
    csrFile,
    configFile: issueOpts.configFile,
    SAN: issueOpts.SAN,
    ips: issueOpts.ips,
  }

  ret.cert = await sign(signOpts, localConfig)
  await createFile(ret.crtFile, ret.cert, { mode: 0o644 })

  // EXPORT TO PKCS#12 FORMAT
  if (issueOpts.kind === 'client') {
    const clientOpts: PfxOpts = {
      privateKeyFile: ret.privateUnsecureKeyFile,
      crtFile: ret.crtFile,
      pfxPass: ret.pass,
    }
    const tmp = await outputClientCert(clientOpts)

    ret.pfxFile = join(centerPath, issueOpts.kind, `${issueOpts.serial}.p12`)
    await copyFileAsync(tmp, ret.pfxFile)
    await chmodAsync(ret.pfxFile, 0o600)
    unlinkAsync(ret.privateUnsecureKeyFile)
    ret.privateUnsecureKeyFile = ''
    unlinkAsync(tmp)
  }

  return Promise.resolve(ret)
}


export async function genKeys(privateKeyOpts: PrivateKeyOpts): Promise<KeysRet> {
  const privateKey = await genPrivateKey(privateKeyOpts)
  const pubKey = await genPubKeyFromPrivateKey(privateKey, privateKeyOpts)
  const privateUnsecureKey = await decryptPrivateKey(privateKey, privateKeyOpts)
  // console.log(`centerPath: ${issueOpts.centerPath}`)
  // console.log('key::', key)
  // console.log('pub:', pubKey)
  // console.log('unsecure key:', privateUnsecureKey)

  return {
    pubKey,
    privateKey,
    privateUnsecureKey,
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
  const args = [
    'genpkey', '-algorithm', 'rsa',
    '-aes256', '-pass', `pass:${pass}`,
    '-pkeyopt', `rsa_keygen_bits:${keyBits}`,
  ]

  /* istanbul ignore next */
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
  const args = [
    'genpkey', '-algorithm', 'ec',
    '-aes256', '-pass', `pass:${pass}`,
    '-pkeyopt', `ec_paramgen_curve:${ecParamgenCurve}`,
  ]

  /* istanbul ignore next */
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

    /* istanbul ignore next */
    if (pass && privateKey.indexOf('ENCRYPTED') > 0) {
      args.push('-passin', `pass:${pass}`)
    }

    /* istanbul ignore next */
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

  if (!privateKey.includes('ENCRYPTED')) {
    /* istanbul ignore next */
    if (privateKey.includes('PRIVATE')) {  // unsecure private key
      return Promise.resolve(privateKey)
    }
    else {
      throw new Error('param key not valid **encrypted** private key')
    }
  }

  return new Promise((resolve, reject) => {
    const args: string[] = [alg]

    /* istanbul ignore next */
    if (pass && privateKey.indexOf('ENCRYPTED') > 0) {
      args.push('-passin', `pass:${pass}`)
    }
    /* istanbul ignore next */
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
async function reqCaCert(config: Config, options: IssueOpts): Promise<string> {
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

  /* istanbul ignore next */
  if (config.isWin32) { // use config file
    rtpl = normalize(await createRandomConfTpl(config, options))
    args.push('-config', rtpl)
  }
  else {  // pass args by -subj
    const subj = genIssueSubj(options)

    subj && args.push('-subj', subj)
  }
  pass && args.push('-passin', `pass:${pass}`)
  // console.log('issueOpts:', options)
  // console.log('args:', args)

  /* istanbul ignore next */
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
  const rtpl = normalize(await createRandomConfTpl(config, options))

  args.push('-config', rtpl)
  // console.log('issueOpts:', options)
  // console.log('keysRet:', keysRet)
  // console.log('args', args)

  /* istanbul ignore next */
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


/* istanbul ignore next */
async function validateIssueOpts(options: IssueOpts): Promise<void> {
  const { alg, centerPath, hash, kind, pass } = options
  const caKeyFile = `${centerPath}/${config.caKeyName}`

  if (alg === 'ec' && config.opensslVer && config.opensslVer < '1.0.2') {
    throw new Error('openssl version < "1.0.2" not support ec generation, current is: ' + config.opensslVer)
  }
  if (! centerPath) {
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
  if (/\s/.test(pass)) {
    throw new Error('pass phrase contains blank or invisible char')
  }
  if (! hash) {
    throw new Error('value of hash empty. must be sha256|sha384')
  }
  if (hash !== 'sha256' && hash !== 'sha384') {
    throw new Error('value of hash invalid. must be sha256|sha384')
  }

  if (kind !== 'ca' && kind !== 'server' && kind !== 'client') {
    throw new Error('value of kind invalid. must be ca|server|client')
  }
  if (kind !== 'ca' && ! await isFileExists(caKeyFile)) {
    throw new Error(`caKeyFile not exists, file: "${caKeyFile}"`)
  }
  if (! options.C || options.C.length !== 2) {
    throw new Error('value of C (Country Name) must be 2 letters')
  }
  if (! options.CN) {
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


function genIssueSubj(options: CertDN): string {
  const arr: string[] = []

  for (const prop of reqSubjectFields) {
    // @ts-ignore
    if (typeof options[prop] !== 'undefined' && options[prop]) {
      // @ts-ignore
      const value = options[prop]

      value && arr.push(`${prop}=${value}`)
    }
  }
  return arr.length ? '/' + arr.join('/') : ''
}


// return random file path
async function createRandomConfTpl(config: Config, signOpts: SignOpts): Promise<string> {
  const tmp = tmpdir()
  const rfile = `${tmp}/openssl-` + Math.random() + '.conf'
  let tpl = (await readFileAsync(join(__dirname, '../../asset', `/${config.confTpl}`))).toString()

  /* istanbul ignore next */
  if (! tpl) {
    throw new Error('loaded openssl config tpl is empty')
  }

  for (const prop of reqSubjectFields) {
    let value = ''
    const regx = new RegExp(`%${prop}%`)

    // @ts-ignore
    if (typeof signOpts[prop] !== 'undefined' && signOpts[prop]) {
      // @ts-ignore
      value = <string> signOpts[prop]
    }
    tpl = tpl.replace(regx, value)
  }
  tpl = tpl.replace(/%hash%/g, signOpts.hash)  // global

  const sans = signOpts.SAN
  const ips = signOpts.ips
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
    tpl += (names + dn + ip)
  }

  return createFile(rfile, tpl).then(() => {
    return rfile
  })
}


async function unlinkRandomConfTpl(file: string): Promise<void> {
  await isFileExists(file) && unlinkAsync(file)
}


// return cert file path
export async function saveCaCrt(config: Config, issueOpts: CaOpts, data: string): Promise<string> {
  const centerPath = await getCenterPath(issueOpts.centerName)
  const file = join(centerPath, config.caCrtName)

  await writeFileAsync(file, data, { mode: 0o644 })
  return file
}

export async function unlinkCaCrt(centerName: string): Promise<void> {
  const centerPath = await getCenterPath(centerName)
  const file = `${centerPath}/${config.caCrtName}`

  /* istanbul ignore next */
  if (await isFileExists(file)) {
    return unlinkAsync(file)
  }
}


// unlink ca.key
export async function unlinkCaKey(centerName: string): Promise<void> {
  const centerPath = await getCenterPath(centerName)

  if (! centerPath) {
    return Promise.reject(`centerPath empty for centerName: "${centerName}"`)
  }
  const file = `${centerPath}/${config.caKeyName}` // ca.key

  /* istanbul ignore next */
  if (await isFileExists(file)) {
    await unlinkAsync(file) // unlink ca.key
  }
}

// save private keys to server/
async function savePrivateKeys(config: Config, issueOpts: IssueOpts, keysRet: KeysRet): Promise<KeysRet> {
  const { centerPath, kind, serial } = issueOpts
  const { privateKey, privateUnsecureKey } = keysRet

  keysRet.privateKeyFile = join(centerPath, kind, `${serial}.key`)
  keysRet.privateUnsecureKeyFile = `${keysRet.privateKeyFile}.unsecure`
  await writeFileAsync(keysRet.privateKeyFile, privateKey, { mode: 0o600 })
  await writeFileAsync(keysRet.privateUnsecureKeyFile, privateUnsecureKey, { mode: 0o600 })

  /* istanbul ignore next */
  if (! await isFileExists(keysRet.privateKeyFile)) {
    throw new Error(`save private key file failed. file: "${keysRet.privateKeyFile}"`)
  }
  return keysRet
}


// sign csr with ca.key, return crt
export async function sign(signOpts: SignOpts, conf?: Config): Promise<string> {
  await validateSignOpts(signOpts)
  const { days, caCrtFile, caKeyFile, caKeyPass, csrFile, configFile, centerPath, ips, SAN } = signOpts
  const args = <string[]> [
    'ca', '-batch',
    // '-config', configFile,
    // '-config', rtpl,
    '-days', days + '',
    '-cert', normalize(caCrtFile),
    '-keyfile', normalize(caKeyFile),
    '-in', normalize(csrFile),
    '-passin', `pass:${caKeyPass}`,
  ]

  const localConfig: Config = conf ? { ...config, ...conf } : config

  if ((SAN && SAN.length) || (ips && ips.length)) {
    const rtpl = await createRandomConfTpl(localConfig, signOpts)

    args.push('-config', normalize(rtpl))
  }
  else {
    args.push('-config', normalize(<string> configFile)) // configFile validate by validateSignOpts()
  }

  // console.log('signOpts:', signOpts)
  // console.log('args:', args)

  /* istanbul ignore next */
  return runOpenssl(args, { cwd: centerPath })
    .then((stdout: string) => {
      if (stdout && stdout.includes('CERTIFICATE')) {
        return stdout
      }
      throw new Error('openssl sign csr return value: ' + stdout)
    })
}


// generate pfx file, return file path(under user tmp folder)
export async function outputClientCert(options: PfxOpts): Promise<string> {
  await validatePfxOpts(options)
  const { privateKeyFile, privateKeyPass, crtFile, pfxPass } = options
  const pfxFile = join(tmpdir(), `/tmp-${ Math.random() }.p12`)
  const args = <string[]> [
    'pkcs12', '-export', '-aes256',
    '-in', crtFile,
    '-inkey', privateKeyFile,
    '-out', pfxFile,
  ]

  if (privateKeyPass) {
    args.push('-passin', `pass:${privateKeyPass}`)
  }
  args.push('-passout', (pfxPass ? `pass:${pfxPass}` : 'pass:'))

  /* istanbul ignore next */
  return runOpenssl(args)
    .then((stdout: string) => {
      if (! stdout) {
        return pfxFile
      }
      throw new Error('openssl output pkcs12 failed, return value: ' + stdout)
    })

}


/* istanbul ignore next */
async function validateSignOpts(signOpts: SignOpts): Promise<void> {
  const { SAN, ips, centerPath, days, hash, caCrtFile, caKeyFile, caKeyPass, csrFile, configFile } = signOpts

  if (! await isDirExists(centerPath)) {
    return Promise.reject(`folder of param centerPath of signOpts not exists: "${centerPath}"`)
  }
  if (typeof +days !== 'number') {
    return Promise.reject(`value of param days of signOpts inavlid: "${days}"`)
  }
  if (+days <= 0) {
    return Promise.reject(`value of param days of signOpts inavlid: "${days}"`)
  }
  if (typeof SAN !== 'undefined') {
    if (! Array.isArray(SAN)) {
      return Promise.reject('value of param SAN of signOpts inavlid, must Array<string>')
    }
    for (const name of SAN) {
      if (! name) {
        return Promise.reject('item value of SAN of signOpts empty')
      }
    }
  }
  if (typeof ips !== 'undefined') {
    if (! Array.isArray(ips)) {
      return Promise.reject('value of param ips of signOpts inavlid, must Array<string>')
    }
    for (const name of ips) {
      if (! name) {
        return Promise.reject('item value of ips of signOpts empty')
      }
    }
  }

  if (! hash) {
    return Promise.reject(`value of param hash of signOpts inavlid: "${hash}"`)
  }
  if (! await isFileExists(caCrtFile)) {
    return Promise.reject(`file of param caCrtFile of signOpts not exists: "${caCrtFile}"`)
  }
  if (! await isFileExists(caKeyFile)) {
    return Promise.reject(`file of param caKeyFile of signOpts not exists: "${caKeyFile}"`)
  }
  if (! await isFileExists(csrFile)) {
    return Promise.reject(`file of param csrFile of signOpts not exists: "${csrFile}"`)
  }
  if (! configFile) {
    return Promise.reject(`value of param configFile of signOpts empty: "${configFile }"`)
  }
  if (! await isFileExists(configFile)) {
    return Promise.reject(`file of param configFile  of signOpts not exists: "${configFile }"`)
  }
  if (! caKeyPass) {
    return Promise.reject(`value of param caKeyPass of signOpts inavlid: "${caKeyPass}"`)
  }
}


/* istanbul ignore next */
async function validatePfxOpts(pfxOpts: PfxOpts): Promise<void> {
  const { privateKeyFile, privateKeyPass, crtFile, pfxPass } = pfxOpts

  if (! await isFileExists(privateKeyFile)) {
    throw new Error(`privateKeyFile not exists: "${privateKeyFile}"`)
  }
  if (! await isFileExists(crtFile)) {
    throw new Error(`crtFile not exists: "${crtFile}"`)
  }
  if (privateKeyPass) { // can be blank
    if (privateKeyPass.length < 4) {
      throw new Error('length of privateKeyPass must at least 4 if not empty')
    }
    if (/\s/.test(privateKeyPass)) {
      throw new Error('privateKeyPass phrase contains blank or invisible char')
    }
  }
  if (pfxPass) {  // can be blank
    if (/\s/.test(pfxPass)) {
      throw new Error('pfxPass phrase contains blank or invisible char')
    }
    if (pfxPass.length < 4) {
      throw new Error('length of pfxPass must at least 4')
    }
  }
}
