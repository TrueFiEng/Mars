import fs from 'fs'
import { expect } from 'chai'
import { runGenerator } from '../../src'

describe.only('Generator', () => {
  it('generates correct artifacts', async () => {
    runGenerator('./test/build', './test/fixtures/artifacts.ts')
    const contractAbi = fs.readFileSync('./test/fixtures/artifacts.ts').toString().trim()
    // Skip eslint comment & import
    const expectedAbi = fs
      .readFileSync('./test/fixtures/exampleArtifacts.ts')
      .toString()
      .split('\n')
      .slice(3)
      .join('\n')
      .trim()
    expect(contractAbi.startsWith(`import * as Mars from "ethereum-mars";\n\n`))
    expect(contractAbi.replace(`import * as Mars from "ethereum-mars";\n\n`, '')).to.equal(expectedAbi)
  })

  it('generates correct artifacts from a subdir', async () => {
    fs.mkdirSync('./test/build/nested/foo/bar', { recursive: true })
    fs.copyFileSync('./test/build/SimpleContract.json', './test/build/nested/foo/rSimpleContract.json')
    fs.copyFileSync('./test/build/ComplexContract.json', './test/build/nested/foo/bar/ComplexContract.json')
    runGenerator('./test/build/nested', './test/fixtures/artifacts.ts')
    const contractAbi = fs.readFileSync('./test/fixtures/artifacts.ts').toString().trim()
    // Skip eslint comment & import
    const expectedAbi = fs
      .readFileSync('./test/fixtures/exampleArtifacts.ts')
      .toString()
      .split('\n')
      .slice(3)
      .join('\n')
      .trim()
    expect(contractAbi.startsWith(`import * as Mars from "ethereum-mars";\n\n`))
    expect(contractAbi.replace(`import * as Mars from "ethereum-mars";\n\n`, '')).to.equal(expectedAbi)
  })

  afterEach(() => {
    fs.unlinkSync('./test/fixtures/artifacts.ts')
  })
})
