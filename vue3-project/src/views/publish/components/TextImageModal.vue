<template>
  <div v-if="visible" class="text-image-modal-overlay" @mousedown="handleOverlayMouseDown">
    <div class="text-image-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">文字配图</h3>
        <button class="close-btn" @click="$emit('close')">
          <SvgIcon name="close" width="20" height="20" />
        </button>
      </div>

      <div class="modal-body">
        <!-- 左右两栏布局 -->
        <div class="main-content">
          <!-- 左侧预览区域 -->
          <div class="preview-section">
            <div class="preview-container">
              <div v-if="!previewImage" class="preview-placeholder">
                <SvgIcon name="imgNote" width="48" height="48" />
                <p>{{ placeholderText }}</p>
              </div>
              <img v-else :src="previewImage" class="preview-image" alt="生成的图片" />
              <!-- 隐藏的canvas用于生成图片 -->
              <canvas ref="previewCanvas" class="hidden-canvas" width="400" height="600" style="display: none;"></canvas>
            </div>
          </div>

          <!-- 右侧控制区域 -->
          <div class="controls-section">
            <!-- 字体和颜色控制区域 -->
            <div class="font-controls">
              <div class="color-controls">
                <div class="control-group">
                  <label class="control-label">文字颜色</label>
                  <label class="color-dot color-dot-current" :style="{ color: textColor }">
                    <input type="color" v-model="textColor" />
                  </label>
                </div>

                <div class="control-group">
                  <label class="stroke-toggle">
                    <input type="checkbox" v-model="strokeEnabled" />
                    <span>文字描边</span>
                  </label>
                  <label v-if="strokeEnabled" class="color-dot color-dot-current" :style="{ color: strokeColor }">
                    <input type="color" v-model="strokeColor" />
                  </label>
                </div>
              </div>

              <div class="control-group">
                <label class="control-label">字体</label>
                <DropdownSelect
                  v-model="selectedFont"
                  :options="fontOptions"
                  placeholder="选择字体"
                  min-width="120px"
                  max-width="200px"
                  size="small"
                />
              </div>
            </div>

            <!-- 输入和Emoji区域容器 -->
            <div class="input-emoji-container">
              <!-- 输入框和emoji选择器 -->
              <div class="input-section">
                <div class="content-input-wrapper">
                  <ContentEditableInput ref="textInputRef" v-model="inputText" placeholder="输入文字内容"
                    :input-class="'content-textarea'" :max-length="200" />
                  <div class="content-actions">
                    <button class="emoji-btn" @click="toggleEmojiPanel">
                      <SvgIcon name="emoji" class="emoji-icon" width="20" height="20" />
                    </button>
                  </div>
                </div>

                <!-- Emoji选择器 -->
                <EmojiPanel v-if="showEmojiPanel" @select="handleEmojiSelect" @close="closeEmojiPanel" />
              </div>
            </div>

            <!-- 模版选择区域 -->
            <div class="template-section">
              <div class="section-title">选择模版</div>
              <div class="template-scroll-container">
                <div class="template-list">
                  <div v-for="template in templates" :key="template.id" class="template-item"
                    :class="{ active: selectedTemplate?.id === template.id }" @click="selectTemplate(template)">
                    <img :src="template.src" :alt="template.name" class="template-image" />
                    <span class="template-name">{{ template.name }}</span>
                  </div>
                </div>
              </div>
              <div class="color-dot-list frame-colors">
                <button v-for="color in framePalette" :key="color" type="button" class="color-dot"
                  :class="{ active: frameColor === color }" :style="{ background: color, color }"
                  @click="frameColor = color"></button>
                <label class="color-dot color-dot-custom" :style="{ color: frameColor }"
                  :class="{ active: !framePalette.includes(frameColor) }">
                  <input type="color" v-model="frameColor" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('close')">取消</button>
        <button class="upload-btn" @click="handleUpload" :disabled="!previewImage">上传</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import ContentEditableInput from '@/components/ContentEditableInput.vue'
