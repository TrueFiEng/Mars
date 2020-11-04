import { Artifact, ArtifactNoParams, Params } from './artifact'
import { AbiSymbol, Address, ArtifactSymbol, Methods, Name } from '../symbols'
import { context } from '../context'
import { Future, FutureBoolean, FutureBytes, FutureNumber, resolveBytesLike, resolveNumberLike } from '../values'
import { AbiConstructorEntry } from '../abi'

export type Contract<T extends Artifact> = {
  [ArtifactSymbol]: T
  [Address]: Future<string>
  [Name]: string
} & {
  [K in keyof T[typeof Methods]]: T[typeof Methods][K]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Options {}

export function contract<T extends ArtifactNoParams>(artifact: T): Contract<T>
export function contract<T extends ArtifactNoParams>(name: string, artifact: T): Contract<T>
export function contract<T extends Artifact>(artifact: T, params: Params<T>, options?: Options): Contract<T>
export function contract<T extends Artifact>(
  name: string,
  artifact: T,
  params: Params<T>,
  options?: Options
): Contract<T>
export function contract(...args: any[]): any {
  context.ensureEnabled()

  const withName = typeof args[0] === 'string'
  const artifact: Artifact = withName ? args[1] : args[0]
  const name: string = withName ? args[0] : unCapitalize(artifact[Name])
  const params = (withName ? args[2] : args[1]) ?? []
  const options = (withName ? args[3] : args[2]) ?? {}
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
  })

  return makeContractInstance(name, artifact, address)
}

function unCapitalize(value: string) {
  return value !== '' ? `${value[0].toLowerCase()}${value.substring(1)}` : ''
}

export function makeContractInstance<T extends Artifact>(
  name: string,
  artifact: T,
  address: Future<string>
): Contract<T> {
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
        context.actions.push({
          type: isView ? 'READ' : 'TRANSACTION',
          name,
          address: address,
          method: entry,
          params: args,
          resolve: resolveResult,
        })
        const type = entry.outputs?.[0]?.type
        return type && isView ? castFuture(type, result) : result
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
