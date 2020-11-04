import { Contract, contract, makeContractInstance, Options } from './contract'
import { Artifact, ArtifactNoParams, Params } from './artifact'
import { Address, ArtifactSymbol, Constructor, Methods, Name } from '../symbols'
import { BooleanLike } from '../values'
import { context } from '../context'
import { constants } from 'ethers'

export type Proxy = (<T extends Artifact, U extends keyof T[typeof Methods]>(
  name: string,
  contract: Contract<T>,
  onInitialize: U,
  params: Parameters<T[typeof Methods][U]>
) => Contract<T>) &
  (<T extends Artifact, U extends keyof T[typeof Methods]>(
    contract: Contract<T>,
    onInitialize: U,
    params: Parameters<T[typeof Methods][U]>
  ) => Contract<T>) &
  (<T extends Artifact>(
    name: string,
    contract: Contract<T>,
    onInitialize: (contract: Contract<T>) => unknown
  ) => Contract<T>) &
  (<T extends Artifact>(contract: Contract<T>, onInitialize: (contract: Contract<T>) => unknown) => Contract<T>)

type MethodCall<T extends Artifact> = keyof T[typeof Methods] | ((contract: Contract<T>) => unknown)

export function createProxy<T extends ArtifactNoParams>(
  artifact: T,
  onUpgrade?: MethodCall<T>,
  options?: Options
): Proxy
export function createProxy<T extends Artifact>(
  artifact: T,
  params: Params<T>,
  onUpgrade?: MethodCall<T>,
  options?: Options
): Proxy
export function createProxy(...args: any[]): any {
  const artifact: Artifact = args[0]
  const params: any[] = artifact[Constructor].length > 0 ? args[1] : []
  const onUpgradeIndex = params.length > 0 ? 2 : 1
  const onUpgrade: any = args[onUpgradeIndex] ?? 'upgradeTo'
  const options: Options = args[onUpgradeIndex + 1] ?? {}

  return (...args: any[]) => {
    const [name, implementation, onInitialize] = parseProxyArgs(...args)
    const proxy = contract(name ?? `${implementation[Name]}_proxy`, artifact, params, options)
    // TODO support proxies without implementation method
    const currentImplementation = proxy.implementation()

    const normalizedOnUpgrade = normalizeCall(proxy, onUpgrade, [implementation])
    runIf(
      () => currentImplementation.equals(implementation[Address]).not(),
      () => normalizedOnUpgrade(proxy)
    )

    const contractBehindProxy = makeContractInstance(
      implementation[Name],
      implementation[ArtifactSymbol],
      proxy[Address]
    )
    runIf(
      () => currentImplementation.equals(constants.AddressZero),
      () => onInitialize(contractBehindProxy)
    )

    return contractBehindProxy
  }
}

function runIf(condition: () => BooleanLike, action: () => any) {
  context.ensureEnabled()

  context.actions.push({
    type: 'CONDITIONAL_START',
    condition,
  })

  action()

  context.actions.push({
    type: 'CONDITIONAL_END',
  })
}

function parseProxyArgs(...args: any[]): [string, Contract<any>, (contract: Contract<any>) => unknown] {
  const withName = typeof args[0] === 'string'
  const name: string = withName ? args[0] : undefined
  const contract: Contract<any> = args[withName ? 1 : 0]
  const params = args[withName ? 3 : 2]
  const onInitialize = normalizeCall(contract, args[withName ? 2 : 1], params)
  return [name, contract, onInitialize as (contract: Contract<any>) => unknown]
}

function normalizeCall<T extends Artifact>(
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
