import { Chain } from './model'

export const arbitrum: Chain = {
  chainId: 42161,
  chainName: 'Arbitrum',
  getPublicRPC: () => 'https://arb1.arbitrum.io/rpc',
  getInfuraRPC: (infuraApiKey) => `https://arbitrum-mainnet.infura.io/v3/${infuraApiKey}`,
  getAlchemyRPC: (alchemyApiKey) => `https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://arbiscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api.arbiscan.io/api',
}

export const arbitrum_rinkeby: Chain = {
  chainId: 421611,
  chainName: 'Arbitrum Testnet',
  getPublicRPC: () => 'https://rinkeby.arbitrum.io/rpc',
  getInfuraRPC: (infuraApiKey) => `https://arbitrum-rinkeby.infura.io/v3/${infuraApiKey}`,
  getAlchemyRPC: (alchemyApiKey) => `https://arb-rinkeby.g.alchemy.com/v2/${alchemyApiKey}`,
  getBlockExplorerContractAddress: (contractAddress) => `https://testnet.arbiscan.io/address/${contractAddress}`,
  getEtherscanVerifierApi: () => 'https://api-testnet.arbiscan.io/api',
}
