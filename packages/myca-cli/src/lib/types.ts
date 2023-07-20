import type { CaOpts, CertOpts } from 'myca'


export type CmdType = 'init' | 'initca' | 'issue' | 'initcenter'

export interface InitCenterArgs {
  _: string[]
  name: string
  path?: string
}

export interface RunCmdArgs {
  cmd: CmdType | void
  options: CaOpts | CertOpts | InitCenterArgs | null // null for cmd:init
  debug: boolean
}

export interface CliArgs extends RunCmdArgs {
  _: string[]
  needHelp: boolean
}

