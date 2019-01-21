import {
  chmodAsync,
  copyFileAsync,
  createFileAsync,
  dirExists,
  fileExists,
  isFileExists,
  join,
  normalize,
  readFileAsync,
  tmpdir,
  unlinkAsync,
  writeFileAsync,
} from '@waiting/shared-core'
import { concat, defer, forkJoin, from as ofrom, iif, of, Observable } from 'rxjs'
import {
  bufferCount,
  catchError,
  concatMap,
  finalize,
  map,
  mapTo,
  mergeMap,
  reduce,
  shareReplay,
  tap,
} from 'rxjs/operators'
import { escapeShell } from 'rxrunscript'

import { getCenterPath, nextSerial } from './center'
import {
  runOpenssl,
  throwMaskError,
  unlinkRandomConfTpl,
} from './common'
import {
  initialCaCertRet,
  initialCaOpts,
  initialCertOpts,
  initialCertRet,
  initialConfig,
  initialPrivateKeyOpts,
  initialSignOpts,
  reqSubjectFields,
} from './config'
import {
  CaOpts,
  CertDN,
  CertDNkeys,
  CertOpts,
  Config,
  IssueCaCertRet,
  IssueCertRet,
  IssueOpts,
  KeysRet,
  PfxOpts,
  PrivateKeyOpts,
  SignOpts,
  StreamOpts,
} from './model'


export function initCaCert(issueOpts: CaOpts): Observable<IssueCaCertRet> {
  const opts$ = of(<CaOpts> { ...initialCaOpts, ...issueOpts }).pipe(
    tap(opts => {
      if (!opts.centerName) {
        throw new Error('centerName empty')
      }
    }),
    shareReplay(1),
  )

  const valid$ = opts$.pipe(
    concatMap(opts => getCenterPath(<string> opts.centerName)),
    tap(centerName => {
      if (! centerName) {
        throw new Error(`center: ${centerName} not initialized yet`)
      }
    }),
    concatMap(centerPath => {
      const file = normalize(`${centerPath}/${initialConfig.caCrtName}`)
      return fileExists(file).pipe(
        tap(exists => {
          if (exists) {
            throw new Error(`CA file exists, should unlink it via unlinkCaCert(centerName). file: "${file}"`)
          }
        }),
      )
    }),
    mapTo(void 0),
  )

  const ret$ = forkJoin(
    opts$,
    valid$,
  ).pipe(
    concatMap(([opts]) => {
      const { centerName } = opts
      return genCaCert(initialConfig, opts).pipe(
        concatMap(certRet => {
          return saveCaCrt(initialConfig.caCrtName, <string> centerName, certRet.cert).pipe(
            map(crtFile => {
              certRet.crtFile = crtFile
              return certRet
            }),
          )
        }),
      )
    }),
    catchError(throwMaskError),
  )

  return ret$
}


/** Generate certificate of self-signed CA */
function genCaCert(config: Config, options: CaOpts): Observable<IssueCaCertRet> {
  const issueOpts$ = processIssueOpts(config, <IssueOpts> { ...initialCertOpts, ...options }).pipe(
    map(issueOpts => {
      issueOpts.kind = 'ca'
      return issueOpts
    }),
    mergeMap(validateIssueOpts),
    shareReplay(1),
  )

  const caKeyFile$ = issueOpts$.pipe(
    map(issueOpts => join(issueOpts.centerPath, config.caKeyName)),  // ca.key
    mergeMap(caKeyFile => {
      return fileExists(caKeyFile).pipe(
        tap(file => {
          if (file) {
            throw new Error(`caKeyFile already exists: "${file}"`)
          }
        }),
        mapTo(caKeyFile),
      )
    }),
  )

  const keysRet$ = issueOpts$.pipe(
    concatMap(issueOpts => {
      const privateKeyOpts = <PrivateKeyOpts> { ...initialPrivateKeyOpts, ...issueOpts }
      return genKeys(privateKeyOpts)
    }),
  )

  const creat$ = forkJoin(
    caKeyFile$,
    keysRet$,
  ).pipe(
    concatMap(([caKeyFile, keysRet]) => {
      return defer(() => createFileAsync(caKeyFile, keysRet.privateKey, { mode: 0o600 }))
        .pipe(
          mapTo({ caKeyFile, keysRet }),
        )
    }),
  )

  const ret$ = forkJoin(
    issueOpts$,
    creat$,
  ).pipe(
    concatMap(([issueOpts, { caKeyFile, keysRet }]) => {
      return reqCaCert(config, issueOpts).pipe(
        map(cert => {
          const ret: IssueCaCertRet = { // crtFile empty here
            ...initialCaCertRet,
            cert,
            privateKeyFile: caKeyFile,
            centerName: issueOpts.centerName,
            privateKey: keysRet.privateKey,
            pass: keysRet.pass,
          }
          return ret
        }),
      )
    }),
  )

  return ret$
}


