export type Chain = {
  chainId: number
  chainName: string
  getPublicRPC: () => string
  getInfuraRPC: (infuraApiKey: string) => string
  getAlchemyRPC: (alchemyApiKey: string) => string
  getBlockExplorerContractAddress: (contractAddress: string) => string
  getContractVerifierApi: () => string
}
