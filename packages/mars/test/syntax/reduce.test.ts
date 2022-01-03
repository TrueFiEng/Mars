import { expectFuture } from '../utils'
import { reduce, Future } from '../../src'

describe('Reduce', () => {
  it('sums two Futures', async () => {
    expectFuture(
      reduce([new Future(() => 1), new Future(() => 2)], (a, b) => a + b),
      3
    )
  })

  it('different types', async () => {
    expectFuture(
      reduce([new Future(() => 1), new Future(() => 'aaa')], (a, b) => `${a}${b}`),
      '1aaa'
    )
  })

  it('accepts a list with one item', async () => {
    expectFuture(
      reduce([new Future(() => 32)], (a) => a + 10),
      42
    )
  })

  it('returns callback result for empty list', async () => {
    expectFuture(
      reduce([], () => 100),
      100
    )
  })
})
