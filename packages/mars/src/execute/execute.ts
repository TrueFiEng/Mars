import chalk from 'chalk'
import {
  Action,
  DebugAction,
  DeployAction,
  EncodeAction,
  ReadAction,
  StartConditionalAction,
  TransactionAction,
} from '../actions'
import { BigNumber, Contract, providers, utils } from 'ethers'
import { AbiSymbol, Address, ArtifactSymbol, Bytecode, Name } from '../symbols'
import { Future, resolveBytesLike } from '../values'
import { getDeployTx } from './getDeployTx'
import { sendTransaction, TransactionOptions } from './sendTransaction'
import { save, read } from './save'
import { isBytecodeEqual } from './bytecode'
import { JsonInputs, verify, verifySingleFile } from '../verification'
import { context } from '../context'

export type TransactionOverrides = Partial<TransactionOptions>

export interface ExecuteOptions extends TransactionOptions {
  network: string
  deploymentsFile: string
  dryRun: boolean
  logFile: string
  verification?: {
    etherscanApiKey: string
    jsonInputs: JsonInputs
    waffleConfig: string
    flattenScript?: (name: string) => Promise<string>
  }
}

export async function execute(actions: Action[], options: ExecuteOptions) {
  for (const action of actions) {
    await executeAction(action, options)
  }
}

async function executeAction(action: Action, options: ExecuteOptions) {
  if (context.conditionalDepth > 0) {
    if (action.type === 'CONDITIONAL_START') {
      context.conditionalDepth++
    }
    if (action.type === 'CONDITIONAL_END') {
      context.conditionalDepth--
    }
    return
  }
  switch (action.type) {
    case 'DEPLOY':
      return executeDeploy(action, options)
    case 'READ':
      return executeRead(action, options)
    case 'TRANSACTION':
      return executeTransaction(action, options)
    case 'ENCODE':
      return executeEncode(action)
    case 'CONDITIONAL_START':
      return executeConditionalStart(action)
    case 'DEBUG':
      return executeDebug(action)
  }
}

function executeConditionalStart({ condition }: StartConditionalAction) {
  if (!Future.resolve(condition)) {
    context.conditionalDepth++
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
      // TODO: support abstract signers where no provider exists
      options.signer.provider!.getTransaction(existing.txHash),
      options.signer.provider!.getTransactionReceipt(existing.txHash),
    ])
    if (existingTx && receipt) {
      if (
        tx.data &&
        isBytecodeEqual(existingTx.data, tx.data.toString()) &&
        receipt.contractAddress.toLowerCase() === existing.address.toLowerCase()
      ) {
        return existing.address
      }
    }
  }
}

async function executeDeploy(action: DeployAction, globalOptions: ExecuteOptions) {
  const options = { ...globalOptions, ...action.options }
  const params = action.params.map((param) => resolveValue(param))
  const tx = getDeployTx(action.artifact[AbiSymbol], action.artifact[Bytecode], params)
  const existingAddress = await getExistingDeployment(tx, action.name, options)
  let address: string, txHash: string
  if (existingAddress) {
    console.log(`Skipping deployment ${action.name} - ${existingAddress}`)
    address = existingAddress
  } else {
    // eslint-disable-next-line no-extra-semi,@typescript-eslint/no-extra-semi
    ;({ txHash, address } = await sendTransaction(`Deploy ${action.name}`, options, tx))
    if (!options.dryRun) {
      save(options.deploymentsFile, options.network, action.name, { txHash, address })
    }
  }
  if (options.verification) {
    if (options.verification.flattenScript) {
      await verifySingleFile(
        options.verification.etherscanApiKey,
        options.verification.flattenScript,
        options.verification.waffleConfig,
        action.artifact[Name],
        address,
        action.constructor ? new utils.Interface([action.constructor]).encodeDeploy(params) : undefined,
        options.network
      )
    } else {
      await verify(
        options.verification.etherscanApiKey,
        options.verification.jsonInputs,
        options.verification.waffleConfig,
        action.artifact[Name],
        address,
        action.constructor ? new utils.Interface([action.constructor]).encodeDeploy(params) : undefined,
        options.network
      )
    }
  }
  action.resolve(address)
}

async function executeRead(action: ReadAction, options: ExecuteOptions) {
  const params = action.params.map((param) => resolveValue(param))
  const address = resolveValue(action.address)
  const contract = new Contract(address, [action.method], options.signer)
  const result = await contract[action.method.name](...params)
  action.resolve(result)
}

async function executeTransaction(action: TransactionAction, globalOptions: ExecuteOptions) {
  const options = { ...globalOptions, ...action.options }
  const params = action.params.map((param) => resolveValue(param))
  const { txHash } = await sendTransaction(
    `${action.name}.${action.method.name}(${printableTransactionParams(params)})`,
    options,
    {
      to: resolveValue(action.address),
      data: new utils.Interface([action.method]).encodeFunctionData(action.method.name, params),
    }
  )
  action.resolve(resolveBytesLike(txHash))
}

function printableTransactionParams(params: unknown[]) {
  return params.map(printableToString).join(', ')
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

function executeDebug({ messages }: DebugAction) {
  console.log(chalk.yellow('🛠', ...messages.map(printableToString)))
}

export function printableToString(data: unknown): string | number | boolean | null | undefined {
  const resolved = data instanceof Future ? Future.resolve(data) : data
  if (!resolved || typeof resolved !== 'object') {
    return resolved
  }
  if (resolved instanceof BigNumber) {
    return resolved.toString()
  }
  if (ArtifactSymbol in resolved && Address in resolved) {
    return `${resolved[ArtifactSymbol][Name]}#${Future.resolve(resolved[Address])}`
  }
  if (Array.isArray(resolved)) {
    return JSON.stringify(resolved.map(printableToString))
  }
  return JSON.stringify(
    Object.fromEntries(Object.entries(resolved).map(([key, value]) => [key, printableToString(value)])),
    null,
    2
  )
}
