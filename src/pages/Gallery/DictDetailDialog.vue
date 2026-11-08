<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import IcOutlineCollectionsBookmark from '~icons/ic/outline-collections-bookmark'
import MajesticonsPaperFoldTextLine from '~icons/majesticons/paper-fold-text-line'
import PajamasReviewList from '~icons/pajamas/review-list'
import IconDownload from '~icons/tabler/download'
import IconTrash from '~icons/tabler/trash'
import AppScrollArea from '@/components/ui/AppScrollArea.vue'
import AppAlertDialog from '@/components/ui/AppAlertDialog.vue'
import ChapterCard from './ChapterCard.vue'
import DictErrorTable from './DictErrorTable.vue'
import ReviewPanel from './ReviewPanel.vue'
import { useErrorWordData } from './hooks/useGalleryData'
import { useDictStore } from '@/stores/dict'
import { useConfigStore } from '@/stores/config'
import { toastError, toastSuccess } from '@/stores/ui'
import { deleteWordRecord } from '@/utils/db'
import { deleteUserDict, getUserDict, isCustomDictId, userDictToCsv, userDictToJson } from '@/utils/db/user-dict'
import { downloadText } from '@/utils/dict-import'
import range from '@/utils/range'
import type { Dictionary } from '@/types'

// 平移自原项目 DictDetail：三 Tab（章节选择/查看错题/错题回顾，后两者仅 errorWords>0 渲染）
// 修复：选中章判定——原版 `dict.id===currentDictId ? currentChapter : 0` 导致非当前词书误标绿第 1 章
// 🆕 C2：自定义词书专属操作（导出 CSV/JSON + 删除二次确认，红线 C8/C9）
const props = defineProps<{ dictionary: Dictionary }>()

const router = useRouter()
const dictStore = useDictStore()
const config = useConfigStore()

const isCustomDict = computed(() => isCustomDictId(props.dictionary.id))
const showExportMenu = ref(false)
const deleteConfirmOpen = ref(false)
const deleting = ref(false)

function onExport(format: 'csv' | 'json') {
  showExportMenu.value = false
  void (async () => {
    try {
      const ud = await getUserDict(props.dictionary.id)
      if (!ud) {
        toastError('词书数据读取失败')
        return
      }
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      if (format === 'csv') {
        downloadText(`${ud.name}_${date}.csv`, userDictToCsv(ud))
      } else {
        downloadText(`${ud.name}_${date}.json`, userDictToJson(ud), 'application/json')
      }
      toastSuccess(`《${ud.name}》已导出`)
    } catch (e) {
      console.error('导出词书失败', e)
      toastError('导出失败，请重试')
    }
  })()
}

async function onConfirmDelete() {
  if (deleting.value) return
  deleting.value = true
  try {
    await deleteUserDict(props.dictionary.id)
    // 正在练/正在复习此书 → 回落 cet4（红线 C8）
    if (dictStore.dictInfo.id === props.dictionary.id) {
      dictStore.selectDict('cet4')
    }
    if (dictStore.isReviewMode && dictStore.reviewRecord?.dict === props.dictionary.id) {
      dictStore.exitReview()
    }
    await dictStore.reloadCustomDicts()
    toastSuccess(`《${props.dictionary.name}》已删除（练习记录与错题保留）`)
    deleteConfirmOpen.value = false
    emit('close')
  } catch (e) {
    console.error('删除词书失败', e)
    toastError('删除失败，请重试')
  } finally {
    deleting.value = false
  }
}

const emit = defineEmits<{ close: [] }>()

type Tab = 'chapters' | 'errors' | 'review'
const curTab = ref<Tab>('chapters')

const reload = ref(false)
const { errorWordData, isLoading, error } = useErrorWordData(props.dictionary, reload)

// 修复后的选中判定：仅当前词书才映射 currentChapter，否则 -1（无选中）
const checkedChapter = computed(() => (dictStore.dictInfo.id === props.dictionary.id ? config.currentChapter : -1))

function onChangeChapter(index: number) {
  dictStore.selectDict(props.dictionary.id)
  dictStore.selectChapter(index)
  router.push('/')
}

