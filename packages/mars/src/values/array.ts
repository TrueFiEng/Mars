import { Future, MaybeFuture } from './future'

export class FutureArray<T> extends Future<Array<T>> {
  private constructor(private futures: Array<Future<T>>) {
    super(() => futures.map(f => f.resolve()))
  }

  static from<T>(...futures: Future<T>[]): FutureArray<T> {
    return new FutureArray(futures)
  }

  map<U>(fn: (futures: T[]) => MaybeFuture<U>) {
    return new Future(() => Future.resolve(fn(this.resolve())))
  }
}
