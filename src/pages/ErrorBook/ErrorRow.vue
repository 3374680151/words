<script setup lang="ts">
import AppTooltip from '@/components/ui/AppTooltip.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { useGetWord } from './hooks'
import { idDictionaryMap } from '@/resources/dictionary'
import type { GroupedWordRecords } from './hooks'

// 平移自原项目 ErrorRow：行布局 + 释义三态（word/loading/error）+ 删除按钮
const props = defineProps<{
  record: GroupedWordRecords
}>()

const emit = defineEmits<{
  open: []
  remove: [record: GroupedWordRecords]
}>()

// 词典名直接查静态表（原行为）
const dictName = computed(() => idDictionaryMap[props.record.dict]?.name ?? props.record.dict)
const dictInfo = computed(() => idDictionaryMap[props.record.dict])

import { computed } from 'vue'
const { word, isLoading, hasError } = useGetWord(props.record.word, dictInfo.value)
</script>

<template>
  <li
    class="flex w-full cursor-pointer items-center justify-between rounded-lg bg-white px-6 py-3 text-black opacity-85 shadow-md dark:bg-gray-800 dark:text-white"
    @click="emit('open')"
  >
    <span class="basis-2/12 break-normal font-mono">{{ props.record.word }}</span>
    <span class="basis-6/12 break-normal">
      <template v-if="word">{{ word.trans.join('；') }}</template>
      <template v-else-if="isLoading"><AppSpinner class="h-6 w-6" /></template>
      <template v-else-if="hasError">
        <span class="tooltip !bg-transparent" data-tip="数据加载失败">
          <svg viewBox="0 0 24 24" class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
        </span>
      </template>
    </span>
    <span class="basis-1/12 break-normal pl-8">{{ props.record.wrongCount }}</span>
    <span class="basis-1/12 break-normal">{{ dictName }}</span>
    <span class="basis-1/12 break-normal">
      <AppTooltip content="Delete Records">
        <button
          type="button"
          aria-label="删除记录"
          class="text-gray-400 hover:text-red-500"
          @click.stop="emit('remove', props.record)"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor">
            <path d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h4V3q0-.425.288-.712T9 2h6q.425 0 .713.288T16 3v1h4v2h-1v13q0 .825-.587 1.413T17 21H7Zm2-3h2V8H9v10Zm4 0h2V8h-2v10Z" />
          </svg>
        </button>
      </AppTooltip>
    </span>
  </li>
</template>
