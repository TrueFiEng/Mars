import { BigNumber } from 'ethers'
import { FutureBoolean } from './boolean'
import { Future, MaybeFuture } from './future'

export type NumberLike = MaybeFuture<number> | MaybeFuture<BigNumber>
export function resolveNumberLike(value: NumberLike): BigNumber {
  const resolved = Future.resolve(value)
  return BigNumber.from(resolved)
}

export class FutureNumber extends Future<BigNumber> {
  add(other: NumberLike) {
    return new FutureNumber(() => this.resolve().add(resolveNumberLike(other)))
  }

  sub(other: NumberLike) {
    return new FutureNumber(() => this.resolve().sub(resolveNumberLike(other)))
  }

  mul(other: NumberLike) {
    return new FutureNumber(() => this.resolve().mul(resolveNumberLike(other)))
  }

  div(other: NumberLike) {
    return new FutureNumber(() => this.resolve().div(resolveNumberLike(other)))
  }

  mod(other: NumberLike) {
    return new FutureNumber(() => this.resolve().mod(resolveNumberLike(other)))
  }

  pow(other: NumberLike) {
    return new FutureNumber(() => this.resolve().pow(resolveNumberLike(other)))
  }

  lt(other: NumberLike) {
    return new FutureBoolean(() => this.resolve().lt(resolveNumberLike(other)))
  }

  lte(other: NumberLike) {
    return new FutureBoolean(() => this.resolve().lte(resolveNumberLike(other)))
  }

  gt(other: NumberLike) {
    return new FutureBoolean(() => this.resolve().gt(resolveNumberLike(other)))
  }

  gte(other: NumberLike) {
    return new FutureBoolean(() => this.resolve().gte(resolveNumberLike(other)))
  }

  equals(other: NumberLike) {
    return new FutureBoolean(() => this.resolve().eq(resolveNumberLike(other)))
  }
}
