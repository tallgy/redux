import { Dispatch } from './types/store'
import { ActionCreator, ActionCreatorsMapObject, Action } from './types/actions'
import { kindOf } from './utils/kindOf'

function bindActionCreator<A extends Action>(
  actionCreator: ActionCreator<A>,
  dispatch: Dispatch<A>
) {
  return function (this: any, ...args: any[]) {
    return dispatch(actionCreator.apply(this, args))
  }
}

export default function bindActionCreators<
  M extends ActionCreatorsMapObject,
  N extends ActionCreatorsMapObject
>(actionCreators: M, dispatch: Dispatch): N

/**
 * 对于多个事件工厂 action1 action2
 * action1() action2()
 * 原本的调用思路 dispatch(action1()) / dispatch(action2())
 * 通过 newDispatch = bindActionCreators([action1, action2], dispatch)
 * 可以改变调用方式 newDispatch.action1() ...
 * @param actionCreators 
 * @param dispatch 
 * @returns 
 */
export default function bindActionCreators(
  actionCreators: ActionCreator<any> | ActionCreatorsMapObject,
  dispatch: Dispatch
) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  const boundActionCreators: ActionCreatorsMapObject = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
