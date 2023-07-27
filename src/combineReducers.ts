import { Action } from './types/actions'
import {
  ActionFromReducersMapObject,
  PreloadedStateShapeFromReducersMapObject,
  Reducer,
  StateFromReducersMapObject
} from './types/reducers'

import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'
import warning from './utils/warning'
import { kindOf } from './utils/kindOf'

/**
 * 判断 reducer 是否存在 默认状态数据
 * @param reducers 
 */
function assertReducerShape(reducers: {
  [key: string]: Reducer<any, any, any>
}) {
  Object.keys(reducers).forEach(key => {
    // 取出当前 reducer
    const reducer = reducers[key]
    const initialState = reducer(undefined, { type: ActionTypes.INIT })

    if (typeof initialState === 'undefined') {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      )
    }

    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION()
      }) === 'undefined'
    ) {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle '${ActionTypes.INIT}' or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      )
    }
  })
}

/**
 * combineReducers 辅助函数的作用是，把一个由多个不同 reducer 函数作为 value 的
 * object，合并成一个最终的 reducer 函数，然后就可以对这个 reducer 调用 createStore。
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @template S Combined state object type.
 *
 * @param reducers An object whose values correspond to different reducer
 *   functions that need to be combined into one. One handy way to obtain it
 *   is to use ES6 `import * as reducers` syntax. The reducers may never
 *   return undefined for any action. Instead, they should return their
 *   initial state if the state passed to them was undefined, and the current
 *   state for any unrecognized action.
 *
 * @returns A reducer function that invokes every reducer inside the passed
 *   object, and builds a state object with the same shape.
 */
export default function combineReducers(reducers: {
  [key: string]: Reducer<any, any, any>
}) {
  const reducerKeys = Object.keys(reducers)
  const finalReducers: { [key: string]: Reducer<any, any, any> } = {}
  // 对 reducers 做一层过滤
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  const finalReducerKeys = Object.keys(finalReducers)

  let shapeAssertionError: unknown
  try {
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }

  return function combination(
    state: StateFromReducersMapObject<typeof reducers> = {},
    action: Action
  ) {
    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    let hasChanged = false
    const nextState: StateFromReducersMapObject<typeof reducers> = {}
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i]
      const reducer = finalReducers[key]
      // 这里 state[key] 可能会没有
      const previousStateForKey = state[key]
      // 这里就会进入 默认值状态
      const nextStateForKey = reducer(previousStateForKey, action)
      // 代表默认没有时也需要存在 initState
      if (typeof nextStateForKey === 'undefined') {
        throw new Error()
      }
      // 将数据放进去
      nextState[key] = nextStateForKey
      // 代表判断是否两次的值是否发生了变化。
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length
    // 判断是否发生了 change
    return hasChanged ? nextState : state
  }
}
