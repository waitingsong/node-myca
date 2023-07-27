import { rm, rename, readFile } from 'fs/promises'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { sep } from 'path'

import {
  userHome,
  fileShortPath,
  isDirExists,
} from '@waiting/shared-core'
import semver from 'semver'
import { $ } from 'zx'

import { runCmd, RunCmdArgs } from '../../src/index.js'


const defaultCenterPath = join(userHome, '.myca')
let defaultCenterPathBak = join(userHome, '.myca-bak-' + Math.random().toString())
const initArgs: RunCmdArgs = {
  cmd: 'init',
  options: null,
  debug: true,
}

const requiredVersion = '>=16 <20'
const currentVersion = process.version
const isVersionMatch = semver.satisfies(currentVersion, requiredVersion)

describe(fileShortPath(import.meta.url), () => {
  const cli = './src/bin/cli.ts'
  const optsCa = {
    days: 10950,
    pass: 'mycapass',
    CN: 'my root ca',
    O: 'my company',
    C: 'CN',
  }

  before(async () => {
    if (! isVersionMatch) {
      console.info(`Skip test, required node version: ${requiredVersion}, current version: ${currentVersion}`)
      return
    }

    const exists = await isDirExists(defaultCenterPath)
    if (exists) {
      await rename(defaultCenterPath, defaultCenterPathBak)
    }
    else {
      defaultCenterPathBak = ''
    }

    const ret = await runCmd(initArgs)
    assert(ret.includes('Default center created at path'), ret)
    assert(ret.includes(defaultCenterPath), ret)

    const cmd = 'initca'
    const args: (string|number)[] = [
      '--days', optsCa.days,
      '--pass', optsCa.pass,
      '--CN', optsCa.CN,
      '--O', optsCa.O,
      '--C', optsCa.C,
    ]
    await $`node ${cli} ${cmd} ${args} `
  })

  after(async () => {
    if (! isVersionMatch) {
      console.info(`Skip test, required node version: ${requiredVersion}, current version: ${currentVersion}`)
      return
    }

    await rm(defaultCenterPath, { recursive: true, force: true })
    if (defaultCenterPathBak) {
      await rename(defaultCenterPathBak, defaultCenterPath)
    }
  })

  describe('Should issue server work', () => {
    if (! isVersionMatch) {
      console.info(`Skip test, required node version: ${requiredVersion}, current version: ${currentVersion}`)
      return
    }

    const cmd = 'issue'
    const opts = {
      kind: 'server',
      ips: '127.0.0.1, 192.168.0.1',
      SAN: 'localhost',
      centerName: 'default',
      alg: 'ec',
      caKeyPass: 'mycapass',

      days: 10950,
      pass: 'mycapass',
      CN: 'test',
      O: 'it',
      C: 'CN',
    }
    const issueArgs: (string | number)[] = [
      '--kind', opts.kind,
      '--centerName', opts.centerName,
      '--alg', opts.alg,
      '--caKeyPass', opts.caKeyPass,

      '--days', opts.days,
      '--pass', opts.pass,
      '--CN', opts.CN,
      '--O', opts.O,
      '--C', opts.C,
    ]

    it('01', async () => {
      const args: (string | number)[] = [
        ...issueArgs,
        '--ips', opts.ips,
        '--SAN', opts.SAN,
      ]

      await $`pwd`
      const { stdout } = await $`node ${cli} ${cmd} ${args} `
      // const { stdout } = await $`ts-node-esm ${cli} ${cmd} ${args} `
      assert(stdout)
      assert(stdout.includes('Issue a Certificate with:'), stdout)
      assert(stdout.includes('pubKey:'), stdout)
      assert(stdout.includes('-----BEGIN PUBLIC KEY-----'), stdout)
      assert(stdout.includes('pass: "mycapass"'), stdout)
      assert(stdout.includes('privateKeyFile'), stdout)
      assert(stdout.includes(opts.kind + sep + '01.key'), stdout)
      assert(stdout.includes('privateUnsecureKeyFile'), stdout)
      assert(stdout.includes(opts.kind + sep + '01.key.unsecure'), stdout)

      const crtFile = stdout.match(/crtFile: "(.*)"/)?.[1]
      assert(crtFile, stdout)
      const txt = await readFile(crtFile, 'utf-8')

      // Issuer: C=CN, O=my company, CN=my root ca
      assert(txt.includes('Issuer:'), txt)
      assert(txt.includes(`C=${optsCa.C}`), txt)
      assert(txt.includes(`O=${optsCa.O}`), txt)
      assert(txt.includes(`CN=${optsCa.CN}`), txt)

      // Subject: C=CN, O=it, CN=test
      assert(txt.includes(`Subject: C=${opts.C}, O=${opts.O}, CN=${opts.CN}`), txt)

      // X509v3 Key Usage: \n Digital Signature, Non Repudiation, Key Encipherment, Data Encipherment
      assert(txt.includes('X509v3 Key Usage:'), txt)
      assert(txt.includes('Digital Signature'), txt)
      assert(txt.includes('Non Repudiation'), txt)
      assert(txt.includes('Key Encipherment'), txt)
      assert(txt.includes('Data Encipherment'), txt)

      // X509v3 Extended Key Usage: \n TLS Web Server Authentication, TLS Web Client Authentication, Code Signing, E-mail Protection
      assert(txt.includes('X509v3 Extended Key Usage:'), txt)
      assert(txt.includes('TLS Web Server Authentication'), txt)
      assert(txt.includes('TLS Web Client Authentication'), txt)
      assert(txt.includes('Code Signing'), txt)
      assert(txt.includes('E-mail Protection'), txt)

      // X509v3 Subject Alternative Name: \n DNS:localhost, IP Address:127.0.0.1, IP Address:192.168.0.1
      assert(txt.includes('X509v3 Subject Alternative Name:'), txt)
      assert(txt.includes('DNS:localhost'), txt)
      assert(txt.match(/IP Address:127\.0\.0\.1/u), txt)
      assert(txt.match(/IP Address:192\.168\.0\.1/u), txt)
    })

    it('02', async () => {
      const args: (string | number)[] = [
        ...issueArgs,
        '--ips', opts.ips,
        '--SAN', opts.SAN,
      ]

      await $`pwd`
      const { stdout } = await $`node ${cli} ${cmd} ${args} `
      // const { stdout } = await $`ts-node-esm ${cli} ${cmd} ${args} `
      assert(stdout)
      assert(stdout.includes('Issue a Certificate with:'), stdout)
      assert(stdout.includes('pubKey:'), stdout)
      assert(stdout.includes('-----BEGIN PUBLIC KEY-----'), stdout)
      assert(stdout.includes('pass: "mycapass"'), stdout)
      assert(stdout.includes('privateKeyFile'), stdout)
      assert(stdout.includes(opts.kind + sep + '02.key'), stdout)
      assert(stdout.includes('privateUnsecureKeyFile'), stdout)
      assert(stdout.includes(opts.kind + sep + '02.key.unsecure'), stdout)
    })

    it('03 w/o ips,san', async () => {
      const args: (string | number)[] = [...issueArgs]

      await $`pwd`
      const { stdout } = await $`node ${cli} ${cmd} ${args} `
      // const { stdout } = await $`ts-node-esm ${cli} ${cmd} ${args} `
      assert(stdout)
      assert(stdout.includes('Issue a Certificate with:'), stdout)
      assert(stdout.includes('pubKey:'), stdout)
      assert(stdout.includes('-----BEGIN PUBLIC KEY-----'), stdout)
      assert(stdout.includes('pass: "mycapass"'), stdout)
      assert(stdout.includes('privateKeyFile'), stdout)
      assert(stdout.includes(opts.kind + sep + '03.key'), stdout)
      assert(stdout.includes('privateUnsecureKeyFile'), stdout)
      assert(stdout.includes(opts.kind + sep + '03.key.unsecure'), stdout)

      const crtFile = stdout.match(/crtFile: "(.*)"/)?.[1]
      assert(crtFile, stdout)
      const txt = await readFile(crtFile, 'utf-8')

      // console.log({ txt })
      // Issuer: C=CN, O=my company, CN=my root ca
      assert(txt.includes('Issuer:'), txt)
      assert(txt.includes(`C=${optsCa.C}`), txt)
      assert(txt.includes(`O=${optsCa.O}`), txt)
      assert(txt.includes(`CN=${optsCa.CN}`), txt)

      // Subject: C=CN, O=it, CN=test
      assert(txt.includes(`Subject: C=${opts.C}, O=${opts.O}, CN=${opts.CN}`), txt)

      // X509v3 Key Usage: \n Digital Signature, Non Repudiation, Key Encipherment, Data Encipherment
      assert(txt.includes('X509v3 Key Usage:'), txt)
      assert(txt.includes('Digital Signature'), txt)
      assert(txt.includes('Non Repudiation'), txt)
      assert(txt.includes('Key Encipherment'), txt)
      assert(txt.includes('Data Encipherment'), txt)

      // X509v3 Extended Key Usage: \n TLS Web Server Authentication, TLS Web Client Authentication, Code Signing, E-mail Protection
      assert(txt.includes('X509v3 Extended Key Usage:'), txt)
      assert(txt.includes('TLS Web Server Authentication'), txt)
      assert(txt.includes('TLS Web Client Authentication'), txt)
      assert(txt.includes('Code Signing'), txt)
      assert(txt.includes('E-mail Protection'), txt)

      // X509v3 Subject Alternative Name: \n DNS:localhost, IP Address:127.0.0.1, IP Address:192.168.0.1
      assert(! txt.includes('X509v3 Subject Alternative Name:'), txt)
      assert(! txt.includes('DNS:localhost'), txt)
      assert(! txt.match(/IP Address:127\.0\.0\.1/u), txt)
      assert(! txt.match(/IP Address:192\.168\.0\.1/u), txt)
    })

    it('04 w/o ips', async () => {
      const args: (string | number)[] = [
        ...issueArgs,
        '--SAN', opts.SAN,
      ]

      await $`pwd`
      const { stdout } = await $`node ${cli} ${cmd} ${args} `
      // const { stdout } = await $`ts-node-esm ${cli} ${cmd} ${args} `
      assert(stdout)

      const crtFile = stdout.match(/crtFile: "(.*)"/)?.[1]
      assert(crtFile, stdout)
      const txt = await readFile(crtFile, 'utf-8')

      // Issuer: C=CN, O=my company, CN=my root ca
      assert(txt.includes('Issuer:'), txt)
      assert(txt.includes(`C=${optsCa.C}`), txt)
      assert(txt.includes(`O=${optsCa.O}`), txt)
      assert(txt.includes(`CN=${optsCa.CN}`), txt)

      // Subject: C=CN, O=it, CN=test
      assert(txt.includes(`Subject: C=${opts.C}, O=${opts.O}, CN=${opts.CN}`), txt)

      // X509v3 Key Usage: \n Digital Signature, Non Repudiation, Key Encipherment, Data Encipherment
      assert(txt.includes('X509v3 Key Usage:'), txt)
      assert(txt.includes('Digital Signature'), txt)
      assert(txt.includes('Non Repudiation'), txt)
      assert(txt.includes('Key Encipherment'), txt)
      assert(txt.includes('Data Encipherment'), txt)

      // X509v3 Extended Key Usage: \n TLS Web Server Authentication, TLS Web Client Authentication, Code Signing, E-mail Protection
      assert(txt.includes('X509v3 Extended Key Usage:'), txt)
      assert(txt.includes('TLS Web Server Authentication'), txt)
      assert(txt.includes('TLS Web Client Authentication'), txt)
      assert(txt.includes('Code Signing'), txt)
      assert(txt.includes('E-mail Protection'), txt)

      // X509v3 Subject Alternative Name: \n DNS:localhost, IP Address:127.0.0.1, IP Address:192.168.0.1
      assert(txt.includes('X509v3 Subject Alternative Name:'), txt)
      assert(txt.includes('DNS:localhost'), txt)
      assert(! txt.match(/IP Address:127\.0\.0\.1/u), txt)
      assert(! txt.match(/IP Address:192\.168\.0\.1/u), txt)
    })
  })
})
