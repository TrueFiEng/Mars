import { context } from './context'
import { getConfig, Options } from './options'
import { execute, ExecuteOptions } from './execute/execute'
import { MultisigContext } from './syntax/multisig'

export async function deploy<T>(
  options: Options,
  callback: (deployer: string, options: ExecuteOptions) => T
): Promise<{ result: T } & { config: ExecuteOptions }> {
  const config = await getConfig(options)

  context.enabled = true
  context.actions = []
  context.multisig = config.multisig ? new MultisigContext(config.multisig) : undefined
  const result = callback(await config.signer.getAddress(), config)
  context.enabled = false
  await execute(context.actions, config)
  return { result, config }
}
