import { BooleanLike, FutureBoolean } from '../values'
import { context } from '../context'

function negate(condition: BooleanLike) {
  if (typeof condition === 'boolean') {
    return new FutureBoolean(() => !condition)
  }
  return new FutureBoolean(() => condition.resolve()).not()
}

export function runIf<T>(condition: BooleanLike, action: () => T) {
  context.ensureEnabled()

  context.actions.push({
    type: 'CONDITIONAL_START',
    condition
  })

  action()

  context.actions.push({
    type: 'CONDITIONAL_END'
  })

  let wasNotExecuted = negate(condition)

  const result = {
    else: <U>(alternate: () => U) => {
      runIf<U>(wasNotExecuted, alternate)
    },
    elseIf: <U>(otherCondition: BooleanLike, alternate: () => U) => {
      runIf<U>(wasNotExecuted.and(otherCondition), alternate)
      wasNotExecuted = wasNotExecuted.and(negate(otherCondition))
      return result
    }
  }

  return result
}
