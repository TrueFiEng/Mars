import { Action } from './actions'
import { MultisigContext } from './syntax/multisig'

export const context = {
  enabled: false,
  ensureEnabled() {
    if (!this.enabled) {
      throw new Error('Context not enabled!')
    }
  },
  actions: [] as Action[],
  // Counts depth of conditional transactions after the failed one
  conditionalDepth: 0,
  multisig: new MultisigContext(),
}
