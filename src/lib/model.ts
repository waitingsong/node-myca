// param options of fs.writeFile()
export interface WriteFileOptions {
  encoding?: string | null
  mode?: number
  flag?: string
}

export interface ExecFileOptions {
  cwd?: string
  env?: object
  encoding?: 'utf8' | string
  timeout?: 0 | number
  maxBuffer?: number
  killSignal?: string
  uid?: number
  gid?: number
  windowsHide?: boolean
  windowsVerbatimArguments?: boolean
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
  dbDir: string
  dbCertsDir: string
  serverDir: string
  clientDir: string
  caKeyName: string // ca.key
  caCrtName: string // ca.crt

  userHome: string  // userprofile path
  centerDirName: string // .myca
  defaultCenterPath: string // userHome/centerDirName
  centerListName: string  // store in userHome/centerDirName/ , only one

  openssl: string   // openssl cli
  opensslVer: string  // dynamic calcu
  isOpensslCmdValid: boolean

  isWin32: boolean
  randomConfigFile: string  // dynamic assign for win32
  confTpl: string // config template for win32
}

export type Alg = 'rsa' | 'ec'    // algorithm
export interface PrivateKeyOptions {
  serial: number
  centerName: 'default' | string
  alg: Alg
  pass?: string
  keyBits?: number // for alg==rsa
  ecParamgenCurve?: 'P-256' | 'P-384' // for alg==ec
}

// passed by customer
export interface CaOptions {
  centerName?: 'default' | string  // key name of log dir
  days: number
  alg?: Alg
  pass: string  // at least 4 chars
  keyBits?: number // for rsa
  ecParamgenCurve?: 'P-256' | 'P-384' // for alg==ec
  hash?: 'sha256' | 'sha384'

  CN: string    // Common Name
  OU: string    // Organizational Unit Name
  O?: string    // Organization Name
  C?: string    // Country Name (2 letter code)
  ST?: string   // State or Province Name
  L?: string    // Locality Name (eg, city)
  emailAddress?: string
  [prop: string]: any
}

// passed by customer
export interface CertOptions {
  serial?: number
  centerName?: 'default' | string  // key name of log dir
  days: number
  alg: Alg
  pass?: string // if not empty at least 4 chars
  keyBits?: number // for rsa
  ecParamgenCurve?: 'P-256' | 'P-384' // for alg==ec
  hash?: 'sha256' | 'sha384'

  CN: string    // Common Name
  OU: string    // Organizational Unit Name
  O?: string    // Organization Name
  C?: string    // Country Name (2 letter code)
  ST?: string   // State or Province Name
  L?: string    // Locality Name (eg, city)
  emailAddress?: string
  caKeyFileName?: 'ca.key' | string,
}

// innter usage
export interface IssueOptions {
  centerName: 'default' | string  // key name of center dir
  centerPath: string  // default as config.defaultCenterPath
  days: number
  alg: Alg
  pass?: string
  keyBits: number // for rsa
  ecParamgenCurve: 'P-256' | 'P-384' // for alg==ec
  hash: 'sha256' | 'sha384'
  serial: number
  caKeyFileName: 'ca.key' | string
  CN: string    // Common Name
  OU: string    // Organizational Unit Name
  O?: string    // Organization Name
  C?: string    // Country Name (2 letter code)
  ST?: string   // State or Province Name
  L?: string    // Locality Name (eg, city)
  emailAddress?: string
  [prop: string]: any
}

export interface CertDetail {
  privateKey: string
  pubKey: string
  privateFile: string
  pubFile: string
}

export interface CertInfo {
  secure?: CertDetail   // available during issue with pass
  unsecure: CertDetail
}

export interface IssueCertRet {
  pubKey: string     // pubkey pem
  privateKey: string  // private key pem
  privateUnsecureKey: string  // private key pem without pass encrypted
  pass: string
  cert: string  // certificate pem
  crtFile: string // certificate file path
}
