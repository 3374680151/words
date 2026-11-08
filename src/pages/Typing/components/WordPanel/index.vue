<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import WordComponent from './components/Word.vue'
import Phonetic from './components/Phonetic.vue'
import Translation from './components/Translation.vue'
import PrevAndNextWord from '../PrevAndNextWord.vue'
import ChapterProgress from '../ChapterProgress.vue'
import { useTypingStore } from '@/stores/typing'
import { useConfigStore } from '@/stores/config'
import { prefetchWordSound } from '@/composables/usePronunciation'
import { useHotkeys } from '@/composables/useHotkeys'
import type { PronunciationType } from '@/types'

// 平移自原项目 WordPanel/index.tsx：编排 + onFinish 三分支（循环/下一词/章节完成）+ Tab 译文 + 上下词跳转
const typing = useTypingStore()
const config = useConfigStore()

const wordComponentKey = ref(0)
const currentWordExerciseCount = ref(0)
const isShowTranslation = ref(false)

const loopWordTimes = computed(() => config.loopWordConfig.times)
const currentWord = computed(() => typing.state.chapterData.words[typing.state.chapterData.index])
const nextWord = computed(() => typing.state.chapterData.words[typing.state.chapterData.index + 1])

const prevIndex = computed(() => {
  const newIndex = typing.state.chapterData.index - 1
  return newIndex < 0 ? 0 : newIndex
})
const nextIndex = computed(() => {
  const newIndex = typing.state.chapterData.index + 1
  return newIndex > typing.state.chapterData.words.length - 1 ? typing.state.chapterData.words.length - 1 : newIndex
})

// 预取下一词发音（升级：内存缓存）
watchEffect(() => {
  prefetchWordSound(nextWord.value?.name, config.pronunciation.type as PronunciationType)
})

function onFinish() {
  if (typing.state.chapterData.index < typing.state.chapterData.words.length - 1 || currentWordExerciseCount.value < loopWordTimes.value - 1) {
    // 完成当前单词
    if (currentWordExerciseCount.value < loopWordTimes.value - 1) {
      // 循环模式：不前进，:key 重挂载清空输入
      currentWordExerciseCount.value += 1
      typing.loopCurrentWord()
      wordComponentKey.value += 1
    } else {
      currentWordExerciseCount.value = 0
      typing.nextWord()
    }
  } else {
    // 章节完成（复习联动在 finishChapter 内处理）
    typing.finishChapter()
  }
}

function onSkipWord(type: 'prev' | 'next') {
  typing.skipToIndex(type === 'prev' ? prevIndex.value : nextIndex.value)
}

useHotkeys(
  'ctrl+shift+arrowleft',
  () => onSkipWord('prev'),
  { preventDefault: true },
)
useHotkeys(
  'ctrl+shift+arrowright',
  () => onSkipWord('next'),
  { preventDefault: true },
)

useHotkeys(
  'tab',
  () => (isShowTranslation.value = true),
  { enableOnFormTags: true, preventDefault: true },
)
useHotkeys(
  'tab',
  () => (isShowTranslation.value = false),
  { enableOnFormTags: true, preventDefault: true, keyup: true },
)

const shouldShowTranslation = computed(() => isShowTranslation.value || typing.state.isTransVisible)
</script>

<template>
  <div class="container flex h-full w-full flex-col items-center justify-center">
    <div class="container flex h-24 w-full shrink-0 grow-0 justify-between px-12 pt-10">
      <template v-if="config.isShowPrevAndNextWord && typing.state.isTyping">
        <PrevAndNextWord type="prev" />
        <PrevAndNextWord type="next" />
      </template>
    </div>
    <div class="container flex flex-grow flex-col items-center justify-center">
      <div v-if="currentWord" class="relative flex w-full justify-center">
        <!-- 暂停/开始遮罩（原样式：backdrop-blur-sm + 按任意键继续/开始） -->
        <div v-if="!typing.state.isTyping" class="absolute flex h-full w-full justify-center">
          <div class="z-10 flex w-full items-center backdrop-blur-sm">
            <p class="w-full select-none text-center text-xl text-gray-600 dark:text-gray-50">
              按任意键{{ typing.state.timerData.time ? '继续' : '开始' }}
            </p>
          </div>
        </div>
        <div class="relative">
          <WordComponent :key="`${wordComponentKey}-${typing.state.chapterData.index}-${typing.state.chapterData.words.length}`" :word="currentWord" :on-finish="onFinish" />
          <Phonetic v-if="config.phonetic.isOpen" :word="currentWord" />
          <Translation
            :trans="currentWord.trans.join('；')"
            :show-trans="shouldShowTranslation"
            @mouseenter="isShowTranslation = true"
            @mouseleave="isShowTranslation = false"
          />
        </div>
      </div>
    </div>
    <ChapterProgress :class-name="`mb-10 mt-auto ${typing.state.isTyping ? 'opacity-100' : 'opacity-0'}`" />
  </div>
</template>
