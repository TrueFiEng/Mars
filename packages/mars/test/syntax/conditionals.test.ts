import fs from 'fs'
import { expect } from 'chai'
import { testDeploy } from '../utils/testDeploy'
import { contract, Future, FutureNumber, runIf } from '../../src'
import { SimpleContract } from '../fixtures/exampleArtifacts'
import { BigNumber } from 'ethers'

describe('RunIf', () => {
  const futureBool = (result: boolean) => new Future(() => result)
  const getDeployResult = () => JSON.parse(fs.readFileSync('./test/deployments.json').toString())
  const deployFileExists = () => fs.existsSync('./test/deployments.json')

  describe('runIf', () => {
    it('executes action if condition is true', async () => {
      await testDeploy(() => runIf(futureBool(true), () => contract(SimpleContract)))
      expect(getDeployResult().test.simpleContract.address).to.be.not.undefined
    })

    it('does not execute action if condition is false', async () => {
      await testDeploy(() => runIf(futureBool(false), () => contract(SimpleContract)))
      expect(deployFileExists()).to.be.false
    })

    it('else clause is not called when condition is true', async () => {
      await testDeploy(() =>
        runIf(futureBool(true), () => contract(SimpleContract)).else(() => contract('alternative', SimpleContract))
      )
      expect(getDeployResult().test.simpleContract.address).to.be.not.undefined
      expect(getDeployResult().test.alternative).to.be.undefined
    })

    it('else clause is called when condition is false', async () => {
      await testDeploy(() =>
        runIf(futureBool(false), () => contract(SimpleContract)).else(() => contract('alternative', SimpleContract))
      )
      expect(getDeployResult().test.simpleContract).to.be.undefined
      expect(getDeployResult().test.alternative.address).to.be.not.undefined
    })

    it('multiple elseIfs', async () => {
      const futureNumber = new FutureNumber(() => BigNumber.from(2))

      await testDeploy(() =>
        runIf(futureNumber.equals(0), () => contract('0', SimpleContract))
          .elseIf(futureNumber.equals(1), () => contract('1', SimpleContract))
          .elseIf(futureNumber.equals(2), () => contract('2', SimpleContract))
          .elseIf(futureNumber.equals(3), () => contract('3', SimpleContract))
          .else(() => contract('other', SimpleContract))
      )
      expect(getDeployResult().test['0']).to.be.undefined
      expect(getDeployResult().test['1']).to.be.undefined
      expect(getDeployResult().test['3']).to.be.undefined
      expect(getDeployResult().test.other).to.be.undefined
      expect(getDeployResult().test['2'].address).to.be.not.undefined
    })

    it('nested conditionals', async () => {
      const futureNumber = new FutureNumber(() => BigNumber.from(2))
      const deploy = (name: string) => () => contract(name, SimpleContract)

      await testDeploy(() =>
        runIf(futureNumber.equals(0), () => runIf(futureNumber.equals(2), deploy('02')).else(deploy('0')))
          .elseIf(futureNumber.equals(1), () => runIf(futureNumber.equals(3), deploy('13')).else(deploy('1')))
          .elseIf(futureNumber.equals(2), () => contract('2', SimpleContract))
          .elseIf(futureNumber.equals(3), () => contract('3', SimpleContract))
          .else(() => contract('other', SimpleContract))
      )
      expect(getDeployResult().test['0']).to.be.undefined
      expect(getDeployResult().test['02']).to.be.undefined
      expect(getDeployResult().test['13']).to.be.undefined
      expect(getDeployResult().test['1']).to.be.undefined
      expect(getDeployResult().test['3']).to.be.undefined
      expect(getDeployResult().test.other).to.be.undefined
      expect(getDeployResult().test['2'].address).to.be.not.undefined
    })

    afterEach(() => {
      if (deployFileExists()) {
        fs.unlinkSync('./test/deployments.json')
      }
    })
  })
})
