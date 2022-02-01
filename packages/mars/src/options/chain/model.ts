export type Chain = {
  chainId: number
  chainName: string
  getPublicRPC: () => string
  getInfuraRPC: (infuraApiKey: string) => string
  getAlchemyRPC: (alchemyApiKey: string) => string
  getBlockExplorerContractAddress: (contractAddress: string) => string
  getEtherscanVerifierApi: () => string
}

export type ChainSet = {
  [chainName: string]: Chain
}
