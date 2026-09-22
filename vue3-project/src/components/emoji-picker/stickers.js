/**
 * 表情包数据访问层
 *
 * stickers.json 结构：
 *   columns  雪碧图每行列数（packs 共用一套网格）
 *   packs[]  id / title / license / sheet（放 public/stickers/ 下）
 *            items  从左上角起逐行的表情名称，位置即格子序号
 *                   名称可写多个同义词用空格分开（如「开心 高兴 笑」），留空则该表情不可被搜索
 *
 * 加新表情包只需丢一张等宽等高的雪碧图进 public/stickers/ 并在这里补一条，组件不用改。
 */
import data from './stickers.json'

const COLUMNS = data.columns

export const STICKER_PACKS = data.packs.map((pack) => ({
  ...pack,
  columns: COLUMNS,
  // 行数由完整 items 决定，搜索过滤后 items 会变少，不能据此反推，否则雪碧图会被压扁
  rows: Math.ceil(pack.items.length / COLUMNS),
  items: pack.items.map((name, index) => ({
    id: String(index + 1),
    name,
    x: index % COLUMNS,
    y: Math.floor(index / COLUMNS)
  }))
}))

// 雪碧图总行数，用来换算 background-size
export function rowsOf(pack) {
  return pack.rows
}

// 按关键词过滤，返回非空分组；关键词为空则返回全部包
export function queryStickers(keyword = '') {
  const query = keyword.trim().toLowerCase()
  return STICKER_PACKS.map((pack) => ({
    ...pack,
    items: query ? pack.items.filter((item) => stickerHit(pack, item, query)) : pack.items
  })).filter((pack) => pack.items.length)
}

function stickerHit(pack, item, query) {
  return (
    pack.title.toLowerCase().includes(query) ||
    item.id.includes(query) ||
    item.name.toLowerCase().includes(query)
  )
}

// 按 pack/item id 查表情，查不到返回 null（行内渲染据此退回明文）
export function findSticker(packId, itemId) {
  const pack = STICKER_PACKS.find((item) => item.id === packId)
  const sticker = pack?.items.find((item) => item.id === itemId)
  return pack && sticker ? { pack, item: sticker } : null
}
