<script setup lang="ts">
import { ref } from 'vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import { saveAs } from 'file-saver'
import { idDictionaryMap } from '@/resources/dictionary'
import { wordListFetcher } from '@/utils/wordListFetcher'
import { toastSuccess, toastError } from '@/stores/ui'
import type { GroupedWordRecords } from './hooks'

// 平移自原项目 DropdownExport：xlsx/csv 导出（数据源=排序后全量；isExporting 禁用）
// 🆕：失败 alert → error Toast（P0-1）；菜单改 headlessui Popover（reka DropdownMenu 对合成事件不响应，已验证）
const props = defineProps<{ renderRecords: GroupedWordRecords[] }>()

const isExporting = ref(false)

function formatTimestamp(date: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}`
}

async function handleExport(bookType: 'xlsx' | 'csv') {
  isExporting.value = true
  try {
    const dictUrls: string[] = []
    props.renderRecords.forEach((item) => {
      const dictInfo = idDictionaryMap[item.dict]
      if (dictInfo?.url && !dictUrls.includes(dictInfo.url)) dictUrls.push(dictInfo.url)
    })
    const dictDataResults = await Promise.all(
      dictUrls.map(async (url) => {
        try {
          return { url, data: await wordListFetcher(url) }
        } catch {
          return { url, data: [] as import('@/types').Word[] }
        }
      }),
    )
    const dictDataMap = new Map(dictDataResults.map((r) => [r.url, r.data]))

    const ExportData: Array<{ 单词: string; 释义: string; 错误次数: number; 词典: string }> = []
    props.renderRecords.forEach((item) => {
      const dictInfo = idDictionaryMap[item.dict]
      let translation = ''
      if (dictInfo?.url && dictDataMap.has(dictInfo.url)) {
        const wordList = dictDataMap.get(dictInfo.url)!
        const word = wordList.find((w) => w.name === item.word)
        translation = word ? word.trans.join(';') : ''
      }
      ExportData.push({ 单词: item.word, 释义: translation, 错误次数: item.wrongCount, 词典: dictInfo?.name ?? item.dict })
    })

    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(ExportData)
    if (bookType === 'xlsx') {
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Data')
      XLSX.writeFileXLSX(wb, `ErrorBook_${formatTimestamp(new Date())}.xlsx`)
    } else {
      const csv = XLSX.utils.sheet_to_csv(ws)
      saveAs(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), `ErrorBook_${formatTimestamp(new Date())}.csv`)
    }
    toastSuccess('导出成功', { duration: 2000 })
  } catch (e) {
    toastError('导出失败，请重试')
    console.error(e)
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <Popover v-slot="{ open }" class="relative">
    <PopoverButton
      class="flex items-center gap-1 text-base text-gray-600 hover:text-indigo-500 dark:text-gray-300"
      :class="[open ? 'text-indigo-500' : '', isExporting && 'pointer-events-none opacity-50']"
      aria-label="导出错词记录"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      {{ isExporting ? '导出中...' : '导出' }}
    </PopoverButton>
    <PopoverPanel class="absolute right-0 z-40 mt-2 w-36 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
      <button
        type="button"
        class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="handleExport('xlsx')"
      >
        导出 .xlsx
      </button>
      <button
        type="button"
        class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        @click="handleExport('csv')"
      >
        导出 .csv
      </button>
    </PopoverPanel>
  </Popover>
</template>
