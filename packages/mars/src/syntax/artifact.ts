import { Abi } from '../abi'
import { context } from '../context'
import { AbiSymbol, Bytecode, Constructor, Methods, Name } from '../symbols'
import { Future, FutureBytes } from '../values'

export interface Artifact {
  [Name]: string
  [Constructor]: (...args: any) => any
  [Methods]: Record<string, (...args: any) => any>
  [AbiSymbol]: Abi
  [Bytecode]: string
}

export interface ArtifactNoParams extends Artifact {
  [Constructor]: () => any
}

export type Params<T extends Artifact> = Parameters<T[typeof Constructor]>

interface Schema {
  name: string
  constructor: (...args: any) => any
  methods: Record<string, (...args: any) => any>
  abi: Abi
  bytecode: string
}

export type ArtifactFrom<T extends Schema> = {
  [Name]: T['name']
  [Constructor]: T['constructor']
  [Methods]: T['methods']
  [AbiSymbol]: T['abi']
  [Bytecode]: T['bytecode']
} & {
  [K in keyof T['methods']]: (...args: Parameters<T['methods'][K]>) => FutureBytes
}

export function createArtifact<T extends Schema>(value: T): ArtifactFrom<T> {
  const artifact: any = {
    [Name]: value.name,
    [Constructor]: value.constructor,
    [Methods]: value.methods,
    [AbiSymbol]: value.abi,
    [Bytecode]: value.bytecode,
  }
  for (const entry of value.abi) {
    if (entry.type === 'function') {
      artifact[entry.name] = (...args: any[]) => {
        context.ensureEnabled()
        const [result, resolveResult] = Future.create()
        context.actions.push({
          type: 'ENCODE',
          method: entry,
          params: args,
          resolve: resolveResult,
        })
        return result
      }
    }
  }
  return artifact
}
