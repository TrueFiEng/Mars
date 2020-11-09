import { expect } from 'chai'
import { testDeploy } from '../utils/testDeploy'
import { contract } from '../../src'
import { SimpleContract } from '../fixtures/simpleContractArtifacts'
import SimpleContractJSON from '../build/SimpleContract.json'
import ComplexContractJSON from '../build/ComplexContract.json'
import { Address } from '../../src/symbols'
import fs from 'fs'
import { ComplexContract } from '../fixtures/complexContractArtifacts'

describe('Contract', () => {
  const getDeployResult = () => JSON.parse(fs.readFileSync('./test/deployments.json').toString())

  it('deploys contract (no name, no params)', async () => {
    const { result, provider } = await testDeploy(() => contract(SimpleContract))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${SimpleContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.simpleContract.address).to.equal(result[Address].resolve())
  })

  it('deploys contract (with name, no params)', async () => {
    const { result, provider } = await testDeploy(() => contract('someName', SimpleContract))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${SimpleContractJSON.evm.deployedBytecode.object}`
    )
    console.log(getDeployResult())
    expect(getDeployResult().test.someName.address).to.equal(result[Address].resolve())
  })

  it('deploys contract (no name, with params)', async () => {
    const { result, provider } = await testDeploy(() => contract(ComplexContract, [10, 'test']))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${ComplexContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.complexContract.address).to.equal(result[Address].resolve())
  })

  it('deploys contract (with name, with params)', async () => {
    const { result, provider } = await testDeploy(() => contract('contractName', ComplexContract, [10, 'test']))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${ComplexContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.contractName.address).to.equal(result[Address].resolve())
  })

  it('does not deploy same contract twice', async () => {
    const { result: firstCall, provider } = await testDeploy(() => contract(SimpleContract))
    const { result: secondCall } = await testDeploy(() => contract(SimpleContract), {
      injectProvider: provider,
      saveDeploy: true,
    })
    expect(firstCall[Address].resolve()).to.equal(secondCall[Address].resolve())
    expect(await provider.getBlockNumber()).to.equal(1)
  })

  it('deploys same contracts with different names', async () => {
    const { result: firstCall, provider } = await testDeploy(() => contract('1', SimpleContract))
    const { result: secondCall } = await testDeploy(() => contract('2', SimpleContract), {
      injectProvider: provider,
      saveDeploy: true,
    })
    expect(firstCall[Address].resolve()).to.not.equal(secondCall[Address].resolve())
    expect(await provider.getBlockNumber()).to.equal(2)
  })

  it('redeploys contract with different constructor args', async () => {
    const { result: firstCall, provider } = await testDeploy(() => contract(ComplexContract, [10, 'test']))
    const { result: secondCall } = await testDeploy(() => contract(ComplexContract, [11, 'test']), {
      injectProvider: provider,
      saveDeploy: true,
    })
    expect(firstCall[Address].resolve()).to.not.equal(secondCall[Address].resolve())
    expect(await provider.getBlockNumber()).to.equal(2)
  })

  it('redeploys contract if bytecode has changed', async () => {
    const { result: firstCall, provider } = await testDeploy(() =>
      contract('contractName', ComplexContract, [10, 'test'])
    )
    const { result: secondCall } = await testDeploy(() => contract('contractName', SimpleContract), {
      injectProvider: provider,
      saveDeploy: true,
    })
    expect(firstCall[Address].resolve()).to.not.equal(secondCall[Address].resolve())
    expect(await provider.getCode(firstCall[Address].resolve())).to.equal(
      `0x${ComplexContractJSON.evm.deployedBytecode.object}`
    )
    expect(await provider.getCode(secondCall[Address].resolve())).to.equal(
      `0x${SimpleContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.contractName.address).to.equal(secondCall[Address].resolve())
  })

  afterEach(() => {
    fs.unlinkSync('./test/deployments.json')
  })
})
