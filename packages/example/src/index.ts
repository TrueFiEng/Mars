import { contract, createProxy, deploy } from 'ethereum-mars'
import { Market, Token, UpgradeabilityProxy } from '../build/artifacts'

deploy({}, () => {
  const proxy = createProxy(UpgradeabilityProxy, 'upgradeTo')
  const dai = proxy(contract('dai', Token), 'initialize', [100])
  const btc = proxy(contract('btc', Token), 'initialize', [200])
  const market = contract(Market, [dai, btc])
  dai.approve(market, dai.totalSupply().add(42))
  btc.approve(market, btc.totalSupply())
})
