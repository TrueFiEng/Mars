import { UpgradeabilityProxy, UpgradeableContract } from '../fixtures/exampleArtifacts'
import { logConfig } from '../../src/logging'
import { contract, createProxy, debug, deploy, Options, runIf } from '../../src'
import { multisig } from '../../src/syntax/multisig'

const options = {
  network: 'rinkeby',
  privateKey: process.env.PRIVATE_KEY,
  infuraApiKey: process.env.INFURA_KEY,
  multisigGnosisSafe: '0x8772CD484C059EC5c61459a0abb5A45ece16701f',
  multisigGnosisServiceUri: 'https://safe-transaction.rinkeby.gnosis.io',
  disableCommandLineOptions: true,
} as Options
logConfig.mode.console = true

describe('Multisig', () => {
  it('Executes 2 multisigs in separate runs', async () => {
    await deploy(options, (deployer, config) => {
      debug(`Deployer is ${deployer}`)

      const isRinkeby = config.networkName === 'rinkeby'
      const useMultisig = isRinkeby

      // CREATION Multisig
      const creationMultisig = useMultisig ? multisig('Contract creation, proxying and initialization') : undefined
      const proxy = createProxy(UpgradeabilityProxy)
      const impl = contract('impl', UpgradeableContract)
      const proxied = proxy(impl, 'initialize', [112233])
      creationMultisig?.propose()

      // INIT MULTISIG
      const conditionalInitMultisig = useMultisig ? multisig('Conditional initialization') : undefined
      runIf(proxied.x().equals(112233), () => {
        proxied.initialize(2244)
      })
      conditionalInitMultisig?.propose()
    })
  })
})
