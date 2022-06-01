import { context } from '../context'
import { MaybeFuture } from '../values'

export function saveContract(name: string, address: MaybeFuture<string>) {
  context.ensureEnabled()

  context.actions.push({
    type: 'SAVE_CONTRACT',
    address,
    name,
  })
}
