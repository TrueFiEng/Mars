import { BigNumber } from 'ethers'
import { MockProvider } from 'ethereum-waffle'
import { context } from '../../src/context'
import { execute, ExecuteOptions } from '../../src/execute/execute'
import { logConfig } from '../../src/logging'

export async function testDeploy<T>(
  callback: () => T,
  options: {
    saveDeploy?: boolean
    injectProvider?: MockProvider
    logFile?: string
  } = {
    saveDeploy: true,
  }
) {
  if (options.logFile) {
    logConfig.mode = { file: true, console: false }
    logConfig.filepath = options.logFile
  }

  const provider = options.injectProvider ?? new MockProvider()
  const config: ExecuteOptions = {
    networkName: 'test',
    dryRun: !options.saveDeploy,
    noConfirm: true,
    logFile: options.logFile ?? '',
    deploymentsFile: './test/deployments.json',
    signer: provider.getSigner(0),
    gasPrice: BigNumber.from(0),
  }
  context.enabled = true
  context.actions = []
  const result = callback()
  context.enabled = false
  await execute(context.actions, config)
  return { result, provider }
}
