/**
 * ESC键关闭指令
 * 用法：v-escape-key="closeFunction"
 * 当按下ESC键时，会调用传入的函数
 */
export default {
  mounted(el, binding) {
    const closeFunction = binding.value
    
    if (!closeFunction || typeof closeFunction !== 'function') {
      return
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeFunction()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    el._escapeKeyHandler = handleKeyDown
  },

  unmounted(el) {
    if (el._escapeKeyHandler) {
      document.removeEventListener('keydown', el._escapeKeyHandler)
      delete el._escapeKeyHandler
    }
  }
}