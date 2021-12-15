import { Contract, ethers, providers, Signer } from 'ethers'
import Safe, { EthersAdapter } from '@gnosis.pm/safe-core-sdk'
import SafeServiceClient from '@gnosis.pm/safe-service-client'
import { SafeTransaction, SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'
import { getDeployTx } from '../../src/execute/getDeployTx'
import { UpgradeableContract } from '../fixtures/exampleArtifacts'
import { AbiSymbol, Bytecode } from '../../src/symbols'
import { ContractDeployer } from '../../src/multisig/gnosis/contractDeployer'
import { expect } from 'chai'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Contract__JSON = require('./../build/UpgradeableContract.json')

const config = {
  txServiceUri: 'https://safe-transaction.rinkeby.gnosis.io', // Rinkeby Gnosis Transaction Service URI
  infuraApiKey: process.env.INFURA_KEY as string, // infura.io project id
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
    deployer = new ContractDeployer(web3Provider.network.chainId)
    owner = new ethers.Wallet(config.owner.privateKey, web3Provider)
    delegate = new ethers.Wallet(config.delegate.privateKey, web3Provider)
    safeByOwner = await Safe.create({
      ethAdapter: new EthersAdapter({ ethers, signer: owner }),
      safeAddress: config.ttSafe,
    })
    safeByDelegate = await Safe.create({
      ethAdapter: new EthersAdapter({ ethers, signer: delegate }),
      safeAddress: config.ttSafe,
    })
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

    const { safeMultisigTx: safeDeploymentTx, safeMultisigTxHash: safeDeploymentTxHash } = await proposeInSafe(
      deploymentTx
    )
    await confirmInSafe(safeDeploymentTxHash)
    await executeInSafe(safeDeploymentTx)

    // Contract interaction using a separate multisig workflow
    const contract = new Contract(address, Contract__JSON.abi, delegate)
    const rawInteractionTx = await contract.populateTransaction.initialize(11223344)
    const { safeMultisigTx: safeInteractionTx, safeMultisigTxHash: safeInteractionTxHash } = await proposeInSafe(
      rawInteractionTx
    )
    await confirmInSafe(safeInteractionTxHash)
    await executeInSafe(safeInteractionTx)

    // Asserts: call the deployed and initialized contract off-multisig to examine availability and state
    const actual = await contract.x()
    expect(actual.toNumber()).to.be.equal(11223344)
  })

  it('Multisig batched transactions to do as much work in a single shot of approvals and execution', async () => {
    const bytecode = UpgradeableContract[Bytecode]
    const directDeploymentTx = getDeployTx(UpgradeableContract[AbiSymbol], bytecode, [])
    const { transaction: deploymentTx, address } = await deployer.createDeploymentTx(directDeploymentTx, bytecode)
    console.log(`Pre-computed address of the contract to be deployed: ${address}`)
    const contract = new Contract(address, Contract__JSON.abi, delegate)
    const interactionTx = await contract.populateTransaction.initialize(11223344)

    // See: here we propose a batch of 1) deployment and 2) contract interaction
    const { safeMultisigTx, safeMultisigTxHash } = await proposeInSafe([deploymentTx, interactionTx])
    await confirmInSafe(safeMultisigTxHash)
    await executeInSafe(safeMultisigTx)

    // Asserts: call the deployed and initialized contract off-multisig to examine availability and state
    const actual = await contract.x()
    expect(actual.toNumber()).to.be.equal(11223344)
  })

  describe('Utility pieces that can be called separately for diagnostic or debugging', () => {
    it("Get safe's latest transactions", async () => {
      const multisigTransactions = await safeServiceClient.getMultisigTransactions(safeByOwner.getAddress())
      multisigTransactions.results.forEach((tx) => {
        console.log('=====================================================================')
        console.log(`TX ${tx.transactionHash}`)
        console.log('=====================================================================')
        console.log(JSON.stringify(tx, null, 2))
      })
    })
  })

  async function proposeInSafe(
    tx: providers.TransactionRequest | providers.TransactionRequest[]
  ): Promise<{ safeMultisigTx: SafeTransaction; safeMultisigTxHash: string }> {
    const txs = Array.isArray(tx) ? tx : [tx]
    const safeMultisigParts: SafeTransactionDataPartial[] = txs.map(
      (tx) =>
        ({
          to: tx.to,
          data: tx.data,
          value: tx.value?.toString() ?? '0',
        } as SafeTransactionDataPartial)
    )
    const safeMultisigTx = await safeByDelegate.createTransaction(safeMultisigParts)
    const safeMultisigTxHash = await safeByDelegate.getTransactionHash(safeMultisigTx)
    await safeServiceClient.proposeTransaction({
      safeAddress: safeByDelegate.getAddress(),
      safeTxHash: safeMultisigTxHash,
      safeTransaction: safeMultisigTx,
      senderAddress: await delegate.getAddress(),
    })
    console.log(`Safe transaction proposed successfully: tx hash = ${safeMultisigTxHash}`)
    return { safeMultisigTx, safeMultisigTxHash }
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
