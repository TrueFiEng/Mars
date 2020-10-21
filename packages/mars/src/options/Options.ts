import { BigNumber } from 'ethers'

export interface Options {
  privateKey?: string
  network?: string
  infuraApiKey?: string
  alchemyApiKey?: string
  outputFile?: string
  gasPrice?: BigNumber
  dryRun?: boolean
  noConfirm?: boolean
  verify?: boolean
  etherscanApiKey?: string
  sources?: string
  waffleConfig?: string
}
