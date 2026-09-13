import { useIntersectionObserver } from '@vueuse/core'
import { vUserHover } from './userHover'
import { vClickOutside } from './clickOutside'
import vEscapeKey from './escapeKey'
import defaultAvatar from '@/assets/imgs/avatar.png'
import defaultPlaceholder from '@/assets/imgs/未加载.png'

// 图片失败重试策略：最多重试 3 次，间隔按 1.5s 指数退避
const MAX_RETRY_COUNT = 3
const RETRY_BASE_DELAY = 1500

// 每个图片元素的重试状态（重试次数、进行中的定时器）
const imageRetryStates = new WeakMap()

const isAvatarElement = (el) => el.classList.contains('lazy-avatar')

const getPlaceholderImage = (el) => (isAvatarElement(el) ? defaultAvatar : defaultPlaceholder)

const getRetryState = (el) => {
  let state = imageRetryStates.get(el)
  if (!state) {
    state = { count: 0, timer: null }
    imageRetryStates.set(el, state)
  }
  return state
}

const resetRetryState = (el) => {
  const state = imageRetryStates.get(el)
  if (state && state.timer) {
    clearTimeout(state.timer)
  }
  imageRetryStates.set(el, { count: 0, timer: null })
}

const revealImage = (el) => {
  el.style.opacity = '1'
  el.style.visibility = 'visible'
  el.classList.add('fade-in')
}

// 图片加载队列管理
class ImageLoadQueue {
  constructor(maxConcurrent = 6) {
    this.maxConcurrent = maxConcurrent
    this.running = 0
    this.queue = []
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    const { task, resolve, reject } = this.queue.shift()

    try {
      const result = await task()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.running--
      this.process()
    }
  }
}

// 全局图片加载队列
const globalImageQueue = new ImageLoadQueue(4) // 降低并发数，避免过载

// 检测卡住item的管理器
class StuckItemManager {
  constructor() {
    this.pendingItems = new Map()
    this.checkInterval = null
    this.isChecking = false
  }

  addItem(el, binding) {
    this.pendingItems.set(el, {
      binding,
      addedAt: Date.now(),
      checked: false
    })
    this.startChecking()
  }

  removeItem(el) {
    this.pendingItems.delete(el)
    if (this.pendingItems.size === 0) {
      this.stopChecking()
    }
  }

  clearAll() {
    this.pendingItems.clear()
    this.stopChecking()
  }

  startChecking() {
    if (this.checkInterval || this.isChecking) return

    this.checkInterval = setInterval(() => {
      this.checkStuckItems()
    }, 5000) // 每5秒检查一次
  }

  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  checkStuckItems() {
    if (this.isChecking) return
    this.isChecking = true

    const now = Date.now()
    for (const [el, info] of this.pendingItems) {
      // 如果超过10秒未加载且在视口内，强制重新检查
      if (now - info.addedAt > 10000 && !info.checked) {
        if (this.isElementInViewport(el)) {
          this.forceLoadImage(el, info.binding)
          info.checked = true
        }
      }
    }

    this.isChecking = false
  }

  isElementInViewport(el) {
    const rect = el.getBoundingClientRect()
    return (
      rect.top < window.innerHeight + 100 &&
      rect.bottom > -100 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    )
  }

  forceLoadImage(el, binding) {
    // 强制加载图片，不使用队列
    const img = new Image()
    img.onload = () => {
      resetRetryState(el)
      el.src = binding.value
      el.classList.add('fade-in')
      el.dispatchEvent(new Event('load'))
      this.removeItem(el)
    }
    img.onerror = () => {
      // 交由统一的失败重试流程处理
      handleImageLoadFailure(el, binding.value)
    }

    // 添加5秒超时
    setTimeout(() => {
      if (!el.src || el.src === 'data:' || el.src.includes('blob:')) {
        handleImageLoadFailure(el, binding.value)
      }
    }, 5000)

    img.src = binding.value
  }
}

export const stuckItemManager = new StuckItemManager()

// 达到重试上限后展示可点击的重试占位图
const showRetryPlaceholder = (el) => {
  const state = getRetryState(el)
  if (state.timer) {
    clearTimeout(state.timer)
    state.timer = null
  }

  el.src = getPlaceholderImage(el)
  el.alt = '图片加载失败，点击重试'
  revealImage(el)
  el.classList.add('img-retryable')

  // 头像点击用于跳转用户主页，仅对封面图绑定点击重试
  if (!isAvatarElement(el) && el.dataset.retryClickBound !== '1') {
    el.dataset.retryClickBound = '1'
    el.addEventListener('click', handleRetryClick)
  }

  el.dispatchEvent(new Event('load'))
}

// 用户点击占位图时手动重新加载
const handleRetryClick = (event) => {
  const el = event.currentTarget
  if (!el.classList.contains('img-retryable')) return

  event.stopPropagation()
  el.classList.remove('img-retryable')
  resetRetryState(el)
  retryImageLoad(el)
}

// 加载失败入口：未达上限则安排指数退避重试，超限则展示占位图
const handleImageLoadFailure = (el, src) => {
  stuckItemManager.removeItem(el)

  const state = getRetryState(el)
  if (state.timer) return

  if (state.count >= MAX_RETRY_COUNT) {
    showRetryPlaceholder(el)
    return
  }

  state.count += 1
  const delay = RETRY_BASE_DELAY * Math.pow(2, state.count - 1)
  state.timer = setTimeout(() => {
    state.timer = null
    retryImageLoad(el, src)
  }, delay)
}

