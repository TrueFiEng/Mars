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

      const useMultisig = config.networkName === 'rinkeby'
      // this is no beauty and indicates our definition and execution pipelines lack information passing, to be improv.
      const proxyCreationPhase = true

      // CREATION Multisig
      const creationMultisig = useMultisig ? multisig('Contract creation, proxying and initialization') : undefined
      const proxy = createProxy(UpgradeabilityProxy)
      const impl = contract('impl', UpgradeableContract)
      const proxied = proxy(impl, {
        onInitialize: 'initialize',
        params: [112233],
        noImplUpgrade: proxyCreationPhase,
      })
      creationMultisig?.propose()

      // CONDITIONAL INIT Multisig
      const conditionalInitMultisig = useMultisig ? multisig('Conditional init') : undefined
      debug(`X value: ${proxied.x()}`)
      runIf(proxied.x().equals(112233), () => {
        proxied.resetTo(102030)
      })
      conditionalInitMultisig?.propose()
    })
  })

  it('Approves off-chain a proposed Safe transaction', async () => {
    const safeTxHashToApprove = '0x85eeadd56b7893766c68c699dfe1649c03bff90c3a43630f5918e331e559ce43'

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
