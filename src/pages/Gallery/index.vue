<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import IconX from '~icons/tabler/x'
import IconInfo from '~icons/ic/outline-info'
import IconPlus from '~icons/tabler/plus'
import Layout from '@/components/common/Layout.vue'
import AppScrollArea from '@/components/ui/AppScrollArea.vue'
import LanguageTabs from './LanguageTabs.vue'
import DictGroup from './DictGroup.vue'
import DictionaryCard from './DictionaryCard.vue'
import ImportDictWizard from './ImportDictWizard.vue'
import { dictionaries } from '@/resources/dictionary'
import groupBy, { groupByDictTags } from '@/utils/groupBy'
import { useDictStore } from '@/stores/dict'
import { useHotkeys } from '@/composables/useHotkeys'
import { useUiStore } from '@/stores/ui'
import type { Dictionary, LanguageCategoryType } from '@/types'

// 平移自原项目 Gallery-N/index.tsx：语言 Tab（自动定位当前词书语言）→ 分类分组 → tag 药丸 → 词书卡
// 🆕 P1：搜索框（防抖 300ms，name/description/tags 过滤）
// 🆕 C1/C2：我的词书分组 + 导入向导入口（自定义词书与内置书共用 DictionaryCard/详情弹窗）
const router = useRouter()
const dictStore = useDictStore()
const ui = useUiStore()

// —— 我的词书（06 规划 C2）——
const importDialogOpen = ref(false)
const customDicts = computed(() => dictStore.customDicts)

const currentLanguageTab = ref<LanguageCategoryType>('en')
// 进入页面自动定位当前词书语言（原行为）
watch(
  () => dictStore.dictInfo.languageCategory,
  (cat) => {
    currentLanguageTab.value = cat
  },
  { immediate: true },
)

function onBack() {
  if (ui.hasOpenDialog()) return // Dialog 守卫（修复原 Enter/Esc 冒泡 bug）
  router.push('/')
}
useHotkeys('enter,esc', onBack, { preventDefault: true })

const groupedByCategoryAndTag = computed<Array<[string, Record<string, Dictionary[]>]>>(() => {
  const currentLanguageCategoryDicts = dictionaries.filter((dict) => dict.languageCategory === currentLanguageTab.value)
  const groupedByCategory = Object.entries(groupBy(currentLanguageCategoryDicts, (dict) => dict.category))
  return groupedByCategory.map(([category, dicts]) => [category, groupByDictTags(dicts)] as [string, Record<string, Dictionary[]>])
})

// 🆕 搜索（防抖 300ms）
const searchText = ref('')
const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchText, (v) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => (debouncedSearch.value = v.trim()), 300)
})
onUnmounted(() => searchTimer && clearTimeout(searchTimer))

const searchResults = computed(() => {
  const q = debouncedSearch.value.toLowerCase()
  if (!q) return null
  return [...customDicts.value, ...dictionaries].filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q)),
  )
})
</script>

<template>
  <Layout>
    <div class="relative mb-auto mt-auto flex w-full flex-1 flex-col overflow-y-auto pl-20">
      <IconX class="absolute right-20 top-10 mr-2 h-7 w-7 cursor-pointer text-gray-400" @click="onBack" />
      <div class="mt-20 flex w-full flex-1 flex-col items-center justify-center overflow-y-auto">
        <div class="flex h-full flex-col overflow-y-auto">
          <div class="flex h-20 w-full items-center justify-between pb-6 pr-20">
            <LanguageTabs v-model="currentLanguageTab" />
            <input
              v-model="searchText"
              type="search"
              placeholder="搜索词书（名称 / 描述 / 标签）"
              class="w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <AppScrollArea class="flex-1 overflow-y-auto">
            <div class="mr-4 flex flex-1 flex-col items-start justify-start gap-14 overflow-y-auto">
              <!-- 搜索结果 -->
              <template v-if="debouncedSearch">
                <div class="grid w-full gap-x-5 gap-y-10 px-1 pb-4 sm:grid-cols-1 md:grid-cols-2 dic3:grid-cols-3 dic4:grid-cols-4">
                  <DictionaryCard v-for="dict in searchResults" :key="dict.id" :dictionary="dict" />
                  <div v-if="!searchResults || searchResults.length === 0" class="col-span-full text-center text-gray-500">
                    没有找到匹配的词典
                  </div>
                </div>
              </template>

              <!-- 常规分组 -->
              <template v-else>
                <!-- 我的词书（C2）：始终展示于最上方，跨语言 Tab 常驻 -->
                <section class="w-full">
                  <div class="mb-6 flex items-center justify-between px-1">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">我的词书</h2>
                    <button
                      type="button"
                      class="flex items-center gap-1 rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-500 transition-colors hover:bg-indigo-50 dark:border-indigo-700 dark:hover:bg-indigo-900/30"
                      @click="importDialogOpen = true"
                    >
                      <IconPlus class="h-4 w-4" />
                      导入词书
                    </button>
                  </div>
                  <div v-if="customDicts.length > 0" class="grid w-full gap-x-5 gap-y-10 px-1 pb-4 sm:grid-cols-1 md:grid-cols-2 dic3:grid-cols-3 dic4:grid-cols-4">
                    <DictionaryCard v-for="dict in customDicts" :key="dict.id" :dictionary="dict" />
                  </div>
                  <div
                    v-else
                    class="flex h-28 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 dark:border-gray-700"
                  >
                    <p class="text-sm">还没有自定义词书</p>
                    <p class="mt-1 text-xs">导入不背单词生词本、Excel 词表或纯单词 txt，即可与内置词书一样练习</p>
                  </div>
                </section>

                <DictGroup
                  v-for="[category, groupeByTag] in groupedByCategoryAndTag"
                  :key="category"
                  :grouped-dicts-by-tag="groupeByTag"
                  :current-dict-tags="dictStore.dictInfo.tags"
                />
              </template>
            </div>
            <div class="flex items-center justify-center pb-10 pt-[20rem] text-gray-500">
              <IconInfo class="mr-1 h-5 w-5" />
              <p class="mr-5 w-10/12 text-xs">
                本项目的词典数据来自多个开源项目以及社区贡献者的无偿提供。我们深感感激并尊重每一位贡献者的知识产权。
                这些数据仅供个人学习和研究使用，严禁用于任何商业目的。如果你是数据的版权所有者，并且认为我们的使用方式侵犯了你的权利，请通过网站底部的电子邮件与我们联系。一旦收到有效的版权投诉，我们将在最短的时间内删除相关内容或寻求必要的许可。
                同时，我们也鼓励所有使用这些数据的人尊重版权所有者的权利，并且在使用这些数据时遵守所有相关的法律和规定。
                请注意，虽然我们尽力确保所有数据的合法性和准确性，但我们不能对任何数据的准确性、完整性、合法性或可靠性做出任何保证。使用这些数据的风险完全由用户自己承担。
              </p>
            </div>
          </AppScrollArea>
        </div>
      </div>
    </div>
    <!-- 导入向导（C1）：三步式，任意步骤可关不落库 -->
    <ImportDictWizard v-model:open="importDialogOpen" />
  </Layout>
</template>
