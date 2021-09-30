import { BigNumber } from 'ethers'
import minimist from 'minimist'
import {
  ensureApiKey,
  ensureBoolean,
  ensureNetwork,
  ensureNumber,
  ensurePrivateKey,
  ensureString,
  exit,
} from './checks'
import { Options } from './Options'
import { usage, ALLOWED_OPTIONS } from './usage'
import path from 'path'

const STRING_ARGUMENTS = ['p', 'private-key', 'i', 'infura-key', 'a', 'alchemy-key', 'e', 'etherscan-key']

export function getCommandLineOptions(): Options {
  const parsed = minimist(process.argv.slice(2), { string: STRING_ARGUMENTS })
  const result: Options = {}

  const showHelp = get(parsed, 'h', 'help')
  if (showHelp) {
    console.log(usage)
    process.exit(0)
  }

  checkAllowed(parsed)

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

  const outputFile = get(parsed, 'o', 'out-file')
  if (outputFile) {
    ensureString(outputFile, 'Invalid output file provided as argument')
    result.outputFile = outputFile
  }

  const gasPrice = get(parsed, 'g', 'gas-price')
  if (gasPrice) {
    ensureNumber(gasPrice, 'Invalid gas price provided as argument')
    result.gasPrice = BigNumber.from(gasPrice)
  }

  const dryRun = get(parsed, 'd', 'dry-run')
  if (dryRun) {
    ensureBoolean(dryRun, 'You cannot specify a value alongside dry run')
    result.dryRun = dryRun
  }

  const logFile = get(parsed, 'l', 'log')
  if (logFile) {
    ensureString(logFile, 'Invalid log file provided as argument')
    result.logFile = logFile
  }

  const noConfirm = get(parsed, 'y', 'yes')
  if (noConfirm) {
    ensureBoolean(noConfirm, 'You cannot specify a value alongside yes')
    result.noConfirm = noConfirm
  }

  const verify = get(parsed, 'v', 'verify')
  if (verify) {
    if (typeof verify === 'string') {
      const scriptPath = path.join(process.cwd(), verify)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      result.flattenScript = require(scriptPath).default
      result.verify = true
    } else {
      ensureBoolean(verify, 'You cannot specify a value alongside verify')
      result.verify = verify
    }
  }

  const etherscanApiKey = get(parsed, 'e', 'etherscan-key')
  if (etherscanApiKey) {
    ensureApiKey(etherscanApiKey, 'Invalid etherscan api key provided as argument')
    result.etherscanApiKey = etherscanApiKey
  }

  const sources = get(parsed, 's', 'sources')
  if (sources) {
    ensureString(sources, 'Invalid sources directory provided as argument')
    result.sources = sources
  }

  const waffleConfig = get(parsed, 'w', 'waffle-config')
  if (waffleConfig) {
    ensureString(waffleConfig, 'Invalid waffle config file provided as argument')
    result.waffleConfig = waffleConfig
  }

  return result
}

function checkAllowed(parsed: minimist.ParsedArgs) {
  const options = Object.keys(parsed).filter((x) => x !== '_')
  for (const option of options) {
    if (!ALLOWED_OPTIONS.includes(option)) {
      exit(`Invalid option specified: ${option}`)
    }
  }
  if (parsed._.length !== 0) {
    exit(`Invalid option specified: ${parsed._[0]}`)
  }
}

function get(parsed: minimist.ParsedArgs, short: string, full: string): unknown {
  if (parsed[short] && parsed[full]) {
    exit(`Both -${short} and --${full} specified`)
  }
  return parsed[short] ?? parsed[full]
}