/** issue certificate of server or client by ca.key */
export function genCert(options: CertOpts, conf?: Config): Observable<IssueCertRet> {
  const localConfig: Config = conf ? { ...initialConfig, ...conf } : initialConfig
  const issueOpts$ = processGenCertIssueOpts(options, localConfig).pipe(
    mergeMap(validateIssueOpts),
    shareReplay(1),
  )
  const csrNkeysRet$ = genCsrFile(issueOpts$, localConfig)
  const tmpRet$: Observable<IssueCertRet> = forkJoin(
    issueOpts$,
    csrNkeysRet$,
  )
  .pipe(
    map(([issueOpts, { csr, csrFile, keysRet }]) => {
      const caKeyFile = join(issueOpts.centerPath, localConfig.caKeyName) // ca.key
      const caCrtFile = join(issueOpts.centerPath, localConfig.caCrtName) // ca.crt
      const ret: IssueCertRet = {
        ...initialCertRet,
        ...keysRet,
        centerName: issueOpts.centerName,
        caKeyFile,
        caCrtFile,
        csr,
        csrFile,
        crtFile: join(issueOpts.centerPath, issueOpts.kind, `${issueOpts.serial}.crt`),
      }

      return ret
    }),
  )

  const issueRet$: Observable<IssueCertRet> = forkJoin(
    issueOpts$,
    tmpRet$,
  ).pipe(
    concatMap(([issueOpts, ret]) => {
      const { centerPath, caKeyPass } = issueOpts
      const signOpts: SignOpts = {
        ...initialSignOpts,
        centerPath,
        caCrtFile: ret.caCrtFile,
        caKeyFile: ret.caKeyFile,
        caKeyPass,
        csrFile: ret.csrFile,
        configFile: issueOpts.configFile,
        SAN: issueOpts.SAN,
        ips: issueOpts.ips,
        days: issueOpts.days,
      }

      return sign(signOpts, localConfig).pipe(
        map(cert => {
          ret.cert = cert
          return ret
        }),
        concatMap(issueRet => {
          return createFileAsync(issueRet.crtFile, issueRet.cert, { mode: 0o644 }).then(() => issueRet)
        }),
      )
    }),
  )

  const ret$ = forkJoin(
    issueOpts$,
    issueRet$,
  ).pipe(
    concatMap(([issueOpts, issueCertRet]) => {
      // EXPORT TO PKCS#12 FORMAT
      if (issueOpts.kind === 'client') {
        const clientOpts: PfxOpts = {
          privateKeyFile: issueCertRet.privateUnsecureKeyFile,
          crtFile: issueCertRet.crtFile,
          pfxPass: issueCertRet.pass,
        }
        return outputClientCert(clientOpts).pipe(
          concatMap(tmpFile => {
            issueCertRet.pfxFile = join(issueOpts.centerPath, issueOpts.kind, `${issueOpts.serial}.p12`)
            return defer(() => copyFileAsync(tmpFile, <string> issueCertRet.pfxFile)).pipe(
              concatMap(() => chmodAsync(<string> issueCertRet.pfxFile, 0o600)),
              tap(() => {
                unlinkAsync(issueCertRet.privateUnsecureKeyFile)
                unlinkAsync(tmpFile)
              }),
            )

          }),
          map(() => {
            issueCertRet.privateUnsecureKeyFile = ''
            return issueCertRet
          }),
        )
      }
      else {
        return of(issueCertRet)
      }
    }),
    catchError(throwMaskError),
  )

  return ret$
}


