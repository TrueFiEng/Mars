import { testDeploy } from '../utils'
import { contract, FutureArray } from '../../src'
import { ComplexContract } from '../fixtures/exampleArtifacts'
import { expect } from 'chai'

describe('Future Arrays', () => {
  const testRun = async () =>
    testDeploy(
      () => {
        const testContract1 = contract(ComplexContract, [1, 'test1'])
        return FutureArray.from(testContract1.add(1), testContract1.add(2))
      },
      { saveDeploy: false }
    )

  describe('get', () => {
    it('can get by index', async () => {
      const numbers = (await testRun()).result
      expect(numbers.get(0).resolve()).to.equal(1)
      expect(numbers.get(1).resolve()).to.equal(2)
    })
  })

  describe('map', () => {
    it('should map over the array future array', async () => {
      const numbers = (await testRun()).result
      const futureSum = numbers.map((nums) => nums[0].add(nums[1]))
      expect(futureSum.resolve()).to.equal(3)
    })
  })
})
