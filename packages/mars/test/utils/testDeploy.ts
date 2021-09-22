import { BigNumber } from 'ethers'
import { MockProvider } from 'ethereum-waffle'
import { context } from '../../src/context'
import { execute, ExecuteOptions } from '../../src/execute/execute'

export async function testDeploy<T>(
  callback: () => T,
  options: {
    saveDeploy?: boolean
    injectProvider?: MockProvider
    verbose?: boolean
  } = {
    saveDeploy: true,
  }
) {
  const provider = options.injectProvider ?? new MockProvider()
  const config: ExecuteOptions = {
    network: 'test',
    dryRun: !options.saveDeploy,
    noConfirm: true,
    verbose: !!options.verbose,
    deploymentsFile: './test/deployments.json',
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
