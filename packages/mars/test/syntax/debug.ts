import { expect } from 'chai'
import { humanReadableToString } from '../../src/execute/execute'
import { BigNumber } from 'ethers'
import { testDeploy } from '../utils/testDeploy'
import { contract, Future } from '../../src'
import { SimpleContract } from '../fixtures/exampleArtifacts'
import { Address } from '../../src/symbols'
import fs from 'fs'

describe('Debug', () => {
  describe('object conversions', () => {
    it('BigNumber', () => {
      expect(humanReadableToString(BigNumber.from('123'))).to.equal('123')
    })

    it('For contracts prints contract solidity name and address', async () => {
      const deployed = await testDeploy(() => contract('name', SimpleContract))
      const address = Future.resolve(deployed.result[Address])
      expect(humanReadableToString(deployed.result)).to.equal(`SimpleContract#${address}`)
      fs.unlinkSync('./test/deployments.json')
    })

    it('Array', () => {
      expect(humanReadableToString([BigNumber.from('123'), '321'])).to.deep.equal('["123","321"]')
    })

    it('Object', () => {
      expect(
        humanReadableToString({
          foo: BigNumber.from('123'),
          bar: 'bar',
        })
      ).to.deep.equal('{\n  "foo": "123",\n  "bar": "bar"\n}')
    })

    it('Future', async () => {
      expect(humanReadableToString(new Future(() => BigNumber.from('123')))).to.equal('123')
    })
  })
})
