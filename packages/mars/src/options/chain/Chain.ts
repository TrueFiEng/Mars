export type Chain = {
  chainId: number
  chainName: string
  getPublicRPC: () => string
  getInfuraRPC: (infuraApiKey: string) => string
  getAlchemyRPC: (alchemyApiKey: string) => string
  getEtherscanApi: () => string
}
