import {
  closeAsync,
  getCenterPath,
  openAsync,
  readFileAsync,
  writeAsync } from './common'
import { Config } from './model'


// return new serial HEX string
export async function nextSerial(centerName: string, config: Config): Promise<string> {
  const centerPath = await getCenterPath(centerName)
  const serialFile = `${centerPath}/db/serial`

  if ( ! centerPath) {
    return Promise.reject(`centerPath not exists, centerName: "${centerName}"`)
  }
  const buf = await readFileAsync(serialFile)
  const nextHex = buf.toString('utf8').trim()
  const nextDec = parseInt(nextHex, 16)

  if (typeof nextDec !== 'number' || ! nextDec || ! Number.isSafeInteger(nextDec)) {
    throw new Error('retrive nextSerial failed or invalid. value: ' + nextDec)
  }
  return nextHex
}
