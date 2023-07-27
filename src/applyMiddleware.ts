import compose from './compose'
import { Middleware, MiddlewareAPI } from './types/middleware'
import { StoreEnhancer, Dispatch } from './types/store'

/**
 * 中间件思路
 * applyMiddleware 通过 enhancer 的调用 返回的 store 和 dispatch
 * 内部实现一个 dispatch 去进行覆盖了 store 的 dispatch
 * dispatch 主要是一个 调用了 中间件的 返回的方法，逆向执行针对 store.dispatch 
 * 的调用，执行后的返回结果。
 */
export default function applyMiddleware(
  ...middlewares: Middleware[]
): StoreEnhancer<any> {
  return createStore => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState)
    let dispatch: Dispatch = () => {
      // 不允许在构造中间件时进行调度。其他中间件不会应用于此分派。
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
          'Other middleware would not be applied to this dispatch.'
      )
    }

    const middlewareAPI: MiddlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    }
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose<typeof dispatch>(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
