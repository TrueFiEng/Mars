import fs from 'fs'
import { expect } from 'chai'
import { runGenerator } from '../../src'

describe('Generator', () => {
  it('generates correct artifacts', async () => {
    await runGenerator('./test/build', './test/fixtures/artifacts.ts')
    const contractAbi = fs.readFileSync('./test/fixtures/artifacts.ts').toString().trim()
    // Skip eslint comment & import
    const expectedAbi = fs
      .readFileSync('./test/fixtures/exampleArtifacts.ts')
      .toString()
      .split('\n')
      .slice(2)
      .join('\n')
      .trim()
    expect(contractAbi.startsWith(`import * as Mars from 'ethereum-mars';\n\n`))
    expect(contractAbi.replace(`import * as Mars from 'ethereum-mars';\n\n`, '')).to.equal(expectedAbi)
  })

  after(() => {
    fs.unlinkSync('./test/fixtures/artifacts.ts')
  })
})
