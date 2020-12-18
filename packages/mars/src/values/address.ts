import { Address } from '../symbols'
import { StringLike } from './string'

export type AddressLike = StringLike | { [Address]: StringLike }
