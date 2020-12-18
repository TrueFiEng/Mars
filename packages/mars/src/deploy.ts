import { context } from './context'
import { getConfig, Options } from './options'
import { execute, ExecuteOptions } from './execute/execute'

export async function deploy<T>(
  options: Options,
  callback: (deployer: string) => T
): Promise<{ result: T } & { config: ExecuteOptions }> {
  const config = await getConfig(options)

  context.enabled = true
  context.actions = []
  const result = callback(config.wallet.address)
  context.enabled = false
  await execute(context.actions, config)
  return { result, config }
}
