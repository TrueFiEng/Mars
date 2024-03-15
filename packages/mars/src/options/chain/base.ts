import { Chain } from './model'

export const base: Chain = {
  chainId: 8453,
  chainName: 'Base',
  getPublicRpc: () => 'https://mainnet.base.org',
  getInfuraRpc: (infuraApiKey) => `https://base-mainnet.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://basescan.org/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api.basescan.org/api',
}

export const base_sepolia: Chain = {
  chainId: 84532,
  chainName: 'Base Sepolia',
  getPublicRpc: () => 'https://sepolia.base.org',
  getInfuraRpc: (infuraApiKey) => `https://base-sepolia.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://sepolia.basescan.org/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-sepolia.basescan.org/api',
}
