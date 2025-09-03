<template>
    <EmojiPickerCore :native="true" :static-texts="staticTexts" :theme="themeStore.actualTheme"
        :group-names="groupNames" v-bind="$attrs" @select="onSelect" />
</template>

<script setup>
import EmojiPickerCore from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const emit = defineEmits(['select'])

// 内置配置
const staticTexts = {
    placeholder: '搜索表情'
}

const groupNames = {
    smileys_people: '笑脸和人物',
    animals_nature: '动物和自然',
    food_drink: '食物和饮料',
    activities: '活动',
    travel_places: '旅行和地点',
    objects: '物品',
    symbols: '符号',
    flags: '旗帜'
}

function onSelect(emoji) {
    emit('select', emoji)
}
</script>

<style scoped></style>