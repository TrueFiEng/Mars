import { ChainSet } from './model'
import * as ethereumChains from './ethereum'
import * as arbitrumChains from './arbitrum'
import * as optimismChains from './optimism'

export const chains = { ...ethereumChains, ...arbitrumChains, ...optimismChains } as ChainSet
