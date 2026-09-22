/**
 * 颜文字数据访问层
 */
import data from './kaomoji.json'

export const KAOMOJI_GROUPS = data.groups

// 按关键词过滤，返回非空分组；关键词为空则返回全部分组
// 只匹配颜文字本身，不做含义（标签）搜索
export function queryKaomoji(keyword = '') {
  const query = keyword.trim().toLowerCase()
  return KAOMOJI_GROUPS.map((group) => ({
    ...group,
    list: query ? group.list.filter((text) => text.toLowerCase().includes(query)) : group.list
  })).filter((group) => group.list.length)
}
