import { expect } from 'chai'
import { getEnvironmentOptions } from '../../src/options/environment'

const PRIVATE_KEY = `0x${'1'.repeat(64)}`

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

  function getEnv(env: { [key: string]: string }) {
    return withEnv(env, getEnvironmentOptions)
  }

  it('can read the private key', () => {
    const options = getEnv({ PRIVATE_KEY })
    expect(options).to.deep.equal({ privateKey: PRIVATE_KEY })
  })

  it('does not accept invalid PRIVATE_KEY values', () => {
    expect(() => {
      getEnv({ PRIVATE_KEY: '0x1234' })
    }).to.throw()
  })

  it('can read the etherscan api key', () => {
    const options = getEnv({ ETHERSCAN_KEY: 'key' })
    expect(options).to.deep.equal({ etherscanApiKey: 'key' })
  })

  it('does not accept invalid ETHERSCAN_KEY values', () => {
    expect(() => {
      getEnv({ ETHERSCAN_KEY: 'foo bar' })
    }).to.throw()
  })

  it('can read the infura api key', () => {
    const options = getEnv({ INFURA_KEY: 'key' })
    expect(options).to.deep.equal({ infuraApiKey: 'key' })
  })

  it('does not accept invalid INFURA_KEY values', () => {
    expect(() => {
      getEnv({ INFURA_KEY: 'foo bar' })
    }).to.throw()
  })

  it('can read the alchemy api key', () => {
    const options = getEnv({ ALCHEMY_KEY: 'key' })
    expect(options).to.deep.equal({ alchemyApiKey: 'key' })
  })

  it('does not accept invalid ALCHEMY_KEY values', () => {
    expect(() => {
      getEnv({ ALCHEMY_KEY: 'foo bar' })
    }).to.throw()
  })

  it('can read multiple values at once', () => {
    const options = getEnv({
      PRIVATE_KEY,
      ETHERSCAN_KEY: 'etherscan-key',
      INFURA_KEY: 'infura-key',
      ALCHEMY_KEY: 'alchemy-key',
    })
    expect(options).to.deep.equal({
      privateKey: PRIVATE_KEY,
      etherscanApiKey: 'etherscan-key',
      infuraApiKey: 'infura-key',
      alchemyApiKey: 'alchemy-key',
    })
  })
})