function processGenCertIssueOpts(options: CertOpts, localConfig: Config): Observable<IssueOpts> {
  const ret$ = defer(() => processIssueOpts(localConfig, <IssueOpts> { ...initialCertOpts, ...options }))
    .pipe(
      concatMap(issueOpts => {
        /* istanbul ignore next */
        if (issueOpts.kind === 'ca') {
          throw new Error('value of kind can not be "ca", generate CA cert via genCaCert()')
        }
        return validateIssueOpts(issueOpts).pipe(
          concatMap(opts => {
            return nextSerial(opts.centerName, localConfig).pipe(
              map(serial => {
                opts.serial = serial
                return opts
              }),
            )
          }),
        )
      }),
    )

  return ret$
}

function genCsrFile(
  issueOpts$: Observable<IssueOpts>,
  localConfig: Config,
): Observable<{csr: string, csrFile: string, keysRet: KeysRet}> {

  const keysRet$ = issueOpts$.pipe(
    concatMap(issueOpts => {
      const privateKeyOpts = <PrivateKeyOpts> { ...initialPrivateKeyOpts, ...issueOpts }
      return genKeys(privateKeyOpts).pipe(
        concatMap(keysRet => {
          return savePrivateKeys(localConfig, issueOpts, keysRet).pipe(
            map(({ privateKeyFile, privateUnsecureKeyFile }) => {
              keysRet.privateKeyFile = privateKeyFile
              keysRet.privateUnsecureKeyFile = privateUnsecureKeyFile
              return keysRet
            }),
          )
        }),
      )
    }),
  )
  const csrNcsrFile$: Observable<{ csr: string, csrFile: string, keysRet: KeysRet }> = forkJoin(
    issueOpts$,
    keysRet$,
  ).pipe(
    concatMap(([issueOpts, keysRet]) => {
      return reqServerCert(localConfig, issueOpts, keysRet).pipe(
        concatMap(csr => {
          const csrFile = join(issueOpts.centerPath, issueOpts.kind, `${issueOpts.serial}.csr`)
          return createFileAsync(csrFile, csr, { mode: 0o600 }).then(() => {
            return { csr, csrFile, keysRet }
          })
        }),
      )
    }),
  )

  return csrNcsrFile$
}


export function genKeys(privateKeyOpts: PrivateKeyOpts): Observable<KeysRet> {
  const privateKey$ = genPrivateKey(privateKeyOpts)

  const ret$ = privateKey$.pipe(
    concatMap(privateKey => {
      const obbs = [
        of(privateKey),
        genPubKeyFromPrivateKey(privateKey, privateKeyOpts.pass, privateKeyOpts.alg),
        decryptPrivateKey(privateKey, privateKeyOpts.pass, privateKeyOpts.alg),
      ]
      // not using forkJoin cause of EPIPE
      return concat(...obbs).pipe(
        bufferCount(obbs.length),
      )
    }),
    map(([privateKey, pubKey, privateUnsecureKey]) => {
      const ret: KeysRet = {
        pubKey,
        privateKey,
        privateUnsecureKey,
        pass: privateKeyOpts.pass,
        privateKeyFile: '',
        privateUnsecureKeyFile: '',
      }
      return ret
    }),
    catchError(throwMaskError),
  )

  return ret$
}


function genPrivateKey(options: PrivateKeyOpts): Observable<string> {
  let key$ = of('')

  switch (options.alg) {
    case 'rsa':
      key$ = genRSAKey(options.pass, options.keyBits)
      break

    case 'ec':
      key$ = genECKey(options.pass, options.ecParamgenCurve)
      break

    default:
      throw new Error('value of param invalid')
  }

  return key$
}


