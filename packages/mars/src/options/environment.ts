import { ensureApiKey, ensurePrivateKey } from './checks'
import { Options } from './Options'

export function getEnvironmentOptions(): Options {
  const privateKey = process.env.PRIVATE_KEY
  const etherscanApiKey = process.env.ETHERSCAN_KEY
  const infuraApiKey = process.env.INFURA_KEY
  const alchemyApiKey = process.env.ALCHEMY_KEY

  const result: Options = {}
  if (privateKey) {
    ensurePrivateKey(privateKey, 'Invalid private key provided in the environment variable: PRIVATE_KEY')
    result.privateKey = privateKey
  }
  if (etherscanApiKey) {
    ensureApiKey(etherscanApiKey, 'Invalid api key provided in the environment variable: ETHERSCAN_KEY')
    result.etherscanApiKey = etherscanApiKey
  }
  if (infuraApiKey) {
    ensureApiKey(infuraApiKey, 'Invalid api key provided in the environment variable: INFURA_KEY')
    result.infuraApiKey = infuraApiKey
  }
  if (alchemyApiKey) {
    ensureApiKey(alchemyApiKey, 'Invalid api key provided in the environment variable: ALCHEMY_KEY')
    result.alchemyApiKey = alchemyApiKey
  }

  return result
}
