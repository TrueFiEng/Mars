import { context } from './context'
import { getConfig } from './config'
import { execute, ExecuteOptions } from './execute/execute'

export async function deploy(options: Partial<ExecuteOptions>, callback: () => void) {
  const config = getConfig(options)

  context.enabled = true
  context.actions = []
  callback()
  context.enabled = false
  return execute(context.actions, config)
}
