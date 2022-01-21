import { context } from './context'
import { getConfig, Options } from './options'
import { execute, ExecuteOptions } from './execute/execute'
import { MultisigTxDispatcher } from './multisig'
import { log } from './logging'

export async function deploy<T>(
  options: Options,
  callback: (deployer: string, options: ExecuteOptions) => T
): Promise<{ result: T } & { config: ExecuteOptions }> {
  const config = await getConfig(options)

  context.enabled = true
  context.actions = []
  context.multisig = config.multisig ? new MultisigTxDispatcher(config.multisig) : undefined
  const result = callback(await config.signer.getAddress(), config)
  context.enabled = false
  await execute(context.actions, config)

  // Refactor -> extract to multisig extension
  if (config.multisig && context.multisig) {
    if (context.multisig.txBatch.length > 0) {
      const multisigId = await context.multisig.propose()
      await context.multisig.approve(multisigId)
    } else {
      log('Multisig batch empty. Nothing to process.')
    }
  }
  return { result, config }
}
