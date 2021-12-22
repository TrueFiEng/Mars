import { contract, createProxy, deploy, runIf, debug, flatMap } from 'ethereum-mars'
import { Market, Token, UpgradeabilityProxy } from '../build/artifacts'
import { Address } from 'ethereum-mars/build/src/symbols'

deploy({}, (deployer) => {
  const appleImplementation = contract('apple', Token)
  const orangeImplementation = contract('orange', Token, { gasLimit: 1000000 })
  const deployBehindProxy = createProxy(UpgradeabilityProxy, 'upgradeTo')
  const apple = deployBehindProxy(appleImplementation, 'initialize', [100])
  const orange = deployBehindProxy(orangeImplementation, 'initialize', [200])
  const market = contract(Market, [apple, orange])
  debug('Apple', apple)
  debug('Allowances', [apple.allowance(deployer, market), orange.allowance(deployer, market)])
  runIf(apple.allowance(deployer, market).equals(0), () => apple.approve(market, 100)).else(() =>
    orange.approve(market, 100)
  )
  flatMap([apple[Address], orange[Address]], (appleAddress, orangeAddress) =>
    console.log(`${appleAddress}${orangeAddress}`)
  )
  apple.approve(market, apple.totalSupply().add(42), { gasLimit: 1000000 })
  orange.approve(market, orange.totalSupply())
})
