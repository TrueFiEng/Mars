import { ConstructorParams, contract, Contract, makeContractInstance, NoParams, WithParams } from './contract'
import { Address, ArtifactSymbol, Name } from '../symbols'
import { Future } from '../values'
import { constants } from 'ethers'
import { ArtifactFrom } from './artifact'
import { runIf } from './conditionals'

type Params<T> = T extends (...args: infer A) => any ? A : never

export interface Proxy {
  <T, U extends keyof T>(name: string, contract: Contract<T>, onInitialize?: U, params?: Params<T[U]>): Contract<T>
  <T, U extends keyof T>(contract: Contract<T>, onInitialize?: U, params?: Params<T[U]>): Contract<T>
  <T>(name: string, contract: Contract<T>, onInitialize?: (contract: Contract<T>) => unknown): Contract<T>
  <T>(contract: Contract<T>, onInitialize?: (contract: Contract<T>) => unknown): Contract<T>
}

type MethodCall<T> = keyof T | ((contract: Contract<T>) => unknown)

export function createProxy<T extends NoParams>(artifact: ArtifactFrom<T>, onUpgrade?: MethodCall<T>): Proxy
export function createProxy<T extends WithParams>(
  artifact: ArtifactFrom<T>,
  params: ConstructorParams<T>,
  onUpgrade?: MethodCall<T>
): Proxy
export function createProxy(...args: any[]): any {
  const artifact: ArtifactFrom<any> = args[0]
  const params: any[] = Array.isArray(args[1]) ? args[1] : []
  const onUpgradeIndex = params.length > 0 ? 2 : 1
  const onUpgrade: any = args[onUpgradeIndex] ?? 'upgradeTo'

  return (...args: any[]) => {
    const [name, implementation, onInitialize] = parseProxyArgs(...args)
    const proxy = contract<{
      new (...args: any): void
      implementation(): Future<string>
    }>(name ?? `${implementation[Name]}_proxy`, artifact as any, params)
    // TODO support proxies without implementation method
    const currentImplementation = proxy.implementation()

    const normalizedOnUpgrade = normalizeCall(proxy, onUpgrade, [implementation])
    runIf(currentImplementation.equals(implementation[Address]).not(), () => normalizedOnUpgrade(proxy))

    const contractBehindProxy = makeContractInstance(
      implementation[Name],
      implementation[ArtifactSymbol],
      proxy[Address]
    )
    runIf(currentImplementation.equals(constants.AddressZero),
      () => onInitialize && onInitialize(contractBehindProxy))

    return contractBehindProxy
  }
}

function parseProxyArgs(...args: any[]): [string, Contract<any>, ((contract: Contract<any>) => unknown) | undefined] {
  const withName = typeof args[0] === 'string'
  const name: string = withName ? args[0] : undefined
  const contract: Contract<any> = args[withName ? 1 : 0]
  const params = args[withName ? 3 : 2] ?? []
  const onInitializeArg = args[withName ? 2 : 1];
  const onInitialize = onInitializeArg ? normalizeCall(contract, onInitializeArg, params) : undefined
  return [name, contract, onInitialize as (contract: Contract<any>) => unknown]
}

function normalizeCall<T>(
  contract: Contract<T>,
  call: MethodCall<T>,
  params: any[]
): (contract: Contract<T>) => unknown {
  if (typeof call === 'function') {
    return call
  }
  const methodName = call
  return (contract: Contract<T>) => contract[methodName](...params)
}
