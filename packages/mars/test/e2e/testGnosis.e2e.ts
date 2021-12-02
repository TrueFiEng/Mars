import { Contract, ethers, providers, Signer } from 'ethers'
import Safe, { EthersAdapter } from '@gnosis.pm/safe-core-sdk'
import SafeServiceClient from '@gnosis.pm/safe-service-client'
import { SafeTransaction, SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'
import { getDeployTx } from '../../src/execute/getDeployTx'
import { UpgradeableContract } from '../fixtures/exampleArtifacts'
import { AbiSymbol, Bytecode } from '../../src/symbols'
import { ContractDeployer } from '../../src/gnosis/contractDeployer'
import { expect } from 'chai'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Contract__JSON = require('./../build/UpgradeableContract.json')

// TODO: convenient way to pass env variables for mocha
const config = {
  txServiceUri: 'https://safe-transaction.rinkeby.gnosis.io', // Rinkeby Gnosis Transaction Service URI
  // TODO: Fetch from env.
  infuraApiKey: '2d765c7dfe354b56bf2fc3cc03a8c34d', // marcin's created infura free tier subscription
  ethNetworkName: 'rinkeby', // in TT we test Gnosis Safes in Rinkeby
  ttSafe: '0x8772CD484C059EC5c61459a0abb5A45ece16701f', // TT Rinkeby Test Safe
  owner: {
    // one of many owners of the TT Test Safe
    address: '0x4a70cc993A25F0D57Fb37B8E8D5C7CcC0B24Cd7d',
    privateKey: process.env.OWNER_PRIVATE_KEY as string,
  },
  delegate: {
    // one of the delegates
    address: '0x48A1B8fF5cEa06D95187f9A1B528D0c90554A179',
    privateKey: process.env.DELEGATE_PRIVATE_KEY as string,
  },
}

// based on https://docs.gnosis-safe.io/build/sdks/core-sdk
describe('Gnosis Safe as multisig contract deployment and interaction service in Rinkeby', () => {
  let deployer: ContractDeployer
  let safeServiceClient: SafeServiceClient
  let owner: Signer
  let delegate: Signer
  let safeByOwner: Safe // safe managed via the owner account
  let safeByDelegate: Safe // safe managed via the delegate account

  beforeEach(async () => {
    safeServiceClient = new SafeServiceClient(config.txServiceUri)
    const web3Provider = new providers.InfuraProvider(config.ethNetworkName, config.infuraApiKey)
    deployer = new ContractDeployer(web3Provider)
    owner = new ethers.Wallet(config.owner.privateKey, web3Provider)
    delegate = new ethers.Wallet(config.delegate.privateKey, web3Provider)
    safeByOwner = await Safe.create({
      ethAdapter: new EthersAdapter({ ethers, signer: owner }),
      safeAddress: config.ttSafe,
    })
    await safeByOwner.connect({})
    safeByDelegate = await Safe.create({
      ethAdapter: new EthersAdapter({ ethers, signer: delegate }),
      safeAddress: config.ttSafe,
    })
    await safeByDelegate.connect({})
  })

  it('Prints Safe address and its owners', async () => {
    const address = safeByOwner.getAddress()
    console.log(`Address: ${address}`)

    const owners = await safeByOwner.getOwners()
    console.log('Owners:')
    owners.map((owner) => console.log(owner))
  })

  it('Adds a delegate if not already assigned', async () => {
    const delegateAddress = await delegate.getAddress()
    const delegates = (await safeServiceClient.getSafeDelegates(config.ttSafe))?.results ?? []

    if (!delegates.some((d) => d.delegate === delegateAddress)) {
      const addedDelegate = await safeServiceClient.addSafeDelegate({
        safe: config.ttSafe,
        delegate: delegateAddress,
        signer: owner,
        label: "marcin's delegate",
      })

      console.log(`Delegate ${addedDelegate} added.`)
    }

    console.log('Delegates:')
    delegates.map((d) => console.log(`${d.delegate} (${d.label}) added by ${d.delegator}`))
  })

  it("Multisig-deploys a contract and multisig-calls a contract's operation", async () => {
    // Contract deployment using multisig workflow
    const bytecode = UpgradeableContract[Bytecode]
    const directDeploymentTx = getDeployTx(UpgradeableContract[AbiSymbol], bytecode, [])
    const { transaction: deploymentTx, address } = await deployer.createDeploymentTx(directDeploymentTx, bytecode)
    console.log(`Pre-computed address of the contract to be deployed: ${address}`)

    const { safeTransaction: safeDeploymentTx, safeTransactionHash: safeDeploymentTxHash } = await proposeInSafe(
      deploymentTx
    )
    await confirmInSafe(safeDeploymentTxHash)
    await executeInSafe(safeDeploymentTx)

    // Contract interaction using a separate multisig workflow
    const contract = new Contract(address, Contract__JSON.abi, delegate)
    const rawInteractionTx = await contract.populateTransaction.initialize(11223344)
    const { safeTransaction: safeInteractionTx, safeTransactionHash: safeInteractionTxHash } = await proposeInSafe(
      rawInteractionTx
    )
    await confirmInSafe(safeInteractionTxHash)
    await executeInSafe(safeInteractionTx)

    // Asserts: call the deployed and initialized contract off-multisig to examine availability and state
    const actual = await contract.x()
    expect(actual).to.be.equal(11223344)
  })

  describe('Utility pieces that can be called separately for diagnostic or debugging', () => {
    it('Get Safe TX details', async () => {
      // EDIT THIS!
      const safeTxHash = '0xe8f81f77337535e7e058cf97f7f50633e70f914f8707b6e512ceb05b09541783'

      const tx = await safeServiceClient.getTransaction(safeTxHash)

      console.log(JSON.stringify(tx, null, 2))
    })
  })

  async function proposeInSafe(tx: providers.TransactionRequest) {
    const safeScriptTx: SafeTransactionDataPartial = {
      to: tx.to,
      data: tx.data,
      value: tx.value?.toString() ?? '0',
    } as SafeTransactionDataPartial
    const safeTransaction = await safeByDelegate.createTransaction(safeScriptTx)
    const safeTransactionHash = await safeByDelegate.getTransactionHash(safeTransaction)
    await safeServiceClient.proposeTransaction({
      safeAddress: safeByDelegate.getAddress(),
      safeTxHash: safeTransactionHash,
      safeTransaction: safeTransaction,
      senderAddress: await delegate.getAddress(),
    })
    console.log(`Safe transaction proposed successfully: tx hash = ${safeTransactionHash}`)
    return { safeTransaction, safeTransactionHash }
  }

  async function confirmInSafe(safeTransactionHash: string) {
    // Off-chain approve tx in Gnosis Transaction Service
    // for an on-chain approval, you need to interact with the contract via the safe sdk (not the service client)
    const confirmationSignature = await safeByOwner.signTransactionHash(safeTransactionHash)
    const confirmationResponse = await safeServiceClient.confirmTransaction(
      safeTransactionHash,
      confirmationSignature.data
    )
    console.log(
      `Confirmed off-chain by owner ${safeByOwner.getAddress()}. ` + `Signature is: ${confirmationResponse.signature}`
    )
  }

  async function executeInSafe(safeDeploymentTx: SafeTransaction) {
    // Execute transaction
    const executionResult = await safeByOwner.executeTransaction(safeDeploymentTx)
    console.log(`Executing... (tx hash: ${executionResult.hash})`)
    await executionResult.transactionResponse?.wait()
    console.log(`Executed (tx hash ${executionResult.hash}) in the network!`)
  }
})
