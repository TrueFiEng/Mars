import { context } from '../context'
import { MultisigBuilder, MultisigConfig, readSavedMultisig } from '../multisig'
import { ExecuteOptions } from '../execute/execute'
import { save } from '../execute/save'
import { SavedMultisigEntry, saveMultisig } from '../multisig/multisigState'

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
  const multisig = context.multisig

  if (!multisig) throw new Error('Multisig context does not exist. Ensure you configured it for the deployment.')

  multisig.defineStart(name)
  context.actions.push({
    type: 'MULTISIG_START',
  })

  return {
    name,
    propose() {
      context.ensureEnabled()

      multisig.defineEnd()
      context.actions.push({
        type: 'MULTISIG_END',
      })
    },
  }
}

/***
 * Multisig context of deployment process.
 *
 * A global overview of all the multisigs in the deployment. Manages them globally.
 */
export class MultisigContext {
  private _all: MultisigBuilder[] = []
  private _config: MultisigConfig
  private _current?: MultisigBuilder

  constructor(config: MultisigConfig) {
    this._config = config
  }

  public defineStart(name: string): void {
    if (this.isActive())
      throw new Error("Multisig block already opened. Make sure you proposed the previous multisig with 'propose'.")

    if (this.contains(multisig.name)) throw new Error(`Multisig name ${multisig.name} already defined.`)

    const builder = new MultisigBuilder(name, this._config.networkChainId)
    this._current = builder
    this._all.push(builder)
  }

  public defineEnd(): void {
    if (!this.isActive())
      throw new Error('Multisig block has not been opened. Ensure you created a multisig block first.')

    this._current = undefined
  }

  public async executeStart(): Promise<void> {
    if (this._all.length == 0)
      throw new Error('There are no multisig elements to process. This indicates a bug in code.')

    this._current = this._all[0]
    this._all = this._all.slice(1)
  }

  // TODO: refactor -> decouple state management from this
  public async executeEnd(options: ExecuteOptions): Promise<{ continue: boolean }> {
    const executable = this._current!.buildExecutable(options.signer, this._config)
    const multisigData = readSavedMultisig(options.deploymentsFile, options.networkName, executable.name)
    let state: SavedMultisigEntry
    if (!multisigData || multisigData.state == 'UNKNOWN') {
      const multisigId = await executable.propose(this._current!.txBatch)
      state = {
        id: multisigId,
        state: 'PROPOSED',
      }
      saveMultisig(options.deploymentsFile, options.networkName, executable.name, state)
      return { continue: false }
    } else if (multisigData.state == 'PROPOSED') {
      const checkedState = await executable.checkState(multisigData.id)
      if (checkedState.kind == 'EXECUTED') {
        save(options.deploymentsFile, options.networkName, executable.name, {
          id: multisigData.id,
          state: 'EXECUTED',
        } as SavedMultisigEntry)
      }
      return { continue: false }
    }

    this._current = undefined
    return { continue: true }
  }

  public isActive(): boolean {
    return this._current !== undefined
  }

  public current(): MultisigBuilder | undefined {
    return this._current
  }

  private contains(name: string) {
    return this._all.map((m) => m.name).indexOf(name) >= 0
  }
}
