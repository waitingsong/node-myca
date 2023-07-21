/* eslint-disable node/no-process-exit */
/**
 * myca-cli
 * command: init|initca|issue|initcenter  case insensitive
 */

import { argv } from 'zx'

import { genCmdHelp, helpDefault } from './lib/helper.js'
import { runCmd } from './lib/index.js'
import { parseCliArgs, parseOpts } from './lib/parse-opts.js'
import { InitCenterArgs } from './lib/types.js'


const args = parseCliArgs(argv)

if (args.cmd) {
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
else {
  const msg = helpDefault()
  console.info(msg)
  process.exit(0)
}

