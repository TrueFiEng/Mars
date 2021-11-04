import { BigNumber } from 'ethers'
import Ganache from "ganache-core";

export interface Options {
  privateKey?: string
  network?: string | Ganache.Provider
  infuraApiKey?: string
  alchemyApiKey?: string
  outputFile?: string
  gasPrice?: BigNumber
  dryRun?: boolean
  fromAddress?: string
  logFile?: string
  noConfirm?: boolean
  verify?: boolean
  flattenScript?: (contractName: string) => Promise<string>
  etherscanApiKey?: string
  sources?: string
  waffleConfig?: string
  dataPrintMode?: boolean
  disableCommandLineOptions?: boolean
}