// generate rsa private key pem
function genRSAKey(
  pass: PrivateKeyOpts['pass'],
  keyBits: PrivateKeyOpts['keyBits'],
): Observable<string> {

  const args = [
    'genpkey', '-algorithm', 'rsa',
    '-aes256', '-pass', `pass:${pass}`,
    '-pkeyopt', `rsa_keygen_bits:${keyBits}`,
  ]

  /* istanbul ignore next */
  return runOpenssl(args).pipe(
    tap(stdout => {
      if (! stdout || ! stdout.includes('PRIVATE KEY')) {
        throw new Error(`generate private key failed. stdout: "${stdout}"`)
      }
    }),
    catchError(throwMaskError),
  )
}


// generate ec private key pem
function genECKey(
  pass: PrivateKeyOpts['pass'],
  ecParamgenCurve: PrivateKeyOpts['ecParamgenCurve'],
): Observable<string> {

  const args = [
    'genpkey', '-algorithm', 'ec',
    '-aes256', '-pass', `pass:${pass}`,
    '-pkeyopt', `ec_paramgen_curve:${ecParamgenCurve}`,
  ]

  /* istanbul ignore next */
  return runOpenssl(args).pipe(
    tap(stdout => {
      if (! stdout || ! stdout.includes('PRIVATE KEY')) {
        throw new Error(`generate private key failed. stdout: "${stdout}"`)
      }
    }),
    catchError(throwMaskError),
  )
}


function genPubKeyFromPrivateKey(
  privateKey: string,
  passwd: PrivateKeyOpts['pass'],
  alg: PrivateKeyOpts['alg'],
): Observable<string> {

  const args = [alg, '-pubout']

  /* istanbul ignore next */
  if (passwd && privateKey.indexOf('ENCRYPTED') > 0) {
    args.push('-passin', `pass:${passwd}`)
  }
  const input$ = of(privateKey)

  const ret$ = runOpenssl(args, { inputStream: input$ }).pipe(
    tap(stdout => {
      /* istanbul ignore next */
      if (!stdout || !stdout.slice(0, 50).includes('PUBLIC KEY')) {
        throw new Error('genPubKeyFromPrivateKey() output invalid PUBLIC KEY: ' + stdout.slice(0, 1000))
      }
    }),

  )

  return ret$
}


export function decryptPrivateKey(
  privateKey: string,
  passwd: PrivateKeyOpts['pass'],
  alg: PrivateKeyOpts['alg'],
): Observable<string> {

  /* istanbul ignore next */
  if (!privateKey.includes('ENCRYPTED')) {
    if (privateKey.includes('PRIVATE')) {  // unsecure private key
      return of(privateKey)
    }
    else {
      throw new Error('decryptPrivateKey() Param key not valid **encrypted** private key')
    }
  }

  const args: string[] = [alg]
  /* istanbul ignore next */
  if (passwd && privateKey.indexOf('ENCRYPTED') > 0) {
    args.push('-passin', `pass:${passwd}`)
  }
  const input$ = of(privateKey)
  const ret$ = runOpenssl(args, { inputStream: input$ }).pipe(
    tap(stdout => {
      /* istanbul ignore next */
      if (! stdout || ! stdout.slice(0, 50).includes('PRIVATE KEY')) {
        throw new Error('decryptPrivateKey() stdout output invalid PRIVATE KEY: ' + stdout.slice(0, 1000))
      }
    }),
    catchError(throwMaskError),
  )

  return ret$
}


