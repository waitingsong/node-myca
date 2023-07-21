import assert from 'node:assert'

import {
  CaOpts,
  CertOpts,
  initDefaultCenter,
  initCaCert,
  initCenter,
  genCert,
  getCenterPath,
} from 'myca'

import { InitCenterArgs, RunCmdArgs } from './types.js'


export async function runCmd(args: RunCmdArgs): Promise<string> {
  const { cmd, options, debug } = args

  assert(cmd, 'cmd should not be empty')
  debug && console.info('runCmd()', { options })

  switch (cmd) {
    case 'init':
      return initCli()

    case 'initca':
      return initCaCli(options as CaOpts)

    case 'issue':
      return issueCli(options as CertOpts, debug)

    case 'initcenter':
      return initCenterCli(options as InitCenterArgs)

    // default:
    //   throw new Error(`invalid cmd: "${cmd}"`)
  }
}


async function initCli(): Promise<string> {
  const centerPath = await initDefaultCenter()
  const ret = `Default center created at path: "${centerPath}"`
  return ret
}


async function initCaCli(options: CaOpts): Promise<string> {
  const certRet = await initCaCert(options)
  const ret = `CA certificate created with:
  centerName: "${certRet.centerName}"
  crtFile: "${certRet.crtFile}"
  privateKeyFile: "${certRet.privateKeyFile}"
  `
  return ret
}


async function issueCli(options: CertOpts, debug = false): Promise<string> {
  const data = await genCert(options, { debug })
  const ret = `Issue a Certificate with:
  pubKey: \n${data.pubKey}\n
  pass: "${data.pass}" ${options.kind === 'server' ? `\n  privateKeyFile: "${data.privateKeyFile}"` : ''}
  privateKeyFile: "${data.privateKeyFile}" ${options.kind === 'server' ? `\n  privateUnsecureKeyFile: "${data.privateUnsecureKeyFile}"` : ''}
  centerName: "${data.centerName}"
  caKeyFile: "${data.caKeyFile}"
  caCrtFile: "${data.caCrtFile}"
  csrFile: "${data.csrFile}"
  crtFile: "${data.crtFile}"
  ${options.kind === 'client' ? `pfxFile: "${data.pfxFile ?? ''}"` : ''}
    `
  return ret
}


async function initCenterCli(options: InitCenterArgs): Promise<string> {
  const { name, path } = options

  const centerName = await initCenter(name, path)
  const centerPath = await getCenterPath(centerName)
  const ret = `center created with:
  centerName: "${centerName}"
  path: "${centerPath}"
    `
  return ret
}
