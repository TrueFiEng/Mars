import { contract, createProxy, deploy, runIf } from 'ethereum-mars'
import { Market, Token, UpgradeabilityProxy } from '../build/artifacts'

deploy({}, (deployer: string) => {
  const proxy = createProxy(UpgradeabilityProxy, 'upgradeTo')
  const dai = proxy(contract('dai', Token), 'initialize', [100])
  const btc = proxy(contract('btc', Token), 'initialize', [200])
  const market = contract(Market, [dai, btc])
  runIf(dai.allowance(deployer, market).equals(0), () => dai.approve(market, 100))
    .else(() => btc.approve(market, 100))
  dai.approve(market, dai.totalSupply().add(42))
  btc.approve(market, btc.totalSupply())
})
