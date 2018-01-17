import { CaOptions, CertOptions, Config, PrivateKeyOptions } from './model'


export const config: Config = {
  dbDir: 'db',
  dbCertsDir: 'db/certs',
  serverDir: 'server',
  clientDir: 'client',
  caKeyName: 'ca.key',
  caCrtName: 'ca.crt',

  userHome: '',
  centerDirName: '.myca',
  defaultCenterPath: '',
  centerListName: 'center-list.json',

  openssl: 'openssl',
  opensslVer: '',
  isOpensslCmdValid: false,

  isWin32: false,
  randomConfigFile: '',
  confTpl: 'tpl.conf',
}

export const initialPrivateKeyOptions: PrivateKeyOptions = {
  serial: 0,
  centerName: 'default',
  alg: 'rsa',
  pass: '',
  keyBits: 2048, // for alg==rsa
  ecParamgenCurve: 'P-256', // for alg==ec
}
export const initialCaOptions: CaOptions = {
  kind: 'ca',
  centerName: 'default',
  days: 10950,  // 30years
  alg: 'rsa',
  pass: '',
  keyBits: 4096,  // for alg==rsa
  ecParamgenCurve: 'P-256',
  hash: 'sha384',
  CN: '',
  OU: '',
  O: '',
  C: '',
  ST: '',
  L: '',
  emailAddress: '',
}

export const initialCertOptions: CertOptions = {
  kind: '',
  serial: 0,
  centerName: 'default',
  days: 750,    // 2years
  alg: 'rsa',
  pass: '',
  keyBits: 2048,
  ecParamgenCurve: 'P-256', // for alg==ec
  hash: 'sha256',
  // DNs
  CN: '',
  OU: '',
  O: '',
  C: '',
  ST: '',
  L: '',
  emailAddress: '',
}

export const reqSubjectFields = [
  'CN',
  'OU',
  'O',
  'L',
  'ST',
  'C',
  'emailAddress',
]

export const initialCertRet = {
  pubKey: '',     // pubkey pem
  privateKey: '',  // private key pem
  privateUnsecureKey: '',  // private key pem
  pass: '',
  cert: '',  // certificate pem
  crtFile: '', // certificate file path
}
