/**
 * 如果参数看起来是一个普通对象，则为True。
 * @param obj The object to inspect.
 * @returns True if the argument appears to be a plain object.
 * 
 * Object.getPrototypeOf() 静态方法返回指定对象的原型（即内部 [[Prototype]] 属性的值）。
 * 所以意思就是，原型要是顶层原型。
 */
export default function isPlainObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}
