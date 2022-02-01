import { Chain } from './model'

export const arbitrum: Chain = {
  chainId: 42161,
  chainName: 'Arbitrum',
  getPublicRpc: () => 'https://arb1.arbitrum.io/rpc',
  getInfuraRpc: (infuraApiKey) => `https://arbitrum-mainnet.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://arbiscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api.arbiscan.io/api',
}

export const arbitrum_rinkeby: Chain = {
  chainId: 421611,
  chainName: 'Arbitrum Testnet',
  getPublicRpc: () => 'https://rinkeby.arbitrum.io/rpc',
  getInfuraRpc: (infuraApiKey) => `https://arbitrum-rinkeby.infura.io/v3/${infuraApiKey}`,
  getAlchemyRpc: (alchemyApiKey) => `https://arb-rinkeby.g.alchemy.com/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://testnet.arbiscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-testnet.arbiscan.io/api',
}
