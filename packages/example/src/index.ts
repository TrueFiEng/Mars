import { contract, deploy } from 'ethereum-mars'
import { Market, Token, OwnedUpgradeabilityProxy } from '../build/artifacts'
import { createProxy } from 'ethereum-mars/build/src/syntax/createProxy'

deploy({}, () => {
  const proxy = createProxy(OwnedUpgradeabilityProxy, 'upgradeTo')
  const dai = proxy(contract('dai', Token), 'initialize', [100])
  const btc = proxy(contract('btc', Token), 'initialize', [200])
  const market = contract(Market, [dai, btc])
  dai.approve(market, dai.totalSupply().add(42))
  btc.approve(market, btc.totalSupply())
})
