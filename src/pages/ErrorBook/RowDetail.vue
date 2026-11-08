<script setup lang="ts">
import { computed } from 'vue'
import IconX from '~icons/tabler/x'
import HashtagIcon from '~icons/heroicons/chart-pie-20-solid'
import CheckCircle from '~icons/heroicons/check-circle-20-solid'
import ClockIcon from '~icons/heroicons/clock-20-solid'
import XCircle from '~icons/heroicons/x-circle-20-solid'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import Letter from '@/pages/Typing/components/WordPanel/components/Letter.vue'
import Phonetic from '@/pages/Typing/components/WordPanel/components/Phonetic.vue'
import WordPronunciationIcon from '@/components/common/WordPronunciationIcon.vue'
import { useGetWord } from './hooks'
import { idDictionaryMap } from '@/resources/dictionary'
import { useHotkeys } from '@/composables/useHotkeys'
import type { GroupedWordRecords } from './hooks'

// 平移自原项目 RowDetail：行详情弹层（主列表 blur）+ 4 DataTag + 翻页（排序后全量列表）+ Esc/←/→
const props = defineProps<{
  currentRowDetail: GroupedWordRecords
  allRecords: GroupedWordRecords[]
}>()

const emit = defineEmits<{ close: []; 'open-record': [record: GroupedWordRecords] }>()

const dictInfo = computed(() => idDictionaryMap[props.currentRowDetail.dict])
const { word, isLoading, hasError } = useGetWord(props.currentRowDetail.word, dictInfo.value)

// DataTag 数据（原 rowDetailData 平移）
const rowDetailData = computed(() => {
  const records = props.currentRowDetail.records
  const time = records.length > 0 ? records.reduce((acc, cur) => acc + cur.totalTime, 0) / records.length : 0
  return {
    time: (time / 1000).toFixed(2),
    sumCount: records.length,
    correctCount: records.length,
    wrongCount: props.currentRowDetail.wrongCount,
  }
})

function onClose() {
  emit('close')
}

// 翻页（在排序后全量列表中定位，原 RowPagination 行为）
const currentIndex = computed(() => {
  const find = (r: GroupedWordRecords) => r.word === props.currentRowDetail.word && r.dict === props.currentRowDetail.dict
  return props.allRecords.findIndex(find)
})

function prev() {
  if (currentIndex.value > 0) emitSwitch(props.allRecords[currentIndex.value - 1])
}
function next() {
  if (currentIndex.value < props.allRecords.length - 1) emitSwitch(props.allRecords[currentIndex.value + 1])
}
function emitSwitch(record: GroupedWordRecords) {
  emit('open-record', record)
}

useHotkeys('esc', () => onClose(), { preventDefault: true })
useHotkeys('arrowleft', () => prev(), { preventDefault: true })
useHotkeys('arrowright', () => next(), { preventDefault: true })
</script>

<template>
  <div class="absolute inset-0 z-20 flex flex-col items-center justify-center">
    <div class="my-card relative z-10 flex h-[32rem] min-w-[26rem] select-text flex-col items-center justify-around rounded-2xl bg-white px-3 py-10 dark:bg-gray-900">
      <IconX class="absolute right-3 top-3 h-6 w-6 cursor-pointer text-gray-400" @click="onClose" />
      <div class="flex flex-col items-center justify-start">
        <div>
          <Letter v-for="(t, index) in props.currentRowDetail.word.split('')" :key="`${index}-${t}`" :letter="t" visible state="normal" />
        </div>
        <div class="relative flex h-8 items-center">
          <Phonetic v-if="word" :word="word" />
          <AppSpinner v-else-if="isLoading" class="h-5 w-5" />
          <span v-else-if="hasError" class="text-xs text-red-500" title="数据加载失败">✕</span>
          <WordPronunciationIcon
            v-if="word"
            :word="word"
            :lang="dictInfo?.language ?? 'en'"
            class="absolute -right-7 top-1/2 h-5 w-5 -translate-y-1/2 transform"
          />
        </div>
        <div class="flex max-w-[24rem] items-center">
          <span class="max-w-4xl text-center font-sans transition-colors duration-300 dark:text-white dark:text-opacity-80">
            <template v-if="word">{{ word.trans.join('；') }}</template>
            <AppSpinner v-else-if="isLoading" class="h-5 w-5" />
          </span>
        </div>
      </div>

      <div class="item flex flex-col gap-4">
        <div class="flex gap-6">
          <div class="flex items-center gap-2">
            <ClockIcon class="h-5 w-5 text-indigo-500" />
            <span class="text-sm text-gray-600 dark:text-gray-300">平均用时 {{ rowDetailData.time }}s</span>
          </div>
          <div class="flex items-center gap-2">
            <HashtagIcon class="h-5 w-5 text-indigo-500" />
            <span class="text-sm text-gray-600 dark:text-gray-300">练习次数 {{ rowDetailData.sumCount }}</span>
          </div>
        </div>
        <div class="flex gap-6">
          <div class="flex items-center gap-2">
            <CheckCircle class="h-5 w-5 text-green-500" />
            <span class="text-sm text-gray-600 dark:text-gray-300">正确次数 {{ rowDetailData.correctCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <XCircle class="h-5 w-5 text-red-500" />
            <span class="text-sm text-gray-600 dark:text-gray-300">错误次数 {{ rowDetailData.wrongCount }}</span>
          </div>
        </div>
      </div>

      <!-- RowPagination -->
      <div class="absolute bottom-6 mt-10 flex items-center gap-3">
        <button
          type="button"
          class="cursor-pointer rounded-full bg-gray-100 p-1.5 text-gray-600 hover:text-indigo-500 dark:bg-gray-800 dark:text-gray-300"
          aria-label="上一条"
          :disabled="currentIndex <= 0"
          @click.stop="prev"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-300">{{ currentIndex + 1 }} / {{ props.allRecords.length }}</span>
        <button
          type="button"
          class="cursor-pointer rounded-full bg-gray-100 p-1.5 text-gray-600 hover:text-indigo-500 dark:bg-gray-800 dark:text-gray-300"
          aria-label="下一条"
          :disabled="currentIndex >= props.allRecords.length - 1"
          @click.stop="next"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
    <div class="absolute inset-0 z-0 cursor-pointer bg-transparent" @click="onClose" />
  </div>
</template>
