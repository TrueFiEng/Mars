import {Contract, providers, Signer} from "ethers";
import {randomBytes} from "ethers/lib/utils";

const createCall = require('./createCall.json')

// TODO: rename to sth gnogis/create2? specific
export class ContractDeployer {
  constructor(private provider: providers.JsonRpcProvider) {
  }

  public async createDeploymentTx(unwrappedDeploymentTx: providers.TransactionRequest): Promise<providers.TransactionRequest> {
    const deployerContract = await this.getDeployerContract()
    const salt = randomBytes(32)
    const deploymentTransaction = await deployerContract.populateTransaction.performCreate2(
      0, unwrappedDeploymentTx.data, salt)

    return deploymentTransaction
  }

  async getDeployerContract(): Promise<Contract> {
    const currentChainId = await this.provider.getNetwork()
    if (currentChainId === undefined)
      throw 'Cannot establish network in which Gnosis contract deployer contract operates'

    const address = createCall.networkAddresses[currentChainId.chainId]
    const deployContract = new Contract(address, createCall.abi, this.provider)

    return deployContract
  }
}
