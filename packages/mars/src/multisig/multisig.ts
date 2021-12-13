import { providers } from 'ethers'

export class Multisig {
  public name: string
  public txBatch: providers.TransactionRequest[]
  public isExecuted: boolean
  public txHash?: string

  constructor(name: string) {
    this.name = name
    this.txBatch = []
    this.isExecuted = false
  }

  propose(): void {
    return
  }
}
