import fs from 'fs'
import { expect } from 'chai'
import { expectFuture, testDeploy } from '../utils'
import { contract, createProxy, FutureNumber } from '../../src'
import SimpleContractJSON from '../build/SimpleContract.json'
import ComplexContractJSON from '../build/ComplexContract.json'
import { Address } from '../../src/symbols'
import {
  ComplexContract,
  OpenZeppelinProxy,
  SimpleContract,
  UpgradeabilityProxy,
  UpgradeableContract,
  UpgradeableContract2,
} from '../fixtures/exampleArtifacts'
import { BigNumber } from 'ethers'
import { Contract, NoParams } from '../../src/syntax/contract'

describe('Contract', () => {
  const getDeployResult = () => JSON.parse(fs.readFileSync('./test/deployments.json').toString())

  it('deploys contract (no name, no params)', async () => {
    const { result, provider } = await testDeploy(() => contract(SimpleContract))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${SimpleContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.simpleContract.address).to.equal(result[Address].resolve())
  })

  it('deploys contract (no name, no params, gas override)', async () => {
    const { result, provider } = await testDeploy(() => contract(SimpleContract, { gasLimit: 2000000 }))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${SimpleContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.simpleContract.address).to.equal(result[Address].resolve())
    expect((await provider.getTransaction(getDeployResult().test.simpleContract.txHash)).gasLimit).to.equal(2000000)
  })

  it('deploys contract (with name, no params)', async () => {
    const { result, provider } = await testDeploy(() => contract('someName', SimpleContract))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${SimpleContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.someName.address).to.equal(result[Address].resolve())
  })

  it('deploys contract (with name, no params, gas override)', async () => {
    const { result, provider } = await testDeploy(() => contract('someName', SimpleContract, { gasLimit: 2000000 }))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${SimpleContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.someName.address).to.equal(result[Address].resolve())
    expect((await provider.getTransaction(getDeployResult().test.someName.txHash)).gasLimit).to.equal(2000000)
  })

  it('deploys contract (no name, with params)', async () => {
    const { result, provider } = await testDeploy(() => contract(ComplexContract, [10, 'test']))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${ComplexContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.complexContract.address).to.equal(result[Address].resolve())
  })

  it('deploys contract (no name, with params, gas override)', async () => {
    const { result, provider } = await testDeploy(() => contract(ComplexContract, [10, 'test'], { gasLimit: 2000000 }))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${ComplexContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.complexContract.address).to.equal(result[Address].resolve())
    expect((await provider.getTransaction(getDeployResult().test.complexContract.txHash)).gasLimit).to.equal(2000000)
  })

  it('deploys contract (with name, with params)', async () => {
    const { result, provider } = await testDeploy(() => contract('contractName', ComplexContract, [10, 'test']))
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${ComplexContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.contractName.address).to.equal(result[Address].resolve())
  })

  it('deploys contract (with name, with params and gas override)', async () => {
    const { result, provider } = await testDeploy(() =>
      contract('contractName', ComplexContract, [10, 'test'], { gasLimit: 2000000 })
    )
    expect(await provider.getCode(result[Address].resolve())).to.equal(
      `0x${ComplexContractJSON.evm.deployedBytecode.object}`
    )
    expect(getDeployResult().test.contractName.address).to.equal(result[Address].resolve())
    expect((await provider.getTransaction(getDeployResult().test.contractName.txHash)).gasLimit).to.equal(2000000)
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

  it('does not deploy same contracts which addresses are of different cases', async () => {
    const { result: firstCall, provider } = await testDeploy(() => contract(SimpleContract))
    const deployment = getDeployResult()
    const addressLowerCase = deployment.test.simpleContract.address.toString().toLowerCase()
    deployment.test.simpleContract.address = addressLowerCase
    fs.writeFileSync('./test/deployments.json', JSON.stringify(deployment))
    const { result: secondCall } = await testDeploy(() => contract(SimpleContract), {
      injectProvider: provider,
      saveDeploy: true,
    })
    expect(firstCall[Address].resolve()).to.not.equal(secondCall[Address].resolve())
    expect(firstCall[Address].resolve().toLowerCase()).to.equal(secondCall[Address].resolve().toLowerCase())
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

  it('does not redeploy modified contract if update was skipped explicitly', async () => {
    const { result: firstCall, provider } = await testDeploy(() =>
      contract('contractName', ComplexContract, [10, 'test'])
    )
    const { result: secondCall } = await testDeploy(
      () => contract('contractName', SimpleContract, { skipUpgrade: true }),
      {
        injectProvider: provider,
        saveDeploy: true,
      }
    )
    expect(firstCall[Address].resolve()).to.equal(secondCall[Address].resolve())
  })

  it('deploys using an upgradeability proxy', async () => {
    let xAfterInit: FutureNumber = new FutureNumber(() => BigNumber.from(0))
    const { result: proxyDeploymentCall } = await testDeploy(() => {
      const upgradeable = contract('upgradeable', UpgradeableContract)
      const proxy = createProxy(UpgradeabilityProxy, 'upgradeTo')
      const proxied = proxy(upgradeable, 'initialize', [1000])
      xAfterInit = proxied.x()
      return proxied
    })

    const proxyAddress = proxyDeploymentCall[Address].resolve()
    expect(getDeployResult().test.upgradeable_proxy.address).to.equal(proxyAddress)
    expectFuture(xAfterInit, BigNumber.from(1000))
  })

  it('deploys using an upgradeability proxy without "implementation" method', async () => {
    let xAfterInit: FutureNumber = new FutureNumber(() => BigNumber.from(0))
    const { result: proxyDeploymentCall } = await testDeploy(() => {
      const upgradeable = contract('upgradeable', UpgradeableContract)
      // Will call initialize(10000)
      const proxy = createProxy(
        OpenZeppelinProxy,
        [upgradeable, '0xfe4b84df0000000000000000000000000000000000000000000000000000000000002710'],
        'upgradeTo'
      )
      const proxied = proxy(upgradeable)
      xAfterInit = proxied.x()
      return proxied
    })

    const proxyAddress = proxyDeploymentCall[Address].resolve()
    expect(getDeployResult().test.upgradeable_proxy.address).to.equal(proxyAddress)
    expectFuture(xAfterInit, BigNumber.from(10000))
  })

  it('deploys using an upgradeability proxy without running init function', async () => {
    let xAfterNoInit: FutureNumber = new FutureNumber(() => BigNumber.from(0))
    const { result: proxyDeploymentCall } = await testDeploy(() => {
      const upgradeable = contract('upgradeable', UpgradeableContract)
      const proxy = createProxy(UpgradeabilityProxy, 'upgradeTo')
      const proxied = proxy(upgradeable)
      xAfterNoInit = proxied.x()
      return proxied
    })

    const proxyAddress = proxyDeploymentCall[Address].resolve()
    expect(getDeployResult().test.upgradeable_proxy.address).to.equal(proxyAddress)
    expectFuture(xAfterNoInit, BigNumber.from(0))
  })

  it('deploys using an upgradeability proxy without providing init params', async () => {
    let xAfterNoInit: FutureNumber = new FutureNumber(() => BigNumber.from(0))
    const { result: proxyDeploymentCall } = await testDeploy(() => {
      const upgradeable = contract('upgradeable', UpgradeableContract)
      const proxy = createProxy(UpgradeabilityProxy, 'upgradeTo')
      const proxied = proxy(upgradeable, 'initializeOne')
      xAfterNoInit = proxied.x()
      return proxied
    })

    const proxyAddress = proxyDeploymentCall[Address].resolve()
    expect(getDeployResult().test.upgradeable_proxy.address).to.equal(proxyAddress)
    expectFuture(xAfterNoInit, BigNumber.from(1))
  })

  it('upgrades proxy without "implementation" method', async () => {
    let xAfterUpdate: FutureNumber = new FutureNumber(() => BigNumber.from(0))
    const { result: proxyDeploymentCall } = await testDeploy(() => {
      const upgradeable = contract('upgradeable', UpgradeableContract)
      // Will call initialize(10000)
      const proxy = createProxy(
        OpenZeppelinProxy,
        [upgradeable, '0xfe4b84df0000000000000000000000000000000000000000000000000000000000002710'],
        'upgradeTo'
      )
      proxy(upgradeable)
      const newVersion = contract('upgradeable', UpgradeableContract2)
      const proxied = proxy(newVersion)
      xAfterUpdate = proxied.x()
      return proxied
    })

    const proxyAddress = proxyDeploymentCall[Address].resolve()
    expect(getDeployResult().test.upgradeable_proxy.address).to.equal(proxyAddress)
    expectFuture(xAfterUpdate, BigNumber.from(420))
  })

  it('does not redeploy existing proxy when intentionally configured not to', async () => {
    const { result: proxyDeploymentCall } = await testDeploy(() => {
      // First iteration of proxy creation
      let upgradeable = contract('upgradeable', UpgradeableContract) as Contract<NoParams>
      let proxy = createProxy(
        OpenZeppelinProxy,
        [upgradeable, '0xfe4b84df0000000000000000000000000000000000000000000000000000000000002710'],
        'upgradeTo'
      )
      proxy(upgradeable, { noRedeploy: true })

      // Second iteration of proxy creation
      upgradeable = contract('upgradeable', UpgradeableContract2)
      proxy = createProxy(
        OpenZeppelinProxy,
        [upgradeable, '0xfe4b84df0000000000000000000000000000000000000000000000000000000000002710'],
        'upgradeTo'
      )

      const proxied = proxy(upgradeable, { noRedeploy: true })
      return proxied
    })

    const proxyAddress = proxyDeploymentCall[Address].resolve()
    expect(getDeployResult().test.upgradeable_proxy.address).to.equal(proxyAddress)
  })

  afterEach(() => {
    fs.unlinkSync('./test/deployments.json')
  })
})
