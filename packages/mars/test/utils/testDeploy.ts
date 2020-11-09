import { BigNumber } from 'ethers'
import { MockProvider } from 'ethereum-waffle'
import { context } from '../../src/context'
import { execute, ExecuteOptions } from '../../src/execute/execute'

export async function testDeploy<T>(callback: () => T) {
  const provider = new MockProvider()
  const config: ExecuteOptions = {
    network: 'test',
    dryRun: true,
    noConfirm: true,
    deploymentsFile: '',
    wallet: provider.getWallets()[0],
    gasPrice: BigNumber.from(0),
  }
  context.enabled = true
  context.actions = []
  const result = callback()
  context.enabled = false
  await execute(context.actions, config)
  return { result, provider }
}
