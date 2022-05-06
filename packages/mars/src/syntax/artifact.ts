import { Abi } from '../abi'
import { context } from '../context'
import { AbiSymbol, Bytecode, DeployedBytecode, Name, Type } from '../symbols'
import { Future } from '../values'

interface CommonFields {
  abi: Abi
  bytecode: string
}

type DeployedBytecodeField = { evm: { deployedBytecode: { object: string } } } | { deployedBytecode: string }

export type ArtifactJSON = CommonFields & DeployedBytecodeField

export type ArtifactFrom<T> = {
  [Name]: string
  [AbiSymbol]: Abi
  [Bytecode]: string
  [DeployedBytecode]: string
  [Type]: T
} & {
  [K in keyof T]: T[K] extends (...args: infer A) => any ? (...args: A) => string : never
}

export function createArtifact<T>(name: string, json: ArtifactJSON): ArtifactFrom<T> {
  let deployedBytecode = ''
  if ('evm' in json) {
    deployedBytecode = json.evm.deployedBytecode.object
  } else {
    deployedBytecode = json.deployedBytecode
  }

  const artifact: any = {
    [Name]: name,
    [AbiSymbol]: json.abi,
    [Bytecode]: json.bytecode,
    [DeployedBytecode]: deployedBytecode,
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
