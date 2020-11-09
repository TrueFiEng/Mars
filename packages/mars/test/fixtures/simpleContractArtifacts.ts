/* eslint-disable */
import * as Mars from '../../src'

const SimpleContractJSON = require('./../build/SimpleContract.json')

export const SimpleContract = Mars.createArtifact({
  name: 'SimpleContract',
  constructor: (): void => Mars.Result,
  methods: {
    str: (): Mars.Future<string> => Mars.Result,
  },
  abi: SimpleContractJSON.abi,
  bytecode: SimpleContractJSON.bytecode,
})