/** Return cert */
function reqCaCert(config: Config, options: IssueOpts): Observable<string> {
  const valid$ = validateIssueOpts(options)

  const { days, centerPath, pass } = options
  const keyFile = `${config.caKeyName}`
  const streamOpts: StreamOpts = {
    args: [
      'req', '-batch', '-utf8', '-x509', '-new',
      '-days', days + '',
      '-key', keyFile,
    ],
    runOpts: { cwd: centerPath },
    rtpl: '',
  }

  const streamOpts$ = of(streamOpts)

  const rtpl$ = iif(
    () => config.isWin32,
    streamOpts$.pipe(
      mergeMap(sopts => {
        return createRandomConfTpl(config, options).pipe(
          mergeMap(rtpl => fileExists(rtpl)),
          tap(rtpl => {
            /* istanbul ignore next */
            if (! rtpl) {
              throw new TypeError('reqCaCert() rtpl blank')
            }
          }),
          tap(rtpl => {
            sopts.args.push('-config', rtpl)
            sopts.rtpl = rtpl
          }),
          mapTo(sopts),
        )
      }),
    ),
    streamOpts$.pipe(
      map(sopts => {
        const subj = genIssueSubj(options)
        subj && sopts.args.push('-subj', `"${subj}"`)
        // console.info('reqCaCert() debug::', sopts, options) // @DEBUG
        return sopts
      }),
    ),
  ).pipe(
    map(sopts => {
      pass && sopts.args.push('-passin', `pass:${pass}`)
      return sopts
    }),
  )

  const ret$ = valid$.pipe(
    mergeMap(() => rtpl$),
    concatMap(({ args, runOpts, rtpl }) => {
      return runOpenssl(args, runOpts)
        .pipe(
          tap(stdout => {
            /* istanbul ignore next */
            if (! stdout || ! stdout.includes('CERTIFICATE')) {
              throw new Error('openssl return value: ' + stdout)
            }
          }),
          finalize(() => {
            unlinkRandomConfTpl(rtpl).subscribe()
          }),
          catchError((err: Error) => {
            unlinkRandomConfTpl(rtpl).subscribe()
            throw err
          }),
        )
    }),

  )

  return ret$
}


/** Generate and return csr base64 */
function reqServerCert(config: Config, options: IssueOpts, keysRet: KeysRet): Observable<string> {
  const valid$ = validateIssueOpts(options)
  const tpl$ = of({ config, options, keysRet }).pipe(
    mergeMap(({ config: conf, options: opts, keysRet: keys }) => {
      const { centerPath } = opts
      const privateUnsecureKeyFile = keys.privateUnsecureKeyFile
      const args = [
        'req', '-batch', '-utf8', '-new',
        '-days', '30',
        '-key', privateUnsecureKeyFile,
      ]
      return createRandomConfTpl(conf, opts).pipe(
        map(normalize),
        map(rtpl => {
          args.push('-config', rtpl)
          return { args, centerPath, rtpl }
        }),
      )
    }),
  )
  const ret$ = valid$.pipe(
    mergeMap(() => tpl$),
    mergeMap(({ args, centerPath, rtpl }) => {
      const runOpts = { cwd: centerPath }
      return runOpenssl(args, runOpts).pipe(
        tap(stdout => {
          /* istanbul ignore next */
          if (!stdout || !stdout.includes('REQUEST')) {
            throw new Error('openssl return value: ' + stdout)
          }
        }),
        finalize(() => {
          unlinkRandomConfTpl(rtpl).subscribe()
        }),

      )
    }),
  )

  return ret$
}


function validateIssueOpts(options: IssueOpts): Observable<IssueOpts> {
  const { alg, centerPath, hash, kind, pass } = options
  const caKeyFile = `${centerPath}/${initialConfig.caKeyName}`

  /* istanbul ignore next */
  if (alg === 'ec' && initialConfig.opensslVer && initialConfig.opensslVer < '1.0.2') {
    throw new Error('openssl version < "1.0.2" not support ec generation, current is: ' + initialConfig.opensslVer)
  }
  if (!centerPath) {
    throw new Error(`centerPath: "${centerPath}" not exits for centerName: "${options.centerName}" \n
      should create center dir by calling initCenter(centerName, path)
    `)
  }
  /* istanbul ignore next */
  if (typeof pass !== 'string') {
    throw new Error('pass must be typeof string')
  }
  if (pass.length < 4) {
    throw new Error('length of pass must at least 4')
  }
  /* istanbul ignore next */
  if (pass.length > 1023) {
    throw new Error('length of pass must not greater than 1023 chars if not empty')
  }
  /* istanbul ignore next */
  if (/\s/.test(pass)) {
    throw new Error('pass phrase contains blank or invisible char')
  }
  /* istanbul ignore next */
  if (!hash) {
    throw new Error('value of hash empty. must be sha256|sha384')
  }
  if (hash !== 'sha256' && hash !== 'sha384') {
    throw new Error('value of hash invalid. must be sha256|sha384')
  }

  /* istanbul ignore next */
  if (kind !== 'ca' && kind !== 'server' && kind !== 'client') {
    throw new Error('value of kind invalid. must be ca|server|client')
  }
  if (!options.C || options.C.length !== 2) {
    throw new Error('value of C (Country Name) must be 2 letters')
  }
  if (!options.CN) {
    throw new Error('value of CN (Common Name) invalid')
  }
  // if ( ! options.OU) {
  //   throw new Error('value of OU (Organizational Unit Name) invalid')
  // }
  /* istanbul ignore next */
  if (typeof options.days !== 'number') {
    throw new Error('value of days must typeof number')
  }
  if (options.days <= 0) {
    throw new Error('value of days must greater than zero')
  }

  if (kind === 'ca') {
    return of(options)
  }
  else {
    const ret$ = fileExists(caKeyFile).pipe(
      tap(res => {
        if (! res) {
          throw new Error(`caKeyFile not exists, file: "${caKeyFile}"`)
        }
      }),
      mapTo(options),
    )
    return ret$
  }
}


