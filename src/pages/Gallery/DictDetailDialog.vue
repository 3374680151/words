<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import IcOutlineCollectionsBookmark from '~icons/ic/outline-collections-bookmark'
import MajesticonsPaperFoldTextLine from '~icons/majesticons/paper-fold-text-line'
import PajamasReviewList from '~icons/pajamas/review-list'
import AppScrollArea from '@/components/ui/AppScrollArea.vue'
import ChapterCard from './ChapterCard.vue'
import DictErrorTable from './DictErrorTable.vue'
import ReviewPanel from './ReviewPanel.vue'
import { useErrorWordData } from './hooks/useGalleryData'
import { useDictStore } from '@/stores/dict'
import { useConfigStore } from '@/stores/config'
import { deleteWordRecord } from '@/utils/db'
import range from '@/utils/range'
import type { Dictionary } from '@/types'

// 平移自原项目 DictDetail：三 Tab（章节选择/查看错题/错题回顾，后两者仅 errorWords>0 渲染）
// 修复：选中章判定——原版 `dict.id===currentDictId ? currentChapter : 0` 导致非当前词书误标绿第 1 章
const props = defineProps<{ dictionary: Dictionary }>()

const router = useRouter()
const dictStore = useDictStore()
const config = useConfigStore()

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
  </div>
</template>
