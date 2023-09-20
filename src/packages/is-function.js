export const isFunction = value =>
  value && (Object.prototype.toString.call(value) === '[object Function]' ||
    typeof value === 'function' || value instanceof Function)
