import { ethers, providers, Signer } from 'ethers'
import { ContractDeployer, DeterministicDeployment } from './gnosis/contractDeployer'
import { MultisigConfig } from './multisigConfig'
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk-types'
import Safe, { EthersAdapter } from '@gnosis.pm/safe-core-sdk'
import SafeServiceClient from '@gnosis.pm/safe-service-client'
import { log } from '../logging'
import chalk from 'chalk'

export class MultisigTxDispatcher {
  private _contractDeployer: ContractDeployer
  private _config: MultisigConfig
  private readonly _signer: Signer
  private _safe?: Safe
  private _safeServiceClient: SafeServiceClient

  public txBatch: providers.TransactionRequest[]

  constructor(config: MultisigConfig) {
    this._config = config
    this._signer = config.multisigSigner
    this._safeServiceClient = new SafeServiceClient(config.gnosisServiceUri);
    this._config = config
    this.txBatch = []
    this._contractDeployer = new ContractDeployer(config.networkChainId)
  }

  /**
   * Adds a contract deployment transaction as a multisig batch part.
   *
   * @param tx contract deployment transaction
   * @returns deterministic deployment data in order to be able replicate the transaction later on
   */
  public async addContractDeployment(tx: providers.TransactionRequest): Promise<DeterministicDeployment> {
    const deployment = await this._contractDeployer.createDeploymentTx(tx)
    this.txBatch.push(deployment.transaction)

    return deployment
  }

  /**
   * Adds a contract interaction transaction as a multisig batch part.
   *
   * @param tx contract deployment transaction
   */
  public addContractInteraction(tx: providers.TransactionRequest): void {
    this.txBatch.push(tx)
  }

  /**
   * Registers a multisig transaction in the multisig system for multisig participants to approve and execute later on.
   *
   * Multisig registration and its various steps may (but does not need to) be transacted in the network on-chain or
   * leveraged off-chain. It depends on the particular multisig service in use.
   * It is guaranteed though that the final execution of the multisig must be transacted and finalized in the network.
   *
   * @returns unique id of the multisig transaction
   */
  public async propose(): Promise<string> {
    const safe = await this.ensureSafe()
    const safeMultisigParts: SafeTransactionDataPartial[] = this.txBatch.map(
      (tx) =>
        ({
          to: tx.to,
          data: tx.data,
          value: tx.value?.toString() ?? '0',
        } as SafeTransactionDataPartial)
    )
    const safeMultisigTx = await safe.createTransaction(safeMultisigParts)
    const safeMultisigTxHash = await safe.getTransactionHash(safeMultisigTx)
    const senderAddress = await this._signer.getAddress()
    await this._safeServiceClient.proposeTransaction({
      safeAddress: safe.getAddress(),
      safeTxHash: safeMultisigTxHash,
      safeTransaction: safeMultisigTx,
      senderAddress,
    })
    log(
      chalk.yellow(
        `🤹 Multisig batch has been proposed (${safeMultisigParts.length} transactions) to the queue. Batch ID = ${safeMultisigTxHash}`
      )
    )

    return safeMultisigTxHash
  }

  /**
   * Adds one more approval for a given multisig tx by the current signer. The signer must be authorized to approve.
   * @param id identifies the multisig transaction to approve
   */
  public async approve(id: string): Promise<void> {
    const safe = await this.ensureSafe()
    const confirmationSignature = await safe.signTransactionHash(id)
    await this._safeServiceClient.confirmTransaction(id, confirmationSignature.data)
    log(chalk.yellow(`🎯 Multisig batch ${id} approved by ${await this._signer.getAddress()}`))
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
