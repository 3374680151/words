<script setup lang="ts">
import { computed } from 'vue'
import { useTypingStore } from '@/stores/typing'

// 平移自原项目 Speed/InfoBox：5 个数据格，完全由 timerData 驱动（暂停即冻结）
const typing = useTypingStore()

const seconds = computed(() => typing.state.timerData.time % 60)
const minutes = computed(() => Math.floor(typing.state.timerData.time / 60))
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
const inputNumber = computed(() => typing.inputNumber)
</script>

<template>
  <div class="flex w-full select-none flex-row items-center justify-around rounded-xl bg-white p-4 opacity-50 shadow-md dark:bg-gray-800">
    <div class="flex select-none flex-col text-center">
      <span class="text-xl font-bold text-gray-600 dark:text-gray-50">{{ pad(minutes) }}:{{ pad(seconds) }}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">时间</span>
    </div>
    <div class="flex select-none flex-col text-center">
      <span class="text-xl font-bold text-gray-600 dark:text-gray-50">{{ inputNumber }}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">输入数</span>
    </div>
    <div class="flex select-none flex-col text-center">
      <span class="text-xl font-bold text-gray-600 dark:text-gray-50">{{ typing.state.timerData.wpm }}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">WPM</span>
    </div>
    <div class="flex select-none flex-col text-center">
      <span class="text-xl font-bold text-green-600 dark:text-green-400">{{ typing.state.chapterData.correctCount }}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">正确数</span>
    </div>
    <div class="flex select-none flex-col text-center">
      <span class="text-xl font-bold text-gray-600 dark:text-gray-50">{{ typing.state.timerData.accuracy }}%</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">正确率</span>
    </div>
  </div>
</template>
