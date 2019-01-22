/// <reference types="mocha" />

import {
  basename,
  join,
 } from '@waiting/shared-core'
import * as assert from 'power-assert'
import * as rmdir from 'rimraf'
import { concat, forkJoin, from as ofrom, iif, of, EMPTY } from 'rxjs'
import { catchError, concatMap, finalize, map, mergeMap, tap } from 'rxjs/operators'

import * as myca from '../src/index'
import { genRandomCenterPath, maskPasswdInString, throwMaskError } from '../src/lib/common'
import { initialConfig } from '../src/lib/config'


const filename = basename(__filename)

describe(filename, () => {

  it('Should maskPasswdInString() works', done => {
    const passArr = [
      'mycapsss',
      'mycapsss' + Math.random(),
      Math.random(),
      'pass:word',
      '证书口令 ',
      '证书口令',
      '证书口令' + Math.random(),
      '',
    ]
    const pass$ = ofrom(passArr)
    const cmds = [
      'openssl rsa -pubout -passin pass:',
      'genpkey -algorithm rsa -aes256 -pass pass:',
    ]

    ofrom(cmds).pipe(
      mergeMap(cmd => {
        return pass$.pipe(
          tap(pass => {
            const ret = maskPasswdInString(`${cmd}${pass}`)
            if (pass) {
              assert(!ret.includes(pass.toString()), cmd)
            }
            else {
              assert(! ret.includes('*'), ret)
            }
          }),
        )
      }),
      finalize(() => done()),
    ).subscribe()
  })

  it('Should throwMaskError() works', done => {
    const passArr = [
      'mycapsss',
      'mycapsss' + Math.random(),
      Math.random(),
      'pass:word',
      '证书口令 ',
      '证书口令',
      '证书口令' + Math.random(),
    ]
    const pass$ = ofrom(passArr)
    const cmds = [
      'openssl rsa -pubout -passin pass:',
      'genpkey -algorithm rsa -aes256 -pass pass:',
    ]

    ofrom(cmds).pipe(
      mergeMap(cmd => {
        return pass$.pipe(
          tap(pass => {
            const str = `${cmd}${pass}`
            const passstr = pass.toString()
            const err = new Error()
            err.name = str
            err.message = str
            try {
              throwMaskError(err)
            }
            catch (ex) {
              assert(!ex.name.includes(passstr), str)
              assert(!ex.message.includes(passstr), str)
            }
          }),
        )
      }),
      finalize(() => done()),
    ).subscribe()
  })


})


describe(filename, () => {
  describe('Should genRandomCenterPath() works', () => {

    it('normal', done => {
      const { defaultCenterPath } = initialConfig
      const random$ = ofrom([
        0,
        Math.random(),
        Math.random().toString(),
        'foo',
        'foo bar   ',
        'foo/bar   ',
      ])

      random$.pipe(
        tap(random => {
          const needle = random.toString().trim().replace(/\s|\//g, '_')
          const expect = `${defaultCenterPath}-${needle}`
          const ret = genRandomCenterPath(random)
          assert(ret === expect,
            `expect: "${expect}", but got "${ret}"`)
        }),
        finalize(() => done()),
      ).subscribe()
    })

    it('invalid value', done => {
      const random$ = ofrom([
        '',
        '   ',
      ])

      random$.pipe(
        map(genRandomCenterPath),
        catchError(() => of(null)),
        tap(val => {
          assert(val === null, `Should throw error but NOT: ${val}`)
        }),
        finalize(() => done()),
      ).subscribe()
    })


  })
})
