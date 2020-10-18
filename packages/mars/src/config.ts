import { providers, utils, Wallet } from 'ethers'
import { DeployOptions, parseDeployArgs } from './cli'
import { ExecuteOptions } from './execute/execute'
import { raise } from './util'
import Ganache from 'ganache-core'
import { createJsonInputs, JsonInputs } from './verification'

const DEFAULT_OPTIONS: Partial<ExecuteOptions> = {
  gasPrice: utils.parseUnits('10', 'gwei'),
  noConfirm: false,
}

function removeUndefinedKeys<T>(obj: T) {
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  }
}

function getWallet(options: DeployOptions) {
  const privateKey = process.env.PRIVATE_KEY

  if (options.dryRun) {
    if (!options.rpc) {
      throw new Error('RPC is required to create a fork during a cold run')
    }
    const randomWallet = Wallet.createRandom()
    const forkedProvider = new providers.Web3Provider(
      Ganache.provider({
        fork: options.rpc,
        accounts: [{ balance: '10000000000000000000000000000000000', secretKey: randomWallet.privateKey }],
      }) as any
    )

    if (privateKey) {
      return new Wallet(privateKey, forkedProvider as any)
    }
    return new Wallet(randomWallet.privateKey, forkedProvider as any)
  }
  const provider = options.rpc
    ? new providers.JsonRpcProvider(options.rpc)
    : providers.getDefaultProvider(options.network)
  return privateKey ? new Wallet(privateKey, provider) : undefined
}

async function getCliConfig(): Promise<Partial<ExecuteOptions>> {
  const args = parseDeployArgs()

  const wallet = getWallet(args)

  let verification:
    | {
        etherscanApiKey: string
        jsonInputs: JsonInputs
        waffleConfig: string
      }
    | undefined = undefined

  if (args.verify) {
    const etherscanApiKey = process.env.ETHERSCAN_KEY
    if (!etherscanApiKey) {
      throw new Error('Set Etherscan api key in ETHERSCAN_KEY env variable to verify contracts')
    }
    verification = {
      etherscanApiKey,
      jsonInputs: await createJsonInputs(args.sourcesPath),
      waffleConfig: args.waffle,
    }
  }

  const cliOptions: Partial<ExecuteOptions> = {
    wallet,
    network: args.network,
    gasPrice: args.gasPrice,
    noConfirm: args.yes,
    dryRun: args.dryRun,
    verification,
  }
  removeUndefinedKeys(cliOptions)
  return cliOptions
}

export async function getConfig(options: Partial<ExecuteOptions>): Promise<ExecuteOptions> {
  const cliOptions = await getCliConfig()
  const mergedOptions: Partial<ExecuteOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    ...cliOptions,
  }

  return {
    gasPrice: mergedOptions.gasPrice ?? raise(new Error('No gasPrice sepecified')),
    noConfirm: mergedOptions.dryRun || mergedOptions.noConfirm || false,
    wallet: mergedOptions.wallet ?? raise(new Error('No wallet specified')),
    network: mergedOptions.network ?? 'default',
    dryRun: mergedOptions.dryRun ?? false,
    deploymentsFile: './deployments.json', // TODO: configurable
    verification: mergedOptions.verification,
  }
}
