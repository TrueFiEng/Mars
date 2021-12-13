import { context } from '../context'
import { Multisig } from '../multisig'

/***
 * Designates a wrapping block of syntax statements that are to be executed as a single multisig transaction batch.
 * Use 'propose()' to terminate the block.
 */
export interface MultisigBlock {
  name: string

  propose(): void
}

/***
 * Opens a multisig block. All subsequent contract creations and interactions are queued in a multisig transaction.
 * @param name name of the multisig. It must be unique per deployment i.e. all multisig blocks in a deployment must
 * have unique names.
 */
export function multisig(name: string): MultisigBlock {
  context.ensureEnabled()

  context.multisig.defineStart(name)
  context.actions.push({
    type: 'MULTISIG_START',
  })

  return {
    name,
    propose() {
      context.ensureEnabled()

      context.multisig.defineEnd()
      context.actions.push({
        type: 'MULTISIG_END',
      })
    },
  }
}

/***
 * Multisig context of deployment process
 */
export class MultisigContext {
  private _all: Multisig[] = []
  private _current?: Multisig

  public defineStart(name: string): void {
    if (this.isActive())
      throw new Error("Multisig block already opened. Make sure you proposed the previous multisig with 'propose'.")

    if (this.contains(multisig.name)) throw new Error(`Multisig name ${multisig.name} already defined.`)

    const handler = new Multisig(name)
    this._current = handler
    this._all.push(handler)
  }

  public defineEnd(): void {
    this._current = undefined
  }

  public processStart(): void {
    if (this._all.length == 0)
      throw new Error('There are no multisig elements to process. This indicates a bug in code.')

    this._current = this._all[0]
    this._all = this._all.slice(1)
  }

  public processEnd(): void {
    this._current = undefined
  }

  public isActive(): boolean {
    return this._current !== undefined
  }

  public current(): Multisig | undefined {
    return this._current
  }

  private contains(name: string) {
    return this._all.map((m) => m.name).indexOf(name) >= 0
  }
}
