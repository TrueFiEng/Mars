import {ethers, providers} from 'ethers'
import Safe, { EthersAdapter } from '@gnosis.pm/safe-core-sdk'

// based on https://docs.gnosis-safe.io/build/sdks/core-sdk
describe("Gnosis Safe as multisig contract deployment service in Rinkeby", () => {
  const infuraApiKey = '2d765c7dfe354b56bf2fc3cc03a8c34d' // marcin's created infura free tier subscription
  const network = 'rinkeby' // in TT we test Gnosis Safes in Rinkeby
  const privateKey = process.env.PRIVATE_KEY
  const existingSafeAddress = '0x8772CD484C059EC5c61459a0abb5A45ece16701f'; // TT Rinkeby Test Safe

  let safeAdapter: EthersAdapter
  let safeSdk: Safe

  beforeEach(async () => {
    const web3Provider = new providers.InfuraProvider(network, infuraApiKey)
    const wallet = new ethers.Wallet(privateKey, web3Provider);
    const signer = wallet.connect(web3Provider);

    safeAdapter = new EthersAdapter({ethers, signer})
    safeSdk = await Safe.create({ ethAdapter: safeAdapter, safeAddress: existingSafeAddress })
    await safeSdk.connect({})
  })

  it("Prints address and owners", async () => {
    const address = safeSdk.getAddress()
    console.log(`Address: ${address}`)

    const owners = await safeSdk.getOwners()
    console.log('Owners:')
    owners.map(owner => console.log(owner))
  })

  it("Enqueues a contract deployment transaction", async () => {

  })
})


