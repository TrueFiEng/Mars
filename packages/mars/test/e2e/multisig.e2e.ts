import { UpgradeabilityProxy, UpgradeableContract } from '../fixtures/exampleArtifacts'
import { logConfig } from '../../src/logging'
import { contract, createProxy, debug, deploy, Options, runIf } from '../../src'
import { multisig } from '../../src/syntax/multisig'
import SafeServiceClient from '@gnosis.pm/safe-service-client'
import { ethers, providers } from 'ethers'
import Safe, { EthersAdapter } from '@gnosis.pm/safe-core-sdk'
import { expect } from 'chai'

const options = {
  network: 'rinkeby',
  privateKey: process.env.PRIVATE_KEY,
  infuraApiKey: process.env.INFURA_KEY,
  multisigGnosisSafe: '0x8772CD484C059EC5c61459a0abb5A45ece16701f',
  multisigGnosisServiceUri: 'https://safe-transaction.rinkeby.gnosis.io',
  disableCommandLineOptions: true,
  noConfirm: true,
} as Options
logConfig.mode.console = true

describe('Multisig', () => {
  it('Executes multisigs in separate runs', async () => {
    await deploy(options, (deployer, config) => {
      debug(`Deployer is ${deployer}`)

      const useMultisig = false //config.networkName === 'rinkeby'

      // CREATION Multisig
      const creationMultisig = useMultisig ? multisig('Contract creation, proxying and initialization') : undefined
      const proxy = createProxy(UpgradeabilityProxy)
      const impl = contract('impl', UpgradeableContract)
      const proxied = proxy(impl)
      creationMultisig?.propose()

      // INIT Multisig
      const initMultisig = useMultisig ? multisig('Contract init') : undefined
      proxied.initialize(112233)
      initMultisig?.propose()

      // CONDITIONAL INIT Multisig
      const conditionalInitMultisig = useMultisig ? multisig('Conditional conditional init') : undefined
      runIf(proxied.x().equals(112233), () => {
        proxied.initialize(2244)
      })
      conditionalInitMultisig?.propose()
    })
  })

  it('Approves off-chain a proposed Safe transaction', async () => {
    const safeTxHashToApprove = '0x721272a0429dadb60968cfbf4304606ad6cd70c22543dd1414ae8bb3ef093b22'

    const safeServiceClient = new SafeServiceClient(options.multisigGnosisServiceUri!)
    const web3Provider = new providers.InfuraProvider(options.network!.toString(), options!.infuraApiKey)
    const signer = new ethers.Wallet(options.privateKey!, web3Provider)
    const safe = await Safe.create({
      ethAdapter: new EthersAdapter({ ethers, signer }),
      safeAddress: options.multisigGnosisSafe!,
    })

    const confirmationSignature = await safe.signTransactionHash(safeTxHashToApprove)
    const confirmationResponse = await safeServiceClient.confirmTransaction(
      safeTxHashToApprove,
      confirmationSignature.data
    )

    expect(confirmationResponse.signature).not.null
  })
})
