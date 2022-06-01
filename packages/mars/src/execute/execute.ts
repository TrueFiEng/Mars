import chalk from 'chalk'
import {
  Action,
  DebugAction,
  DeployAction,
  EncodeAction,
  GetStorageAction,
  ReadAction, SaveContractAction,
  StartConditionalAction,
  TransactionAction
} from '../actions'
import { BigNumber, Contract, providers, utils } from 'ethers'
import { AbiSymbol, Address, ArtifactSymbol, Bytecode, DeployedBytecode, Name } from '../symbols'
import { Future, resolveBytesLike } from '../values'
import { getDeployTx } from './getDeployTx'
import { sendTransaction, TransactionOptions } from './sendTransaction'
import { read, save, SaveEntry } from './save'
import { isBytecodeEqual } from './bytecode'
import { JsonInputs, verify, verifySingleFile } from '../verification'
import { context } from '../context'
import { MultisigConfig } from '../multisig'

export type TransactionOverrides = Partial<TransactionOptions> & {
  skipUpgrade?: boolean
}

export interface ExecuteOptions extends TransactionOptions {
  networkName: string
  deploymentsFile: string
  dryRun: boolean
  logFile: string
  verification?: {
    etherscanApiKey: string
    jsonInputs: JsonInputs
    waffleConfig: string
    flattenScript?: (name: string) => Promise<string>
  }
  multisig?: MultisigConfig
}

export async function execute(actions: Action[], options: ExecuteOptions) {
  for (const action of actions) {
    await executeAction(action, options)
  }
}

async function executeGetStorageAt(
  { address: futureAddress, storageAddress, resolve }: GetStorageAction,
  options: ExecuteOptions
) {
  const address = resolveValue(futureAddress)
  const storageValue = await options.signer.provider?.getStorageAt(address, storageAddress)
  resolve(storageValue ?? '0x')
}

async function executeAction(action: Action, options: ExecuteOptions): Promise<void> {
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
    case 'GET_STORAGE_AT':
      return executeGetStorageAt(action, options)
    case 'SAVE_CONTRACT':
      return executeContractSave(action, options)
  }
}

function executeConditionalStart({ condition }: StartConditionalAction) {
  if (!Future.resolve(condition)) {
    context.conditionalDepth++
  }
}

function getDeployedAddress(fileName: string, networkName: string, localContractName: string): string | undefined {
  const localEntry = read<SaveEntry>(fileName, networkName, localContractName)
  return localEntry ? localEntry.address : undefined
}

async function isDeployedContractSameAsLocal(
  provider: providers.Provider,
  address: string,
  localContractBytecode: string
): Promise<boolean> {
  const networkBytecode = await provider.getCode(address)
  return networkBytecode !== undefined && isBytecodeEqual(networkBytecode, localContractBytecode)
}

async function isNewDeploymentNeeded(
  localAddress: string | undefined,
  provider: providers.Provider,
  localBytecode: string,
  skipEqualityCheck: boolean
): Promise<boolean> {
  if (!localAddress) return true

  const contractsAreEqual =
    skipEqualityCheck || (await isDeployedContractSameAsLocal(provider, localAddress, localBytecode))

  return !contractsAreEqual
}

async function executeDeploy(action: DeployAction, globalOptions: ExecuteOptions) {
  const options = { ...globalOptions, ...action.options }
  const params = action.params.map((param) => resolveValue(param))
  let tx = getDeployTx(action.artifact[AbiSymbol], action.artifact[Bytecode], params)
  const existingAddress = getDeployedAddress(options.deploymentsFile, options.networkName, action.name)
  let address: string, txHash: string | undefined
  if (
    !(await isNewDeploymentNeeded(
      existingAddress,
      options.provider,
      action.artifact[DeployedBytecode],
      action.skipUpgrade
    ))
  ) {
    console.log(`Skipping deployment ${action.name} - ${existingAddress}`)
    address = <string>existingAddress
  } else {
    if (context.multisig) {
      // eslint-disable-next-line no-extra-semi,@typescript-eslint/no-extra-semi
      ;({ transaction: tx, address } = await context.multisig.addContractDeployment(tx))
      ;({ txHash } = await sendTransaction(`Deploy ${action.name}`, options, tx))
    } else {
      // eslint-disable-next-line no-extra-semi,@typescript-eslint/no-extra-semi
      ;({ txHash, address } = await sendTransaction(`Deploy ${action.name}`, options, tx))
    }

    if (!options.dryRun) {
      const multisig = !!context.multisig
      save(options.deploymentsFile, options.networkName, action.name, { txHash, address, multisig })
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
        options.networkName
      )
    } else {
      await verify(
        options.verification.etherscanApiKey,
        options.verification.jsonInputs,
        options.verification.waffleConfig,
        action.artifact[Name],
        address,
        action.constructor ? new utils.Interface([action.constructor]).encodeDeploy(params) : undefined,
        options.networkName
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
  const transaction = {
    to: resolveValue(action.address),
    data: new utils.Interface([action.method]).encodeFunctionData(action.method.name, params),
  }
  const { txHash, txWithGas } = await sendTransaction(
    `${action.name}.${action.method.name}(${printableTransactionParams(params)})`,
    options,
    transaction
  )
  context.multisig?.addContractInteraction(txWithGas)
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

function executeContractSave({ address, name }: SaveContractAction, globalOptions: ExecuteOptions) {
  save(globalOptions.deploymentsFile, globalOptions.networkName, name, { address })
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
