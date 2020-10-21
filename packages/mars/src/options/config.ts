import { providers, Wallet } from 'ethers'
import Ganache from 'ganache-core'
import { ExecuteOptions } from '../execute/execute'
import { createJsonInputs } from '../verification'
import { exit } from './checks'
import { getCommandLineOptions } from './cli'
import { getDefaultOptions } from './defaults'
import { getEnvironmentOptions } from './environment'
import { Options } from './Options'

export async function getConfig(options: Options): Promise<ExecuteOptions> {
  const merged = {
    ...getDefaultOptions(),
    ...getEnvironmentOptions(),
    ...getCommandLineOptions(),
    ...options,
  }

  if (merged.dryRun && merged.noConfirm === undefined) {
    merged.noConfirm = true
  }

  let verification: ExecuteOptions['verification'] = undefined
  if (merged.verify) {
    verification = {
      etherscanApiKey: merged.etherscanApiKey,
      jsonInputs: await createJsonInputs(merged.sources),
      waffleConfig: merged.waffleConfig,
    }
  }

  const privateKey = merged.privateKey
  if (privateKey === undefined) {
    exit('No private key specified.')
  }
  const { provider, networkName } = await getProvider(options)
  const wallet = new Wallet(privateKey, provider)

  const gasPrice = merged.gasPrice ?? (await provider.getGasPrice())

  return {
    gasPrice,
    noConfirm: !!merged.noConfirm,
    wallet,
    network: networkName,
    dryRun: !!merged.dryRun,
    deploymentsFile: merged.outputFile,
    verification,
  }
}

async function getProvider(options: Options) {
  const { network, infuraApiKey, alchemyApiKey, dryRun } = options
  if (network === undefined) {
    throw new Error('No network specified. This should never happen.')
  }
  let rpcUrl
  if (network.startsWith('http')) {
    rpcUrl = network
  } else if (alchemyApiKey) {
    rpcUrl = `https://eth-${network}.alchemyapi.io/v2/${alchemyApiKey}`
  } else if (infuraApiKey) {
    rpcUrl = `https://${network}.infura.io/v3/${infuraApiKey}`
  } else {
    throw new Error('Cannot construct rpc url. This should never happen.')
  }

  let provider
  if (dryRun) {
    const randomWallet = Wallet.createRandom()
    const ganache = Ganache.provider({
      fork: rpcUrl,
      accounts: [{ balance: '10000000000000000000000000000000000', secretKey: randomWallet.privateKey }],
    })
    provider = new providers.Web3Provider(ganache as any)
  } else {
    provider = new providers.JsonRpcProvider(rpcUrl)
  }

  const networkName = network.startsWith('http') ? (await provider.getNetwork()).name : network

  return { provider, networkName }
}
