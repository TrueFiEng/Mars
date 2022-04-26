import { Wallet } from 'ethers'
import ganache from 'ganache-core'
import { contract, deploy } from '../../src'
import { SimpleContract } from '../fixtures/exampleArtifacts'
import { expectFuture } from '../utils'
import { expect } from 'chai'

describe('Deploying', () => {
  describe('With fork and unlocked accounts using `dryRun` and `fromAccount` options', () => {
    it('using account with plenty of ETH, should deploy with success', async () => {
      const alice = Wallet.createRandom()

      const ganacheProvider = ganache.provider({
        locked: true,
        gasPrice: '0',
        accounts: [{ secretKey: alice.privateKey, balance: '10000000000000000' }],
      })

      const { result } = await deploy(
        {
          dryRun: true,
          fromAddress: await alice.getAddress(),
          network: ganacheProvider,
          disableCommandLineOptions: true,
        },
        () => {
          const contractResult = contract(SimpleContract)
          return contractResult.hello()
        }
      )

      expectFuture(result, 'world')
    })

    it('using account with no ETH, should fail deployment', async () => {
      const alice = Wallet.createRandom()

      const ganacheProvider = ganache.provider({
        locked: true,
        gasPrice: '0',
        accounts: [{ secretKey: alice.privateKey, balance: '0' }],
      })

      try {
        await deploy(
          {
            dryRun: true,
            fromAddress: await alice.getAddress(),
            network: ganacheProvider,
            disableCommandLineOptions: true,
          },
          () => contract(SimpleContract)
        )
      } catch (e: any) {
        expect(e.message)
          .to.be.a('string')
          .and.match(/^sender doesn't have enough funds to send tx/)
      }
    })
  })
})
