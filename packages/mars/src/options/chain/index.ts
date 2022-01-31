import { Chain } from './Chain'
import { arbitrum, arbitrumRinkeby, goerli, kovan, mainnet, rinkeby, ropsten } from './ethereum'

export const getChainConfig = (chain: string | undefined): Chain | undefined => {
  if (chain === 'mainnet') {
    return mainnet
  } else if (chain === 'ropsten') {
    return ropsten
  } else if (chain === 'rinkeby') {
    return rinkeby
  } else if (chain === 'goerli') {
    return goerli
  } else if (chain === 'kovan') {
    return kovan
  } else if (chain === 'arbitrum') {
    return arbitrum
  } else if (chain === 'arbitrum-rinkeby') {
    return arbitrumRinkeby
  } else {
    return undefined
  }
}
