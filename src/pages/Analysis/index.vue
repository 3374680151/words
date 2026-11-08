<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import IconX from '~icons/tabler/x'
import Layout from '@/components/common/Layout.vue'
import ActivityCalendar from './components/ActivityCalendar.vue'
import TrendChart from './components/TrendChart.vue'
import KeyboardHeatmap from './components/KeyboardHeatmap.vue'
import { getWordStats, type WordStats } from './hooks/useWordStats'
import { useDarkMode } from '@/composables/useDarkMode'
import { useHotkeys } from '@/composables/useHotkeys'
import { useUiStore } from '@/stores/ui'

// 平移自原项目 Analysis/index.tsx：过去一年五张图 + Ctrl+D 深色 + Enter/Esc 返回（Dialog 守卫）
// 🆕 P0-5：加载骨架
const router = useRouter()
const { isDark, toggle: toggleDark } = useDarkMode()
const ui = useUiStore()

function onBack() {
  if (ui.hasOpenDialog()) return
  router.push('/')
}
useHotkeys('enter,esc', onBack, { preventDefault: true })
useHotkeys(
  'ctrl+d',
  () => toggleDark(),
  { enableOnFormTags: true, preventDefault: true },
)

const stats = ref<WordStats | null>(null)
const isLoading = ref(true)

const startTimeStamp = dayjs().subtract(1, 'year').unix()
const endTimeStamp = dayjs().unix()

watch(
  isDark,
  () => {
    // 深色切换 → 图表 dispose 重建由各图表组件内部处理（此处触发响应式即可）
  },
)

async function load() {
  isLoading.value = true
  stats.value = await getWordStats(startTimeStamp, endTimeStamp)
  isLoading.value = false
}
void load()

const isEmpty = computed(() => !!stats.value?.isEmpty)
const chartCards = computed(() => {
  const s = stats.value
  if (!s || s.isEmpty) return []
  return [
    { key: 'exercise', title: '过去一年练习次数热力图', type: 'heatmap', data: s.exerciseRecord },
    { key: 'words', title: '过去一年练习词数热力图', type: 'heatmap', data: s.wordRecord },
    { key: 'wpm', title: '过去一年WPM趋势图', type: 'line', data: s.wpmRecord, name: 'WPM' },
    { key: 'accuracy', title: '过去一年正确率趋势图', type: 'line', data: s.accuracyRecord, name: '正确率(%)', suffix: '%' },
    { key: 'keys', title: '按键错误次数排行', type: 'keyboard', data: s.wrongTimeRecord, name: '错误次数' },
  ] as const
})
</script>

<template>
  <Layout>
    <div class="flex w-full flex-1 flex-col overflow-y-auto pl-20 pr-20 pt-20">
      <IconX class="absolute right-20 top-10 mr-2 h-7 w-7 cursor-pointer text-gray-400" @click="onBack" />

      <!-- 🆕 P0-5：加载骨架（与数据态同构的占位卡，替代原 spinner 文案版） -->
      <div v-if="isLoading" class="mx-4 my-8 flex flex-col gap-8" aria-busy="true" aria-label="统计加载中">
        <div
          v-for="i in 5"
          :key="i"
          class="shrink-0 overflow-hidden rounded-lg p-8 shadow-lg dark:bg-gray-700 dark:bg-opacity-50"
          :class="i <= 2 ? 'h-64' : 'h-80'"
        >
          <div class="mb-6 h-5 w-52 animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
          <div class="flex items-end gap-2" :class="i <= 2 ? 'h-36' : 'h-48'">
            <div v-for="j in 12" :key="j" class="w-full animate-pulse rounded bg-gray-100 dark:bg-gray-600/70" :style="{ height: `${35 + ((i * 7 + j * 13) % 60)}%`, animationDelay: `${(i * 12 + j * 7) % 90}ms` }" />
          </div>
        </div>
      </div>

      <!-- 空状态（原行为保留） -->
      <div v-else-if="isEmpty" class="m-4 grid h-80 w-auto place-content-center overflow-hidden rounded-lg shadow-lg dark:bg-gray-600">
        <div class="text-2xl text-gray-400">暂无练习数据</div>
      </div>

      <!-- 五张图 -->
      <template v-else>
        <div
          v-for="card in chartCards"
          :key="card.key"
          class="mx-4 my-8 shrink-0 overflow-hidden rounded-lg p-8 shadow-lg dark:bg-gray-700 dark:bg-opacity-50"
          :class="card.type === 'heatmap' ? 'h-auto' : 'h-80'"
        >
          <ActivityCalendar v-if="card.type === 'heatmap'" :title="card.title" :data="card.data" />
          <TrendChart
            v-else-if="card.type === 'line'"
            :title="card.title"
            :data="card.data"
            :name="card.name"
            :suffix="'suffix' in card ? card.suffix : ''"
          />
          <KeyboardHeatmap v-else-if="card.type === 'keyboard'" :title="card.title" :data="card.data" :name="card.name" />
        </div>
      </template>
    </div>
  </Layout>
</template>
