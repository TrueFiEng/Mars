import { context } from './context'
import { getConfig, Options } from './options'
import { execute, ExecuteOptions } from './execute/execute'

export async function deploy<T>(
  options: Options,
  callback: (deployer: string, options: ExecuteOptions) => T
): Promise<{ result: T } & { config: ExecuteOptions }> {
  const config = await getConfig(options)

  context.enabled = true
  context.actions = []
  const result = callback(await config.signer.getAddress(), config)
  context.enabled = false
  await execute(context.actions, config)
  return { result, config }
}
