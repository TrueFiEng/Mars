import { context } from '../context'

export function debug(...messages: any[]) {
  context.ensureEnabled()

  context.actions.push({
    type: 'DEBUG',
    messages,
  })
}
