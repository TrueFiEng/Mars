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
  flattenScript?: (contractName: string) => Promise<string>
  etherscanApiKey?: string
  sources?: string
  waffleConfig?: string
  dataPrintMode?: boolean
}
