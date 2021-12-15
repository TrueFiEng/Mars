import { providers } from 'ethers'
import { ContractDeployer } from './gnosis/contractDeployer'

/**
 * Builds multisig parts and provides construction of multisig executable.
 * This split responsibility of multisig definition building and its execution at later state.
 *
 * Encapsulates the multisig implementation details (multisig vendor/service) from all the other logic.
 */
export class MultisigBuilder {
  private _contractDeployer: ContractDeployer

  public name: string
  public txBatch: providers.TransactionRequest[]
  // TODO: consider more complex state management
  public isExecuted: boolean
  public txHash?: string

  /**
   *
   * @param name name of the multisig to differentiate from other multisig batches in the deployment (if many)
   * @param networkChainId chain id of the network, needed in order to locate auxiliary contract deployment contracts
   */
  constructor(name: string, networkChainId: number) {
    this.name = name
    this.txBatch = []
    this.isExecuted = false
    this._contractDeployer = new ContractDeployer(networkChainId)
  }

  /**
   * Adds a contract deployment transaction as a multisig batch part.
   * @param tx contract deployment transaction
   * @param bytecode contract bytecode
   * @returns the address of the contract to be deployed to. Deterministic, i.e. known before deployment transaction
   *  is finalized and unchanged after that.
   */
  public async addContractDeployment(tx: providers.TransactionRequest, bytecode: string): Promise<string> {
    const { transaction: wrappedTx, address } = await this._contractDeployer!.createDeploymentTx(tx, bytecode)
    this.txBatch.push(wrappedTx)

    return address
  }

  /**
   * Adds a contract interaction transaction as a multisig batch part.
   * @param tx contract deployment transaction
   */
  public async addContractInteraction(tx: providers.TransactionRequest): Promise<void> {
    this.txBatch.push(tx)
  }

  public buildExecutable(provider: providers.JsonRpcProvider): MultisigExecutable {
    return new MultisigExecutable(provider)
  }
}

/**
 * Multisig state-changing operations.
 *
 * Encapsulates the multisig implementation details (multisig vendor/service) from all the other logic.
 */
class MultisigExecutable {
  private _provider: providers.JsonRpcProvider

  constructor(provider: providers.JsonRpcProvider) {
    this._provider = provider
  }

  /**
   * Registers a multisig transaction in the multisig system for multisig participants to approve and execute later on.
   *
   * Multisig registration and its various steps may (but does not need to) be transacted in the network on-chain or
   * leveraged off-chain. It depends on the particular multisig service in use.
   * It is guaranteed though that the final execution of the multisig must be transacted and finalized in the network.
   */
  propose(): void {
    return
  }
}
