// 一个 v5 的简单版本，用于理解，删除了大量不重要的边界 case 以及其他 type 类型等
import $$observable from './utils/symbol-observable'

import {
  Store,
  StoreEnhancer,
  Dispatch,
  Observer,
  ListenerCallback
} from './types/store'
import { Action } from './types/actions'
import { Reducer } from './types/reducers'
import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'
import { kindOf } from './utils/kindOf'

export function createStore<
  S,
  A extends Action,
  Ext extends {} = {},
  StateExt extends {} = {},
  PreloadedState = S
>(
  reducer: Reducer<S, A, PreloadedState>,
  preloadedState?: PreloadedState | StoreEnhancer<Ext, StateExt> | undefined,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<S, A, StateExt> & Ext {

  /**
   * 如果存在 enhancer 方法
   * 那么去调用，进行中间件增强
   */
  if (typeof enhancer !== 'undefined') {
    return enhancer(createStore)(
      reducer,
      preloadedState as PreloadedState | undefined
    )
  }

  let currentReducer = reducer
  let currentState: S | PreloadedState | undefined = preloadedState as
    | PreloadedState
    | undefined
  let currentListeners: Map<number, ListenerCallback> | null = new Map()
  let nextListeners = currentListeners
  let listenerIdCounter = 0
  let isDispatching = false

  /**
   * 确保 nextListeners 发生了变化
   * 防止在分派过程中围绕消费者调用订阅/退订的任何错误。
   * 
   * if 内部会被执行的条件是 触发了 dispatch 或者 初始状态，current 和 next 会被赋值相等。
   */
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = new Map()
      currentListeners.forEach((listener, key) => {
        nextListeners.set(key, listener)
      })
    }
  }

  /**
   * 很简单，就是返回 currentState
   */
  function getState(): S {
    // 如果处于 调度 状态，抛出异常
    if (isDispatching) {
      throw new Error()
    }

    return currentState as S
  }

  /**
   * subscribe 监听的添加
   */
  function subscribe(listener: () => void) {
    if (isDispatching) {
      throw new Error()
    }

    let isSubscribed = true

    ensureCanMutateNextListeners()
    const listenerId = listenerIdCounter++
    nextListeners.set(listenerId, listener)

    return function unsubscribe() {
      // 避免进行重复调用清除功能
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error()
      }

      isSubscribed = false

      // 通过这个，判断是否需要再次更新 next
      ensureCanMutateNextListeners()
      // TODO
      // 为什么 currentListeners 要直接设置为 null
      nextListeners.delete(listenerId)
      currentListeners = null
    }
  }

  /**
   * 判断是否为普通对象、type是否是字符串，是否处于正在 isDispatching 阶段
   * 调用 reducer 进行更新 调用 listeners 方法，
   * 同时将 nextListeners 赋值给 currentListeners
   * return action
   */
  function dispatch(action: A) {
    // 保持 dispatch 的唯一，保证数据的单向唯一性
    if (isDispatching) {
      throw new Error()
    }

    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    const listeners = (currentListeners = nextListeners)
    listeners.forEach(listener => {
      listener()
    })
    return action
  }

  /**
   * 替换当前store用来计算状态的reducer。
   * 
   * TODO 没有理解 调用 dispatch 的作用是什么，因为type是内部的type
   */
  function replaceReducer(nextReducer: Reducer<S, A>): void {
    currentReducer = nextReducer as unknown as Reducer<S, A, PreloadedState>

    dispatch({ type: ActionTypes.REPLACE } as A)
  }

  /**
   * 用于实现对 数据对象的处理。
   * @returns 
   */
  function observable() {
    const outerSubscribe = subscribe
    return {
      /** 作用在数据更新时，调用 observer.next 方法进行处理 */
      subscribe(observer: unknown) {

        function observeState() {
          const observerAsObserver = observer as Observer<S>
          if (observerAsObserver.next) {
            observerAsObserver.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }

  // 当一个存储被创建时，一个“INIT”动作被调度，
  // 以便每个reducer返回它们的初始状态。这有效地填充了初始状态树。
  dispatch({ type: ActionTypes.INIT } as A)

  const store = {
    dispatch: dispatch as Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    // $$observable 是一个通过 Symbol 直接创建的唯一性 键值对
    [$$observable]: observable
  } as unknown as Store<S, A, StateExt> & Ext
  return store
}

export function legacy_createStore<
  S,
  A extends Action,
  Ext extends {} = {},
  StateExt extends {} = {},
  PreloadedState = S
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState | StoreEnhancer<Ext, StateExt> | undefined,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<S, A, StateExt> & Ext {
  return createStore(reducer, preloadedState as any, enhancer)
}
