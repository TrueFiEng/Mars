import { contract, createProxy, debug, deploy, Options, runIf } from 'ethereum-mars'
import { Market, Token, UpgradeabilityProxy } from '../build/artifacts'
import { logConfig } from 'ethereum-mars/build/src/logging'

const options = {
  network: 'rinkeby',
  logFile: 'tx.log',
  noConfirm: true,
  multisig: true,
  multisigGnosisSafe: '0x8772CD484C059EC5c61459a0abb5A45ece16701f',
  multisigGnosisServiceUri: 'https://safe-transaction.rinkeby.gnosis.io',
} as Options
logConfig.mode.console = false

// based upon https://github.com/trusttoken/smart-contracts/blob/main/deploy/truefi2.ts
// to reproduce complexity level of the standard deployment script
deploy(options, (deployer) => {
  debug(`Deployer is ${deployer}`)

  const proxy = createProxy(UpgradeabilityProxy)

  // new contract implementations
  const firstImpl = contract('firstImpl', Token)
  const secondImpl = contract('secondImpl', Token)

  // new contract proxies
  const firstProxied = proxy(firstImpl, {
    onInitialize: 'initialize',
    params: [112233],
  })
  const secondProxied = proxy(secondImpl)

  // new bare contracts
  const firstBare = contract('firstBare', Token)
  const secondBare = contract('secondBare', Token)

  // contracts that depend on previous deployments in order to construct
  const market = contract('market', Market, [firstProxied, secondBare])

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
  runIf(secondBare.val().equals(222), () => {
    secondBare.initialize(333)
  })
  debug('Balance in firstProxied', firstProxied.balanceOf(deployer))
  debug('Balance in secondBare', secondBare.balanceOf(deployer))
  firstProxied.approve(market, 11111)
  secondBare.approve(market, 22222)
  runIf(
    firstProxied.allowance(deployer, market).gte(11111).and(secondBare.allowance(deployer, market).gte(22222)),
    () => {
      market.supply(11111, 22222)
    }
  )
}).then()