function processIssueOpts(config: Config, options: IssueOpts): Observable<IssueOpts> {
  const ret$ = defer(() => getCenterPath(options.centerName)).pipe(
    map(path => {
      const { keyBits, pass } = options

      options.centerPath = path
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
        if (typeof options[prop] !== 'undefined' && !options[prop]) {
          // @ts-ignore
          options[prop] = ''
        }
      }

      return options
    }),
  )

  return ret$
}


function genIssueSubj(options: CertDN): string {
  const arr: string[] = []


  for (const prop of reqSubjectFields) {
    if (typeof options[prop] !== 'undefined' && options[prop]) {
      const value = options[prop]
      const ret = Array.isArray(value) || ! value
        ? value
        : escapeShell(value)

      value && arr.push(`${prop}=${ret}`)
    }
  }
  return arr.length ? '/' + arr.join('/') : ''
}



/** return random config file path */
function createRandomConfTpl(config: Config, signOpts: IssueOpts): Observable<string> {
  const rfile = `${tmpdir()}/openssl-` + Math.random() + '.conf'
  const fields$: Observable<CertDNkeys> = ofrom(reqSubjectFields)
  const confTplPath = join(initialConfig.appDir, 'asset', `${config.confTpl}`)

  const tpl$ = defer(() => readFileAsync(confTplPath))
    .pipe(
      map(buf => buf.toString()),
      tap(tpl => {
        /* istanbul ignore next */
        if (!tpl) {
          throw new Error('loaded openssl config tpl is empty')
        }
      }),
    )

  const parserTpl$ = forkJoin(
    of(signOpts),
    tpl$,
  )
  .pipe(
    concatMap(([opts, tpl]) => {
      const stream$ = fields$.pipe(
        reduce((acc: string, curr: CertDNkeys) => {
          let value = ''
          const regx = new RegExp(`%${curr}%`)

          if (typeof opts[curr] === 'string' && opts[curr]) {
            value = <string> opts[curr]
          }
          const ret = acc.replace(regx, value)
          return ret
        }, tpl),
      )
      return stream$.pipe(
        map(ret => ret.replace(/%hash%/g, opts.hash)),  // global
      )
    }),
  )

  const ret$ = forkJoin(
    of(rfile),
    of({ sans: signOpts.SAN, ips: signOpts.ips }),
    parserTpl$,
  ).pipe(
    concatMap(([file, { sans, ips }, tpl]) => {
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

      return createFileAsync(file, tpl)
    }),
  )

  return ret$
}


/** return cert file path */
export function saveCaCrt(caCrtName: string, centerName: string, data: string): Observable<string> {
  const ret$ = getCenterPath(centerName).pipe(
    mergeMap(centerPath => {
      const file = join(centerPath, caCrtName)
      return writeFileAsync(file, data, { mode: 0o644 }).then(() => file)
    }),
  )
  return ret$
}

