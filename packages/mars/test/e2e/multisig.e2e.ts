import { UpgradeabilityProxy, UpgradeableContract } from '../fixtures/exampleArtifacts'
import { logConfig } from '../../src/logging'
import { contract, createProxy, debug, deploy, Options, runIf } from '../../src'

const options = {
  network: 'rinkeby',
  privateKey: process.env.PRIVATE_KEY,
  infuraApiKey: process.env.INFURA_KEY,
  multisig: true,
  multisigGnosisSafe: '0x8772CD484C059EC5c61459a0abb5A45ece16701f',
  multisigGnosisServiceUri: 'https://safe-transaction.rinkeby.gnosis.io',
  disableCommandLineOptions: true,
  noConfirm: true,
} as Options
logConfig.mode.console = true

describe('Multisig', () => {
  it('Dry-runs transactions, collects them as multisig batch and proposes to Gnosis Safe', async () => {
    await deploy(options, (deployer, config) => {
      debug(`Deployer is ${deployer}`)

      const proxy = createProxy(UpgradeabilityProxy)
      const impl = contract('impl', UpgradeableContract)
      const proxied = proxy(impl, {
        onInitialize: 'initialize',
        params: [112233],
      })

      debug('Proxied value:', proxied.x())
      runIf(proxied.x().equals(112233), () => {
        proxied.resetTo(102030)
      })
    })
  })
})
