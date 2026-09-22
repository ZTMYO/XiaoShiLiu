/**
 * 表情数据访问层
 */
import emojis from './emojis.json'

export const GROUPS = [
  { key: 'smileys_people', title: '笑脸和人物' },
  { key: 'animals_nature', title: '动物和自然' },
  { key: 'food_drink', title: '食物和饮料' },
  { key: 'activities', title: '活动' },
  { key: 'travel_places', title: '旅行和地点' },
  { key: 'objects', title: '物品' },
  { key: 'symbols', title: '符号' },
  { key: 'flags', title: '旗帜' }
]

export const SKIN_TONES = [
  { key: 'neutral', label: '默认肤色', color: '#ffc83d' },
  { key: '1f3fb', label: '浅肤色', color: '#f7d7c4' },
  { key: '1f3fc', label: '中浅肤色', color: '#d8b094' },
  { key: '1f3fd', label: '中肤色', color: '#bb9167' },
  { key: '1f3fe', label: '中深肤色', color: '#8e562e' },
  { key: '1f3ff', label: '深肤色', color: '#613d30' }
]

// 数据里的 emoji 码点用 '-' 连接，例如 '1f476-1f3fb'
export function unicodeToEmoji(sequence) {
  return sequence
    .split('-')
    .map((hex) => parseInt(hex, 16))
    .map((code) => String.fromCodePoint(code))
    .join('')
}

// 取表情在指定肤色下应显示的字符
export function charOf(emoji, skinTone = 'neutral') {
  if (skinTone === 'neutral' || !Array.isArray(emoji.v)) {
    return unicodeToEmoji(emoji.u)
  }
  const index = emoji.v.findIndex((variation) => variation.includes(skinTone))
  return unicodeToEmoji(index === -1 ? emoji.u : emoji.v[index])
}

// 按关键词过滤，返回非空分组；关键词为空则返回全部
export function queryEmojis(keyword = '') {
  const query = keyword.trim().toLowerCase()
  return GROUPS.map((group) => {
    const list = emojis[group.key] || []
    return {
      ...group,
      emojis: query ? list.filter((emoji) => emoji.n[0].includes(query)) : list
    }
  }).filter((group) => group.emojis.length)
}
