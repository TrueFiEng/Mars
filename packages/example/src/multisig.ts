import { contract, createProxy, deploy, runIf } from 'ethereum-mars'
import { Market, Token, UpgradeabilityProxy } from '../build/artifacts'

// based upon https://github.com/trusttoken/smart-contracts/blob/main/deploy/truefi2.ts
// to reproduce complexity level of the standard deployment script
deploy({}, (_, config) => {
  const proxy = createProxy(UpgradeabilityProxy)
  const isRinkeby = config.networkName === 'rinkeby'

  // existing contracts, already deployed
  const wellKnown = isRinkeby ? '0x124BCA8F86a1eC3b84d68BEDB0Cc640D301C3eEF' : contract('wellKnown', Token)
  const preProxied = proxy(contract('preProxied', Token))

  // new contract implementations
  const firstImpl = contract('firstImpl', Token)
  const secondImpl = contract('secondImpl', Token)

  // new contract proxies
  const firstProxied = proxy(firstImpl, 'initialize', [112233])
  const secondProxied = proxy(secondImpl)

  // new bare contracts
  const firstBare = contract('firstBare', Token)
  const secondBare = contract('secondBare', Token)

  // contracts that depend on previous deployments in order to construct
  const firstMarket = contract('firstMarket', Market, [wellKnown, preProxied])
  const secondMarket = contract('secondMarket', Market, [firstProxied, secondBare])

  // contract initialization
  runIf(firstProxied.isInitialized().not(), () => {
    firstProxied.initialize(1002003)
  })
  runIf(secondProxied.isInitialized().not(), () => {
    secondProxied.initialize(908007)
  })
  runIf(firstBare.val().equals(0), () => {
    firstBare.initialize(111)
  })
  runIf(secondBare.val().equals(0), () => {
    secondBare.initialize(222)
  })
  // the following one is to show initialization has not happened in the multisig yet
  // we need to move the below to a separate multisig group
  runIf(secondBare.val().equals(222), () => {
    secondBare.initialize(333)
  })

  // to show dependencies on initialization of other contracts
  firstMarket.supply(11111, 22222)
  runIf(firstProxied.val().equals(0).not().and(secondBare.val().equals(0).not()), () => {
    secondMarket.supply(33333, 44444)
  })
}).then()
