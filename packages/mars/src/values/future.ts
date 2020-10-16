import type { FutureBoolean } from './boolean'

export type MaybeFuture<T> = T | Future<T>
export class Future<T> {
  constructor(public resolve: () => T) {}

  static resolve<T>(value: MaybeFuture<T>) {
    return value instanceof Future ? value.resolve() : value
  }

  static create<T>(message = 'Trying to get value from unresolved future.') {
    let resolved = false
    let value: T
    const future = new Future<T>(() => {
      if (!resolved) {
        throw new Error(message)
      }
      return value
    })
    return [
      future,
      (result: T) => {
        resolved = true
        value = result
      },
    ] as const
  }

  map<U>(fn: (value: T) => MaybeFuture<U>): Future<U> {
    return new Future(() => Future.resolve(fn(this.resolve())))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  equals(other: MaybeFuture<unknown>): FutureBoolean {
    throw new Error('This will get overridden.')
  }
}
