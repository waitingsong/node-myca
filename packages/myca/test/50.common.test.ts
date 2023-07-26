import assert from 'node:assert'

import { fileShortPath } from '@waiting/shared-core'

import { maskPasswdInString, throwMaskError } from '../src/lib/common.js'


describe(fileShortPath(import.meta.url), () => {

  it('Should maskPasswdInString() work', () => {
    const passArr = [
      'mycapsss',
      'mycapsss' + Math.random().toString(),
      Math.random(),
      'pass:word',
      '证书口令 ',
      '证书口令',
      '证书口令' + Math.random().toString(),
      '',
    ]
    const cmdArr = [
      'openssl rsa -pubout -passin pass:',
      'genpkey -algorithm rsa -aes256 -pass pass:',
    ]

    cmdArr.forEach((cmd) => {
      passArr.forEach((pass) => {
        const ret = maskPasswdInString(`${cmd}${pass}`)
        if (pass) {
          assert(! ret.includes(pass.toString()), cmd)
        }
        else {
          assert(! ret.includes('*'), ret)
        }
      })
    })

  })

  it('Should throwMaskError() work', () => {
    const passArr = [
      'mycapsss',
      'mycapsss' + Math.random().toString(),
      Math.random(),
      'pass:word',
      '证书口令 ',
      '证书口令',
      '证书口令' + Math.random().toString(),
    ]
    const cmdArr = [
      'openssl rsa -pubout -passin pass:',
      'genpkey -algorithm rsa -aes256 -pass pass:',
    ]

    cmdArr.forEach((cmd) => {
      passArr.forEach((pass) => {
        const str = `${cmd}${pass}`
        const passstr = pass.toString()
        const err = new Error()
        err.name = str
        err.message = str
        try {
          throwMaskError(err)
          assert(false, 'Should throw error')
        }
        catch (ex) {
          assert(ex instanceof Error, str)
          assert(! ex.name.includes(passstr), str)
          assert(! ex.message.includes(passstr), str)
        }
      })
    })

  })

})

