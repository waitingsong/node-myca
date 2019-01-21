import {
  copyFileAsync,
  createDir,
  createFileAsync,
  dirExists,
  isDirExists,
  isFileExists,
  readFileAsync,
  writeFileAsync,
} from '@waiting/shared-core'
import { join, normalize } from 'path'
import {
  concat,
  defer,
  forkJoin,
  from as ofrom,
  merge,
  of,
  EMPTY,
  Observable,
} from 'rxjs'
import {
  concatMap,
  last,
  map,
  mapTo,
  mergeMap,
  tap,
 } from 'rxjs/operators'

import { initialConfig, initialDbFiles } from './config'
import { CenterList, Config, InitialFile } from './model'


/** Get serial HEX string */
export function nextSerial(centerName: string, config: Config): Observable<string> {
  const centerPath$ = getCenterPath(centerName).pipe(
    tap(centerPath => {
      if (!centerPath) {
        throw new Error(`centerPath not exists, centerName: "${centerName}"`)
      }
    }),
  )
  const serial$ = centerPath$.pipe(
    map(centerPath => `${centerPath}/db/serial`),
    mergeMap(serialFile => readFileAsync(serialFile)),
    map(buf => buf.toString('utf8').trim()), // 'BARZ' -> 186
    map(hex => {
      return {
        dec: parseInt(hex, 16),
        hex,
      }
    }),
  )

  const ret$ = serial$.pipe(
    tap(({ dec, hex }) => {
      if (typeof dec !== 'number' || ! dec || dec < 1) {
        throw new Error(`retrive nextSerial failed nextDec not typeof number or invalid.
      value: "${hex}", Dec: ${dec}`)
      }
      if (!Number.isSafeInteger(dec)) {
        throw new Error(`retrive nextSerial failed. not save integer. value: "${hex}", Dec: ${dec}`)
      }
      if (hex.replace(/^0+/, '').toLocaleLowerCase() !== dec.toString(16)) {
        throw new Error(`retrive nextSerial failed or invalid.
      hex formatted: "${ hex.replace(/^0+/, '').toLocaleLowerCase()}",
      Dec to hex: ${ dec.toString(16)}`)
      }
    }),
    map(({ hex }) => {
      return hex
    }),
  )

  return ret$
}


/** Copy .config to path ./center */
async function initOpensslConfig(configName: string, centerPath: string) {
  const src = join(initialConfig.appDir, 'asset', configName)
  const target = join(centerPath, configName)
  return copyFileAsync(src, target)
}


/** Create defaultCenterPath and center folders/files, return centerPath */
export function initDefaultCenter(): Observable<Config['defaultCenterPath']> {
  const centerName = 'default'
  const centerPathErr$ = getCenterPath(centerName).pipe(
    tap(path => {
      throw new Error(`default center initialized already. path: "${path}"`)
    }),
  )
  const inited$ = isCenterInited(centerName).pipe(
    mergeMap(exists => exists ? centerPathErr$ : of(void 0)),
  )
  // create default ca dir under userHome
  const dir$ = createDir(initialConfig.defaultCenterPath)
  // must before createCenter()
  const list$ = defer(() => createCenterListFile(join(initialConfig.defaultCenterPath, initialConfig.centerListName)))
  // create default cneter dir under userHome
  const center$ = createCenter(initialConfig, centerName, initialConfig.defaultCenterPath)

  const ret$ = concat(
    inited$,
    dir$,
    list$,
    center$,
  ).pipe(
    last(),
    mapTo(initialConfig.defaultCenterPath),
  )

  return ret$
}


/** Create center path and folders/files, return center path */
export function initCenter(centerName: string, path: string): Observable<string> {
  const centerName$ = of(centerName).pipe(
    tap(name => {
      if (name === 'default') {
        throw new Error('Calling method of initDefaultCenter() to init default center')
      }
    }),
    mergeMap(() => EMPTY),
  )
  const defaultInitedValid$ = isCenterInited('default').pipe(
    tap(inited => {
      if (! inited) {
        throw new Error('default center must be initialized first')
      }
    }),
    mergeMap(() => EMPTY),
  )
  const inited$ = getCenterPath(centerName).pipe(
    tap(p => {
      if (p) {
        throw new Error(`Center of "${centerName}" initialized already. path: "${p}"`)
      }
    }),
    mergeMap(() => EMPTY),
  )

  const validDirs$ = of(
    initialConfig.dbDir,
    initialConfig.serverDir,
    initialConfig.clientDir,
    initialConfig.dbCertsDir,
  ).pipe(
    mergeMap(dirExists),
    tap(dir => {
      if (dir) {
        throw new Error(`Folder(s) exists already during initCenter: ${dir}`)
      }
    }),
    mergeMap(() => EMPTY),
  )

  const valid$ = merge(
    centerName$,
    defaultInitedValid$,
    inited$,
    validDirs$,
  )
  const ret$ = concat(
    valid$,
    // create default ca dir under userHome
    createDir(path),
    // create default cneter dir under userHome
    createCenter(initialConfig, centerName, path),
  ).pipe(
    last(),
    map(() => normalize(path)),
  )

  return ret$
}


