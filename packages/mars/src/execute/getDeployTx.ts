import { ContractFactory } from 'ethers'
import { Abi } from '../abi'

export function getDeployTx(abi: Abi, bytecode: string, args: any[]) {
  return new ContractFactory(abi, bytecode).getDeployTransaction(...args)
}
