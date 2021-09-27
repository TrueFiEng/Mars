import fs from 'fs'
import { expect } from 'chai'
import { testDeploy } from '../utils/testDeploy'
import { contract } from '../../src'
import { SimpleContract } from '../fixtures/exampleArtifacts'

describe('Log', () => {
  const logPath = 'test.log'

  it('logs deployment', async () => {
    expect(fs.existsSync(logPath)).to.be.false

    await testDeploy(() => contract(SimpleContract), {
      saveDeploy: true,
      logFile: 'test.log',
    })
    const text = fs.readFileSync(logPath).toString()
    expect(text.split('\n').length).to.eq(6)
    expect(text.indexOf('Transaction:')).to.be.gte(0)
    expect(text.indexOf('Hash:')).to.be.gte(0)
    expect(text.indexOf('Hex data:')).to.be.gte(0)
  })

  afterEach(async () => {
    fs.unlinkSync(logPath)
  })
})