async function onDelete(word: string) {
  await deleteWordRecord(word, props.dictionary.id)
  reload.value = !reload.value
}

const tabs = computed(() => [
  { id: 'chapters' as const, label: '章节选择', icon: MajesticonsPaperFoldTextLine, show: true },
  { id: 'errors' as const, label: '查看错题', icon: IcOutlineCollectionsBookmark, show: errorWordData.value.length > 0 },
  { id: 'review' as const, label: '错题回顾', icon: PajamasReviewList, show: errorWordData.value.length > 0 },
])

// 错题数据加载后若当前 tab 不可用则回落章节选择
watch(
  () => errorWordData.value.length,
  () => {
    if (!tabs.value.find((t) => t.id === curTab.value)?.show) curTab.value = 'chapters'
  },
)
</script>

<template>
  <div class="flex flex-col rounded-[4rem] px-4 py-3 pl-5 text-gray-800 dark:text-gray-300">
    <div class="text relative flex h-40 flex-col gap-2">
      <h3 class="text-2xl font-semibold">{{ props.dictionary.name }}</h3>
      <p class="mt-1">{{ props.dictionary.chapterCount }} 章节</p>
      <p>共 {{ props.dictionary.length }} 词</p>
      <p>{{ props.dictionary.description }}</p>

      <!-- 自定义词书：导出 + 删除（C8/C9） -->
      <div v-if="isCustomDict" class="absolute right-0 top-0 flex items-center gap-2">
        <div class="relative">
          <button
            type="button"
            title="导出词书"
            class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="showExportMenu = !showExportMenu"
          >
            <IconDownload class="h-4 w-4" />
            导出
          </button>
          <div
            v-if="showExportMenu"
            class="absolute right-0 top-8 z-10 w-32 overflow-hidden rounded-md border border-gray-100 bg-white py-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            <button type="button" class="block w-full px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700" @click="onExport('csv')">导出 CSV</button>
            <button type="button" class="block w-full px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700" @click="onExport('json')">导出 JSON</button>
          </div>
        </div>
        <button
          type="button"
          title="删除词书"
          class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          @click="deleteConfirmOpen = true"
        >
          <IconTrash class="h-4 w-4" />
          删除
        </button>
      </div>

      <div class="absolute bottom-5 right-4 flex gap-1">
        <button
          v-for="tab in tabs.filter((t) => t.show)"
          :key="tab.id"
          type="button"
          :disabled="curTab === tab.id"
          class="flex items-center rounded-md px-2 py-1.5 text-sm disabled:opacity-100"
          :class="curTab === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-700'"
          @click="curTab = tab.id"
        >
          <component :is="tab.icon" class="mr-1.5 text-gray-500" />
          {{ tab.label }}
        </button>
      </div>
    </div>
    <div class="flex pl-0">
      <div class="h-[30rem] w-full">
        <AppScrollArea v-if="curTab === 'chapters'" class="h-[30rem]">
          <div class="flex w-full flex-wrap gap-3">
            <ChapterCard
              v-for="index in range(0, props.dictionary.chapterCount, 1)"
              :key="`${props.dictionary.id}-${index}`"
              :index="index"
              :checked="checkedChapter === index"
              :dict-i-d="props.dictionary.id"
              @change="onChangeChapter"
            />
          </div>
        </AppScrollArea>
        <DictErrorTable
          v-else-if="curTab === 'errors'"
          :data="errorWordData"
          :is-loading="isLoading"
          :error="error"
          @delete="onDelete"
        />
        <ReviewPanel v-else-if="curTab === 'review'" :error-data="errorWordData" :dict="props.dictionary" />
      </div>
    </div>

    <!-- 删除二次确认（红线 C8：练习记录与错题保留，词书本体不可恢复） -->
    <AppAlertDialog
      v-model:open="deleteConfirmOpen"
      title="删除自定义词书"
      :description="`将删除《${props.dictionary.name}》词书本体（${props.dictionary.length} 词），此操作不可恢复。练习记录与错题将保留（错题本/统计仍可见）。`"
      confirm-text="删除"
      :confirm-loading="deleting"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
