import { userApi } from './index.js'

// 获取用户信息API
export async function getUserInfo(userId) {
  try {
    const userInfo = await userApi.getUserInfo(userId)
    return userInfo
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 如果API调用失败，返回基础数据
    return {
      id: userId,
      avatar: null,
      nickname: `用户${userId}`,
      bio: '还没有简介',
      followCount: 0,
      fansCount: 0,
      likeAndCollectCount: 0,
      isFollowing: false,
      images: []
    }
  }
}