import { ArgumentParser } from 'argparse'
import { BigNumber } from 'ethers'
import minimist from 'minimist'
import { ensureApiKey, ensureNetwork, ensurePrivateKey, exit } from './checks'
import { Options } from './Options'

export interface DeployOptions {
  rpc?: string
  network?: string
  gas?: number
  gasPrice?: BigNumber
  yes?: boolean
  dryRun: boolean
  sourcesPath: string
  verify?: boolean
  waffle: string
}

export const parseDeployArgs = (): DeployOptions => {
  const parser = new ArgumentParser({
    description: 'M.A.R.S. - Magically Augmented Release Scripts',
  })

  parser.add_argument('-r', '--rpc', {
    help: 'RPC URL',
    required: false,
    type: String,
  })
  parser.add_argument('-n', '--network', {
    help: 'Network name',
    required: false,
    type: String,
    choices: ['development', 'ropsten', 'goelri', 'mainnet', 'rinkeby', 'kovan'],
  })
  parser.add_argument('--gas', {
    help: 'Gas limit for transactions',
    required: false,
    type: Number,
  })
  parser.add_argument('--gasPrice', {
    help: 'Gas price for transactions',
    required: false,
    type: (value: string) => BigNumber.from(value),
  })
  parser.add_argument('--dryRun', {
    help: 'Dry run',
    action: 'store_true',
  })
  parser.add_argument('--yes', {
    help: 'No confiramtions',
    action: 'store_true',
  })
  parser.add_argument('--sourcesPath', {
    help: 'Paths to contracts that should be validated',
    type: String,
    default: './contracts',
  })
  parser.add_argument('--waffle', {
    help: 'Waffle compiler config',
    type: String,
    default: './waffle.json',
  })
  parser.add_argument('-v', '--verify', {
    help: 'Verify contracts on etherscan',
    action: 'store_true',
  })

  return parser.parse_args()
}

export function getCommandLineOptions (): Options {
  const parsed = minimist(process.argv.slice(2))
  const result: Options = {}

  const privateKey = get(parsed, 'p', 'private-key')
  if (privateKey) {
    ensurePrivateKey(privateKey, 'Invalid private key provided as argument')
    result.privateKey = privateKey
  }

  const network = get(parsed, 'n', 'network')
  if (network) {
    ensureNetwork(network, 'Invalid network provided as argument')
    result.network = network
  }

  const infuraApiKey = get(parsed, 'i', 'infura-key')
  if (infuraApiKey) {
    ensureApiKey(infuraApiKey, 'Invalid infura api key provided as argument')
    result.infuraApiKey = infuraApiKey
  }

  const alchemyApiKey = get(parsed, 'a', 'alchemy-key')
  if (alchemyApiKey) {
    ensureApiKey(alchemyApiKey, 'Invalid alchemy api key provided as argument')
    result.alchemyApiKey = alchemyApiKey
  }

  // const outFile = get(parsed, 'o', 'out-file')
  // const gasPrice = get(parsed, 'g', 'gas-price')
  // const dryRun = get(parsed, 'd', 'dry-run')
  // const yes = get(parsed, 'y', 'yes')
  // const verify = get(parsed, 'v', 'verify')
  // const etherscanApiKey = get(parsed, 'e', 'etherscan-key')
  // const waffleConfig = get(parsed, 'w', 'waffle-config')

  return result
}

function get(parsed: minimist.ParsedArgs, short: string, full: string): unknown {
  if (parsed[short] && parsed[full]) {
    exit(`Both -${short} and --${full} specified`)
  }
  return parsed[short] ?? parsed[full]
}
