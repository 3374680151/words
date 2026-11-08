<script setup lang="ts">
import { ref, computed } from 'vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppAlertDialog from '@/components/ui/AppAlertDialog.vue'
import type { TErrorWordData } from '@/utils/db/review-record'

// 平移自原项目 ErrorTable：5 列（word 可排序/trans/errorCount 可排序/errorChar kbd/删除）
// 🆕：删除二次确认 AlertDialog（P0-2）
const props = defineProps<{
  data: TErrorWordData[]
  isLoading: boolean
  error?: Error
}>()

const emit = defineEmits<{ delete: [word: string] }>()

type SortType = 'asc' | 'desc' | 'none'
const sortField = ref<'word' | 'errorCount'>('errorCount')
const sortType = ref<SortType>('none')

function toggleSort(field: 'word' | 'errorCount') {
  if (sortField.value !== field) {
    sortField.value = field
    sortType.value = 'asc'
    return
  }
  sortType.value = sortType.value === 'asc' ? 'desc' : sortType.value === 'desc' ? 'none' : 'asc'
}

const sortedData = computed(() => {
  if (sortType.value === 'none') return props.data
  const sorted = [...props.data].sort((a, b) =>
    sortField.value === 'word' ? a.word.localeCompare(b.word) : a.errorCount - b.errorCount,
  )
  return sortType.value === 'desc' ? sorted.reverse() : sorted
})

// 删除确认
const confirmOpen = ref(false)
const pendingDelete = ref<TErrorWordData | null>(null)
function requestDelete(item: TErrorWordData) {
  pendingDelete.value = item
  confirmOpen.value = true
}
function confirmDelete() {
  if (pendingDelete.value) emit('delete', pendingDelete.value.word)
  confirmOpen.value = false
  pendingDelete.value = null
}

</script>

<template>
  <div class="flex h-full flex-col">
    <table class="w-full text-left text-sm text-gray-700 dark:text-gray-300">
      <thead class="sticky top-0 bg-white text-xs uppercase dark:bg-slate-900">
        <tr>
          <th class="px-4 py-3">
            <button type="button" class="flex items-center gap-1 hover:text-indigo-500" @click="toggleSort('word')">
              单词
              <span class="text-[10px]">{{ sortField === 'word' && sortType !== 'none' ? (sortType === 'asc' ? '↑' : '↓') : '⇅' }}</span>
            </button>
          </th>
          <th class="px-4 py-3">释义</th>
          <th class="px-4 py-3 text-center">
            <button type="button" class="flex items-center gap-1 hover:text-indigo-500" @click="toggleSort('errorCount')">
              错误次数
              <span class="text-[10px]">{{ sortField === 'errorCount' && sortType !== 'none' ? (sortType === 'asc' ? '↑' : '↓') : '⇅' }}</span>
            </button>
          </th>
          <th class="px-4 py-3">易错字母</th>
          <th class="px-4 py-3 text-center">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="props.isLoading || props.error || sortedData.length === 0">
          <td :colspan="5" class="h-[22rem] text-center">
            <div v-if="props.isLoading" class="flex items-center justify-center">
              <AppSpinner />
            </div>
            <p v-else-if="props.error" class="text-gray-500">好像遇到错误啦！尝试刷新下</p>
            <p v-else class="text-gray-500">暂无数据, 快去练习吧！</p>
          </td>
        </tr>
        <tr
          v-for="item in sortedData"
          v-else
          :key="item.word"
          class="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <td class="px-4 py-2 font-mono">{{ item.word }}</td>
          <td class="max-w-md truncate px-4 py-2">{{ item.originData.trans.join('，') }}</td>
          <td class="px-4 py-2 text-center">{{ item.errorCount }}</td>
          <td class="px-4 py-2">
            <kbd
              v-for="(ch, i) in item.errorChar"
              :key="i"
              class="mr-1 inline-block min-w-[1.4rem] rounded border border-gray-300 bg-gray-50 px-1 text-center font-mono text-xs dark:border-gray-600 dark:bg-gray-800"
            >
              {{ ch }}
            </kbd>
          </td>
          <td class="px-4 py-2 text-center">
            <AppTooltip content="删除该词记录">
              <button
                type="button"
                aria-label="删除记录"
                class="text-gray-400 hover:text-red-500"
                @click="requestDelete(item)"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                </svg>
              </button>
            </AppTooltip>
          </td>
        </tr>
      </tbody>
    </table>

    <AppAlertDialog
      v-model:open="confirmOpen"
      title="删除错词记录"
      :description="`将删除「${pendingDelete?.word ?? ''}」在该词典的全部错误记录，此操作不可恢复。`"
      confirm-text="删除"
      @confirm="confirmDelete"
    />
  </div>
</template>
