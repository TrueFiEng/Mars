import { expect } from 'chai'
import { Wallet } from 'ethers'
import { getEnvironmentOptions } from '../../src/options/environment'

describe('getEnvironmentOptions', () => {
  function withEnv<T>(env: { [key: string]: string }, callback: () => T): T {
    const backup = process.env
    process.env = { ...process.env, ...env }
    try {
      return callback()
    } finally {
      process.env = backup
    }
  }

  it('can read the private key', () => {
    const key = Wallet.createRandom().privateKey
    const options = withEnv({ PRIVATE_KEY: key }, getEnvironmentOptions)
    expect(options).to.deep.equal({ privateKey: key })
  })

  it('does not accept invalid PRIVATE_KEY values', () => {
    expect(() => {
      withEnv({ PRIVATE_KEY: '0x1234' }, getEnvironmentOptions)
    }).to.throw()
  })

  it('can read the etherscan api key', () => {
    const options = withEnv({ ETHERSCAN_KEY: 'key' }, getEnvironmentOptions)
    expect(options).to.deep.equal({ etherscanApiKey: 'key' })
  })

  it('does not accept invalid ETHERSCAN_KEY values', () => {
    expect(() => {
      withEnv({ ETHERSCAN_KEY: 'foo bar' }, getEnvironmentOptions)
    }).to.throw()
  })

  it('can read the infura api key', () => {
    const options = withEnv({ INFURA_KEY: 'key' }, getEnvironmentOptions)
    expect(options).to.deep.equal({ infuraApiKey: 'key' })
  })

  it('does not accept invalid INFURA_KEY values', () => {
    expect(() => {
      withEnv({ INFURA_KEY: 'foo bar' }, getEnvironmentOptions)
    }).to.throw()
  })

  it('can read the alchemy api key', () => {
    const options = withEnv({ ALCHEMY_KEY: 'key' }, getEnvironmentOptions)
    expect(options).to.deep.equal({ alchemyApiKey: 'key' })
  })

  it('does not accept invalid ALCHEMY_KEY values', () => {
    expect(() => {
      withEnv({ ALCHEMY_KEY: 'foo bar' }, getEnvironmentOptions)
    }).to.throw()
  })

  it('can read multiple values at once', () => {
    const key = Wallet.createRandom().privateKey
    const options = withEnv(
      {
        PRIVATE_KEY: key,
        ETHERSCAN_KEY: 'etherscan-key',
        INFURA_KEY: 'infura-key',
        ALCHEMY_KEY: 'alchemy-key',
      },
      getEnvironmentOptions
    )
    expect(options).to.deep.equal({
      privateKey: key,
      etherscanApiKey: 'etherscan-key',
      infuraApiKey: 'infura-key',
      alchemyApiKey: 'alchemy-key',
    })
  })
})
