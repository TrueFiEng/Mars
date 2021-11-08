import { ArtifactFrom } from './artifact'
import { AbiSymbol, Address, ArtifactSymbol, Name } from '../symbols'
import { context } from '../context'
import { Future, FutureBoolean, FutureBytes, FutureNumber, resolveBytesLike, resolveNumberLike } from '../values'
import { AbiConstructorEntry } from '../abi'
import { TransactionOverrides } from '../execute/execute'

export type Contract<T> = {
  [ArtifactSymbol]: ArtifactFrom<T>
  [Name]: string
  [Address]: Future<string>
} & {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => R : never
}

export type ConstructorParams<T> = T extends { new (...args: infer A): any } ? A : any

export interface NoParams {
  new (): any
}

export interface WithParams {
  new (first: any, ...args: any): any
}

export function contract<T extends NoParams>(artifact: ArtifactFrom<T>): Contract<T>
export function contract<T extends NoParams>(artifact: ArtifactFrom<T>, options: TransactionOverrides): Contract<T>
export function contract<T extends NoParams>(name: string, artifact: ArtifactFrom<T>): Contract<T>
export function contract<T extends NoParams>(
  name: string,
  artifact: ArtifactFrom<T>,
  options: TransactionOverrides
): Contract<T>
export function contract<T extends WithParams>(artifact: ArtifactFrom<T>, params: ConstructorParams<T>): Contract<T>
export function contract<T extends WithParams>(
  artifact: ArtifactFrom<T>,
  params: ConstructorParams<T>,
  options: TransactionOverrides
): Contract<T>
export function contract<T extends WithParams>(
  name: string,
  artifact: ArtifactFrom<T>,
  params: ConstructorParams<T>
): Contract<T>
export function contract<T extends WithParams>(
  name: string,
  artifact: ArtifactFrom<T>,
  params: ConstructorParams<T>,
  options: TransactionOverrides
): Contract<T>
export function contract(...args: any[]): any {
  context.ensureEnabled()

  const { name, artifact, params, options } = parseContractArgs(...args)
  const constructor = artifact[AbiSymbol].find(({ type }) => type === 'constructor') as AbiConstructorEntry

  const [address, resolveAddress] = Future.create<string>()

  context.actions.push({
    type: 'DEPLOY',
    name,
    constructor,
    artifact,
    params,
    options,
    resolve: resolveAddress,
    skipUpgrade: !!options.skipUpgrade,
  })

  return makeContractInstance(name, artifact, address)
}

function unCapitalize(value: string) {
  return value !== '' ? `${value[0].toLowerCase()}${value.substring(1)}` : ''
}

function parseContractArgs(
  ...args: any[]
): {
  name: string
  artifact: ArtifactFrom<any>
  params: ConstructorParams<any>
  options: TransactionOverrides
} {
  const withName = typeof args[0] === 'string'
  const artifactIndex = withName ? 1 : 0
  const artifact = args[artifactIndex]
  const name = withName ? args[0] : unCapitalize(artifact[Name])
  const withParams = Array.isArray(args[artifactIndex + 1])
  const params = withParams ? args[artifactIndex + 1] : []
  const options = (withParams ? args[artifactIndex + 2] : args[artifactIndex + 1]) ?? {}
  return { name, artifact, options, params }
}

export function makeContractInstance<T>(name: string, artifact: ArtifactFrom<T>, address: Future<string>): Contract<T> {
  const contract: any = {
    [ArtifactSymbol]: artifact,
    [Address]: address,
    [Name]: name,
  }
  for (const entry of artifact[AbiSymbol]) {
    if (entry.type === 'function') {
      contract[entry.name] = (...args: any[]) => {
        context.ensureEnabled()
        const [result, resolveResult] = Future.create()
        const isView = ['pure', 'view'].includes(entry.stateMutability)
        let options = {}
        let params = args
        if (!isView && args.length > entry.inputs.length) {
          options = args[args.length - 1]
          params = params.slice(0, args.length - 1)
        }
        context.actions.push({
          type: isView ? 'READ' : 'TRANSACTION',
          name,
          address: address,
          method: entry,
          params,
          options,
          resolve: resolveResult,
        })
        const type = entry.outputs?.[0]?.type
        const length = entry.outputs?.length
        return type && length === 1 && isView ? castFuture(type, result) : result
      }
    }
  }
  return contract
}

function castFuture(type: string, future: Future<any>): Future<any> {
  if (type.startsWith('uint') || type.startsWith('int')) {
    return new FutureNumber(future.map(resolveNumberLike).resolve)
  } else if (type === 'bool') {
    return new FutureBoolean(future.resolve)
  } else if (type.startsWith('byte')) {
    return new FutureBytes(future.map(resolveBytesLike).resolve)
  } else {
    return future
  }
}
