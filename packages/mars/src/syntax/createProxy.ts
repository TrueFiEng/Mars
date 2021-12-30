import { ConstructorParams, contract, Contract, makeContractInstance, NoParams, WithParams } from './contract'
import { Address, ArtifactSymbol, Name } from '../symbols'
import { Future } from '../values'
import { constants, utils } from 'ethers'
import { ArtifactFrom } from './artifact'
import { runIf } from './conditionals'

type Params<T> = T extends (...args: infer A) => any ? A : never

/**
 * Optional arguments for proxy instance creation
 */
type ProxyOptionals<T, U extends keyof T> = {
  /**
   * Custom name for the proxied contract
   */
  name?: string
  /**
   * Routine to be executed at first deployment
   */
  onInitialize?: U
  /**
   * Params for the initialization routine
   */
  params?: Params<T[U]>
  /**
   * If set to true, it prevents proxied contract from being redeployed when e.g. ctor argument containing initial
   * implementation address changes.
   */
  noRedeploy?: boolean
}

/**
 * Proxy that wraps contract implementations. Exposes factory methods that create wrapped instances of contracts.
 * Such proxy instances take care of specific contract proxies deployment, initialization and upgrades if underlying
 * implementation changes.
 */
export interface Proxy {
  /**
   * Creates a proxied implementation for a contract with optional initialization routine.
   * @param contract logic contract
   * @param onInitialize initialization routine to be performed once at the first deployment
   */ <T>(contract: Contract<T>, onInitialize?: (contract: Contract<T>) => unknown): Contract<T>

  /**
   * Creates a proxied implementation for a contract with optional initialization routine and its params.
   * @param contract logic contract
   * @param onInitialize initialization routine to be performed once at the first deployment
   * @param params parameters to the initialization routine
   */ <T, U extends keyof T>(contract: Contract<T>, onInitialize?: U, params?: Params<T[U]>): Contract<T>

  /**
   * Creates a named proxied implementation for a contract with optional initialization routine.
   * @param name custom name of the proxied contract
   * @param contract logic contract
   * @param onInitialize initialization routine to be performed once at the first deployment
   */ <T>(name: string, contract: Contract<T>, onInitialize?: (contract: Contract<T>) => unknown): Contract<T>

  /**
   * Creates a named proxied implementation for a contract with optional initialization routine and its params.
   * @param name custom name of the proxied contract
   * @param contract logic contract
   * @param onInitialize initialization routine to be performed once at the first deployment
   * @param params parameters to the initialization routine
   */ <T, U extends keyof T>(name: string, contract: Contract<T>, onInitialize?: U, params?: Params<T[U]>): Contract<T>

  /**
   * Creates a proxied implementation for a contract with a set of optional arguments.
   * @param contract logic contract
   * @param optionals set of optional parameters
   */ <T, U extends keyof T>(contract: Contract<T>, optionals: ProxyOptionals<T, U>): Contract<T>
}

type MethodCall<T> = keyof T | ((contract: Contract<T>) => unknown)

function getImplementation(
  proxy: Contract<{
    new (...args: any): void
    implementation(): Future<string>
  }>
): Future<string> {
  // Storage slot defined in EIP-1967 https://eips.ethereum.org/EIPS/eip-1967
  const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
  if (proxy.implementation) {
    return proxy.implementation()
  }
  return proxy.getStorageAt(IMPLEMENTATION_SLOT).map((slot) => utils.getAddress(`0x${slot.slice(-40)}`))
}

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
    const [name, implementation, onInitialize, noRedeploy] = parseProxyArgs(...args)
    const proxy = contract<{
      new (...args: any): void
      implementation(): Future<string>
    }>(name ?? `${implementation[Name]}_proxy`, artifact as any, params, { skipUpgrade: noRedeploy })
    const currentImplementation = getImplementation(proxy)

    const normalizedOnUpgrade = normalizeCall(proxy, onUpgrade, [implementation])
    runIf(currentImplementation.equals(implementation[Address]).not(), () => normalizedOnUpgrade(proxy))

    const contractBehindProxy = makeContractInstance(
      implementation[Name],
      implementation[ArtifactSymbol],
      proxy[Address]
    )
    runIf(currentImplementation.equals(constants.AddressZero), () => onInitialize && onInitialize(contractBehindProxy))

    return contractBehindProxy
  }
}

// refactoring: provide a proxy instance with params convergence function
function parseProxyArgs(
  ...args: any[]
): [string, Contract<any>, ((contract: Contract<any>) => unknown) | undefined, boolean] {
  const hasObjectParam = args.length == 2 && typeof args[1] !== 'function' && typeof args[1] !== 'string'
  const objectParam = (hasObjectParam ? args[1] : {}) as ProxyOptionals<any, any>
  const withName = typeof args[0] === 'string'
  const name: string = withName ? args[0] : objectParam.name
  const contract: Contract<any> = args[withName ? 1 : 0]
  const onInitialize = hasObjectParam ? objectParam.onInitialize : args[withName ? 2 : 1]
  const onInitializeParams = (hasObjectParam ? objectParam.params : args[withName ? 3 : 2]) ?? []
  const onInitializeNormalized = onInitialize ? normalizeCall(contract, onInitialize, onInitializeParams) : undefined
  const noRedeploy = objectParam.noRedeploy ?? false
  return [name, contract, onInitializeNormalized, noRedeploy]
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
