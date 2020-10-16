import {
  createArtifact,
  NumberLike,
  AddressLike,
  NumberLike,
  FutureNumber,
  Transaction,
  Result // null as any
} from 'ethereum-mars'

export const Token = createArtifact({
  name: 'Token',
  constructor: (totalSupply: NumberLike): void => Result,
  methods: {
    transfer: (to: AddressLike, value: NumberLike): Transaction => Result,
    balanceOf: (account: AddressLike): FutureNumber => Result,
  },
  abi: [/* ... */],
  bytecode: '...',
})
