import fs from 'fs'
import { providers } from 'ethers'

// TODO: poor-man logging, think about using a lib
export interface ILogger {
  log(entry: string): void
}

export type LogMode = {
  console: boolean
  file: boolean
}

export const logConfig = {
  mode: {} as LogMode,
  filepath: '',
}

export interface TxLogData {
  hash?: string
  from: string
  to: string
  data: string
}

export function logTx(txName: string, tx: providers.TransactionRequest | providers.TransactionResponse | TxLogData) {
  log(`📕 Transaction: '${txName}' Hash: ${(tx as any).hash} From: ${tx.from} To: ${tx.to} Hex data: ${tx.data} `)
}

export function log(...args: string[]) {
  const argsJoined = args.join('\n')

  if (logConfig.mode.console) {
    console.log(argsJoined)
  }

  if (logConfig.mode.file && logConfig.filepath) {
    fs.appendFileSync(logConfig.filepath, argsJoined)
  }
}
