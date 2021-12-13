import { Contract, providers } from 'ethers'
import { randomBytes } from 'ethers/lib/utils'
import { computeCreate2Address } from '../../create2Address'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const createCall = require('./createCall.json')

export interface DeterministicDeployment {
  address: string
  transaction: providers.TransactionRequest
}

/**
 * Creates contract deployment transactions targeting deterministic addresses using CREATE2 opcode.
 */
export class ContractDeployer {
  constructor(private provider: providers.JsonRpcProvider) {}

  /**
   * Creates a new contract deployment transactions and precomputes its deterministic creation address.
   * @param unwrappedDeploymentTx a raw deployment transaction
   * @param contractBytecode contract bytecode
   * @returns wrapped contract deployment transaction and contract deployment address
   */
  public async createDeploymentTx(
    unwrappedDeploymentTx: providers.TransactionRequest,
    contractBytecode: string
  ): Promise<DeterministicDeployment> {
    const deployerContract = this.getDeployerContract()
    const salt = randomBytes(32)

    const transaction = await deployerContract.populateTransaction.performCreate2(0, unwrappedDeploymentTx.data, salt)
    const address = computeCreate2Address(deployerContract.address, salt, contractBytecode)

    return { address, transaction }
  }

  getDeployerContract(): Contract {
    const currentChainId = this.provider.network
    if (currentChainId === undefined)
      throw 'Cannot establish network in which Gnosis contract deployer contract operates'

    const address = createCall.networkAddresses[currentChainId.chainId]
    return new Contract(address, createCall.abi, this.provider)
  }
}
