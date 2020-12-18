import { expect, use } from 'chai'
import { solidity } from 'ethereum-waffle'
import { contract, Future } from '../../src'
import { testDeploy } from '../utils/testDeploy'
import { ComplexContract } from '../fixtures/exampleArtifacts'
import { BigNumber, constants, Contract } from 'ethers'
import { AbiSymbol, Address } from '../../src/symbols'

use(solidity)

describe('Artifacts', () => {
  const expectFuture = (future: Future<any>, expected: any) => expect(future.resolve()).to.deep.equal(expected)

  const testRun = async () =>
    testDeploy(
      () => {
        const testContract = contract(ComplexContract, [1, 'test'])
        testContract.setter('hello world', [1, 2, 3])
        const number = testContract.number()
        const str = testContract.str()
        const mapping = testContract.simpleMapping(2)
        const complexMapping = testContract.complexMapping(12, constants.AddressZero)
        const array = testContract.simpleArray(2)
        const twoDArray = testContract.twoDArray(1, 1)
        const noArgs = testContract.viewNoArgs()
        const tuple = testContract.viewReturnsTuple()
        const struct = testContract.viewReturnsStruct()
        const sum = testContract.add(struct.get('c').get(0).get('x'))
        return { testContract, number, str, mapping, complexMapping, array, twoDArray, noArgs, tuple, struct, sum }
      },
      { saveDeploy: false }
    )

  it('check inputs', async () => {
    const {
      result: { testContract },
      provider,
    } = await testRun()
    const contract = new Contract(testContract[Address].resolve(), ComplexContract[AbiSymbol], provider)
    expect('setter').to.be.calledOnContractWith(contract, ['hello world', [1, 2, 3]])
    expect('number').to.be.calledOnContractWith(contract, [])
    expect('str').to.be.calledOnContractWith(contract, [])
    expect('simpleMapping').to.be.calledOnContractWith(contract, [2])
    expect('complexMapping').to.be.calledOnContractWith(contract, [12, constants.AddressZero])
    expect('simpleArray').to.be.calledOnContractWith(contract, [2])
    expect('viewNoArgs').to.be.calledOnContractWith(contract, [])
    expect('viewReturnsTuple').to.be.calledOnContractWith(contract, [])
    expect('viewReturnsStruct').to.be.calledOnContractWith(contract, [])
    expect('add').to.be.calledOnContractWith(contract, [15])
  })

  it('check outputs', async () => {
    const { result } = await testRun()
    expectFuture(result.number, 1)
    expectFuture(result.str, 'hello world')
    expectFuture(result.mapping, '')
    expectFuture(result.complexMapping, [0, 0])
    expectFuture(result.array, 3)
    expectFuture(result.twoDArray, 20)
    expectFuture(result.noArgs, 42)
    expectFuture(result.tuple, [1, 'hello', false])
    expectFuture(result.struct, [BigNumber.from(10), BigNumber.from(20), [[BigNumber.from(15), BigNumber.from(16)]]])
    expectFuture(result.sum, 16)
  })
})
