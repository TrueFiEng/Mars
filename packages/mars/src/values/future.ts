import type { FutureBoolean } from './boolean'

export type MaybeFuture<T> = T | Future<T>
type UnpackFuture<T> = T extends Future<infer U> ? U : T
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

  get<U extends keyof T>(key: U): Future<UnpackFuture<T[U]>> {
    return this.map((value) => value[key]) as any
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  equals(other: MaybeFuture<unknown>): FutureBoolean {
    throw new Error('This will get overridden.')
  }
}

type FutureTuple<T> = T extends [infer V, ...infer Rest] ? [Future<V>, ...FutureTuple<Rest>] : []

type FutureArray<T> = T extends Array<any> ? FutureTuple<T> : Future<T>[]
type UnpackArray<T> = T extends FutureArray<infer U> ? U : never
type ForceArray<T> = T extends Array<any> ? T : T[]

export function flatMap<T extends FutureArray<any>, R>(
  futures: T,
  fn: (...args: ForceArray<UnpackArray<T>>) => R
): Future<R> {
  return new Future(() =>
    Future.resolve(fn(...((futures as any[]).map((f) => f.resolve()) as ForceArray<UnpackArray<T>>)))
  )
}
