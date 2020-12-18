import { verify } from '../src/verification'

describe('Verification', () => {
  it('does not throw if verification fails', async () => {
    await verify('', { contract: {} } as any, '', 'contract', '', '')
  })
})
