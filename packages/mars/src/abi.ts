export interface AbiConstructorEntry {
  type: 'constructor'
  inputs: AbiParam[]
  stateMutability: 'nonpayable' | 'payable'
}

export interface AbiFunctionEntry {
  type: 'function' | 'constructor' | 'receive' | 'fallback'
  name: string
  inputs: AbiParam[]
  outputs?: AbiParam[]
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable'
}

export interface AbiEventEntry {
  type: 'event'
  name: string
  inputs: AbiParam[]
  anonymous?: boolean
}

export type AbiEntry = AbiConstructorEntry | AbiFunctionEntry | AbiEventEntry

export type Abi = AbiEntry[]

export interface AbiParam {
  name: string
  type: string
  internalType?: string
  indexed?: boolean
  components?: any
}
