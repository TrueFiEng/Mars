import { computeCreate2Address } from '../src/create2Address'
import { randomBytes } from 'ethers/lib/utils'
import { ComplexContract, SimpleContract } from './fixtures/exampleArtifacts'
import { Bytecode } from '../src/symbols'
import { expect } from 'chai'

describe('Create2 based deterministic addresses', () => {
  it('are same with same input params', () => {
    const address = '0xAdEa3382c50feb66De7A0C86bfdEB79Ec285DBe9'
    const salt = randomBytes(32)
    const contract = SimpleContract[Bytecode]

    const firstGeneration = act(address, salt, contract)
    const secondGeneration = act(address, salt, contract)

    expect(firstGeneration).be.equal(secondGeneration)
  })

  it('are different if createor addresses differ', () => {
    const salt = randomBytes(32)
    const contract = SimpleContract[Bytecode]

    const firstGeneration = act('0xAdEa3382c50feb66De7A0C86bfdEB79Ec285DBe9', salt, contract)
    const secondGeneration = act('0x18d903773dd20c121F82704a48711d09D08B19c4', salt, contract)

    expect(firstGeneration).be.not.equal(secondGeneration)
  })

  it('are different if salts differ', () => {
    const address = '0xAdEa3382c50feb66De7A0C86bfdEB79Ec285DBe9'
    const contract = SimpleContract[Bytecode]

    const firstGeneration = act(address, randomBytes(32), contract)
    const secondGeneration = act(address, randomBytes(32), contract)

    expect(firstGeneration).be.not.equal(secondGeneration)
  })

  it('are different if bytecodes differ', () => {
    const address = '0xAdEa3382c50feb66De7A0C86bfdEB79Ec285DBe9'
    const salt = randomBytes(32)
    const firstGeneration = act(address, salt, SimpleContract[Bytecode])
    const secondGeneration = act(address, salt, ComplexContract[Bytecode])

    expect(firstGeneration).be.not.equal(secondGeneration)
  })
})

function act(address: string, salt: Uint8Array, byteCode: string) {
  return computeCreate2Address(address, salt, byteCode)
}
