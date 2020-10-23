import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { getCommandLineOptions } from '../../src/options/cli'

const PRIVATE_KEY = `0x${'1'.repeat(64)}`

describe('getCommandLineOptions', () => {
  function withParams<T>(params: string | string[], callback: () => T): T {
    const backup = process.argv
    const options = Array.isArray(params) ? params : [...params.split(' ')]
    process.argv = ['node', 'file.js', ...options.filter((x) => x !== '')]
    try {
      return callback()
    } finally {
      process.argv = backup
    }
  }

  function getOptions(params: string | string[]) {
    return withParams(params, getCommandLineOptions)
  }

  it('throws on invalid argument', () => {
    expect(() => getOptions('-x')).to.throw()
  })

  function checkParam(name: string, short: string, long: string, valid: any, invalid: any, expected = valid) {
    describe(name, () => {
      if (Array.isArray(valid)) {
        for (const [i, item] of valid.entries()) {
          it(`recognises shorter -${short} ${item}`, () => {
            expect(getOptions([`-${short}`, item])).to.deep.equal({
              [name]: expected[i],
            })
          })

          it(`recognises longer --${long} ${item}`, () => {
            expect(getOptions([`--${long}`, item])).to.deep.equal({
              [name]: expected[i],
            })
          })
        }
      } else {
        it(`recognises shorter -${short}`, () => {
          expect(getOptions([`-${short}`, valid])).to.deep.equal({
            [name]: expected,
          })
        })

        it(`recognises longer --${long}`, () => {
          expect(getOptions([`--${long}`, valid])).to.deep.equal({
            [name]: expected,
          })
        })
      }

      it(`fails for invalid -${short}`, () => {
        expect(() => getOptions([`-${short}`, invalid])).to.throw()
      })

      it(`fails for invalid --${long}`, () => {
        expect(() => getOptions([`--${long}`, invalid])).to.throw()
      })

      it(`fails for simultaneous -${short} and --${long}`, () => {
        expect(() => getOptions(`-${short} 123 --${long} 123`)).to.throw()
      })
    })
  }

  checkParam('privateKey', 'p', 'private-key', PRIVATE_KEY, '0x123')
  checkParam('network', 'n', 'network', ['mainnet', 'http://foo', 'https://bar'], 'foo')
  checkParam('infuraApiKey', 'i', 'infura-key', 'boo', 'bam bam')
  checkParam('alchemyApiKey', 'a', 'alchemy-key', 'boo', 'bam bam')
  checkParam('outputFile', 'o', 'out-file', 'file.json', '123')
  checkParam('gasPrice', 'g', 'gas-price', '2', 'foo', BigNumber.from(2))
  checkParam('dryRun', 'd', 'dry-run', '', 'asd', true)
  checkParam('noConfirm', 'y', 'yes', '', 'asd', true)
  checkParam('verify', 'v', 'verify', '', 'asd', true)
  checkParam('etherscanApiKey', 'e', 'etherscan-key', 'boo', 'bam bam')
  checkParam('sources', 's', 'sources', 'dir', '123')
  checkParam('waffleConfig', 'w', 'waffle-config', 'waffle-config.json', '123')

  it('can read multiple parameters at once', () => {
    expect(getOptions(['-vd', '--sources', 'foo'])).to.deep.equal({
      sources: 'foo',
      verify: true,
      dryRun: true,
    })
  })
})
