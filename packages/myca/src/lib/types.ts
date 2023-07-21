// param options of fs.writeFile()
export interface WriteFileOptions {
  encoding?: string | null
  mode?: number
  flag?: string
}


/**
 * json object converted from center-list.json
 * {
 *  "default": "/home/mark/.myca"
 *  "app1": "opt/app1/.myca"
 *  "app2": "opt/app2/foo"
 * }
 */
export interface CenterList {
  default: string
  [name: string]: string
}

export interface Config {
  /** base directory of this module */
  appDir: string
  dbDir: string
  dbCertsDir: string
  serverDir: string
  clientDir: string
  caKeyName: string // ca.key
  caCrtName: string // ca.crt

  userHome: string // userprofile path
  centerDirName: string // .myca
  defaultCenterPath: string // userHome/centerDirName
  centerListName: string // store in userHome/centerDirName/ , only one

  openssl: string // openssl cli
  opensslVer: string // dynamic calcu
  isOpensslCmdValid: boolean

  isWin32: boolean
  configName: string // dynamic assign for win32
  confTpl: string // config template for win32
  /**
   * @default false
   */
  debug: boolean
}

export type Alg = 'rsa' | 'ec' // algorithm
export interface PrivateKeyOpts {
  // serial: string
  centerName: 'default' | string
  alg: Alg
  pass: string
  /** for alg==rsa */
  keyBits: number
  /** for alg==ec */
  ecParamgenCurve?: 'P-256' | 'P-384'
}

// passed by customer
export interface CaOpts {
  /** key name of log dir */
  centerName?: 'default' | string
  alg?: Alg
  days: number
  pass: string // at least 4 chars
  keyBits?: number // for rsa
  ecParamgenCurve?: 'P-256' | 'P-384' // for alg==ec
  hash?: 'sha256' | 'sha384'

  /** Common Name */
  CN: string
  /** Organizational Unit Name */
  OU?: string
  /** Organization Name */
  O?: string
  /** Country Name (2 letter code) */
  C?: string
  /** State or Province Name */
  ST?: string
  /** Locality Name (eg, city) */
  L?: string
  emailAddress?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any
}

export type CertDNkeys = keyof CertDN

export interface CertDN {
  CN: string // Common Name
  OU?: string // Organizational Unit Name
  O?: string // Organization Name
  C: string // Country Name (2 letter code)
  ST?: string // State or Province Name
  L?: string // Locality Name (eg, city)
  emailAddress?: string
  SAN?: string[] // subjectAltName
  ips?: string[] // subjectAltName ip
}

// sign csr
export interface SignOpts {
  kind: 'ca' | 'server' | 'client'
  centerPath: string // default as config.defaultCenterPath
  days: number
  hash: 'sha256' | 'sha384'
  caCrtFile: string
  caKeyFile: string
  caKeyPass: string
  csrFile: string
  configFile?: string // openssl config file . default centerPath/.config
  SAN?: string[] // subjectAltName DNS
  ips?: string[] // subjectAltName ip. NOT support ip mask such as 192.168.0.*
}

// passed by customer
export interface CertOpts extends CertDN {
  kind: 'ca' | 'server' | 'client'
  // serial?: string
  centerName?: 'default' | string // key name of log dir
  alg?: Alg
  days: number
  pass: string // at least 4 chars
  caKeyPass: string
  keyBits?: number // for rsa
  ecParamgenCurve?: 'P-256' | 'P-384' // for alg==ec
  hash?: 'sha256' | 'sha384'
}

// inner usage
export interface IssueOpts extends SignOpts, CertDN {
  serial: string // hex
  centerName: 'default' | string // key name of center dir
  alg: Alg
  days: number
  pass: string
  keyBits: number // for rsa
  ecParamgenCurve: 'P-256' | 'P-384' // for alg==ec
  hash: 'sha256' | 'sha384'
}

export interface CertDetail {
  privateKey: string
  pubKey: string
  privateFile: string
  pubFile: string
}

export interface CertInfo {
  secure?: CertDetail // available during issue with pass
  unsecure: CertDetail
}

export interface KeysRet {
  pubKey: string // pubkey pem
  privateKey: string // private key pem
  privateUnsecureKey: string // private key pem without pass encrypted
  pass: string
  privateKeyFile: string
  privateUnsecureKeyFile: string
}

export interface IssueCaCertRet {
  centerName: string
  privateKey: string // private key pem
  pass: string
  privateKeyFile: string
  cert: string // certificate pem
  crtFile: string // certificate file path
}

export interface IssueCertRet extends KeysRet {
  centerName: string
  caKeyFile: string
  caCrtFile: string
  csr: string
  csrFile: string
  cert: string // certificate pem
  crtFile: string // certificate file path
  pfxFile?: string // for client
}

export interface InitialFile {
  name: string
  defaultValue: string | number
  mode?: number
}

export interface PfxOpts {
  privateKeyFile: string
  privateKeyPass?: string
  crtFile: string
  pfxPass: string
}

export interface StreamOpts {
  args: string[]
  runOpts: RunOpensslOptions
  rtpl: string
}

export interface RunOpensslOptions {
  cwd?: string
  input?: string
  /**
  * @default false
  */
  debug?: boolean
}
