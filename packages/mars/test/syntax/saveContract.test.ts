import { expect } from 'chai'
import { testDeploy } from '../utils/testDeploy'
import { saveContract } from '../../src'
import fs from 'fs'

describe('SaveContract', () => {
  const getDeployResult = () => JSON.parse(fs.readFileSync('./test/deployments.json').toString())

  it('adds address to the deployments file', async () => {
    await testDeploy(() => saveContract('name', '0x123'))
    const result = getDeployResult()
    expect(result.name).to.equal('0x123')
    fs.unlinkSync('./test/deployments.json')
  })
})
