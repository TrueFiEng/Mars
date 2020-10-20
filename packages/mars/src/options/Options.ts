import { BigNumber } from 'ethers'

export interface Options {
  network?: string
  outputFile?: string
  dryRun?: boolean
  privateKey?: string
  gasPrice?: BigNumber
  noConfirm?: boolean
  etherscanApiKey?: string
  infuraApiKey?: string
  alchemyApiKey?: string
  waffleConfigPath?: string
}
