import { contract, deploy } from 'ethereum-mars'
import { Market, Token } from '../build/artifacts'

deploy({}, () => {
  const dai = contract('dai', Token)
  const btc = contract('btc', Token)
  const market = contract(Market, [dai, btc])
  dai.approve(market, dai.totalSupply().add(42))
  btc.approve(market, btc.totalSupply())
})
