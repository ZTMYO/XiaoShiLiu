/**
 * 点击外部区域关闭模态框的自定义指令
 * 用法：v-click-outside="closeFunction"
 * 
 * 功能：
 * 1. 监听点击事件，当点击的是overlay本身（而不是内容区域）时触发关闭函数
 * 2. 支持鼠标按下事件（mousedown）和点击事件（click）
 * 3. 自动处理事件的绑定和解绑
 */

export const vClickOutside = {
  mounted(el, binding) {
    const closeFunction = binding.value

    if (!closeFunction || typeof closeFunction !== 'function') {
      return
    }

    const handleClick = (event) => {
      if (event.target === event.currentTarget) {
        event.preventDefault()
        event.stopPropagation()
        closeFunction()
      }
    }

    const eventType = binding.modifiers.mousedown ? 'mousedown' : 'click'

    el.addEventListener(eventType, handleClick)

    el._clickOutsideHandler = { handler: handleClick, eventType }
  },

  unmounted(el) {
    if (el._clickOutsideHandler) {
      el.removeEventListener(el._clickOutsideHandler.eventType, el._clickOutsideHandler.handler)
      delete el._clickOutsideHandler
    }
  }
}