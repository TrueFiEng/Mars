import { ChainSet } from './model'
import * as ethereumChains from './ethereum'
import * as arbitrumChains from './arbitrum'

export const chains = { ...ethereumChains, ...arbitrumChains } as ChainSet
