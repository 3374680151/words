<script setup lang="ts">
import { computed } from 'vue'
import IconExclamationTriangle from '~icons/heroicons/exclamation-triangle-solid'
import IconHandThumbUp from '~icons/heroicons/hand-thumb-up-solid'
import IconHeart from '~icons/heroicons/heart-solid'

// 平移自原项目 ConclusionBar：三档评语（85/70 阈值 + 全对特判）
const props = defineProps<{
  mistakeLevel: number
  mistakeCount: number
}>()

const ICON_MAPPER = [
  {
    icon: IconHeart,
    className: 'text-indigo-600',
    text: (mistakeCount: number) => `表现不错！` + (mistakeCount > 0 ? `只错了 ${mistakeCount} 个单词` : '全对了！'),
  },
  { icon: IconHandThumbUp, className: 'text-indigo-600', text: () => '有些小问题哦，下一次可以做得更好！' },
  { icon: IconExclamationTriangle, className: 'text-indigo-600', text: () => '错误太多，再来一次如何？' },
]

const current = computed(() => ICON_MAPPER[props.mistakeLevel])
</script>

<template>
  <div class="flex h-10 flex-row items-center">
    <component :is="current.icon" :class="current.className, 'h-5 w-5'" />
    <span class="ml-2 inline-block align-middle text-sm font-medium leading-10 text-gray-700 sm:text-sm md:text-base">
      {{ current.text(props.mistakeCount) }}
    </span>
  </div>
</template>
