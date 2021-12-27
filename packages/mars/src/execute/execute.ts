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
import { sendTransaction, TransactionOptions, withGas } from './sendTransaction'
import { read, save, SaveEntry } from './save'
import { isBytecodeEqual } from './bytecode'
import { JsonInputs, verify, verifySingleFile } from '../verification'
import { context } from '../context'
import { MultisigConfig } from '../multisig/multisigConfig'
import { log } from '../logging'

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
    // TODO: improve action logging details
    log('⚙️ EXE ' + action.type)
    const result = await executeAction(action, options)
    if (result && !result.continue) break
  }
}

interface ActionResult {
  /**
   * Whether to continue the pipeline. If false, then all consequent actions are not going to be executed in this run.
   */
  continue: boolean
}

async function executeAction(action: Action, options: ExecuteOptions): Promise<ActionResult | void> {
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
    case 'MULTISIG_START':
      return context.multisig!.executeStart()
    case 'MULTISIG_END':
      return context.multisig!.executeEnd(options)
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
  shouldSkipUpgrade: boolean,
  options: ExecuteOptions
): Promise<string | undefined> {
  const existing = read<SaveEntry>(options.deploymentsFile, options.networkName, name)
  if (!existing) return

  if (existing.multisig) {
    // multisig returns a deterministic addresses
    return existing.address
  } else if (existing.txHash) {
    const [existingTx, receipt] = await Promise.all([
      // TODO: support abstract signers where no provider exists
      options.signer.provider!.getTransaction(existing.txHash),
      options.signer.provider!.getTransactionReceipt(existing.txHash),
    ])
    // TODO: multisig improvement candidate; for now we do not look for internal ex contract deployment data
    if (existingTx && receipt && shouldSkipUpgrade) {
      return existing.address
    }
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
  const existingAddress = await getExistingDeployment(tx, action.name, action.skipUpgrade, options)
  let address: string, txHash: string | undefined
  if (existingAddress) {
    console.log(`Skipping deployment ${action.name} - ${existingAddress}`)
    address = existingAddress
  } else {
    if (action.multisig) {
      address = await action.multisig.addContractDeployment(tx, action.artifact[Bytecode])
    } else {
      // eslint-disable-next-line no-extra-semi,@typescript-eslint/no-extra-semi
      ;({ txHash, address } = await sendTransaction(`Deploy ${action.name}`, options, tx))
    }
    if (!options.dryRun) {
      const multisig = !!action.multisig
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

  if (action.multisig) {
    const txWithGas = await withGas(transaction, options.gasLimit, options.gasPrice, options.signer)
    await action.multisig.addContractInteraction(txWithGas)
  } else {
    const { txHash } = await sendTransaction(
      `${action.name}.${action.method.name}(${printableTransactionParams(params)})`,
      options,
      transaction
    )
    action.resolve(resolveBytesLike(txHash))
  }
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
