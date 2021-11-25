import {ethers, providers, Signer} from 'ethers'
import Safe, {EthersAdapter} from '@gnosis.pm/safe-core-sdk'
import SafeServiceClient from "@gnosis.pm/safe-service-client";
import {OperationType, SafeTransactionDataPartial} from '@gnosis.pm/safe-core-sdk-types'
import {getDeployTx} from "../../src/execute/getDeployTx";
import {SimpleContract} from "../fixtures/exampleArtifacts";
import {AbiSymbol, Bytecode} from "../../src/symbols";

const config = {
  txServiceUri: 'https://safe-transaction.rinkeby.gnosis.io', // Rinkeby Gnosis Transaction Service URI
  infuraApiKey: '2d765c7dfe354b56bf2fc3cc03a8c34d', // marcin's created infura free tier subscription
  ethNetworkName: 'rinkeby', // in TT we test Gnosis Safes in Rinkeby
  ttSafe: '0x8772CD484C059EC5c61459a0abb5A45ece16701f', // TT Rinkeby Test Safe
  owner: { // one of many owners of the TT Test Safe
    address: '0x4a70cc993A25F0D57Fb37B8E8D5C7CcC0B24Cd7d',
    privateKey: process.env.OWNER_PRIVATE_KEY as string
  },
  delegate: { // one of the delegates
    address: '0x48A1B8fF5cEa06D95187f9A1B528D0c90554A179',
    privateKey: process.env.DELEGATE_PRIVATE_KEY as string
  }
}

// based on https://docs.gnosis-safe.io/build/sdks/core-sdk
describe("Gnosis Safe as multisig contract deployment service in Rinkeby", () => {
  let safeServiceClient: SafeServiceClient
  let owner: Signer
  let delegate: Signer
  let safeByOwner: Safe // safe managed via the owner account
  let safeByDelegate: Safe // safe managed via the delegate account

  beforeEach(async () => {
    safeServiceClient = new SafeServiceClient(config.txServiceUri)
    const web3Provider = new providers.InfuraProvider(config.ethNetworkName, config.infuraApiKey)
    owner = new ethers.Wallet(config.owner.privateKey, web3Provider)
    delegate = new ethers.Wallet(config.delegate.privateKey, web3Provider)
    safeByOwner = await Safe.create({
      ethAdapter: new EthersAdapter({ethers, signer: owner}),
      safeAddress: config.ttSafe
    })
    await safeByOwner.connect({})
    safeByDelegate = await Safe.create({
      ethAdapter: new EthersAdapter({ethers, signer: delegate}),
      safeAddress: config.ttSafe
    })
    await safeByDelegate.connect({})
  })

  it("Prints address and owners", async () => {
    const address = safeByOwner.getAddress()
    console.log(`Address: ${address}`)

    const owners = await safeByOwner.getOwners()
    console.log('Owners:')
    owners.map(owner => console.log(owner))
  })

  it('Adds a delegate if not already assigned', async () => {
    const delegateAddress = await delegate.getAddress()
    const delegates = (await safeServiceClient.getSafeDelegates(config.ttSafe))?.results ?? []

    if (!delegates.some(d => d.delegate === delegateAddress)) {
      const addedDelegate = await safeServiceClient.addSafeDelegate({
        safe: config.ttSafe,
        delegate: delegateAddress,
        signer: owner,
        label: 'marcin\'s delegate'
      })

      console.log(`Delegate add signature: ${addedDelegate.signature}`)
    }

    console.log('Delegates:')
    delegates.map(d => console.log(`${d.delegate} (${d.label}) added by ${d.delegator}`))
  })

  it('Enqueues a simple contract deployment transaction by a delegate', async () => {
    const simpleContractDeploymentTx = getDeployTx(SimpleContract[AbiSymbol], SimpleContract[Bytecode], [])

    const safeDeploymentTx: SafeTransactionDataPartial = {
      data: simpleContractDeploymentTx.data as string,
      safeTxGas: 80000000
    } as SafeTransactionDataPartial
    const safeTransaction = await safeByOwner.createTransaction(safeDeploymentTx)
    const safeTransactionHash = await safeByOwner.getTransactionHash(safeTransaction)
    await safeServiceClient.proposeTransaction({
      safeAddress: safeByOwner.getAddress(),
      safeTxHash: safeTransactionHash,
      safeTransaction,
      senderAddress: await owner.getAddress()
    })

    console.log(`Simple contract deployment via Safe tx hash: ${safeTransactionHash}`)
  })

  it('Find tx details', async () => {
    const t = await safeServiceClient.getTransaction('0x683fe944de35598048d190a7e39932c0d4b8036805c859eaa1d4f224e8b07dfa')
    const pending = await safeServiceClient.getPendingTransactions(safeByOwner.getAddress())

    const approvalResult = await safeByOwner.approveTransactionHash(t.safeTxHash)
    //safeByOwner.executeTransaction()
  })
})


