import { Abi } from '../abi'
import { context } from '../context'
import { AbiSymbol, Bytecode, Name, Type } from '../symbols'
import { Future } from '../values'

export interface ArtifactJSON {
  abi: Abi
  bytecode: string
}

export type ArtifactFrom<T> = {
  [Name]: string
  [AbiSymbol]: Abi
  [Bytecode]: string
  [Type]: T
} & {
  [K in keyof T]: T[K] extends (...args: infer A) => any ? (...args: A) => string : never
}

export function createArtifact<T>(name: string, json: ArtifactJSON): ArtifactFrom<T> {
  const artifact: any = {
    [Name]: name,
    [AbiSymbol]: json.abi,
    [Bytecode]: json.bytecode,
  }
  for (const entry of json.abi) {
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
