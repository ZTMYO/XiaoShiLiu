<template>
    <div class="user-list">

        <SkeletonList v-if="loading" :count="6" type="user-card" layout="vertical" avatar-size="48px" :show-stats="true"
            :show-button="true" />


        <div v-else-if="users.length > 0">
            <UserCard v-for="user in users" :key="user.id" :user="user" @follow="handleFollow"
                @unfollow="handleUnfollow" @userClick="handleUserClick" />
        </div>


        <div v-else class="empty-state">
            <p>暂无用户数据</p>
        </div>
    </div>
</template>

<script setup>
import UserCard from './UserCard.vue'
import SkeletonList from '@/components/skeleton/SkeletonList.vue'

const props = defineProps({
    users: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['follow', 'unfollow', 'userClick'])

function handleFollow(user) {
    emit('follow', user)
}

function handleUnfollow(user) {
    emit('unfollow', user)
}

function handleUserClick(user) {
    emit('userClick', user)
}
</script>

<style scoped>
.user-list {
    width: 100%;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-color-secondary);
}

.empty-state p {
    margin: 0;
    font-size: 14px;
}
</style>