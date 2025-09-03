// 频道配置
export const CHANNELS = [
  { id: 'recommend', label: '推荐', path: '/recommend' },
  { id: 'study', label: '学习', path: '/study' },
  { id: 'campus', label: '校园', path: '/campus' },
  { id: 'emotion', label: '情感', path: '/emotion' },
  { id: 'interest', label: '兴趣', path: '/interest' },
  { id: 'life', label: '生活', path: '/life' },
  { id: 'social', label: '社交', path: '/social' },
  { id: 'help', label: '求助', path: '/help' },
  { id: 'opinion', label: '观点', path: '/opinion' },
  { id: 'graduation', label: '毕业', path: '/graduation' },
  { id: 'career', label: '职场', path: '/career' }
]

// 获取有效的频道路径（用于路由验证）
export const getValidChannelPaths = () => {
  return CHANNELS.map(ch => ch.path.substring(1)) // 去掉开头的 '/'
}

// 根据路径获取频道ID
export const getChannelIdByPath = (path) => {
  // 处理 /explore/xxx 格式的路径
  let channelPath = path
  if (path.startsWith('/explore/')) {
    channelPath = path.replace('/explore', '')
  } else if (path === '/explore') {
    return 'recommend' // 默认返回推荐频道
  }

  const channel = CHANNELS.find(ch => ch.path === channelPath)
  return channel ? channel.id : 'recommend'
}

// 根据频道ID获取路径
export const getChannelPath = (channelId) => {
  const channel = CHANNELS.find(ch => ch.id === channelId)
  return channel ? channel.path : '/recommend'
}