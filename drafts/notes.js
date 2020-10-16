// use

import { run, contract, switchChain } from 'ethereum-mars'
import * as Mainnet from '../build/artifacts.ts'
import * as Ropsten from '../build2/artifacts.ts'

// cli arguments
// environment
// options in code


// AddressLike: string, FutureString, Contract, Wallet
// NumberLike: number, string, BigNumber, FutureBigNumber, FutureNumber, BigNumberish?
// BooleanLike
// BytesLike
// StringLike: string, FutureString

// $ mars generate inDir outFile

// $ ts-node scripts/deploy.ts [--network ropsten]
// $ mars scripts/deploy.ts [--network ropsten]


// tasks
// 1. generate (Dima)
// 2. cli for script (config) -> (options)
//    - arguments
//    - env variables
//    - pretty print
// 3. syntax
//    3.1 contract
//    3.2 method
//    3.3 Future
// 4. runner
//    4.1 fork
//    4.2 actual
//    4.3 deployments.json

const options = {
  gasPrice: 32
}

run(options, () => {
  const Token = switchChain({
    mainnet: Mainnet.Token,
    ropsten: Ropsten.Token
  })

  const dai = contract('dai', Token) // FutureContract
  const supply = dai.totalSupply() // FutureBigNumber
  const btc = contract('btc', Token)
  contract(Market, [dai, btc, supply])
})

// type Action = {
//   kind: 'DEPLOY'
//   aftifact: Artifact,
//   args: Future[]
//   resolveTo: Future
// } | {
//   kind: 'CALL',
//   contract: Contract
//   args: Future[]
//   resolveTo: Future
// }
// output is saved to deployment.json

// api

// just deploy, name is "artifact"
contract(Artifact)
// deploy with constructor parameters
contract(Artifact, [a, b])
// deploy with named constructor parameters
contract(Artifact, { a: 1, b: 'foo' })
// deploy with name "bob"
contract('bob', Artifact)
// deploy with name and constructor parameters
contract('bob', Artifact, [a, b])
// deploy with name and named constructor parameters
contract('bob', Artifact, { a: 1, b: 'foo' })
// deploy with options
contract(Artifact, [], {
  useUniversalDeployer: true
})
// deploy with name and options
contract('bob', Artifact, [], {
  useUniversalDeployer: true
})
// deploy with name and constructor parameters and options
contract('bob', Artifact, [a, b], {
  useUniversalDeployer: true
})
// deploy with name and named constructor parameters and options
contract('bob', Artifact, { a: 1, b: 'foo' }, {
  useUniversalDeployer: true
})