import EmojiPanel from '@/components/EmojiPanel.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'
import { STICKER_EM, splitStickerSegments, stickerDrawInfo } from '@/utils/inlineSticker'
import { framePresets, framePalette, defaultFrameColor, renderFrame, frameSafeAreas } from '@/utils/textFrames'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'generate'])

const textInputRef = ref(null)
const previewCanvas = ref(null)
const inputText = ref('')
const showEmojiPanel = ref(false)
const selectedTemplate = ref(null)
const previewImage = ref('')
const frameColor = ref(defaultFrameColor)
const fontSize = ref(40)
const selectedFont = ref('微软雅黑')

// 字体选项
const fontOptions = [
  { label: '微软雅黑', value: '微软雅黑' },
  { label: '宋体', value: '宋体' },
  { label: '楷体', value: '楷体' },
  { label: '黑体', value: '黑体' },
  { label: '仿宋', value: 'FangSong' },
  { label: '华文细黑', value: 'STXihei' },
  { label: '华文彩云', value: 'STCaiyun' },
  { label: '华文楷体', value: 'STKaiti' },
  { label: '华文宋体', value: 'STSong' },
  { label: '华文黑体', value: 'STHeiti' },
  { label: '华文仿宋', value: 'STFangsong' },
  { label: '华文隶书', value: 'STLiti' }
]

// 表情按 1 个字算：标记本身有十几个字符，不能直接数长度
const displayLength = (line) =>
  splitStickerSegments(line).reduce((sum, seg) => sum + (seg.type === 'sticker' ? 1 : seg.value.length), 0)

// 自动计算最合适的字体大小
const calculateOptimalFontSize = () => {
  if (!inputText.value) return 30
  
  const lines = processText(inputText.value)
  const maxLineLength = Math.max(...lines.map(displayLength))
  
  // 根据每行字符数确定字体大小
  if (maxLineLength <= 5) {
    return 55
  } else if (maxLineLength <= 7) {
    return 45
  } else if (maxLineLength === 8) {
    return 40
  } else if (maxLineLength === 9) {
    return 35
  } else {
    return 30  // 超过9个字使用最小字体
  }
}
const textColor = ref('#000000')
const strokeColor = ref('#ffffff')
const strokeEnabled = ref(false)

// 模板缩略图跟着配色实时重绘，选色时列表里就能看到效果
const templates = computed(() =>
  framePresets.map((frame) => ({
    id: frame.id,
    name: frame.name,
    frame,
    src: renderFrame(frame, frameColor.value)
  }))
)

// 处理文字换行，按用户输入的换行符进行换行
const processText = (text) => {
  if (!text) return []
  
  // 创建临时DOM元素来安全地提取文本内容
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = text
  
  // 将<br>和<div>标签转换为换行符
  const brElements = tempDiv.querySelectorAll('br')
  brElements.forEach(br => {
    br.replaceWith('\n')
  })
  
  const divElements = tempDiv.querySelectorAll('div')
  divElements.forEach(div => {
    div.insertAdjacentText('beforebegin', '\n')
  })
  
  // 获取纯文本内容
  let cleanText = tempDiv.textContent || tempDiv.innerText || ''
  
  // 处理HTML实体字符
  cleanText = cleanText.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  
  // 按换行符分割文本
  const lines = cleanText.split('\n')
  
  // 过滤掉完全空的行
  const filteredLines = lines.filter(line => line.trim().length > 0)
  
  return filteredLines
}

// 雪碧图只在第一次用到时加载，之后复用
const sheetCache = new Map()
const loadSheet = (src) => {
  if (!sheetCache.has(src)) {
    sheetCache.set(src, new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    }))
  }
  return sheetCache.get(src)
}

