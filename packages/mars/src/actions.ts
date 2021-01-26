import { AbiConstructorEntry, AbiFunctionEntry } from './abi'
import { ArtifactFrom } from './syntax/artifact'
import { BooleanLike, Future } from './values'
import { TransactionOptions } from './execute/sendTransaction'
export type Action =
  | DeployAction
  | ReadAction
  | TransactionAction
  | EncodeAction
  | StartConditionalAction
  | EndConditionalAction
  | DebugAction

export interface DeployAction {
  type: 'DEPLOY'
  artifact: ArtifactFrom<any>
  constructor: AbiConstructorEntry
  name: string
  params: any[]
  options: Partial<TransactionOptions>
  resolve: (address: string) => void
}

export interface StartConditionalAction {
  type: 'CONDITIONAL_START'
  condition: BooleanLike
}

export interface EndConditionalAction {
  type: 'CONDITIONAL_END'
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
  options: Partial<TransactionOptions>
  resolve: (value: any) => void
}

export interface EncodeAction {
  type: 'ENCODE'
  method: AbiFunctionEntry
  params: any[]
  resolve: (value: Buffer) => void
}

export interface DebugAction {
  type: 'DEBUG'
  messages: any[]
}
