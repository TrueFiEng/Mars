import { Chain } from './model'

export const mainnet: Chain = {
  chainId: 1,
  chainName: 'Mainnet',
  getPublicRpc: () => 'https://main-light.eth.linkpool.io/',
  getInfuraRpc: (infuraApiKey) => `https://mainnet.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://eth-mainnet.alchemyapi.io/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://etherscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api.etherscan.io/api',
}

export const ropsten: Chain = {
  chainId: 3,
  chainName: 'Ropsten',
  getPublicRpc: () => 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  getInfuraRpc: (infuraApiKey) => `https://ropsten.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://eth-ropsten.alchemyapi.io/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://ropsten.etherscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-ropsten.etherscan.io/api',
}

export const rinkeby: Chain = {
  chainId: 4,
  chainName: 'Rinkeby',
  getPublicRpc: () => 'https://rinkeby-light.eth.linkpool.io/',
  getInfuraRpc: (infuraApiKey) => `https://rinkeby.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://eth-rinkeby.alchemyapi.io/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://rinkeby.etherscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-rinkeby.etherscan.io/api',
}

export const goerli: Chain = {
  chainId: 5,
  chainName: 'Goerli',
  getPublicRpc: () => 'https://goerli-light.eth.linkpool.io/',
  getInfuraRpc: (infuraApiKey) => `https://goerli.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://eth-goerli.alchemyapi.io/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://goerli.etherscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-goerli.etherscan.io/api',
}

export const kovan: Chain = {
  chainId: 42,
  chainName: 'Kovan',
  getPublicRpc: () => 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  getInfuraRpc: (infuraApiKey) => `https://kovan.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://eth-kovan.alchemyapi.io/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://kovan.etherscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-kovan.etherscan.io/api',
}

export const sepolia: Chain = {
  chainId: 11155111,
  chainName: 'Sepolia',
  getPublicRpc: () => 'https://gateway.tenderly.co/public/sepolia',
  getInfuraRpc: (infuraApiKey) => `https://sepolia.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://eth-sepolia.alchemyapi.io/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://sepolia.etherscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-sepolia.etherscan.io/api',
}