// 把一行按段排好：文字量宽度，表情按字号倍数占位，都记下起始 x
const layoutLine = (ctx, line, fontSize, centerX) => {
  const stickerSize = fontSize * STICKER_EM
  const placed = []
  let total = 0

  for (const seg of splitStickerSegments(line)) {
    if (seg.type === 'sticker') {
      const info = stickerDrawInfo(seg.packId, seg.itemId)
      if (info) {
        placed.push({ kind: 'sticker', info, width: stickerSize })
        total += stickerSize
        continue
      }
      // 表情不存在时退回明文，跟页面上的表现保持一致
      const width = ctx.measureText(seg.raw).width
      placed.push({ kind: 'text', value: seg.raw, width })
      total += width
      continue
    }
    const width = ctx.measureText(seg.value).width
    placed.push({ kind: 'text', value: seg.value, width })
    total += width
  }

  let x = centerX - total / 2
  placed.forEach((seg) => {
    seg.x = x
    x += seg.width
  })
  return { placed, stickerSize }
}

const isStickerToken = (token) => {
  const segs = splitStickerSegments(token)
  return segs.length === 1 && segs[0].type === 'sticker'
}

const tokenWidth = (ctx, token, stickerSize) =>
  isStickerToken(token) ? stickerSize : ctx.measureText(token).width