/**
 * Check whether specified cenerName initialized.
 * Return center path, blank if not initialized yet
 */
export function isCenterInited(centerName: string): Observable<boolean> {
  /* istanbul ignore next */
  if (! centerName) {
    throw new Error('value of path param invalid')
  }
  const ret$ = getCenterPath(centerName).pipe(
    concatMap(centerPath => {
      if (!centerPath) {
        return of(false)
      }
      else {
        const path$ = defer(() => isDirExists(centerPath)).pipe(
          map(exists => {
            return exists ? true : false
          }),
        )
        return path$
      }
    }),
  )

  return ret$
}


/** Create center dirs to store output certifacates */
function createCenter(config: Config, centerName: string, path: string): Observable<string> {
  const folders: string[] = [config.dbDir, config.serverDir, config.clientDir, config.dbCertsDir]
  path = normalize(path)

  /* istanbul ignore next */
  if (! centerName) {
    throw new Error('value of centerName invalid')
  }

  const inited$ = isCenterInited(centerName).pipe(
    concatMap(inited => {
      return inited
        ? of(path)
        : createDir(path)
    }),
  )
  const createDirs$ = ofrom(folders).pipe(
    // must concatMap !
    concatMap(folder => {
      const dir = `${path}/${folder}`
      return dirExists(dir).pipe(
        concatMap(exists => exists ? of(void 0) : createDir(dir)),
        mapTo(void 0),
      )
    }),
  )

  const ret$ = concat(
    inited$,
    createDirs$,
    defer(() => initDbFiles(config, path, initialDbFiles)),
    addCenterList(config, centerName, path),
    defer(() => initOpensslConfig(config.configName, path)),
  )
    .pipe(
      last(),
      mapTo(path),
    )

  return ret$
}

async function createCenterListFile(file: string): Promise<void> {
  if (await isFileExists(file)) {
    throw new Error(`CenterList file exists. path: "${file}"`)
  }
  else {
    await createFileAsync(file, '')
  }
}



async function initDbFiles(config: Config, path: string, files: InitialFile[]): Promise<void> {
  const db = `${path}/${config.dbDir}`

  if (! path) {
    throw new Error('value of path empty initDbFiles()')
  }
  if (! files || ! Array.isArray(files) || ! files.length) {
    throw new Error('value of param files empty initDbFiles()')
  }

  for (const file of files) {
    if (! file.name) {
      throw new Error('file name empty within initDbFiles()')
    }
    /* istanbul ignore next */
    if (typeof file.defaultValue === 'undefined') {
      throw new Error('file defaultValue empty')
    }
    if (typeof file.defaultValue !== 'string' && typeof file.defaultValue !== 'number') {
      throw new Error('file defaultValue invalid, must be typeof string or number')
    }
    await createFileAsync(`${db}/${file.name}`, file.defaultValue, (file.mode ? { mode: file.mode } : {}))
  }
}


function addCenterList(config: Config, key: string, path: string): Observable<void> {
  if (!key || !path) {
    throw new Error('addCenterList() params key or path is invalid')
  }
  // const centerList = await loadCenterList(config) || <CenterList> {}
  const centerList$ = loadCenterList(config).pipe(
    map(centerList => centerList ? centerList : <CenterList> {}),
  )
  const ret$ = forkJoin(
    of({
      k: key,
      p: path,
      defaultCenterPath: config.defaultCenterPath,
      centerListName: config.centerListName,
    }),
    centerList$,
  ).pipe(
    mergeMap(([{ centerListName, defaultCenterPath , k, p }, centerList]) => {
      const file = `${defaultCenterPath}/${centerListName}` // center-list.json
      p = normalize(p)
      if (centerList[k]) {
        throw new Error(`center list exists already, can not create more. key: "${k}",
      path: "${p}", target: "${p}"`)
      }
      else {
        centerList[k] = p
        return writeFileAsync(file, JSON.stringify(centerList))
      }
    }),
  )

  return ret$
}


function loadCenterList(config: Config): Observable<CenterList | null> {
  const file$ = of(`${config.defaultCenterPath}/${config.centerListName}`)
    .pipe(
      mergeMap(file => {
        return defer(() => isFileExists(file)).pipe(
          tap(exists => {
            if (!exists) {
              throw new Error(`center file not exists. path: "${file}"`)
            }
          }),
          mapTo(file),
        )
      }),
    )
  const ret$ = file$.pipe(
    mergeMap(file => readFileAsync(file)),
    map((buf: Buffer) => {
      const json = buf.toString()
      return (typeof json === 'string' && json) ? <CenterList> JSON.parse(json) : null
    }),
  )

  return ret$
}


export function getCenterPath(centerName: string | void): Observable<string> {
  /* istanbul ignore else */
  if (! centerName) {
    return of('')
  }
  else if (centerName === 'default') {
    return of(initialConfig.defaultCenterPath)
  }

  const ret$ = loadCenterList(initialConfig).pipe(
    map(centerList => {
      return typeof centerList === 'object' && centerList
        ? centerList[centerName]
        : ''
    }),
  )
  return ret$
}
