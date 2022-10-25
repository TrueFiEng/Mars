import { SimpleContract } from '../fixtures/exampleArtifacts'
import { logConfig } from '../../src/logging'
import { contract, deploy, Options } from '../../src'

const options = {
  network: 'goerli',
  privateKey: 'xxx',
  infuraApiKey: 'xxx',
  disableCommandLineOptions: true,
  verify: true,
  sources: './test/fixtures',
  etherscanApiKey: 'XXX',
  noConfirm: true,
} as Options
logConfig.mode.console = false

describe.only('Verification', () => {
  it('Deploys and verifies on Goerli', async () => {
    await deploy(options, () => {
      contract('SimpleContract', SimpleContract)
    })
  })
})
