import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '@/api/index.js'

export const useFollowStore = defineStore('follow', () => {
  // 存储用户的关注状态 { userId: { followed: boolean, isMutual: boolean, buttonType: string } }
  const userFollowStates = ref(new Map())

  // 存储关注列表
  const followingList = ref([])

  // 更新用户关注状态
  const updateUserFollowState = (userId, followed, isMutual = false, buttonType = 'follow') => {
    userFollowStates.value.set(userId.toString(), { followed, isMutual, buttonType })
  }

  // 获取用户关注状态
  const getUserFollowState = (userId) => {
    const hasState = userFollowStates.value.has(userId.toString())
    const state = userFollowStates.value.get(userId.toString()) || { followed: false, isMutual: false, buttonType: 'follow' }
    // 只在开发环境且状态发生变化时输出日志
    if (process.env.NODE_ENV === 'development' && hasState) {
    }
    return { ...state, hasState }
  }

  // 关注用户 - 简化版本，只管理状态
  const followUser = async (userId) => {
    // 关注用户

    // 先乐观更新本地状态
    const currentState = getUserFollowState(userId)

    // 根据当前状态确定新的 buttonType
    let newButtonType = 'unfollow'
    let newIsMutual = currentState.isMutual

    // 如果当前是 'back' 状态（对方关注了我），关注后应该变成 'mutual'（互相关注）
    if (currentState.buttonType === 'back') {
      newButtonType = 'mutual'
      newIsMutual = true
    }

    updateUserFollowState(userId, true, newIsMutual, newButtonType)

    // 添加到关注列表
    const userIdStr = userId.toString()
    if (!followingList.value.some(user => user.user_id === userIdStr)) {
      followingList.value.push({ user_id: userIdStr })
    }

    try {
      const response = await userApi.followUser(userId)
      if (!response.success) {
        // 关注失败，回滚状态
        updateUserFollowState(userId, false, currentState.isMutual, currentState.buttonType)
        followingList.value = followingList.value.filter(user => user.user_id !== userIdStr)
        return { success: false, error: response.message }
      }
      return { success: true }
    } catch (error) {
      console.error('关注失败:', error)

      // 如果后端说已经关注了，那就保持当前状态（已关注）
      if (error.message && error.message.includes('已经关注过了')) {
        updateUserFollowState(userId, true, newIsMutual, newButtonType)
        return { success: true }
      }

      // 其他错误，回滚状态
      updateUserFollowState(userId, false, currentState.isMutual, currentState.buttonType)
      followingList.value = followingList.value.filter(user => user.user_id !== userIdStr)
      return { success: false, error: error.message }
    }
  }

  // 取消关注用户 - 简化版本，只管理状态
  const unfollowUser = async (userId) => {
    // 取消关注用户

    // 先乐观更新本地状态
    const currentState = getUserFollowState(userId)

    // 根据当前状态确定新的 buttonType
    let newButtonType = 'follow'
    let newIsMutual = false

    // 如果当前是 'mutual' 状态（互相关注），取消关注后应该变成 'back'（对方还关注着我）
    if (currentState.buttonType === 'mutual') {
      newButtonType = 'back'
      newIsMutual = false
    }

    updateUserFollowState(userId, false, newIsMutual, newButtonType)

    // 从关注列表中移除
    const userIdStr = userId.toString()
    followingList.value = followingList.value.filter(user => user.user_id !== userIdStr)

    try {
      const response = await userApi.unfollowUser(userId)
      if (!response.success) {
        // 取消关注失败，回滚状态
        updateUserFollowState(userId, true, currentState.isMutual, currentState.buttonType)
        if (!followingList.value.some(user => user.user_id === userIdStr)) {
          followingList.value.push({ user_id: userIdStr })
        }
        return { success: false, error: response.message }
      }
      return { success: true }
    } catch (error) {
      console.error('取消关注失败:', error)

      // 如果后端说没有关注，那就保持当前状态（未关注）
      if (error.message && error.message.includes('还没有关注')) {
        updateUserFollowState(userId, false, newIsMutual, newButtonType)
        return { success: true }
      }

      // 其他错误，回滚状态
      updateUserFollowState(userId, true, currentState.isMutual, currentState.buttonType)
      if (!followingList.value.some(user => user.user_id === userIdStr)) {
        followingList.value.push({ user_id: userIdStr })
      }
      return { success: false, error: error.message }
    }
  }

  // 切换用户关注状态 - 这是组件应该调用的主要方法
  const toggleUserFollow = async (userId) => {
    const currentState = getUserFollowState(userId)
    const isCurrentlyFollowed = currentState.followed

    let result
    if (isCurrentlyFollowed) {
      result = await unfollowUser(userId)
    } else {
      result = await followUser(userId)
    }

    return result
  }

  // 初始化用户关注状态（从API获取的数据）
  const initUserFollowState = (userId, followed, isMutual = false, buttonType = null) => {
    // 如果没有提供buttonType，根据followed状态推断
    if (!buttonType) {
      buttonType = followed ? 'unfollow' : 'follow'
    }
    updateUserFollowState(userId, followed, isMutual, buttonType)
  }

  // 批量初始化用户关注状态
  const initUsersFollowStates = (users) => {
    // 初始化用户关注状态

    users.forEach(user => {
      const followed = user.followed || user.isFollowing || false
      const isMutual = user.isMutual || false
      const buttonType = user.buttonType || (followed ? 'unfollow' : 'follow')
      initUserFollowState(user.user_id, followed, isMutual, buttonType)
    })
  }

  // 获取关注状态（从API）
  const fetchFollowStatus = async (userId) => {
    try {
      const response = await userApi.getFollowStatus(userId)
      if (response.success) {
        const { followed, isMutual, buttonType } = response.data
        initUserFollowState(userId, followed, isMutual, buttonType)
        return { success: true, data: response.data }
      }
      return { success: false, error: '获取关注状态失败' }
    } catch (error) {
      console.error('获取关注状态失败:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    userFollowStates,
    followingList,
    updateUserFollowState,
    getUserFollowState,
    followUser,
    unfollowUser,
    toggleUserFollow,
    initUserFollowState,
    initUsersFollowStates,
    fetchFollowStatus
  }
})