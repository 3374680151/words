<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import IconX from '~icons/tabler/x'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppAlertDialog from '@/components/ui/AppAlertDialog.vue'
import ExportDropdown from './ExportDropdown.vue'
import RowDetail from './RowDetail.vue'
import ErrorRow from './ErrorRow.vue'
import { useGroupedRecords, type GroupedWordRecords } from './hooks'
import { deleteWordRecord } from '@/utils/db'
import { nextTick } from 'vue'

// 平移自原项目 ErrorBook/index.tsx + ErrorRow + Pagination + RowDetail
// 🆕 P0：空状态 / 列表骨架 loading / 删除二次确认；P1：删除后页码回退
const router = useRouter()

const reload = ref(false)
const { groupedRecords, isLoading } = useGroupedRecords(reload)

const currentPage = ref(1)
const sortType = ref<'asc' | 'desc' | 'none'>('asc')

const totalPages = computed(() => Math.max(1, Math.ceil(groupedRecords.value.length / 20)))

const sortedRecords = computed(() => {
  if (sortType.value === 'none') return groupedRecords.value
  return [...groupedRecords.value].sort((a, b) =>
    sortType.value === 'asc' ? a.wrongCount - b.wrongCount : b.wrongCount - a.wrongCount,
  )
})

const renderRecords = computed(() => {
  const start = (currentPage.value - 1) * 20
  return sortedRecords.value.slice(start, start + 20)
})

function setSort(next: 'asc' | 'desc' | 'none') {
  sortType.value = next
  currentPage.value = 1 // 原行为：切排序回第 1 页
}

function setPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

// —— 删除（🆕 二次确认 + 页码回退 P1-6） ——
const confirmOpen = ref(false)
const pendingDelete = ref<GroupedWordRecords | null>(null)

function requestDelete(record: GroupedWordRecords) {
  pendingDelete.value = record
  confirmOpen.value = true
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  const { word, dict } = pendingDelete.value
  await deleteWordRecord(word, dict)
  confirmOpen.value = false
  pendingDelete.value = null
  reload.value = !reload.value
  // 🆕 P1-6：删除后若当前页空且非第 1 页 → 页码回退
  await nextTick()
  if (renderRecords.value.length === 0 && currentPage.value > 1) {
    currentPage.value -= 1
  }
}

// —— 行详情 ——
const currentRowDetail = ref<GroupedWordRecords | null>(null)
const blurMain = computed(() => currentRowDetail.value !== null)

// 排序表头箭头（原 HeadWrongNumber 循环 asc→desc→none）
const sortIcon = computed(() => (sortType.value === 'asc' ? '↑' : sortType.value === 'desc' ? '↓' : '⇅'))
</script>

<template>
  <div :class="`relative flex h-screen w-full flex-col items-center pb-4 ease-in ${blurMain && 'blur-sm'}`">
    <div class="mr-8 mt-4 flex w-auto items-center justify-center self-end">
      <h1 class="mr-4 w-auto self-end text-gray-500 opacity-70">Tip: 点击错误单词查看详细信息</h1>
      <IconX class="h-7 w-7 cursor-pointer text-gray-400" @click="router.push('/')" />
    </div>

    <div class="flex w-full flex-1 select-text items-start justify-center overflow-hidden">
      <div class="flex h-full w-5/6 flex-col pt-10">
        <div class="flex w-full justify-between rounded-lg bg-white px-6 py-5 text-lg text-black shadow-lg dark:bg-gray-800 dark:text-white">
          <span class="basis-2/12">单词</span>
          <span class="basis-6/12">释义</span>
          <button
            class="flex basis-1/12 items-center gap-1 hover:text-indigo-500"
            type="button"
            @click="setSort(sortType === 'asc' ? 'desc' : sortType === 'desc' ? 'none' : 'asc')"
          >
            错误次数
            <span class="text-xs">{{ sortIcon }}</span>
          </button>
          <span class="basis-1/12">词典</span>
          <ExportDropdown :render-records="sortedRecords" />
        </div>

        <div class="flex-1 overflow-y-auto pt-5">
          <!-- 🆕 列表 loading（P0 补强） -->
          <div v-if="isLoading" class="flex flex-col items-center gap-3 pt-10">
            <AppSpinner />
            <p class="text-sm text-gray-400">加载错题记录中...</p>
          </div>

          <!-- 🆕 空状态（P0-3） -->
          <div v-else-if="groupedRecords.length === 0" class="flex flex-col items-center gap-6 pt-16">
            <svg viewBox="0 0 120 100" class="w-40 text-indigo-300" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M20 80 Q 60 20 100 80" stroke-linecap="round" />
              <circle cx="95" cy="25" r="12" class="text-green-500" stroke-width="4" />
              <path d="M90 25 l4 4 l8 -8" class="text-green-500" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="text-lg font-medium text-gray-600 dark:text-gray-300">太棒了，还没有错题！</p>
            <RouterLink to="/" class="my-btn-primary">去练习</RouterLink>
          </div>

          <!-- 列表 -->
          <ul v-else class="flex flex-col gap-3">
            <ErrorRow
              v-for="record in renderRecords"
              :key="`${record.dict}-${record.word}`"
              :record="record"
              @open="currentRowDetail = record"
              @remove="requestDelete"
            />
          </ul>
        </div>
      </div>
    </div>

    <!-- 分页（原样式：圆形按钮 + N / M） -->
    <div class="flex items-center gap-2 pt-3">
      <button
        type="button"
        class="cursor-pointer rounded-full bg-white p-2 text-indigo-500 shadow-md dark:bg-gray-800 dark:text-indigo-300"
        aria-label="上一页"
        @click="setPage(currentPage - 1)"
      >
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <span class="text-black dark:text-white">{{ currentPage }} / {{ totalPages }}</span>
      <button
        type="button"
        class="cursor-pointer rounded-full bg-white p-2 text-indigo-500 shadow-md dark:bg-gray-800 dark:text-indigo-300"
        aria-label="下一页"
        @click="setPage(currentPage + 1)"
      >
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>

    <!-- 🆕 删除确认（P0-2） -->
    <AppAlertDialog
      :open="confirmOpen"
      title="删除错词记录"
      :description="`将删除「${pendingDelete?.word ?? ''}」在该词典的全部 ${pendingDelete?.records.length ?? 0} 条记录，此操作不可恢复。`"
      confirm-text="删除"
      @update:open="(v: unknown) => (confirmOpen = !!v)"
      @confirm="confirmDelete"
    />

    <!-- 行详情 -->
    <RowDetail
      v-if="currentRowDetail"
      :current-row-detail="currentRowDetail"
      :all-records="sortedRecords"
      @close="currentRowDetail = null"
      @open-record="(r) => (currentRowDetail = r)"
    />
  </div>
</template>
