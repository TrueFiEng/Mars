import { Chain } from './Chain'

export const mainnet: Chain = {
  chainId: 1,
  chainName: 'Mainnet',
  getPublicRPC: () => 'https://main-light.eth.linkpool.io/',
  getInfuraRPC: (infuraApiKey) => `https://mainnet.infura.io/v3/${infuraApiKey}`,
  getAlchemyRPC: (alchemyApiKey) => `https://eth-mainnet.alchemyapi.io/v2/${alchemyApiKey}`,
  getEtherscanApi: () => 'https://api.etherscan.io/api',
}

export const ropsten: Chain = {
  chainId: 3,
  chainName: 'Ropsten',
  getPublicRPC: () => 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  getInfuraRPC: (infuraApiKey) => `https://ropsten.infura.io/v3/${infuraApiKey}`,
  getAlchemyRPC: (alchemyApiKey) => `https://eth-ropsten.alchemyapi.io/v2/${alchemyApiKey}`,
  getEtherscanApi: () => 'https://api-ropsten.etherscan.io/api',
}

export const rinkeby: Chain = {
  chainId: 4,
  chainName: 'Rinkeby',
  getPublicRPC: () => 'https://rinkeby-light.eth.linkpool.io/',
  getInfuraRPC: (infuraApiKey) => `https://rinkeby.infura.io/v3/${infuraApiKey}`,
  getAlchemyRPC: (alchemyApiKey) => `https://eth-rinkeby.alchemyapi.io/v2/${alchemyApiKey}`,
  getEtherscanApi: () => 'https://api-rinkeby.etherscan.io/api',
}

export const goerli: Chain = {
  chainId: 5,
  chainName: 'Goerli',
  getPublicRPC: () => 'https://goerli-light.eth.linkpool.io/',
  getInfuraRPC: (infuraApiKey) => `https://goerli.infura.io/v3/${infuraApiKey}`,
  getAlchemyRPC: (alchemyApiKey) => `https://eth-goerli.alchemyapi.io/v2/${alchemyApiKey}`,
  getEtherscanApi: () => 'https://api-goerli.etherscan.io/api',
}

export const kovan: Chain = {
  chainId: 42,
  chainName: 'Kovan',
  getPublicRPC: () => 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  getInfuraRPC: (infuraApiKey) => `https://kovan.infura.io/v3/${infuraApiKey}`,
  getAlchemyRPC: (alchemyApiKey) => `https://eth-kovan.alchemyapi.io/v2/${alchemyApiKey}`,
  getEtherscanApi: () => 'https://api-kovan.etherscan.io/api',
}

export const arbitrum: Chain = {
  chainId: 42161,
  chainName: 'Arbitrum',
  getPublicRPC: () => 'https://arb1.arbitrum.io/rpc',
  getInfuraRPC: (infuraApiKey) => `https://arbitrum-mainnet.infura.io/v3/${infuraApiKey}`,
  getAlchemyRPC: (alchemyApiKey) => `https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  getEtherscanApi: () => 'https://api.arbiscan.io/api',
}

export const arbitrumRinkeby: Chain = {
  chainId: 421611,
  chainName: 'Arbitrum Testnet',
  getPublicRPC: () => 'https://rinkeby.arbitrum.io/rpc',
  getInfuraRPC: (infuraApiKey) => `https://arbitrum-rinkeby.infura.io/v3/${infuraApiKey}`,
  getAlchemyRPC: (alchemyApiKey) => `https://arb-rinkeby.g.alchemy.com/v2/${alchemyApiKey}`,
  getEtherscanApi: () => 'https://api-testnet.arbiscan.io/api',
}
