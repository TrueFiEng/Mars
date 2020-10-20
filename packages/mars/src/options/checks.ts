import { usage } from "./usage"

const PRIVATE_KEY_REGEX = /^0x[a-f\d]{64}$/i
export function ensurePrivateKey(value: unknown, message: string): asserts value is string {
  ensureRegex(PRIVATE_KEY_REGEX, value, message)
}

const API_KEY_REGEX = /^[^\s]+$/
export function ensureApiKey(value: unknown, message: string): asserts value is string {
  ensureRegex(API_KEY_REGEX, value, message)
}

function ensureRegex (regex: RegExp, value: unknown, message: string) {
  ensure(value => typeof value === 'string' && regex.test(value), value, message)
}

const NETWORKS = ['development', 'kovan', 'ropsten', 'goerli', 'rinkeby', 'mainnet']
const URL_REGEX = /^https?\:\/\/[^\s]+$/
function isProperNetwork (value: unknown) {
  return typeof value === 'string' && (NETWORKS.includes(value) || URL_REGEX.test(value))
}
export function ensureNetwork (value: unknown, message: string): asserts value is string {
  ensure(isProperNetwork, value, message)
}

function ensure <T> (check: (value: T) => boolean, value: T, message: string) {
  if (!check(value)) {
    exit(message)
  }
}

export function exit (message: string) {
  console.error(message)
  console.log(usage)
  process.exit(1)
}
