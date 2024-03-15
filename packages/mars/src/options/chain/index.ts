import { ChainSet } from './model'
import * as ethereumChains from './ethereum'
import * as arbitrumChains from './arbitrum'
import * as optimismChains from './optimism'
import * as baseChains from './base'

export const chains = { ...ethereumChains, ...arbitrumChains, ...optimismChains, ...baseChains } as ChainSet
