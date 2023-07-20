import assert from 'node:assert'
import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  fileShortPath,
  createDirAsync,
  isDirExists,
  isFileExists,
  sleep,
} from '@waiting/shared-core'

import * as myca from '../src/index.js'
import { addCenterList, createCenter, createCenterListFile, initDbFiles, loadCenterList } from '../src/lib/center.js'
import { removeCenterFiles } from '../src/lib/common.js'
import { initialDbFiles } from '../src/lib/config.js'

import { initialCaOpts, initialConfig, pathPrefix, tmpDir } from './root.config.js'


describe(fileShortPath(import.meta.url), () => {
  before(async () => {
    await createDirAsync(tmpDir)
  })
  beforeEach(async () => {
    const random = Math.random().toString()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`

    initialConfig.defaultCenterPath = `${randomPath}/${initialConfig.centerDirName}`
    await myca.initDefaultCenter()
  })
  afterEach(async () => {
    await sleep(100)
    await removeCenterFiles(initialConfig.defaultCenterPath)
  })


  it('Should getCenterPath() work', async () => {
    const path = await myca.getCenterPath('default')
    assert(path, 'getCenterPath("default") should return default path, but blank')

    const random = Math.random()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`

    await myca.initCenter(centerName, centerPath)
    const path2 = await myca.getCenterPath(centerName)
    assert(path2, `getCenterPath('${centerName}') should return not empty result, but EMPTY`)

    await rm(randomPath, { recursive: true, force: true })
  })

  it('Should getCenterPath() work with invalid param', async () => {
    const random = Math.random().toString()

    try {
      const centerPath = await myca.getCenterPath(random)
      centerPath && assert(false, 'getCenterPath() should return empty result with invalid centerName, but NOT')
    }
    catch (ex) {
      assert(true)
    }
  })


  it('Should createCenter() work', async () => {
    const random = Math.random().toString()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`

    await createCenter(initialConfig, centerName, centerPath)

    if (! await isDirExists(centerPath)) {
      return assert(false, `spcified center folder not exists, path: "${centerPath}"`)
    }
    await rm(randomPath, { recursive: true, force: true })
  })

  it('Should createCenter() work', async () => {
    const random = Math.random().toString()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`
    const folders: string[] = [
      initialConfig.dbDir,
      initialConfig.serverDir,
      initialConfig.clientDir,
      initialConfig.dbCertsDir,
    ]

    await createCenter(initialConfig, centerName, centerPath)

    for (const name of folders) {
      const dir = join(centerPath, name)

      if (! await isDirExists(dir)) {
        return assert(false, `spcified center folder not exists, path: "${dir}"`)
      }
    }
    await rm(randomPath, { recursive: true, force: true })
  })

  it('Should createCenter() work with invalid param', async () => {
    const random = Math.random()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`
    const folders: string[] = [
      initialConfig.dbDir,
      initialConfig.serverDir,
      initialConfig.clientDir,
      initialConfig.dbCertsDir,
    ]

    try {
      await createCenter(initialConfig, '', centerPath)
      assert(false, 'createCenter() should throw error with empty value of centerName, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of centerName invalid'))
    }

    for (const name of folders) {
      const dir = join(centerPath, name)
      if (await isDirExists(dir)) {
        assert(false, `spcified center folder should NOT exists, path: "${dir}"`)
      }
    }

    await rm(randomPath, { recursive: true, force: true })
  })

  it('Should createCenter() work with invalid param', async () => {
    const random = Math.random().toString()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`
    const folders: string[] = [
      initialConfig.dbDir,
      initialConfig.serverDir,
      initialConfig.clientDir,
      initialConfig.dbCertsDir,
    ]

    try {
      await createCenter(initialConfig, centerName, '')
      assert(false, 'createCenter() should throw error with empty value of path, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of path invalid'), ex.message)
    }

    for (const name of folders) {
      const dir = join(centerPath, name)
      if (await isDirExists(dir)) {
        assert(false, `spcified center folder should NOT exists, path: "${dir}"`)
      }
    }

    await rm(randomPath, { recursive: true, force: true })
  })


  it('Should createCenterListFile() work', async () => {
    const random = Math.random().toString()
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const randomFile = `${randomPath}/test`

    await createCenterListFile(randomFile)

    try {
      await createCenterListFile(randomFile)
      assert(false, `should throw error during create duplicate file, but NOT. file: "${randomFile}"`)
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('CenterList file exists'), ex.message)
    }

    await rm(randomPath, { recursive: true, force: true })
  })


  it('Should initDbFiles() work', async () => {
    const random = Math.random().toString()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const db = `${randomPath}/${initialConfig.dbDir}`
    const files = initialDbFiles

    await initDbFiles(initialConfig, randomPath, files)

    for (const file of files) {
      const path = `${db}/${file.name}`

      if (! await isFileExists(path)) {
        assert(false, `file not exists. path: "${path}"`)
      }
    }

    await rm(randomPath, { recursive: true, force: true })
  })

  it('Should initDbFiles() work without mode value', async () => {
    const random = Math.random().toString()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const db = `${randomPath}/${initialConfig.dbDir}`
    const files = [
      {
        name: 'serial',
        defaultValue: '01',
      },
      {
        name: 'index',
        defaultValue: '',
        mode: 0o644,
      },
    ]

    await initDbFiles(initialConfig, randomPath, files)

    for (const file of files) {
      const path = `${db}/${file.name}`

      if (! await isFileExists(path)) {
        assert(false, `file not exists. path: "${path}"`)
      }
    }

    await rm(randomPath, { recursive: true, force: true })
  })


  it('Should initDbFiles() work with invalid param', async () => {
    const random = Math.random().toString()
    // const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    // const db = `${randomPath}/${config.dbDir}`
    let files: myca.InitialFile[] = [ { name: '', defaultValue: '' } ]

    try {
      await initDbFiles(initialConfig, '', files)
      assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of path empty initDbFiles()'), ex.message)
    }

    try {
      await initDbFiles(initialConfig, randomPath, files)
      return assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('file name empty within initDbFiles()'), ex.message)
    }

    // files = [
    //   { name: 'test', defaultValue: null },
    // ]
    // try {
    //   await fn(initialConfig, randomPath, files)
    //   return assert(false, 'initDbFiles() should throw error, but NOT')
    // }
    // catch (ex) {
    //   assert(true)
    // }

    files = []
    try {
      await initDbFiles(initialConfig, randomPath, files)
      assert(false, 'initDbFiles() should throw error, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('value of param files invalid initDbFiles()'), ex.message)
    }

    await rm(randomPath, { recursive: true, force: true })
  })


  it('Should nextSerial() work', async () => {
    const serial = await myca.nextSerial('default')
    assert(serial === '01', `value of serial should be 01, but got: "${serial}"`)
  })

  it('Should nextSerial() work with blank centerName', async () => {
    try {
      const serial = await myca.nextSerial('')
      return assert(serial, 'should throw error, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('centerPath not exists, centerName: ""'), ex.message)
    }
  })

  it('Should nextSerial() work with reading invalid serial', async () => {
    const centerName = 'default'
    const centerPath = await myca.getCenterPath(centerName)
    const serialFile = `${centerPath}/db/serial`

    try {
      await writeFile(serialFile, 'BARZ', { encoding: 'utf-8' })
      const serial = await myca.nextSerial(centerName)
      return assert(false, `should throw error, but NOT. serial:"${serial}"`)
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('retrive nextSerial failed or invalid'), ex.message)
      assert(ex.message.includes('hex formatted: "barz"'), ex.message)
      assert(ex.message.includes('Dec to hex: ba'), ex.message)
    }
  })

  it('Should nextSerial() work with reading unsafe integer serial', async () => {
    const centerName = 'default'
    const centerPath = await myca.getCenterPath(centerName)
    const serialFile = `${centerPath}/db/serial`

    try {
      await writeFile(serialFile, Math.pow(2, 53).toString(16), 'utf-8')
      const serial = await myca.nextSerial(centerName)
      return assert(false, `should throw error, but NOT. serial:"${serial}"`)
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('retrive nextSerial failed'), ex.message)
      assert(ex.message.includes('value: "20000000000000"'), ex.message)
      assert(ex.message.includes('Dec: 9007199254740992'), ex.message)
    }
  })

  it('Should nextSerial() work with reading 0', async () => {
    const centerName = 'default'
    const centerPath = await myca.getCenterPath(centerName)
    const serialFile = `${centerPath}/db/serial`

    try {
      await writeFile(serialFile, '0', 'utf-8')
      const serial = await myca.nextSerial(centerName)
      assert(false, `should throw error, but NOT. serial:"${serial}"`)
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('retrive nextSerial failed nextDec not typeof number or invalid'), ex.message)
      assert(ex.message.includes('value: "0", Dec: 0'), ex.message)
    }
  })


  it('Should addCenterList() work', async () => {
    const random = Math.random().toString()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`

    await createDirAsync(centerPath)
    await addCenterList(initialConfig, centerName, centerPath)

    if (! await isDirExists(centerPath)) {
      return assert(false, `spcified center folder not exists, path: "${centerPath}"`)
    }

    await rm(randomPath, { recursive: true, force: true })
  })

  it('Should addCenterList() work with invalid param', async () => {
    const random = Math.random().toString()
    const centerName = `${pathPrefix}-${random}`
    const randomPath = `${tmpDir}/${pathPrefix}-${random}`
    const centerPath = `${randomPath}/${initialConfig.centerDirName}`

    await createDirAsync(centerPath)

    try {
      await addCenterList(initialConfig, '', centerPath)
      return assert(false, 'should throw error with blank centerName, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('key empty addCenterList()'), ex.message)
    }

    try {
      await addCenterList(initialConfig, centerName, '')
      return assert(false, 'should throw error with blank centerPath, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('path empty addCenterList()'), ex.message)
    }

    try {
      await addCenterList(initialConfig, 'default', centerPath)
      return assert(false, 'should throw error with blank centerPath, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('center list exists already'), ex.message)
      assert(ex.message.includes('can not create more. key: "default"'), ex.message)
      assert(ex.message.includes(centerPath), ex.message)
    }

    if (! await isDirExists(centerPath)) {
      return assert(false, `spcified center folder not exists, path: "${centerPath}"`)
    }

    await rm(randomPath, { recursive: true, force: true })
  })


  it('Should loadCenterList() work', async () => {
    const ret = await loadCenterList(initialConfig)
    if (! ret || ! ret.default) {
      assert(false, 'should return valid centerList object')
    }
  })


  // // --------------- at last

  it('Should loadCenterList() work without centerList file', async () => {
    const file = join(initialConfig.defaultCenterPath, initialConfig.centerListName)

    try {
      await rm(file, { recursive: true, force: true })
      await loadCenterList(initialConfig)
      assert(false, 'should throw error, but NOT')
    }
    catch (ex) {
      assert(ex instanceof Error)
      assert(ex.message.includes('center file not exists'), ex.message)
      assert(ex.message.includes(initialConfig.defaultCenterPath), ex.message)
    }
  })


})


