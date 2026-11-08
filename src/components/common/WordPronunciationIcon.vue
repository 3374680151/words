<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Volume2 } from 'lucide-vue-next'
import { usePronunciationSound } from '@/composables/usePronunciation'
import { useConfigStore } from '@/stores/config'
import type { Word } from '@/types'
import { cn } from '@/utils/ui'

// 平移自原项目 WordPronunciationIcon：发音按钮（Expose play：先 stop 再 play）
const props = defineProps<{
  word: Word
  lang: string
  class?: string
}>()

const config = useConfigStore()
const isPlaying = ref(false)

// hapin 特殊发音文本：notation（西里尔）或 trans[2]（原行为）
const pronounceWord = computed(() => {
  if (props.lang !== 'hapin') return props.word.name
  if (props.word.notation && /[\u0400-\u04FF]/.test(props.word.notation)) return props.word.notation
  return props.word.trans?.[2] ?? props.word.name
})

const sound = usePronunciationSound(pronounceWord, computed(() => config.pronunciation.isLoop))

watch(sound.isPlaying, (v) => (isPlaying.value = v))

function play() {
  sound.play()
}
function stop() {
  sound.stop()
}

defineExpose({ play, stop })
</script>

<template>
  <button
    type="button"
    aria-label="朗读单词"
    :class="cn('cursor-pointer text-gray-600 transition-opacity hover:opacity-80 dark:text-gray-50 dark:opacity-80', props.class)"
    @click="play"
  >
    <Volume2 class="h-9 w-9" :class="isPlaying ? 'animate-pulse text-indigo-400' : ''" />
  </button>
</template>
