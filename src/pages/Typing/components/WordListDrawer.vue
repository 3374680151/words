<script setup lang="ts">
import { ref, computed } from 'vue'
import { List } from 'lucide-vue-next'
import AppSheet from '@/components/ui/AppSheet.vue'
import AppScrollArea from '@/components/ui/AppScrollArea.vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import { useTypingStore } from '@/stores/typing'
import { useDictStore } from '@/stores/dict'
import { useConfigStore } from '@/stores/config'
import { playWordDirect } from '@/composables/usePronunciation'
import { toastSuccess } from '@/stores/ui'
import type { WordWithIndex } from '@/types'

// 平移自原项目 WordList + WordCard：
// 左侧固定按钮 → 抽屉；打开即暂停打字；当前词高亮；点卡片发音；复制按钮 + 反馈（🆕 P1）
const typing = useTypingStore()
const dict = useDictStore()
const config = useConfigStore()

const isOpen = ref(false)

function openModal() {
  isOpen.value = true
  typing.pause() // 打开列表自动暂停（原行为）
}

const title = computed(() =>
  dict.isReviewMode ? `${dict.dictInfo.name} 错题复习` : `${dict.dictInfo.name} 第 ${config.currentChapter + 1} 章`,
)

const words = computed(() => typing.state.chapterData.words)

function playWord(word: WordWithIndex) {
  playWordDirect(word.name)
}

async function copyWord(word: WordWithIndex, event: Event) {
  event.stopPropagation()
  try {
    await navigator.clipboard.writeText(`${word.name} ${word.trans.join('；')}`)
    toastSuccess('已复制到剪贴板', { duration: 1500 })
  } catch {
    toastSuccess('复制失败，请手动选择复制', { duration: 1500 })
  }
}
</script>

<template>
  <div>
    <AppTooltip content="单词列表">
      <button
        type="button"
        class="fixed left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-lg bg-white p-2 text-gray-600 shadow-md hover:text-indigo-500 dark:bg-gray-800 dark:text-gray-300"
        aria-label="打开单词列表"
        @click="openModal"
      >
        <List class="h-5 w-5" />
      </button>
    </AppTooltip>

    <AppSheet :open="isOpen" side="left" :title="title" @update:open="(v: boolean) => (isOpen = v)">
      <template #content>
        <AppScrollArea class="h-[calc(100vh-10rem)] w-full">
          <ul class="flex flex-col gap-2 pr-2">
            <li
              v-for="(word, index) in words"
              :key="index"
              class="flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2"
              :class="index === typing.state.chapterData.index ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'"
              @click="playWord(word)"
            >
              <div class="min-w-0">
                <p class="truncate font-mono text-base text-gray-800 dark:text-gray-200">
                  {{ ['romaji', 'hapin'].includes(dict.dictInfo.language) && word.notation ? word.notation : word.name }}
                </p>
                <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ word.trans.join('；') }}</p>
              </div>
              <button
                type="button"
                aria-label="复制该单词"
                class="ml-2 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-500 dark:hover:bg-gray-600"
                @click="copyWord(word, $event)"
              >
                <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </li>
          </ul>
        </AppScrollArea>
      </template>
    </AppSheet>
  </div>
</template>
