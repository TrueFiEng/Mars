import { contract, createProxy, deploy, runIf } from 'ethereum-mars'
import { Market, Token, UpgradeabilityProxy } from '../build/artifacts'

deploy({}, (deployer) => {
  const appleImplementation = contract('apple', Token)
  const orangeImplementation = contract('orange', Token, { gasLimit: 1000000 })
  const proxy = createProxy(UpgradeabilityProxy, 'upgradeTo')
  const apple = proxy(appleImplementation, 'initialize', [100])
  const orange = proxy(orangeImplementation, 'initialize', [200])
  const market = contract(Market, [apple, orange])
  runIf(apple.allowance(deployer, market).equals(0), () => apple.approve(market, 100))
    .else(() => orange.approve(market, 100))
  apple.approve(market, apple.totalSupply().add(42), { gasLimit: 1000000 })
  orange.approve(market, orange.totalSupply())
})
