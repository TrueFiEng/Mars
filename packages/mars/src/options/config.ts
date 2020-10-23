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

  const { wallet, networkName } = await getWallet(options)
  const gasPrice = merged.gasPrice ?? (await wallet.provider.getGasPrice())

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

async function getWallet(options: Options) {
  const { network, infuraApiKey, alchemyApiKey, dryRun, privateKey } = options
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

  let wallet
  if (dryRun) {
    const randomWallet = Wallet.createRandom()
    const ganache = Ganache.provider({
      fork: rpcUrl,
      accounts: [{ balance: '10000000000000000000000000000000000', secretKey: randomWallet.privateKey }],
    })
    const provider = new providers.Web3Provider(ganache as any)
    wallet = new Wallet(privateKey ?? randomWallet, provider)
  } else {
    const provider = new providers.JsonRpcProvider(rpcUrl)
    if (privateKey === undefined) {
      exit('No private key specified.')
    }
    wallet = new Wallet(privateKey, provider)
  }

  const networkName = network.startsWith('http') ? (await wallet.provider.getNetwork()).name : network
  return { wallet, networkName }
}