// 拆成不可再分的排版单元：表情标记整体算一个，西文连续字母数字算一个词，其余逐字
const splitTokens = (line) => {
  const tokens = []
  for (const seg of splitStickerSegments(line)) {
    if (seg.type === 'sticker') {
      tokens.push(seg.raw)
      continue
    }
    tokens.push(...(seg.value.match(/[A-Za-z0-9'’-]+|\s+|[\s\S]/g) || []))
  }
  return tokens
}

// 按安全区宽度折行，用户不手动回车也能自动断开
const wrapLine = (ctx, line, maxWidth, stickerSize) => {
  const atoms = []

  splitTokens(line).forEach((token) => {
    const width = tokenWidth(ctx, token, stickerSize)
    // 单个单元本身就超宽（长英文词）时退化成逐字，否则会整行溢出
    if (width > maxWidth && !isStickerToken(token)) {
      ;[...token].forEach((char) => atoms.push({ text: char, width: ctx.measureText(char).width }))
      return
    }
    atoms.push({ text: token, width })
  })

  const rows = []
  let row = ''
  let width = 0

  atoms.forEach((atom) => {
    if (row && width + atom.width > maxWidth) {
      rows.push(row)
      row = ''
      width = 0
      // 折断处正好落在空白上就丢掉，免得行首留空
      if (/^\s+$/.test(atom.text)) return
    }
    row += atom.text
    width += atom.width
  })

  if (row) rows.push(row)

  return rows.map((row) => row.replace(/\s+$/, '')).filter((row) => row.length > 0)
}

// 逐档缩小字号，直到折行后的文字能整体装进安全区
const layoutTextInArea = (ctx, rawLines, baseFontSize, area) => {
  let last = null

  for (let size = baseFontSize; size >= 18; size -= 2) {
    const lineHeight = size + 10
    ctx.font = `bold ${size}px ${selectedFont.value}, Arial, sans-serif`
    const lines = rawLines.flatMap((line) => wrapLine(ctx, line, area.w, size * STICKER_EM))
    last = { fontSize: size, lineHeight, lines }
    if (lines.length * lineHeight <= area.h) return last
  }

  return last
}

// 绘制canvas预览
const drawCanvas = async () => {
  if (!previewCanvas.value || !selectedTemplate.value) {
    return
  }

  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')

  // 清空canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  try {
    // 底图按当前配色实时生成，SVG 自带画布尺寸，直接铺满即可
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = renderFrame(selectedTemplate.value.frame, frameColor.value)
    })

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 绘制文字
    if (inputText.value.trim()) {
      const area = frameSafeAreas[selectedTemplate.value.id]
        || { x: 0, y: 0, w: canvas.width, h: canvas.height }

      const rawLines = processText(inputText.value)

      // 先折行、按安全区收缩字号，再拿最终字号排版
      const { fontSize: currentFontSize, lineHeight, lines } =
        layoutTextInArea(ctx, rawLines, calculateOptimalFontSize(), area)
      fontSize.value = currentFontSize

      // 设置文字样式
      ctx.font = `bold ${currentFontSize}px ${selectedFont.value}, Arial, sans-serif`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 3

      // 文字在安全区内居中，而不是整个画布居中
      const totalHeight = lines.length * lineHeight
      const startY = area.y + (area.h - totalHeight) / 2 + lineHeight / 2
      const centerX = area.x + area.w / 2

      // 行内表情要用的雪碧图先全部就位，避免边画边等
      const sheets = new Map()
      for (const line of lines) {
        for (const seg of splitStickerSegments(line)) {
          if (seg.type !== 'sticker') continue
          const info = stickerDrawInfo(seg.packId, seg.itemId)
          if (info) sheets.set(info.sheet, await loadSheet(info.sheet))
        }
      }

      // 逐行绘制：先统一描边、再统一填充，最后贴表情，避免相邻两段互相压边
      lines.forEach((line, index) => {
        if (!line || typeof line !== 'string') return

        const y = startY + index * lineHeight
        const { placed, stickerSize } = layoutLine(ctx, line, currentFontSize, centerX)

        if (strokeEnabled.value) {
          ctx.strokeStyle = strokeColor.value
          placed.forEach((seg) => {
            if (seg.kind === 'text') ctx.strokeText(seg.value, seg.x, y)
          })
        }

        ctx.fillStyle = textColor.value
        placed.forEach((seg) => {
          if (seg.kind === 'text') ctx.fillText(seg.value, seg.x, y)
        })

        placed.forEach((seg) => {
          if (seg.kind !== 'sticker') return
          const sheet = sheets.get(seg.info.sheet)
          if (!sheet) return
          const cellWidth = sheet.naturalWidth / seg.info.columns
          const cellHeight = sheet.naturalHeight / seg.info.rows
          ctx.drawImage(
            sheet,
            seg.info.x * cellWidth, seg.info.y * cellHeight, cellWidth, cellHeight,
            seg.x, y - stickerSize / 2, stickerSize, stickerSize
          )
        })
      })
    }
  } catch (error) {
    console.error('绘制canvas失败:', error)
  }
}

// 计算是否可以生成图片
const canGenerate = computed(() => {
  return inputText.value.trim() && selectedTemplate.value
})

// 计算提示文字
const placeholderText = computed(() => {
  const hasText = inputText.value.trim()
  const hasTemplate = selectedTemplate.value

  if (!hasText && !hasTemplate) {
    return '请输入文字并选择模版'
  } else if (hasTemplate && !hasText) {
    return '请输入文字内容'
  } else if (hasText && !hasTemplate) {
    return '请选择模版'
  } else {
    return '图片生成中...'
  }
})

// 处理遮罩层鼠标按下
const handleOverlayMouseDown = (event) => {
  // 只有在遮罩层本身按下鼠标时才关闭模态框
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

// 切换emoji面板
const toggleEmojiPanel = () => {
  showEmojiPanel.value = !showEmojiPanel.value
}

// 关闭emoji面板
const closeEmojiPanel = () => {
  showEmojiPanel.value = false
}

// 处理emoji选择
const handleEmojiSelect = (emoji) => {
  const emojiChar = emoji.i
  const inputElement = textInputRef.value

  if (inputElement && inputElement.insertEmoji) {
    inputElement.insertEmoji(emojiChar)
  } else {
    inputText.value += emojiChar
  }
}

// 选择模版
const selectTemplate = (template) => {
  selectedTemplate.value = template
  // 清除之前的预览图片
  previewImage.value = ''

  // 如果已有文字，自动生成图片
  if (inputText.value.trim()) {
    handleGenerate()
  }
}

// 处理生成图片
const handleGenerate = async () => {
  if (!canGenerate.value || !previewCanvas.value) {
    return
  }

  try {
    // 先绘制canvas，等待完成
    await drawCanvas()

    // 将canvas转为blob并显示在预览区域
    await new Promise((resolve) => {
      previewCanvas.value.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          previewImage.value = url
        }
        resolve()
      }, 'image/png', 0.9)
    })
  } catch (error) {
    console.error('生成图片失败:', error)
  }
}

