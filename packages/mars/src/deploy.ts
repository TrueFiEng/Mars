import { context } from './context'
import { getConfig, Options } from './options'
import { execute } from './execute/execute'

export async function deploy(options: Partial<Options>, callback: () => void) {
  const config = await getConfig(options)

  context.enabled = true
  context.actions = []
  callback()
  context.enabled = false
  return execute(context.actions, config)
}
