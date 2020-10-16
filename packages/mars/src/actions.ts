import { AbiFunctionEntry } from './abi'
import { Artifact } from './syntax/artifact'
import { Future } from './values'
export type Action = DeployAction | ReadAction | TransactionAction | EncodeAction

export interface DeployAction {
  type: 'DEPLOY'
  artifact: Artifact
  name: string
  params: any[]
  options: any
  resolve: (address: string) => void
}

export interface ReadAction {
  type: 'READ'
  address: Future<string>
  method: AbiFunctionEntry
  params: any[]
  resolve: (value: any) => void
}

export interface TransactionAction {
  type: 'TRANSACTION'
  name: string
  address: Future<string>
  method: AbiFunctionEntry
  params: any[]
  resolve: (value: any) => void
}

export interface EncodeAction {
  type: 'ENCODE'
  method: AbiFunctionEntry
  params: any[]
  resolve: (value: Buffer) => void
}
