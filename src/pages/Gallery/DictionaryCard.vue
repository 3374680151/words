<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import DictDetailDialog from './DictDetailDialog.vue'
import { useDictStats } from './hooks/useGalleryData'
import { useDictStore } from '@/stores/dict'
import { calcChapterCount } from '@/utils'
import FxSpotlightCard from '@/components/effects/FxSpotlightCard.vue'
import FxGate from '@/components/common/FxGate.vue'
import type { Dictionary } from '@/types'
import bookCover from '@/assets/book-cover.png'

// 平移自原项目 DictionaryWithoutCover：词书卡片（IntersectionObserver 懒查进度 + Dialog 预览）
// 特效挂点（04 规划 P0）：SpotlightCard 鼠标光斑（FxGate 降级为普通卡片）
const props = defineProps<{ dictionary: Dictionary }>()

const dictStore = useDictStore()
const cardRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

watch(
  cardRef,
  (el) => {
    observer?.disconnect()
    if (!el) return
    observer = new IntersectionObserver((entries) => {
      isVisible.value = entries.some((e) => e.isIntersecting)
    })
    observer.observe(el)
  },
  { immediate: true },
)
onUnmounted(() => observer?.disconnect())

const dictStats = useDictStats(props.dictionary.id, isVisible)
const chapterCount = computed(() => calcChapterCount(props.dictionary.length))
const isSelected = computed(() => dictStore.dictInfo.id === props.dictionary.id)
const progress = computed(() =>
  dictStats.value ? Math.ceil((dictStats.value.exercisedChapterCount / chapterCount.value) * 100) : 0,
)

const dialogOpen = ref(false)

function openDetail(e: Event) {
  // 阻止本次 click 冒泡到 document，避免打开弹窗的同一击被外部点击检测关闭
  e.stopPropagation()
  dialogOpen.value = true
}
</script>

<template>
  <div>
    <!-- FxGate：特效开 → SpotlightCard；关 → 普通卡片（信息与交互完全一致） -->
    <FxGate>
      <div ref="cardRef" class="w-fit">
      <FxSpotlightCard
        class="h-36 w-80 cursor-pointer overflow-hidden rounded-lg text-left shadow-lg"
        :class="isSelected ? 'bg-indigo-400' : 'bg-zinc-50 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700'"
        role="button"
        @click="openDetail"
      >
        <div class="relative ml-1 mt-2 flex h-full w-full flex-col items-start justify-start">
          <h1 class="mb-1.5 text-xl font-normal" :class="isSelected ? 'text-white' : 'text-gray-800 group-hover:text-indigo-400 dark:text-gray-200'">
            {{ props.dictionary.name }}
          </h1>
          <AppTooltip :content="props.dictionary.description" :delay="400">
            <p class="mb-1 max-w-full truncate whitespace-nowrap" :class="isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-200'">
              {{ props.dictionary.description }}
            </p>
          </AppTooltip>
          <p class="mb-0.5 font-bold" :class="isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-200'">{{ props.dictionary.length }} 词</p>
          <div class="flex w-full items-center pt-2">
            <AppProgress
              v-if="progress > 0"
              class="mr-4 border bg-white"
              :class="isSelected ? 'border-indigo-600' : 'border-indigo-400'"
              :value="progress"
              :indicator-class="isSelected ? 'bg-indigo-600' : 'bg-indigo-400'"
            />
            <img :src="bookCover" class="absolute right-3 top-3 w-16" :class="isSelected ? 'opacity-50' : 'opacity-20'" alt="" />
          </div>
        </div>
      </FxSpotlightCard>
      </div>
      <template #fallback>
        <div
          ref="cardRef"
          class="h-36 w-80 cursor-pointer overflow-hidden rounded-lg text-left shadow-lg"
          :class="isSelected ? 'bg-indigo-400' : 'bg-zinc-50 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700'"
          role="button"
          @click="openDetail"
        >
          <div class="relative ml-1 mt-2 flex h-full w-full flex-col items-start justify-start">
            <h1 class="mb-1.5 text-xl font-normal" :class="isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'">
              {{ props.dictionary.name }}
            </h1>
            <p class="mb-1 max-w-full truncate whitespace-nowrap" :class="isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-200'">
              {{ props.dictionary.description }}
            </p>
            <p class="mb-0.5 font-bold" :class="isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-200'">{{ props.dictionary.length }} 词</p>
            <div class="flex w-full items-center pt-2">
              <AppProgress
                v-if="progress > 0"
                class="mr-4 border bg-white"
                :value="progress"
                :indicator-class="isSelected ? 'bg-indigo-600' : 'bg-indigo-400'"
              />
              <img :src="bookCover" class="absolute right-3 top-3 w-16" :class="isSelected ? 'opacity-50' : 'opacity-20'" alt="" />
            </div>
          </div>
        </div>
      </template>
    </FxGate>

    <!-- 预览弹窗（受控模式，不用 DialogTrigger） -->
    <AppDialog :open="dialogOpen" content-class="w-[60rem] max-w-none !rounded-[20px] p-0" @update:open="(v: boolean) => (dialogOpen = v)">
      <template #content>
        <DictDetailDialog v-if="dialogOpen" :dictionary="props.dictionary" />
      </template>
    </AppDialog>
  </div>
</template>
