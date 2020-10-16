import { Future, MaybeFuture } from './future'

export type BooleanLike = MaybeFuture<boolean>

export class FutureBoolean extends Future<boolean> {
  not() {
    return new FutureBoolean(() => !this.resolve())
  }

  and(other: BooleanLike) {
    return new FutureBoolean(() => this.resolve() && Future.resolve(other))
  }

  or(other: BooleanLike) {
    return new FutureBoolean(() => this.resolve() || Future.resolve(other))
  }

  thenElse<T, U>(thenValue: MaybeFuture<T>, elseValue: MaybeFuture<U>): Future<T | U> {
    return this.map((x) => (x ? Future.resolve(thenValue) : Future.resolve(elseValue)))
  }
}

Future.prototype.equals = function (other: MaybeFuture<unknown>): FutureBoolean {
  return new FutureBoolean(() => this.resolve() === Future.resolve(other))
}
