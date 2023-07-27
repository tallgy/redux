/**
 * 从右到左，一次生成的 柯里化函数
 * 重点是使用 reduce 进行循环调用到结束
 */
export default function compose<R>(...funcs: Function[]): (...args: any[]) => R
export default function compose(...funcs: Function[]) {
  if (funcs.length === 0) {
    return <T>(arg: T) => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  // 这个是重点
  return funcs.reduce(
    (a, b) =>
      (...args: any) =>
        a(b(...args))
  )
  // 详细描述
  // 不传递参数，表示 第一个是从下标0开始
  // 将一个没有执行的方法整体放成 preFn
  // eg:  fn1, fn2, fn3
  // preFn = fn1, curFn = fn2
  // preFn(curFn(...)) = fn1(fn2(...))
  // preFn = fn1(fn2(...)), curFn = fn3
  // preFn(curFn(...)) = fn1(fn2(fn3(...))); 
  /**
   * 详细逻辑
   * fn1, fn2, fn3
   * 第一次
   * preFn = fn1, curFn = fn2
   * reutrn (...a) => {
   *   return fn1(fn2(...a));
   * } as fn1fn2
   * 第二次
   * preFn = fn1fn2, curFn = fn3
   * return (...a) => {
   *   return (fn3(...a) as args) => {
   *     return fn1(fn2(...args));
   *   }
   * }
   */
  return funcs.reduce(
    (preFn, curFn) => {
      // 将这个方法直接返回，就会变成下一个的 preFn 
      return (...args: any[]) => {
        // 执行的是 preFn(curFn())
        return preFn(curFn(...args))
      }
    }
  )
}
