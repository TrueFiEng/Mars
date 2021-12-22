import { expectFuture } from '../utils'
import { flatMap, Future } from '../../src'

describe('FlatMap', () => {
  it('sums two Futures', async () => {
    expectFuture(
      flatMap([new Future(() => 1), new Future(() => 2)], (a, b) => a + b),
      3
    )
  })

  it('different types', async () => {
    const t = [new Future(() => 1), new Future(() => 'aaa')]
    expectFuture(
      flatMap(t, (a, b) => `${a}${b}`),
      '1aaa'
    )
  })
})
