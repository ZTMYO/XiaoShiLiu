import { useIntersectionObserver } from '@vueuse/core'
import { vUserHover } from './userHover'
import { vClickOutside } from './clickOutside'
import vEscapeKey from './escapeKey'

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
      el.src = binding.value
      el.classList.add('fade-in')
      el.dispatchEvent(new Event('load'))
      this.removeItem(el)
    }
    img.onerror = () => {
      el.src = new URL('@/assets/imgs/未加载.png', import.meta.url).href
      el.alt = '图片加载失败'
      el.dispatchEvent(new Event('load'))
      this.removeItem(el)
    }

    // 添加5秒超时
    setTimeout(() => {
      if (!el.src || el.src === 'data:' || el.src.includes('blob:')) {
        el.src = new URL('@/assets/imgs/未加载.png', import.meta.url).href
        el.alt = '图片加载超时'
        el.dispatchEvent(new Event('load'))
        this.removeItem(el)
      }
    }, 5000)

    img.src = binding.value
  }
}

const stuckItemManager = new StuckItemManager()

// 立即加载图片函数（用于首屏图片）
const loadImageImmediately = (el, src) => {
  const img = new Image()

  const timeout = setTimeout(() => {
    img.onload = null
    img.onerror = null
    el.src = new URL('@/assets/imgs/未加载.png', import.meta.url).href
    el.alt = '图片加载超时'
    el.style.opacity = '1'
    el.style.visibility = 'visible'
    el.dispatchEvent(new Event('load'))
    stuckItemManager.removeItem(el)
  }, 3000) // 首屏图片缩短超时时间

  img.onload = () => {
    clearTimeout(timeout)
    el.src = src
    el.style.opacity = '1'
    el.style.visibility = 'visible'
    el.classList.add('fade-in')
    el.dispatchEvent(new Event('load'))
    stuckItemManager.removeItem(el)
  }

  img.onerror = () => {
    clearTimeout(timeout)
    el.src = new URL('@/assets/imgs/未加载.png', import.meta.url).href
    el.alt = '图片加载失败'
    el.style.opacity = '1'
    el.style.visibility = 'visible'
    el.dispatchEvent(new Event('load'))
    stuckItemManager.removeItem(el)
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
                    el.src = new URL('@/assets/imgs/未加载.png', import.meta.url).href
                    el.alt = '图片加载失败'
                    el.style.opacity = '1'
                    el.style.visibility = 'visible'
                    el.dispatchEvent(new Event('load'))
                    stuckItemManager.removeItem(el)
                    resolve()
                  }

                  img.src = binding.value
                })
              }).catch(() => {
                // 队列加载失败，显示默认图片
                el.src = new URL('@/assets/imgs/未加载.png', import.meta.url).href
                el.alt = '图片加载失败'
                el.style.opacity = '1'
                el.style.visibility = 'visible'
                el.dispatchEvent(new Event('load'))
                stuckItemManager.removeItem(el)
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
            // 重新触发懒加载
            el.style.opacity = '0'
            stuckItemManager.addItem(el, binding)
          }
        }
      },

      unmounted(el) {
        // 清理资源
        stuckItemManager.removeItem(el)
      }
    })

    app.directive('user-hover', vUserHover)

    app.directive('click-outside', vClickOutside)

    app.directive('escape-key', vEscapeKey)
  }
}