// 处理上传图片
const handleUpload = async () => {
  if (!previewImage.value) return

  try {
    // 确保canvas已绘制完成
    await drawCanvas()

    // 将canvas转为blob
    previewCanvas.value.toBlob((blob) => {
      if (blob) {
        // 创建File对象
        const file = new File([blob], `text-image-${Date.now()}.png`, {
          type: 'image/png'
        })

        const data = {
          text: inputText.value,
          template: selectedTemplate.value,
          imageFile: file,
          imageUrl: previewImage.value
        }

        emit('generate', data)
      }
    }, 'image/png', 0.9)
  } catch (error) {
    console.error('上传图片失败:', error)
  }
}

// 监听文字变化，自动生成图片
watch(inputText, (newText) => {
  // 如果有文字且已选择模版，自动生成图片
  if (newText.trim() && selectedTemplate.value) {
    handleGenerate()
  } else if (!newText.trim()) {
    // 只有在没有文字时才清除预览图片
    previewImage.value = ''
  }
})

// 监听颜色和字体变化，自动重新生成图片
watch([textColor, strokeColor, strokeEnabled, selectedFont, frameColor], () => {
  if (inputText.value.trim() && selectedTemplate.value) {
    // 直接执行，不使用nextTick
    handleGenerate()
  }
})

// 监听visible变化，重置状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 模态框打开时重置状态
    inputText.value = ''
    selectedTemplate.value = null
    previewImage.value = ''
    showEmojiPanel.value = false
    // 重置颜色和字体设置
    textColor.value = '#000000'
    strokeColor.value = '#ffffff'
    strokeEnabled.value = false
    frameColor.value = defaultFrameColor
    selectedFont.value = '微软雅黑'
  }
})
</script>

<style scoped>
.text-image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.text-image-modal {
  background: var(--bg-color-primary);
  border-radius: 8px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px var(--shadow-color);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-color-primary);
  flex-shrink: 0;
  background: var(--bg-color-primary);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: var(--text-color-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--text-color-primary);
  background-color: var(--bg-color-secondary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  background: var(--bg-color-primary);
}

.main-content {
  display: flex;
  flex-direction: row;
  gap: 30px;
  flex: 1;
}

.preview-section {
  flex: 0 0 300px;
  text-align: center;
}

.controls-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.input-emoji-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.preview-container {
  width: 100%;
  border: 2px dashed var(--border-color-primary);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-primary);
  min-height: 400px;
  overflow: hidden;
  position: relative;
}

.preview-container:has(.preview-image) {
  border: none;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-color-secondary);
}

.preview-placeholder p {
  margin: 0;
  font-size: 18px;
}

.preview-canvas {
  display: block;
  border-radius: 8px;
  border: 1px solid var(--border-color-primary);
  max-width: 100%;
  height: auto;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.hidden-canvas {
  display: none !important;
}

.input-section {
  position: relative;
}

.content-input-wrapper {
  position: relative;
  border: 1px solid var(--border-color-primary);
  border-radius: 8px;
  background: var(--bg-color-primary);
  transition: all 0.2s ease;
}

.content-input-wrapper:focus-within {
  border-color: var(--primary-color);
}

.content-textarea {
  width: 100%;
  padding: 1rem;
  padding-bottom: 3rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-color-primary);
  font-size: 16px;
  line-height: 1.5;
  transition: all 0.2s ease;
  min-height: 80px;
  box-sizing: border-box;
  caret-color: var(--primary-color);
}

.content-textarea:focus {
  outline: none;
}

.content-textarea:empty:before {
  content: attr(placeholder);
  color: var(--text-color-secondary);
  pointer-events: none;
}

