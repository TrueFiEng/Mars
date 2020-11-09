/* eslint-disable */
import * as Mars from '../../src'

const ComplexContractJSON = require('./../build/ComplexContract.json')

export const ComplexContract = Mars.createArtifact({
  name: 'ComplexContract',
  constructor: (_a: Mars.NumberLike, _b: Mars.StringLike): void => Mars.Result,
  methods: {
    complexMapping: (_: Mars.NumberLike, __: Mars.AddressLike): Mars.Future<[Mars.FutureNumber, Mars.FutureNumber]> =>
      Mars.Result,
    number: (): Mars.FutureNumber => Mars.Result,
    setter: (arg1: Mars.StringLike, arg2: Mars.MaybeFuture<Mars.NumberLike[]>): Mars.Transaction => Mars.Result,
    simpleArray: (_: Mars.NumberLike): Mars.FutureNumber => Mars.Result,
    simpleMapping: (_: Mars.NumberLike): Mars.Future<string> => Mars.Result,
    add: (a: Mars.NumberLike): Mars.FutureNumber => Mars.Result,
    str: (): Mars.Future<string> => Mars.Result,
    twoDArray: (_: Mars.NumberLike, __: Mars.NumberLike): Mars.FutureNumber => Mars.Result,
    viewNoArgs: (): Mars.FutureNumber => Mars.Result,
    viewReturnsStruct: (): Mars.Future<{
      a: Mars.FutureNumber
      b: Mars.FutureNumber
      c: Mars.Future<Mars.Future<{ x: Mars.FutureNumber; y: Mars.FutureNumber }>[]>
    }> => Mars.Result,
    viewReturnsTuple: (): Mars.Future<[Mars.FutureNumber, Mars.Future<string>, Mars.FutureBoolean]> => Mars.Result,
  },
  abi: ComplexContractJSON.abi,
  bytecode: ComplexContractJSON.bytecode,
})
