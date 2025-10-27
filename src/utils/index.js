/**
 * @Author: cj
 * @Date: 2025/10/26 18:40
 *
 */

// 节流
export function throttle ( func, delay ) {
  let lastTime = 0
  return function () {
    const context = this
    const args = arguments
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      func.apply(context, args)
    }
  }
}