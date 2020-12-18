# Ethereum Mars
![CI](https://github.com/ethworks/mars/workflows/CI/badge.svg)

Devops tool for Ethereum Smart Contracts to take your project to the moon and beyond.

## Features

### Fearless deployments and updates

Forget about deployment pain! Write once, dry-run and deploy to multiple networks. With support for Proxy pattern, contract updates are first-class citizen.

### Focus on what’s important

Don’t roll your own hacky script. Let Mars handle the details: gas fees, resuming broken deployments, waiting for confirmations and storing the results.

### Infrastructure-as-code

Solidity source does not paint the full picture. Store deployment configuration, environments and infrastructure in your git repository.

### Learn in 5 minutes

No need to learn a new language. Write your configuration in JS/TS with familiar tooling like ethers.js and Waffle.

## Example

Configuration

```ts
import { deploy, connect, contract } from 'ethereum-mars'
import { ERC20, WETH9, AwesomeExchange } from './build/artifacts'

deploy(() => {
  const myToken = contract('myToken', ERC20, [20_000])
  const weth = connect('weth', WETH9, '0xC02a...6Cc2')
  contract(AwesomeExchange, [myToken, weth])
})
```

Output

```
> mars deploy

Transaction: Deploy myToken
  Fee: $5.72, Ξ0.00875217
  Balance: $753.86, Ξ1.15322565145876257
  Hash: 0x98dd...bdd8
  Block: 22650076
  Address: 0x4b0a4...F2f8b

Transaction: Deploy market
  Fee: $2.74, Ξ0.00419342
  Balance: $738.00, Ξ1.13018515145876257
  Sending ...
  Hash: 0x60c0...a2bd
  Block: 22650101
  Address: 0x0522...991F

Done in 20s.
```

## Installation

To install mars use Yarn:
```
yarn add --dev ethereum-mars
```
or if you prefer you can use npm:
```
npm install --save-dev ethereum-mars
```
