import fs from 'fs'
import { expect } from 'chai'
import { testDeploy } from '../utils/testDeploy'
import { contract } from '../../src'
import { SimpleContract } from '../fixtures/exampleArtifacts'

describe('Log', () => {
  const logPath = 'test.log'

  it('logs deployment transaction', async () => {
    await deploySomething()
    const text = readLog()
    expect(text).to.match(/Transaction: (.*) Hash: (.*) Hex data: (.*)/)
  })

  it('separates log entries with new lines', async () => {
    await deploySomething()
    const text = readLog()
    expect(text.split('\n').length).to.eq(2)
  })

  beforeEach(async () => {
    expect(fs.existsSync(logPath)).to.be.false
  })

  afterEach(async () => {
    fs.unlinkSync(logPath)
    fs.unlinkSync('./test/deployments.json')
  })

  async function deploySomething() {
    await testDeploy(() => contract(SimpleContract), {
      saveDeploy: true,
      logFile: logPath,
    })
  }

  function readLog(): string {
    return fs.readFileSync(logPath).toString()
  }
})
