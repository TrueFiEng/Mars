import { expect } from 'chai'
import {BigNumber, Wallet} from 'ethers'
import { getConfig } from '../../src/options'

const PRIVATE_KEY_1 = `0x${'1'.repeat(64)}`
const PRIVATE_KEY_2 = `0x${'2'.repeat(64)}`
const PRIVATE_KEY_3 = `0x${'3'.repeat(64)}`

const defaults = { gasPrice: BigNumber.from(1) } // speeds things up

describe('getConfig', () => {
  let envBackup: typeof process.env
  let argvBackup: string[]

  beforeEach(() => {
    envBackup = process.env
    argvBackup = process.argv
  })

  afterEach(() => {
    process.env = envBackup
    process.argv = argvBackup
  })

  function setEnv(values: typeof process.env) {
    process.env = { ...envBackup, ...values }
  }

  function setArgv(values: string[]) {
    process.argv = [argvBackup[0], argvBackup[1], ...values]
  }

  it('respects options precedence', async () => {
    const result1 = await getConfig({ privateKey: PRIVATE_KEY_1, ...defaults })
    expect((result1.signer as Wallet).privateKey).to.equal(PRIVATE_KEY_1)

    setEnv({ PRIVATE_KEY: PRIVATE_KEY_2 })
    const result2 = await getConfig({ privateKey: PRIVATE_KEY_1, ...defaults })
    expect((result2.signer as Wallet).privateKey).to.equal(PRIVATE_KEY_2)

    setArgv(['-p', PRIVATE_KEY_3])
    const result3 = await getConfig({ privateKey: PRIVATE_KEY_1, ...defaults })
    expect((result3.signer as Wallet).privateKey).to.equal(PRIVATE_KEY_3)
  })

  it('dry run implies noConfirm', async () => {
    const result = await getConfig({ dryRun: true, ...defaults })
    expect(result.noConfirm).to.equal(true)
  })

  it('throws if private key is missing', async () => {
    const reverted = await getConfig({}).then(
      () => false,
      () => true
    )
    expect(reverted).to.equal(true)
  })
})