export function unlinkCaCrt(centerName: string): Observable<void> {
  const ret$ = getCenterPath(centerName).pipe(
    mergeMap(centerPath => {
      const file = `${centerPath}/${initialConfig.caCrtName}`
      return fileExists(file).pipe(
        mergeMap(exists => {
          /* istanbul ignore next */
          return exists ? unlinkAsync(file) : of(void 0)
        }),
      )
    }),
  )

  return ret$
}


/** unlink ca.key */
export function unlinkCaKey(centerName: string): Observable<void> {
  // const centerPath = await
  const ret$ = getCenterPath(centerName).pipe(
    tap(centerPath => {
      if (!centerPath) {
        throw new Error(`centerPath empty for centerName: "${centerName}"`)
      }
    }),
    mergeMap(centerPath => {
      const file = `${centerPath}/${initialConfig.caKeyName}` // ca.key
      return fileExists(file).pipe(
        mergeMap(exists => {
          /* istanbul ignore next */
          return exists ? unlinkAsync(file) : of() // unlink ca.key
        }),
      )
    }),
  )
  return ret$
}

/** Save private keys to path ./server */
function savePrivateKeys(
  config: Config,
  issueOpts: IssueOpts,
  keysRet: KeysRet,
): Observable<{ privateKeyFile: string, privateUnsecureKeyFile: string }> {

  const { centerPath, kind, serial } = issueOpts
  const { privateKey, privateUnsecureKey } = keysRet

  const privateKeyFile = join(centerPath, kind, `${serial}.key`)
  const privateUnsecureKeyFile = `${privateKeyFile}.unsecure`

  const ret$ = forkJoin(
    writeFileAsync(privateKeyFile, privateKey, { mode: 0o600 }),
    writeFileAsync(privateUnsecureKeyFile, privateUnsecureKey, { mode: 0o600 }),
  ).pipe(
    concatMap(() => fileExists(privateKeyFile)),
    tap(exists => {
      /* istanbul ignore next */
      if (!exists) {
        throw new Error(`save private key file failed. file: "${privateKeyFile}"`)
      }
    }),
    mapTo({ privateKeyFile, privateUnsecureKeyFile }),
  )

  return ret$
}


/** sign csr with ca.key, return crt */
export function sign(signOpts: SignOpts, conf?: Config): Observable<string> {
  const signOpts$ = validateSignOpts(signOpts)

  const ps$ = signOpts$.pipe(
    map(opts => {
      const { days, caCrtFile, caKeyFile, caKeyPass, csrFile } = opts
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
      return { args, opts }
    }),
  )
  const ps2$ = ps$.pipe(
    mergeMap(({ args, opts }) => {
      const localConfig: Config = conf ? { ...initialConfig, ...conf } : initialConfig
      const { configFile, ips, SAN } = opts

      return iif(
        () => (SAN && SAN.length) || (ips && ips.length) ? true : false,
        createRandomConfTpl(localConfig, <IssueOpts> opts).pipe(
          map(rtpl => {
            args.push('-config', normalize(rtpl))
            return { args, opts }
          }),
        ),
        of(args).pipe(
          map(args3 => {
            // configFile validated by validateSignOpts()
            args3.push('-config', normalize(<string> configFile))
            return { args: args3, opts }
          }),
        ),
      )
    }),
  )

  const ret$ = ps2$.pipe(
    mergeMap(({ args, opts }) => {
      return runOpenssl(args, { cwd: opts.centerPath }).pipe(
        tap(stdout => {
          /* istanbul ignore next */
          if (! stdout || ! stdout.includes('CERTIFICATE')) {
            throw new Error('openssl sign csr return value: ' + stdout)
          }
        }),
      )
    }),
    catchError(throwMaskError),
  )

  return ret$
}


