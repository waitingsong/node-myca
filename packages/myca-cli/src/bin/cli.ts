/* eslint-disable node/no-process-exit */
/**
 * myca-cli
 * command: init|initca|issue|initcenter  case insensitive
 */

import assert from 'assert'

import { argv } from 'zx'

import { genCmdHelp } from '../lib/helper.js'
import { runCmd } from '../lib/index.js'
import { parseCliArgs, parseOpts } from '../lib/parse-opts.js'
import type { CliArgs, InitCenterArgs } from '../lib/types.js'


let args: CliArgs | undefined
try {
  args = parseCliArgs(argv)
  assert(args.cmd, 'args.cmd empty')

  if (args.needHelp) {
    const msg = genCmdHelp(args.cmd)
    console.info(msg)
    process.exit(0)
  }
  else {
    args.options = args.cmd === 'init' ? null : parseOpts(args.cmd, argv as InitCenterArgs)
    args.debug && console.info(args)
    const ret = await runCmd(args)
    console.info(ret)
  }

}
catch (ex) {
  assert(ex instanceof Error)
  console.info(ex.message)
  process.exit(1)
}

