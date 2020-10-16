# Ethereum Mars 👨‍🚀
### A military grade smart contract multi tool.
- **M**agical
- **A**wesome
- **R**obust
- **S**imple

## 👽 About
What Ethereum Mars offers you?
- first
- second
- third

It provides you with simple, powerful interface and cutting edge functionality.

## ⛏️ Installation
In order to add Ethereum Mars to your project install it with your favourite package manager.
#### 🧶 Yarn
```
yarn add ethereum-mars
```
#### 📦 NPM
```
npm install --save ethereum-mars
```

## 🛰️ Usage
### 🪐 Generate artifacts
The first step you need to take is to generate deployment artifacts from your solidity compilation products. To do that you need to run following command:
```
mars generate <idk_what_are_the_params>
```
### ✨ Prepare script
Once you have done that you can start creating your first deployment script. Let's discuss the following example:

`deploy.ts`
```
import { deploy, contract } from 'ethereum-mars'
import { Token, Market } from '../build/artifacts.ts'

deploy(() => {
  const cosmoCoin = contract('cosmoCoin', Token)
  const astroAsset = contract('astroAsset', Token)

  const market = contract('market', Market, [cosmoCoin, astroAsset])

  cosmoCoin.approve(market, 100)
  astroAsset.approve(market, 100)
})
```
### 🚀 Deploy
Now you just need to run your sciprt, passing the rest of the essential configuration
```
mars deploy.ts <idk_what_are_the_params>
```

### 🔭 Preview deloyment
Mars will automatically generate you a file wrapping whole deployment. You will find there all essenctial data, like addresses etc.

## 🧰 Configuration
There are three ways of feeding deployment with options. Lorem ipsum.
### 🌎 Environment
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
### 📟 CLI arguments
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
### 💻 Code
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
