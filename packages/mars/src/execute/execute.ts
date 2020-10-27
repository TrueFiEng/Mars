import { Action, DeployAction, EncodeAction, ReadAction, TransactionAction } from '../actions'
import { Contract, providers, utils } from 'ethers'
import { AbiSymbol, Address, Bytecode, Name } from '../symbols'
import { Future, resolveBytesLike } from '../values'
import { getDeployTx } from './getDeployTx'
import { sendTransaction, TransactionOptions } from './sendTransaction'
import { save, read } from './save'
import { isBytecodeEqual } from './bytecode'
import { JsonInputs, verify } from '../verification'

export interface ExecuteOptions extends TransactionOptions {
  network: string
  deploymentsFile: string
  dryRun: boolean
  verification?: {
    etherscanApiKey: string
    jsonInputs: JsonInputs
    waffleConfig: string
  }
}

export async function execute(actions: Action[], options: ExecuteOptions) {
  for (const action of actions) {
    await executeAction(action, options)
  }
}

async function executeAction(action: Action, options: ExecuteOptions) {
  switch (action.type) {
    case 'DEPLOY':
      return executeDeploy(action, options)
    case 'READ':
      return executeRead(action, options)
    case 'TRANSACTION':
      return executeTransaction(action, options)
    case 'ENCODE':
      return executeEncode(action)
  }
}

export async function getExistingDeployment(
  tx: providers.TransactionRequest,
  name: string,
  options: ExecuteOptions
): Promise<string | undefined> {
  const existing = read(options.deploymentsFile, options.network, name)
  if (existing) {
    const [existingTx, receipt] = await Promise.all([
      options.wallet.provider.getTransaction(existing.txHash),
      options.wallet.provider.getTransactionReceipt(existing.txHash),
    ])
    if (existingTx && receipt) {
      if (
        tx.data &&
        isBytecodeEqual(existingTx.data, tx.data.toString()) &&
        receipt.contractAddress === existing.address
      ) {
        return existing.address
      }
    }
  }
}

async function executeDeploy(action: DeployAction, options: ExecuteOptions) {
  const params = action.params.map((param) => resolveValue(param))
  const tx = getDeployTx(action.artifact[AbiSymbol], action.artifact[Bytecode], params)
  const existingAddress = await getExistingDeployment(tx, action.name, options)
  if (existingAddress) {
    console.log(`Skipping deployment ${action.name} - ${existingAddress}`)
    action.resolve(existingAddress)
    return
  }
  const { txHash, address } = await sendTransaction(`Deploy ${action.name}`, options, tx)
  if (!options.dryRun) {
    save(options.deploymentsFile, options.network, action.name, { txHash, address })
  }
  if (options.verification) {
    await verify(
      options.verification.etherscanApiKey,
      options.verification.jsonInputs,
      options.verification.waffleConfig,
      action.artifact[Name],
      address,
      new utils.Interface([action.constructor]).encodeDeploy(params),
      options.network
    )
  }
  action.resolve(address)
}

async function executeRead(action: ReadAction, options: ExecuteOptions) {
  const params = action.params.map((param) => resolveValue(param))
  const address = resolveValue(action.address)
  const contract = new Contract(address, [action.method], options.wallet)
  const result = await contract[action.method.name](...params)
  action.resolve(result)
}

async function executeTransaction(action: TransactionAction, options: ExecuteOptions) {
  const params = action.params.map((param) => resolveValue(param))
  const { txHash } = await sendTransaction(`${action.name}.${action.method.name}`, options, {
    to: resolveValue(action.address),
    data: new utils.Interface([action.method]).encodeFunctionData(action.method.name, params),
  })
  action.resolve(resolveBytesLike(txHash))
}

async function executeEncode(action: EncodeAction) {
  const params = action.params.map((param) => resolveValue(param))
  const result = new utils.Interface([action.method]).encodeFunctionData(action.method.name, params)
  action.resolve(Buffer.from(result, 'hex'))
}

function resolveValue(value: unknown) {
  const resolved = Future.resolve(value)
  const address = resolved && (resolved as any)[Address]
  if (address) {
    return Future.resolve(address)
  }
  return resolved
}
