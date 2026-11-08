<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTypingStore } from '@/stores/typing'

// 平移自原项目 Progress：进度条三档色阶（0-33-66-100），循环模式不推进
const props = defineProps<{ className?: string }>()

const typing = useTypingStore()
const progress = ref(0)
const phase = ref(0)

watch(
  () => [typing.state.chapterData.index, typing.state.chapterData.words.length] as const,
  ([index, length]) => {
    const p = length === 0 ? 0 : Math.floor((index / length) * 100)
    progress.value = p
    phase.value = Math.floor(p / 33.4)
  },
  { immediate: true },
)

const phaseBg = ['bg-indigo-200 dark:bg-indigo-300', 'bg-indigo-300 dark:bg-indigo-400', 'bg-indigo-400 dark:bg-indigo-500']
</script>

<template>
  <div :class="`h-3.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${props.className ?? ''}`">
    <div
      class="h-full rounded-full transition-all duration-300"
      :class="phaseBg[phase] ?? phaseBg[2]"
      :style="{ width: `${progress}%` }"
    />
  </div>
</template>
