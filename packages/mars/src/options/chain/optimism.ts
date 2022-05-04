import { Chain } from './model'

export const optimism: Chain = {
  chainId: 10,
  chainName: 'Optimism',
  getPublicRpc: () => 'https://mainnet.optimism.io/',
  getInfuraRpc: (infuraApiKey) => `https://optimism-mainnet.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://optimistic.etherscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-optimistic.etherscan.io/api',
}

export const optimism_kovan: Chain = {
  chainId: 69,
  chainName: 'Optimism Kovan',
  getPublicRpc: () => 'https://kovan.optimism.io/',
  getInfuraRpc: (infuraApiKey) => `https://optimism-kovan.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://opt-kovan.g.alchemy.com/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://kovan-optimistic.etherscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-kovan-optimistic.etherscan.io/api',
}
