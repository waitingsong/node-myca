import { fileExists, unlinkAsync } from '@waiting/shared-core'
import { defer, of, Observable } from 'rxjs'
import { catchError, map, mapTo, mergeMap, reduce } from 'rxjs/operators'
import { run, RxSpawnOpts } from 'rxrunscript'

import { initialConfig } from './config'


export function runOpenssl(args: string[], options?: Partial<RxSpawnOpts>): Observable<string> {
  const script = initialConfig.openssl
  const ret$ = run(script, args, options)

  return ret$
    .pipe(
      reduce((acc: Buffer[], curr: Buffer) => {
        acc.push(curr)
        return acc
      }, []),
      map(arr => Buffer.concat(arr)),
      map(buf => buf.toString()),
      catchError(throwMaskError),
    )
}


export function maskPasswdInString(command: string): string {
  let ret = command.replace(/(?<=pass:)(.+?[\b\s])/g, (word: string) => {
    return '*'.repeat(word.length)
  })
  ret = ret.replace(/(?<=pass:)(.+)$/g, (word: string) => {
    return '*'.repeat(word.length)
  })
  return ret
}


export function throwMaskError(err: Error): never {
  const error = new Error()
  /* istanbul ignore next */
  error.name = maskPasswdInString(err.name) || 'Error'
  error.message = maskPasswdInString(err.message)
  throw error
}


// validate openssl cli
export function getOpensslVer(openssl: string): Observable<string> {
  /* istanbul ignore next */
  if (! openssl) {
    throw new Error('value of param openssl empty')
  }
  const script = `${openssl} version`
  const ret$ = run(script).pipe(
      map(buf => buf.toString()),
      map(stdout => {
        /* istanbul ignore next */
        if (stdout && stdout.indexOf('OpenSSL') >= 0) {
          return stdout.split(' ')[1]
        }
        else {
          throw new Error('openssl cli error:' + stdout)
        }
      }),
  )

  return ret$
}


export function unlinkRandomConfTpl(file: string): Observable<undefined> {
  return fileExists(file).pipe(
    mergeMap(exists => {
      return exists
        ? defer(() => unlinkAsync(exists))
        : of(void 0)
    }),
    mapTo(void 0),
    catchError(err => {
      console.info(err)
      /* istanbul ignore next */
      return of(void 0)
    }),
  )
}
