import { Future, MaybeFuture } from './future'
import { FutureBoolean } from './boolean'

export type BytesLike = MaybeFuture<string> | MaybeFuture<number[]> | MaybeFuture<Buffer>
export function resolveBytesLike(value: BytesLike): Buffer {
  const resolved = Future.resolve(value)
  if (typeof resolved === 'string') {
    if (resolved.startsWith('0x')) {
      return Buffer.from(resolved.slice(2), 'hex')
    } else {
      return Buffer.from(resolved, 'hex')
    }
  } else if (Array.isArray(resolved)) {
    return Buffer.from(resolved)
  } else {
    return resolved
  }
}

export class FutureBytes extends Future<Buffer> {
  equals(other: MaybeFuture<Buffer>) {
    return new FutureBoolean(() => this.resolve().equals(Future.resolve(other)))
  }
}
