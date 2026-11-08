<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { Word } from '@/types'

// 平移自原项目 Phonetic：AmE/BrE 音标展示（长度 >1 才显示）
const props = defineProps<{ word: Word }>()

const config = useConfigStore()
const selectable = computed(() => (config.isTextSelectable ? 'select-text' : ''))
</script>

<template>
  <div :class="`space-x-5 text-center text-sm font-normal text-gray-600 transition-colors duration-300 dark:text-gray-400 ${selectable}`">
    <span v-if="config.phonetic.type === 'us' && props.word.usphone && props.word.usphone.length > 1">{{ `AmE: [${props.word.usphone}]` }}</span>
    <span v-if="config.phonetic.type === 'uk' && props.word.ukphone && props.word.ukphone.length > 1">{{ `BrE: [${props.word.ukphone}]` }}</span>
  </div>
</template>
