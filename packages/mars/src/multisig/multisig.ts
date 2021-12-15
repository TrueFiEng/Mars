import { ethers, providers, Signer } from 'ethers'
import { ContractDeployer } from './gnosis/contractDeployer'
import { MultisigConfig } from './multisigConfig'
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'
import Safe, { EthersAdapter } from '@gnosis.pm/safe-core-sdk'
import SafeServiceClient from '@gnosis.pm/safe-service-client'

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
   * Creates a multisig builder instance.
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
   *
   * @param tx contract deployment transaction
   * @param bytecode contract bytecode
   * @returns the address of the contract to be deployed to. Deterministic, i.e. known before deployment transaction
   *  is finalized and unchanged after that.
   */
  public async addContractDeployment(tx: providers.TransactionRequest, bytecode: string): Promise<string> {
    const { transaction: wrappedTx, address } = await this._contractDeployer.createDeploymentTx(tx, bytecode)
    this.txBatch.push(wrappedTx)

    return address
  }

  /**
   * Adds a contract interaction transaction as a multisig batch part.
   *
   * @param tx contract deployment transaction
   */
  public async addContractInteraction(tx: providers.TransactionRequest): Promise<void> {
    this.txBatch.push(tx)
  }

  /**
   * Creates execution orchestrator of the multisig
   *
   * @param signer signs multisig transactions
   * @param config multisig configuration
   */
  public buildExecutable(signer: Signer, config: MultisigConfig): MultisigExecutable {
    return new MultisigExecutable(signer, config)
  }
}

/**
 * Multisig state-changing operations.
 *
 * Encapsulates the multisig implementation details (multisig vendor/service) from all the other logic.
 */
class MultisigExecutable {
  private _signer: Signer
  private _safe?: Safe
  private _config: MultisigConfig
  private _safeServiceClient: SafeServiceClient

  constructor(signer: Signer, config: MultisigConfig) {
    this._config = config
    this._signer = signer
    this._safeServiceClient = new SafeServiceClient(config.gnosisServiceUri)
  }

  /**
   * Registers a multisig transaction in the multisig system for multisig participants to approve and execute later on.
   *
   * Multisig registration and its various steps may (but does not need to) be transacted in the network on-chain or
   * leveraged off-chain. It depends on the particular multisig service in use.
   * It is guaranteed though that the final execution of the multisig must be transacted and finalized in the network.
   *
   * @param tx either a single transaction request or a batch of many
   * @returns transaction hash of the whole multisig batch transaction
   */
  public async propose(tx: providers.TransactionRequest | providers.TransactionRequest[]): Promise<string> {
    const safe = await this.ensureSafe()
    const txs = Array.isArray(tx) ? tx : [tx]
    const safeMultisigParts: SafeTransactionDataPartial[] = txs.map(
      (tx) =>
        ({
          to: tx.to,
          data: tx.data,
          value: tx.value?.toString() ?? '0',
        } as SafeTransactionDataPartial)
    )
    const safeMultisigTx = await safe.createTransaction(safeMultisigParts)
    const safeMultisigTxHash = await safe.getTransactionHash(safeMultisigTx)
    await this._safeServiceClient.proposeTransaction({
      safeAddress: safe.getAddress(),
      safeTxHash: safeMultisigTxHash,
      safeTransaction: safeMultisigTx,
      senderAddress: await this._signer.getAddress(),
    })

    return safeMultisigTxHash
  }

  private async ensureSafe(): Promise<Safe> {
    if (this._safe) return <Safe>this._safe

    this._safe = await Safe.create({
      ethAdapter: new EthersAdapter({ ethers, signer: this._signer }),
      safeAddress: this._config.gnosisSafeAddress,
    })

    return this._safe
  }
}
