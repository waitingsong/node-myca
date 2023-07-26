import assert from 'node:assert'

// import minimist from 'minimist'
import {
  initialCaOpts,
  initialCertOpts,
} from 'myca'
import { argv } from 'zx'

import { cmdSet, initialCliArgs } from './config.js'
import { helpDefault } from './helper.js'
import { CliArgs, CmdType, InitCenterArgs } from './types.js'


// const argv = minimist(process.argv.slice(2))

export function parseCliArgs(arg: typeof argv): CliArgs {
  const args: CliArgs = { ...initialCliArgs, ...arg }
  const cmdArr: string[] = args._

  args.cmd = parseCmd(cmdArr)
  args.options = null
  args.needHelp = !! arg['h']
  args.debug = !! arg['d']

  return args
}


function parseCmd(args: string[]): CmdType {
  let command = ''

  for (let cmd of args) {
    cmd = cmd.toLowerCase()

    if (cmdSet.has(cmd)) {
      if (command && command !== cmd) {
        throw new Error(`confusing command: "${cmd}" and "${command}"`)
      }
      else {
        command = cmd
      }
    }
  }

  if (! command) {
    const help = helpDefault()
    throw new Error(help)
  }
  return command as CmdType
}


export function parseOpts(cmd: string, options: InitCenterArgs): CliArgs['options'] {
  assert(cmd !== 'init', 'cmd should not be "init"')

  if (cmd === 'initcenter') {
    return parseInitCenter(options)
  }

  const caOpts: CliArgs['options'] = cmd === 'initca'
    ? { ...initialCaOpts }
    : { ...initialCertOpts }
  const propMap = new Map() as Map<string, string> // <upperKey, oriKey>

  Object.keys(caOpts).forEach((key) => {
    propMap.set(key.toUpperCase(), key)
  })

  Object.keys(options).forEach((key) => {
    const upperKey = key.toUpperCase()

    if (propMap.has(upperKey)) {
      Object.defineProperty(caOpts, propMap.get(upperKey) as string, {
        configurable: true,
        enumerable: true,
        writable: true,
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value: options[key],
      })
    }
  })

  if (cmd === 'issue') {
    if (typeof caOpts.SAN !== 'undefined') {
      const arr = parseMultiValue(caOpts.SAN)

      if (arr.length) {
        caOpts.SAN = arr
      }
      else {
        delete caOpts.SAN
      }
    }
    if (typeof caOpts.ips !== 'undefined') {
      const arr = parseMultiValue(caOpts.ips)

      if (arr.length) {
        caOpts.ips = arr
      }
      else {
        delete caOpts.ips
      }
    }
  }

  return caOpts
}


function parseMultiValue(arg: unknown): string[] {
  const arr = arg ? String(arg).split(',') : []
  const ret: string[] = []

  if (arr.length) {
    for (let value of arr) {
      value = value.trim()
      if (value) {
        ret.push(value)
      }
    }
  }

  return ret
}


function parseInitCenter(args: typeof argv): InitCenterArgs {
  assert(args, 'args empty')
  assert(typeof args === 'object', 'args should be an object')

  const { path } = args
  const { name } = args

  assert(typeof name === 'string', 'value of name should be a string')
  assert(name.length, 'value of name empty')
  assert(typeof name === 'string', 'value of name should be a string')
  const ret = {
    name,
    path: typeof path === 'string' ? path : '',
    _: args._,
  }
  return ret
}
