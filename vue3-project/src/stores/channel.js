import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CHANNELS, getChannelIdByPath, getChannelPath } from '@/config/channels'

export const useChannelStore = defineStore('channel', () => {
  // 频道列表
  const channels = CHANNELS

  // 当前活跃的频道ID
  const activeChannelId = ref('recommend')

  // 设置活跃频道
  const setActiveChannel = (channelId) => {
    activeChannelId.value = channelId
  }

  // 根据路径获取频道ID
  const getChannelIdByPathFn = getChannelIdByPath

  // 根据频道ID获取路径
  const getChannelPathFn = getChannelPath

  return {
    channels,
    activeChannelId,
    setActiveChannel,
    getChannelIdByPath: getChannelIdByPathFn,
    getChannelPath: getChannelPathFn
  }
})