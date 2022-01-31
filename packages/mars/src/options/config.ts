/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { providers, Signer, Wallet } from 'ethers'
import Ganache from 'ganache-core'
import { ExecuteOptions } from '../execute/execute'
import { createJsonInputs } from '../verification'
import { exit } from './checks'
import { getCommandLineOptions } from './cli'
import { getDefaultOptions } from './defaults'
import { getEnvironmentOptions } from './environment'
import { Options } from './Options'
import { ensureMultisigConfig } from '../multisig/multisigConfig'
import { logConfig } from '../logging'
import { networks } from './chain'

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

  const { signer, networkName, multisigSigner } = await getSigner(merged)
  const gasPrice = merged.gasPrice ?? (await signer.getGasPrice())

  const multisig = merged.multisig
    ? ensureMultisigConfig({
        // @typescript-eslint/no-non-null-assertion
        networkChainId: (await multisigSigner!.provider!.getNetwork()).chainId,
        gnosisSafeAddress: merged.multisigGnosisSafe,
        gnosisServiceUri: merged.multisigGnosisServiceUri,
        multisigSigner: multisigSigner,
      })
    : undefined

  logConfig.mode.file = !!merged.logFile
  logConfig.filepath = merged.logFile ?? ''

  return {
    gasPrice,
    noConfirm: !!merged.noConfirm,
    signer,
    provider: <providers.Provider>signer.provider,
    networkName: networkName,
    dryRun: !!merged.dryRun,
    logFile: merged.logFile ?? '',
    deploymentsFile: merged.outputFile,
    verification,
    multisig,
  }
}

function isNetworkProvider(network: string | Ganache.Provider): network is Ganache.Provider {
  return !!network && typeof network === 'object' && (network as Ganache.Provider).send !== undefined
}

// Refactoring candidate - https://github.com/EthWorks/Mars/issues/50
// signer returned here has non-empty provider
async function getSigner(options: Options) {
  const { network, infuraApiKey, alchemyApiKey, dryRun, fromAddress, privateKey, multisig } = options
  if (network === undefined) {
    throw new Error('No network specified. This should never happen.')
  }
  let rpcUrl: string | undefined
  let provider: providers.JsonRpcProvider | undefined

  if (isNetworkProvider(network)) {
    // this causes 'MaxListenersExceededWarning: Possible EventEmitter memory leak detected.' when many contracts in use
    // details at https://github.com/ChainSafe/web3.js/issues/1648
    provider = new providers.Web3Provider(network as any)
  } else if (network.startsWith('http')) {
    rpcUrl = network
  } else if (alchemyApiKey) {
    rpcUrl = networks[network]?.getAlchemyRPC(alchemyApiKey)
  } else if (infuraApiKey) {
    rpcUrl = networks[network]?.getInfuraRPC(infuraApiKey)
  } else {
    rpcUrl = networks[network]?.getPublicRPC()
  }

  let signer: Signer
  let multisigSigner: Signer | undefined
  if (multisig) {
    if (privateKey === undefined) {
      exit('No private key specified. In dry-run multisig a private key must be provided')
    }
    const multisigProvider = provider ?? new providers.JsonRpcProvider(rpcUrl)
    multisigSigner = new Wallet(privateKey, multisigProvider)
    const ganache = Ganache.provider({
      fork: rpcUrl,
    })
    provider = new providers.Web3Provider(ganache as any)
    signer = new Wallet(privateKey, provider)
  } else if (dryRun) {
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
    isNetworkProvider(network) || network.startsWith('http') ? (await provider.getNetwork()).name : network
  return { signer, networkName, multisigSigner }
}
