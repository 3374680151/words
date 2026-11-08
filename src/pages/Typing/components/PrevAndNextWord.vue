<script setup lang="ts">
import { computed } from 'vue'
import IconPrev from '~icons/tabler/arrow-narrow-left'
import IconNext from '~icons/tabler/arrow-narrow-right'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import { useTypingStore } from '@/stores/typing'
import { useDictStore } from '@/stores/dict'
import { useConfigStore } from '@/stores/config'
import { CTRL } from '@/utils'

// 平移自原项目 PrevAndNextWord：上/下词预览
// prev 永远显示原文；next 在听写模式下渲染全下划线 + tracking-wider
const props = defineProps<{ type: 'prev' | 'next' }>()

const typing = useTypingStore()
const dict = useDictStore()
const config = useConfigStore()

const newIndex = computed(() => typing.state.chapterData.index + (props.type === 'prev' ? -1 : 1))
const word = computed(() => typing.state.chapterData.words[newIndex.value])
const shortCutKey = computed(() => (props.type === 'prev' ? `${CTRL} + Shift + ArrowLeft` : `${CTRL} + Shift + ArrowRight`))
const currentLanguage = computed(() => dict.dictInfo.language)

const headWord = computed(() => {
  if (!word.value) return ''
  const showWord = ['romaji', 'hapin'].includes(currentLanguage.value) ? word.value.notation : word.value.name
  if (props.type === 'prev') return showWord
  return !config.wordDictation.isOpen ? showWord : (showWord || '').replace(/./g, '_')
})

function onClickWord() {
  if (!word.value) return
  typing.skipToIndex(newIndex.value)
}
</script>

<template>
  <div v-if="word">
    <AppTooltip :content="`快捷键: ${shortCutKey}`">
      <div
        class="flex max-w-xs cursor-pointer select-none items-center text-gray-700 opacity-60 duration-200 ease-in-out hover:opacity-100 dark:text-gray-400"
        @click="onClickWord"
      >
        <IconPrev v-if="props.type === 'prev'" class="mr-4 shrink-0 grow-0 text-2xl" />
        <div class="grow-1 flex w-full flex-col" :class="props.type === 'next' ? 'items-end text-right' : ''">
          <p
            class="font-mono text-2xl font-normal text-gray-700 dark:text-gray-400"
            :class="!config.wordDictation.isOpen ? 'tracking-normal' : 'tracking-wider'"
          >
            {{ headWord }}
          </p>
          <p v-if="typing.state.isTransVisible" class="line-clamp-1 max-w-full text-sm font-normal text-gray-600 dark:text-gray-500">
            {{ word.trans.join('；') }}
          </p>
        </div>
        <IconNext v-if="props.type === 'next'" class="ml-4 shrink-0 grow-0 text-2xl" />
      </div>
    </AppTooltip>
  </div>
  <div v-else />
</template>
