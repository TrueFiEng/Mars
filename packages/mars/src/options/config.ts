/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BigNumber, providers, Signer, Wallet } from 'ethers'
import Ganache, { Provider } from 'ganache'
import { ExecuteOptions } from '../execute/execute'
import { createJsonInputs } from '../verification'
import { exit } from './checks'
import { getCommandLineOptions } from './cli'
import { getDefaultOptions } from './defaults'
import { getEnvironmentOptions } from './environment'
import { Options } from './Options'
import { ensureMultisigConfig } from '../multisig/multisigConfig'
import { logConfig } from '../logging'
import { chains } from './chain'
import { JsonRpcProvider } from '@ethersproject/providers'

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

function isNetworkProvider(
  network: string | Provider | providers.JsonRpcProvider
): network is Provider | providers.JsonRpcProvider {
  return !!network && typeof network === 'object' && (network as Provider).send !== undefined
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

  if (JsonRpcProvider.isProvider(network)) {
    provider = network
  } else if (isNetworkProvider(network)) {
    // this causes 'MaxListenersExceededWarning: Possible EventEmitter memory leak detected.' when many contracts in use
    // details at https://github.com/ChainSafe/web3.js/issues/1648
    provider = new providers.Web3Provider(network as any)
  } else if (network.startsWith('http')) {
    rpcUrl = network
  } else if (alchemyApiKey) {
    rpcUrl = chains[network].getAlchemyRpc(alchemyApiKey)
  } else if (infuraApiKey) {
    rpcUrl = chains[network].getInfuraRpc(infuraApiKey)
  } else {
    rpcUrl = chains[network].getPublicRpc()
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
      fork: {
        url: rpcUrl,
      },
    })
    provider = new providers.Web3Provider(ganache as any)
    signer = new Wallet(privateKey, provider)
  } else if (dryRun) {
    const randomWallet = Wallet.createRandom()
    const ganache = Ganache.provider({
      fork:
        typeof network === 'string'
          ? {
              url: network,
            }
          : {
              provider: {
                request: async ({ method, params }) => {
                  const res = await network.send(method as any, params as any)
                  return res
                },
              },
            },
      unlocked_accounts: fromAddress ? [fromAddress] : [],
      accounts: [
        {
          balance: BigNumber.from('10000000000000000000000000000000000').toHexString(),
          secretKey: randomWallet.privateKey,
        },
      ],
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