// 通过预加载重新拉取图片，成功后写入真实 src
const retryImageLoad = (el, src) => {
  const targetSrc = src || el.getAttribute('v-img-lazy') || el.dataset.src
  if (!targetSrc) {
    showRetryPlaceholder(el)
    return
  }

  const img = new Image()

  const timeout = setTimeout(() => {
    img.onload = null
    img.onerror = null
    handleImageLoadFailure(el, targetSrc)
  }, 8000)

  img.onload = () => {
    clearTimeout(timeout)
    resetRetryState(el)
    el.classList.remove('img-retryable')
    el.removeAttribute('img-retryable')
    el.src = targetSrc
    el.alt = ''
    revealImage(el)
    el.dispatchEvent(new Event('load'))
  }

  img.onerror = () => {
    clearTimeout(timeout)
    img.onload = null
    img.onerror = null
    handleImageLoadFailure(el, targetSrc)
  }

  img.src = targetSrc
}

// 供组件监听 img error 事件时调用，触发重新加载流程
export const retryFailedImage = (el) => {
  if (!el) return
  const src = el.getAttribute('v-img-lazy') || el.dataset.src
  handleImageLoadFailure(el, src)
}

// 立即加载图片函数（用于首屏图片）
const loadImageImmediately = (el, src) => {
  const img = new Image()

  const timeout = setTimeout(() => {
    img.onload = null
    img.onerror = null
    handleImageLoadFailure(el, src)
  }, 3000) // 首屏图片缩短超时时间

  img.onload = () => {
    clearTimeout(timeout)
    resetRetryState(el)
    el.src = src
    el.style.opacity = '1'
    el.style.visibility = 'visible'
    el.classList.add('fade-in')
    el.dispatchEvent(new Event('load'))
    stuckItemManager.removeItem(el)
  }

  img.onerror = () => {
    clearTimeout(timeout)
    img.onload = null
    img.onerror = null
    handleImageLoadFailure(el, src)
  }

  img.src = src
}

export const lazyPlugin = {
  install(app) {
    app.directive('img-lazy', {
      mounted(el, binding) {
        // 检查图片是否已经正确加载
        if (el.src === binding.value && el.complete && el.naturalWidth > 0) {
          return
        }

        // 设置初始状态和数据属性
        el.style.opacity = '0'
        el.style.visibility = 'hidden'
        el.style.transition = 'opacity 0.3s ease'
        el.dataset.src = binding.value // 保存原始src供强制检查使用
        el.setAttribute('v-img-lazy', binding.value)

        // 添加到卡住检测管理器
        stuckItemManager.addItem(el, binding)

        // 检查是否在首屏位置，如果是则立即加载
        const rect = el.getBoundingClientRect()
        const isInFirstScreen = rect.top < window.innerHeight + 100

        if (isInFirstScreen) {
          // 首屏图片立即加载，不使用队列
          loadImageImmediately(el, binding.value)
          return
        }

        const { stop } = useIntersectionObserver(
          el,
          ([{ isIntersecting, intersectionRatio }]) => {
            if (isIntersecting || intersectionRatio > 0) {
              // 使用队列管理图片加载，避免并发过载
              globalImageQueue.add(() => {
                return new Promise((resolve, reject) => {
                  const img = new Image()

                  const loadTimeout = setTimeout(() => {
                    img.onload = null
                    img.onerror = null
                    reject(new Error('加载超时'))
                  }, 8000) // 8秒超时

                  img.onload = () => {
                    clearTimeout(loadTimeout)
                    resetRetryState(el)
                    el.src = binding.value
                    el.style.opacity = '1'
                    el.style.visibility = 'visible'
                    el.classList.add('fade-in')
                    el.dispatchEvent(new Event('load'))
                    stuckItemManager.removeItem(el)
                    resolve()
                  }

                  img.onerror = () => {
                    clearTimeout(loadTimeout)
                    img.onload = null
                    img.onerror = null
                    handleImageLoadFailure(el, binding.value)
                    resolve()
                  }

                  img.src = binding.value
                })
              }).catch(() => {
                // 队列加载失败，进入统一重试流程
                handleImageLoadFailure(el, binding.value)
              })

              stop()
            }
          },
          {
            rootMargin: '100px', // 增大预加载范围
            threshold: 0.1, // 降低触发阈值
          }
        )

        // 备用检查机制：延迟1秒后再次检查
        setTimeout(() => {
          if (!el.src || el.src === 'data:' || el.style.opacity === '0') {
            const rect = el.getBoundingClientRect()
            if (rect.top < window.innerHeight + 50 && rect.bottom > -50) {
              // 在视口内但未加载，强制触发加载
              loadImageImmediately(el, binding.value)
            }
          }
        }, 1000)
      },

      updated(el, binding) {
        // 处理更新时的情况
        if (binding.value !== binding.oldValue) {
          if (el.src !== binding.value) {
            // 换了图片地址，重置重试状态后重新触发懒加载
            resetRetryState(el)
            el.classList.remove('img-retryable')
            el.style.opacity = '0'
            stuckItemManager.addItem(el, binding)
          }
        }
      },

      unmounted(el) {
        // 清理资源
        const state = imageRetryStates.get(el)
        if (state && state.timer) {
          clearTimeout(state.timer)
        }
        el.removeEventListener('click', handleRetryClick)
        stuckItemManager.removeItem(el)
      }
    })

    app.directive('user-hover', vUserHover)

    app.directive('click-outside', vClickOutside)

    app.directive('escape-key', vEscapeKey)
  }
}