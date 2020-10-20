import { context } from './context'
import { getConfig } from './options/config'
import { execute, ExecuteOptions } from './execute/execute'

export async function deploy(options: Partial<ExecuteOptions>, callback: () => void) {
  const config = await getConfig(options)

  context.enabled = true
  context.actions = []
  callback()
  context.enabled = false
  return execute(context.actions, config)
}
