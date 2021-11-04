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
    ...options,
    ...getEnvironmentOptions(),
    ...(options.disableCommandLineOptions ? false : getCommandLineOptions()),
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
      flattenScript: merged.flattenScript,
    }
  }

  const { signer, networkName } = await getSigner(merged)
  const gasPrice = merged.gasPrice ?? (await signer.getGasPrice())

  return {
    gasPrice,
    noConfirm: !!merged.noConfirm,
    signer,
    networkName: networkName,
    dryRun: !!merged.dryRun,
    logFile: merged.logFile ?? '',
    deploymentsFile: merged.outputFile,
    verification,
  }
}

async function getSigner(options: Options) {
  const { network, infuraApiKey, alchemyApiKey, dryRun, fromAddress, privateKey } = options
  if (network === undefined) {
    throw new Error('No network specified. This should never happen.')
  }
  let rpcUrl
  let provider
  if (typeof network === 'object') {
    provider = new providers.Web3Provider(network as any)
  } else if (network.startsWith('http')) {
    rpcUrl = network
  } else if (alchemyApiKey) {
    rpcUrl = `https://eth-${network}.alchemyapi.io/v2/${alchemyApiKey}`
  } else if (infuraApiKey) {
    rpcUrl = `https://${network}.infura.io/v3/${infuraApiKey}`
  } else {
    throw new Error('Cannot construct rpc url. This should never happen.')
  }

  let signer
  if (dryRun) {
    const randomWallet = Wallet.createRandom()
    const ganache = Ganache.provider({
      fork: network ?? rpcUrl,
      unlocked_accounts: fromAddress ? [fromAddress] : [],
      accounts: [{ balance: '10000000000000000000000000000000000', secretKey: randomWallet.privateKey }],
    })
    provider = new providers.Web3Provider(ganache as any)
    signer = fromAddress ? provider.getSigner(fromAddress) : new Wallet(privateKey ?? randomWallet, provider)
  } else {
    provider ??= new providers.JsonRpcProvider(rpcUrl)
    if (privateKey === undefined) {
      exit('No private key specified.')
    }
    signer = new Wallet(privateKey, provider)
  }

  const networkName =
    typeof network === 'object' || network.startsWith('http') ? (await signer.provider.getNetwork()).name : network
  return { signer: signer, networkName }
}