.content-actions {
  position: absolute;
  bottom: 0.5rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-color-secondary);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.emoji-btn:hover {
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
}

.emoji-icon {
  width: 20px;
  height: 20px;
}

.emoji-panel-overlay {
  --ep-overlay-z: 1000;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.font-controls {
  background: var(--bg-color-primary);
  border-radius: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-color-primary);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.control-label {
  width: 72px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary);
  margin: 0;
}

.stroke-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary);
  margin: 0;
  cursor: pointer;
  user-select: none;
}

/* 同色系自绘勾选框，跟着主题色走 */
.stroke-toggle input {
  appearance: none;
  width: 15px;
  height: 15px;
  margin: 0;
  border: 1px solid var(--border-color-primary);
  border-radius: 3px;
  background: var(--bg-color-primary);
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.stroke-toggle input:checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.stroke-toggle input:checked::after {
  content: '';
  box-sizing: border-box;
  position: absolute;
  left: 4px;
  top: 3px;
  width: 5px;
  height: 7px;
  border: solid #fff;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

.color-dot-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 8px;
  min-width: 0;
}

.template-section {
  flex-shrink: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.template-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 6px;
}

.template-scroll-container::-webkit-scrollbar {
  display: block;
  height: 8px;
}

.template-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.template-scroll-container::-webkit-scrollbar-thumb {
  background: var(--text-color-quaternary);
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

.template-scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-tertiary);
  background-clip: content-box;
}

.template-list {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
}

.template-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 80px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-item:hover .template-image {
  scale: 1.05;
  border: 1px solid var(--primary-color-shadow);
}

.template-item.active .template-image {
  scale: 1.05;
  border: 1px solid var(--primary-color);
}


.template-image {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border-color-primary);
  user-select: none;
}

.template-name {
  display: block;
  font-size: 12px;
  color: var(--text-color-secondary);
  font-weight: 500;
  margin: 4px 0 0 0;
  user-select: none;
}

/* 底图配色的行内边距，与上方模板列表对齐 */
.frame-colors {
  padding: 0 12px;
  margin-top: 10px;
}

/* 平时不描边，避免色块被外圈压住色感 */
.color-dot {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.color-dot:hover {
  transform: scale(1.12);
}

/* 选中态：留 2px 底色缝，再用色块自身的颜色画一圈细环 */
.color-dot.active {
  transform: scale(1.12);
  box-shadow: 0 0 0 2px var(--bg-color-primary), 0 0 0 3px currentColor;
}

.color-dot-custom {
  position: relative;
  display: block;
  overflow: hidden;
  background: linear-gradient(135deg, #ff6b9d, #ffc53d, #3ed6a8, #6c7bff);
}

/* 文字/描边色：圆点直接显示当前颜色，外圈细环保证浅色时也看得出边界 */
.color-dot-current {
  position: relative;
  display: block;
  overflow: hidden;
  background: currentColor;
  box-shadow: 0 0 0 1px var(--border-color-primary);
}

.color-dot-custom input,
.color-dot-current input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  opacity: 0;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 8px 30px;
  border-top: 1px solid var(--border-color-primary);
  background: var(--bg-color-primary);
  flex-shrink: 0;
}

.cancel-btn,
.upload-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 80px;
}

.cancel-btn {
  background: var(--bg-color-primary);
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color-primary);
}

.cancel-btn:hover {
  background: var(--bg-color-secondary);
  color: var(--text-color-primary);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.upload-btn {
  background: var(--primary-color);
  color: white;
}

.upload-btn:hover {
  background-color: var(--primary-color-dark);
}

@media (max-width: 640px) {
  .text-image-modal {
    margin: 0.5rem;
    max-width: none;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .main-content {
    flex-direction: column;
    gap: 20px;
  }

  .preview-section {
    flex: none;
  }

  .preview-container {
    min-height: 250px;
  }

  .preview-image {
    max-height: 300px;
  }

  .template-item {
    width: 100px;
  }

  .template-image {
    width: 100px;
  }
}
</style>