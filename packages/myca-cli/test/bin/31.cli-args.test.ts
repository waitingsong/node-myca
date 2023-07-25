import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'
import { $, ProcessOutput } from 'zx'


describe(fileShortPath(import.meta.url), () => {
  const cli = './src/bin/cli.ts'

  describe('Should cli work', () => {
    it('no args', async () => {
      try {
        await $`node --enable-source-maps --loader ts-node/esm ${cli}  `
        assert(false, 'should throw')
      }
      catch (ex) {
        assert(ex instanceof Error)
        const output = ex as ProcessOutput
        assert(typeof output.exitCode === 'number')
        assert(output.exitCode === 1, `exitCode: ${output.exitCode}`)
        assert(output.stdout.length > 0, `stdout: ${output.stdout}`)
        assert(output.stdout.includes('Standard commands'), `stdout: ${output.stdout}`)
        assert(output.stdout.includes('init\tinitca\tissue\tinitcenter'), `stdout: ${output.stdout}`)
        assert(output.stdout.includes('More help: myca <command> -h'), `stdout: ${output.stdout}`)
      }
    })

    it('-h without cmd', async () => {
      try {
        const args = ['-h']
        await $`node --enable-source-maps --loader ts-node/esm ${cli} ${args} `
        assert(false, 'should throw')
      }
      catch (ex) {
        assert(ex instanceof Error)
        const output = ex as ProcessOutput
        assert(typeof output.exitCode === 'number')
        assert(output.exitCode === 1, `exitCode: ${output.exitCode}`)
        assert(output.stdout.length > 0, `stdout: ${output.stdout}`)
        assert(output.stdout.includes('Standard commands'), `stdout: ${output.stdout}`)
        assert(output.stdout.includes('init\tinitca\tissue\tinitcenter'), `stdout: ${output.stdout}`)
        assert(output.stdout.includes('More help: myca <command> -h'), `stdout: ${output.stdout}`)
      }
    })

    it('init -h', async () => {
      const cmd = 'init'
      const args = ['-h']
      const { stdout } = await $`node --enable-source-maps --loader ts-node/esm ${cli} ${cmd} ${args} `
      assert(stdout.length > 0, `stdout: ${stdout}`)
      assert(stdout.includes(`Usage: ${cmd} [options]`), `stdout: ${stdout}`)
      assert(stdout.includes('Valid options are:'), `stdout: ${stdout}`)
      assert(stdout.includes('Display this summary'), `stdout: ${stdout}`)
      assert(stdout.includes('Display debug info'), `stdout: ${stdout}`)
    })

    it('initca -h', async () => {
      const cmd = 'initca'
      const args = ['-h']
      const { stdout } = await $`node --enable-source-maps --loader ts-node/esm ${cli} ${cmd} ${args} `
      assert(stdout.length > 0, `stdout: ${stdout}`)
      assert(stdout.includes(`Usage: ${cmd} [options]`), `stdout: ${stdout}`)
      assert(stdout.includes('Valid options are:'), `stdout: ${stdout}`)
      assert(stdout.includes('Display this summary'), `stdout: ${stdout}`)
      assert(stdout.includes('Display debug info'), `stdout: ${stdout}`)

      assert(stdout.includes('--centerName'), `stdout: ${stdout}`)
      assert(stdout.includes('--alg'), `stdout: ${stdout}`)
      assert(stdout.includes('--days'), `stdout: ${stdout}`)
      assert(stdout.includes('--pass'), `stdout: ${stdout}`)
      assert(stdout.includes('--keyBits'), `stdout: ${stdout}`)
      assert(stdout.includes('--ecParamgenCurve'), `stdout: ${stdout}`)
      assert(stdout.includes('--hash'), `stdout: ${stdout}`)
      assert(stdout.includes('--CN'), `stdout: ${stdout}`)
      assert(stdout.includes('--OU'), `stdout: ${stdout}`)
      assert(stdout.includes('--O'), `stdout: ${stdout}`)
      assert(stdout.includes('--C'), `stdout: ${stdout}`)
      assert(stdout.includes('--ST'), `stdout: ${stdout}`)
      assert(stdout.includes('--L'), `stdout: ${stdout}`)
      assert(stdout.includes('--emailAddress'), `stdout: ${stdout}`)
    })

    it('issue -h', async () => {
      const cmd = 'issue'
      const args = ['-h']
      const { stdout } = await $`node --enable-source-maps --loader ts-node/esm ${cli} ${cmd} ${args} `
      assert(stdout.length > 0, `stdout: ${stdout}`)
      assert(stdout.includes(`Usage: ${cmd} [options]`), `stdout: ${stdout}`)
      assert(stdout.includes('Valid options are:'), `stdout: ${stdout}`)
      assert(stdout.includes('Display this summary'), `stdout: ${stdout}`)
      assert(stdout.includes('Display debug info'), `stdout: ${stdout}`)

      assert(stdout.includes('--kind'), `stdout: ${stdout}`)
      assert(stdout.includes('--centerName'), `stdout: ${stdout}`)
      assert(stdout.includes('--caKeyPass'), `stdout: ${stdout}`)
      assert(stdout.includes('--alg'), `stdout: ${stdout}`)
      assert(stdout.includes('--days'), `stdout: ${stdout}`)
      assert(stdout.includes('--pass'), `stdout: ${stdout}`)
      assert(stdout.includes('--keyBits'), `stdout: ${stdout}`)
      assert(stdout.includes('--ecParamgenCurve'), `stdout: ${stdout}`)
      assert(stdout.includes('--hash'), `stdout: ${stdout}`)
      assert(stdout.includes('--CN'), `stdout: ${stdout}`)
      assert(stdout.includes('--OU'), `stdout: ${stdout}`)
      assert(stdout.includes('--O'), `stdout: ${stdout}`)
      assert(stdout.includes('--C'), `stdout: ${stdout}`)
      assert(stdout.includes('--ST'), `stdout: ${stdout}`)
      assert(stdout.includes('--L'), `stdout: ${stdout}`)
      assert(stdout.includes('--emailAddress'), `stdout: ${stdout}`)

      assert(stdout.includes('--SAN'), `stdout: ${stdout}`)
      assert(stdout.includes('--ips'), `stdout: ${stdout}`)
    })

    it('initcenter -h', async () => {
      const cmd = 'initcenter'
      const args = ['-h']
      const { stdout } = await $`node --enable-source-maps --loader ts-node/esm ${cli} ${cmd} ${args} `
      assert(stdout.length > 0, `stdout: ${stdout}`)
      assert(stdout.includes(`Usage: ${cmd} [options]`), `stdout: ${stdout}`)
      assert(stdout.includes('Valid options are:'), `stdout: ${stdout}`)
      assert(stdout.includes('Display this summary'), `stdout: ${stdout}`)
      assert(stdout.includes('Display debug info'), `stdout: ${stdout}`)

      assert(stdout.includes('--name'), `stdout: ${stdout}`)
      assert(stdout.includes('--path'), `stdout: ${stdout}`)
    })

  })

})
