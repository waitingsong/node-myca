import { $ } from 'zx'


process.env['NODE_OPTIONS'] = '--enable-source-maps --no-warnings --loader tsx'

/**
 * @see https://mochajs.org/#root-hook-plugins
 * beforeAll:
 *  - In serial mode(Mocha’s default ), before all tests begin, once only
 *  - In parallel mode, run before all tests begin, for each file
 * beforeEach:
 *  - In both modes, run before each test
 */
export const mochaHooks = async () => {
  // avoid run multi times
  if (! process.env['mochaRootHookFlag']) {
    process.env['mochaRootHookFlag'] = 'true'
  }

  return {
    beforeAll: async () => {
      await $`chmod a+x ./dist/bin/cli.js`
      return
    },

    afterAll: async () => {
      return
    },
  }

}

