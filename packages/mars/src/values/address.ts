import { Contract } from '../syntax/contract'
import { StringLike } from './string'

export type AddressLike = StringLike | Contract<any>
