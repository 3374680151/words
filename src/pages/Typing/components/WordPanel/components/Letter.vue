<script setup lang="ts">
import { computed } from 'vue'
import { EXPLICIT_SPACE } from '@/constants'
import { useConfigStore } from '@/stores/config'

// 平移自原项目 Word/Letter.tsx：字母三态颜色（含 ␣ 显式空格独立色组），字号跟随用户配置
export type LetterState = 'normal' | 'correct' | 'wrong'

const props = withDefaults(
  defineProps<{
    letter: string
    state?: LetterState
    visible?: boolean
  }>(),
  { state: 'normal', visible: true },
)

const config = useConfigStore()

const stateClass = computed(() => {
  const map = props.letter === EXPLICIT_SPACE
    ? {
        normal: 'text-gray-400',
        correct: 'text-green-400 dark:text-green-700',
        wrong: 'text-red-400 dark:text-red-600',
      }
    : {
        normal: 'text-gray-600 dark:text-gray-50',
        correct: 'text-green-600 dark:text-green-400',
        wrong: 'text-red-600 dark:text-red-400',
      }
  return map[props.state]
})

const fontSize = computed(() => `${config.fontSize.foreignFont}px`)
</script>

<template>
  <span
    class="m-0 p-0 pr-0.8 font-mono font-normal duration-0 dark:text-opacity-80"
    :class="stateClass"
    :style="{ fontSize }"
  >{{ visible ? letter : '_' }}</span>
</template>