/** generate pfx file, return file path(under user tmp folder) */
export function outputClientCert(options: PfxOpts): Observable<string> {
  const ret$ = defer(() => validatePfxOpts(options)).pipe(
    mergeMap(() => {
      const { privateKeyFile, privateKeyPass, crtFile, pfxPass } = options
      const pfxFile = join(tmpdir(), `/tmp-${Math.random()}.p12`)
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
      return runOpenssl(args).pipe(
        tap(stdout => {
          if (stdout) {
            throw new Error('openssl output pkcs12 failed, return value: ' + stdout)
          }
        }),
        mapTo(pfxFile),
      )
    }),
  )
  return ret$
}


function validateSignOpts(signOpts: SignOpts): Observable<SignOpts> {
  const first$ = of(signOpts).pipe(
    tap(opts => {
      const { SAN, ips, days, hash, caKeyPass } = opts
      /* istanbul ignore next */
      if (typeof +days !== 'number') {
        throw new Error(`value of param days of signOpts inavlid: "${days}"`)
      }
      /* istanbul ignore next */
      if (+days <= 0) {
        throw new Error(`value of param days of signOpts inavlid: "${days}"`)
      }

      /* istanbul ignore next */
      if (typeof SAN !== 'undefined') {
        if (!Array.isArray(SAN)) {
          throw new Error('value of param SAN of signOpts inavlid, must Array<string>')
        }
        for (const name of SAN) {
          if (!name) {
            throw new Error('item value of SAN of signOpts empty')
          }
        }
      }
      /* istanbul ignore next */
      if (typeof ips !== 'undefined') {
        if (!Array.isArray(ips)) {
          throw new Error('value of param ips of signOpts inavlid, must Array<string>')
        }
        for (const name of ips) {
          if (!name) {
            throw new Error('item value of ips of signOpts empty')
          }
        }
      }

      /* istanbul ignore next */
      if (!hash) {
        throw new Error(`value of param hash of signOpts inavlid: "${hash}"`)
      }

      /* istanbul ignore next */
      if (!caKeyPass) {
        throw new Error(`value of param caKeyPass of signOpts inavlid: "${caKeyPass}"`)
      }
    }),
  )

  const centerPath$ = of(signOpts.centerPath).pipe(
    mergeMap(centerPath => {
      return dirExists(centerPath).pipe(
        tap(exists => {
          /* istanbul ignore next */
          if (!exists) {
            throw new Error(`folder of param centerPath of signOpts not exists: "${centerPath}"`)
          }
        }),
      )
    }),
  )

  const caCrtFile$ = of(signOpts.caCrtFile).pipe(
    mergeMap(caCrtFile => {
      return fileExists(caCrtFile).pipe(
        tap(exists => {
          /* istanbul ignore next */
          if (! exists) {
            throw new Error(`file of param caCrtFile of signOpts not exists: "${caCrtFile}"`)
          }
        }),
      )
    }),
  )

  const caKeyFile$ = of(signOpts.caKeyFile).pipe(
    mergeMap(caKeyFile => {
      return fileExists(caKeyFile).pipe(
        tap(exists => {
          /* istanbul ignore next */
          if (! exists) {
            throw new Error(`file of param caKeyFile of signOpts not exists: "${caKeyFile}"`)
          }
        }),
      )
    }),
  )

  const csrFile$ = of(signOpts.csrFile).pipe(
    mergeMap(csrFile => {
      return fileExists(csrFile).pipe(
        tap(exists => {
          /* istanbul ignore next */
          if (! exists) {
            throw new Error(`file of param csrFile of signOpts not exists: "${csrFile}"`)
          }
        }),
      )
    }),
  )

  const config$ = of(signOpts.configFile).pipe(
    mergeMap(configFile => {
      /* istanbul ignore next */
      if (!configFile) {
        throw new Error('value of param configFile of signOpts empty')
      }
      return fileExists(configFile).pipe(
        tap(exists => {
          /* istanbul ignore next */
          if (! exists) {
            throw new Error(`file of param configFile  of signOpts not exists: "${configFile}"`)
          }
        }),
      )

    }),
  )

  const ret$ = forkJoin(
    first$,
    centerPath$,
    caCrtFile$,
    caKeyFile$,
    csrFile$,
    config$,
  ).pipe(
    mapTo(signOpts),
  )

  return ret$
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
