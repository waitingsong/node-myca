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
  configName: string  // dynamic assign for win32
  confTpl: string // config template for win32
}

export type Alg = 'rsa' | 'ec'    // algorithm
export interface PrivateKeyOpts {
  // serial: string
  centerName: 'default' | string
  alg: Alg
  pass: string
  keyBits: number // for alg==rsa
  ecParamgenCurve?: 'P-256' | 'P-384' // for alg==ec
}

// passed by customer
export interface CaOpts {
  centerName?: 'default' | string  // key name of log dir
  alg?: Alg
  days: number
  pass: string  // at least 4 chars
  keyBits?: number // for rsa
  ecParamgenCurve?: 'P-256' | 'P-384' // for alg==ec
  hash?: 'sha256' | 'sha384'

  CN: string    // Common Name
  OU?: string    // Organizational Unit Name
  O?: string    // Organization Name
  C?: string    // Country Name (2 letter code)
  ST?: string   // State or Province Name
  L?: string    // Locality Name (eg, city)
  emailAddress?: string
  [prop: string]: any
}

// sign csr
export interface SignOpts {
  centerPath: string  // default as config.defaultCenterPath
  days: number
  hash: 'sha256' | 'sha384'
  caCrtFile: string
  caKeyFile: string
  caKeyPass: string
  csrFile: string
  configFile?: string // openssl config file . default centerPath/.config
  SAN?: string[]  // subjectAltName
  [prop: string]: string | number | string[] | undefined
}

// passed by customer
export interface CertOpts {
  kind: 'ca' | 'server' | 'client'
  // serial?: string
  centerName?: 'default' | string  // key name of log dir
  alg?: Alg
  days: number
  pass: string // at least 4 chars
  caKeyPass: string
  keyBits?: number // for rsa
  ecParamgenCurve?: 'P-256' | 'P-384' // for alg==ec
  hash?: 'sha256' | 'sha384'

  CN: string    // Common Name
  OU?: string    // Organizational Unit Name
  O?: string    // Organization Name
  C?: string    // Country Name (2 letter code)
  ST?: string   // State or Province Name
  L?: string    // Locality Name (eg, city)
  emailAddress?: string
  SAN?: string[]  // subjectAltName
}

// inner usage
export interface IssueOpts extends SignOpts {
  kind: 'ca' | 'server' | 'client'
  serial: string  // hex
  centerName: 'default' | string  // key name of center dir
  alg: Alg
  days: number
  pass?: string
  keyBits: number // for rsa
  ecParamgenCurve: 'P-256' | 'P-384' // for alg==ec
  hash: 'sha256' | 'sha384'
  CN: string    // Common Name
  OU?: string    // Organizational Unit Name
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

export interface KeysRet {
  pubKey: string     // pubkey pem
  privateKey: string  // private key pem
  privateUnsecureKey: string  // private key pem without pass encrypted
  pass: string
  privateKeyFile: string
  privateUnsecureKeyFile: string
}

export interface IssueCertRet extends KeysRet {
  csr: string
  csrFile: string
  cert: string  // certificate pem
  crtFile: string // certificate file path
}

export interface InitialFile {
  name: string
  defaultValue: string | number
  mode?: number
}
