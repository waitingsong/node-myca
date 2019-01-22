/// <reference types="mocha" />

import {
  basename,
  createDirAsync,
  createFileAsync,
  dirExists,
  isDirExists,
  isFileExists,
  join,
  promisify,
  tmpdir,
  unlinkAsync,
} from '@waiting/shared-core'
import * as assert from 'power-assert'
import * as rmdir from 'rimraf'
import { concat, forkJoin, iif, EMPTY } from 'rxjs'
import { catchError, concatMap, mergeMap, tap } from 'rxjs/operators'

import * as myca from '../src/index'
import { initialConfig } from '../src/lib/config'


const filename = basename(__filename)
const tmpDir = join(tmpdir(), 'myca-tmp')
const pathPrefix = 'myca-test-center'
const randomPathG = `${tmpDir}/${pathPrefix}-${Math.random()}`

// dir contains conf file and folders
// config.defaultCenterPath = normalize(`${config.userHome}/${config.centerDirName}`)
initialConfig.defaultCenterPath = `${randomPathG}/${initialConfig.centerDirName}`

describe(filename, () => {
  before(async () => {
    await createDirAsync(tmpDir)
  })
  after(done => {
    rmdir(tmpDir, err => err ? console.error(err) : done())
  })

  it('Should initDefaultCenter() works', done => {
    const centerPath$ = myca.initDefaultCenter().pipe(
      tap(path => {
        assert(
          path === initialConfig.defaultCenterPath,
          `result not expected. result: "${path}", expected: "${initialConfig.defaultCenterPath}"`,
        )
      }),
    )
    const exists$ = dirExists(initialConfig.defaultCenterPath).pipe(
      tap(path => {
        if (! path) {
          assert(false, `default center folder not exists, path: "${initialConfig.defaultCenterPath}"`)
        }
      }),
    )
    const centerInited$ = myca.isCenterInited('default').pipe(
      tap(inited => {
        assert(
          inited === true,
          `isCenterInited('default') says folder not exits. path: "${initialConfig.defaultCenterPath}"`,
        )
      }),
    )

    const first$ = centerPath$.pipe(
      concatMap(() => exists$),
      concatMap(() => centerInited$),
    )
    // initialize again
    const second$ = centerPath$.pipe(
      catchError(() => EMPTY),
      tap(() => {
        assert(false, 'should throw error during duplicate initialization, but NOT')
      }),
    )

    concat(
      first$,
      second$,
    ).subscribe(
      () => {},
      (err: Error) => assert(false, err.message),
      done,
    )

    // not rm for below test
    // rmdir(join(config.defaultCenterPath, '../'), (err) => err && console.error(err))
  })


  it('Should getCenterPath() works', done => {
    const centerPath$ = myca.getCenterPath('default')
    const exists$ = centerPath$.pipe(
      mergeMap(dirExists),
    )
    const isDefaultCenterInited$ = myca.isCenterInited('default')

    forkJoin(
      exists$,
      isDefaultCenterInited$,
    ).subscribe(
      ([path, inited]) => assert(path ? inited : ! inited),
      err => assert(false, err),
      done,
    )
  })



  // ------------------ at last

  it('Should getCenterPath() works with empty centerList', async () => {
    const file = join(initialConfig.defaultCenterPath, initialConfig.centerListName)

    try {
      if (await isFileExists(file)) {
        await unlinkAsync(file)
      }
      await createFileAsync(file, '')
      assert(await myca.getCenterPath('center').toPromise() === '', 'should return empty')
    }
    catch (ex) {
      assert(false, ex)
    }
  })


  it('Should initCenter() works without default Center', async () => {
    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`
    const path = join(initialConfig.defaultCenterPath, '..')

    if (await isDirExists(path)) {
      const rmdirAsync = promisify(rmdir)

      try {
        await rmdirAsync(path)
      }
      catch (ex) {
        assert(false, `unlink default Center failed. path: "${path}"`)
      }
    }

    try {
      await myca.initCenter(centerName, centerPath).toPromise()
      assert(false, 'initCenter() should throw error, but NOT')
    }
    catch (ex) {
      assert(true)
    }

    assert(! await isDirExists(centerPath), `path should not exists: "${centerPath}"`)
  })

})

