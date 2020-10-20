import { ArgumentParser } from 'argparse'
import { BigNumber } from 'ethers'

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
