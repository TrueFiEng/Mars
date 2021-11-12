import { BigNumber } from 'ethers'
import type Ganache from 'ganache-core'

export interface Options {
  /**
   * Private key of the account to be used to sign deployment transactions.
   */
  privateKey?: string
  /**
   * A name or a URL or a provider instance (connection) of the ethereum blockchain network.
   * If this is a name, then it is used to locate an ethereum network in one of the services (Infura, Alchemy etc.)
   * If this is a URL or a provider instance, then it is used to construct an RPC provider to an existing network node.
   */
  network?: string | Ganache.Provider
  /**
   * API key to Infura service. See: https://infura.io/
   */
  infuraApiKey?: string
  /**
   * API key to Alchemy service. See: https://www.alchemy.com/
   */
  alchemyApiKey?: string
  outputFile?: string
  gasPrice?: BigNumber
  /***
   * If true then it forks an existing chain locally and executes the deployment on such.
   * Equivalent to Ganache's 'fork' option.
   */
  dryRun?: boolean
  /**
   * Specifies an address of the account to be used as deployment transaction signer. To be used with 'dryRun' to unlock
   * an account without knowing its private key. Equivalent to Ganache's unlocked_accounts.
   */
  fromAddress?: string
  logFile?: string
  noConfirm?: boolean
  verify?: boolean
  flattenScript?: (contractName: string) => Promise<string>
  etherscanApiKey?: string
  sources?: string
  waffleConfig?: string
  dataPrintMode?: boolean
  /***
   * Disables collecting options from the command line program invocation. Useful in running end-2-end tests with mocha.
   */
  disableCommandLineOptions?: boolean
}
