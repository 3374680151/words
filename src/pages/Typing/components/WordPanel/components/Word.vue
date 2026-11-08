<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted, onUnmounted } from 'vue'
import Letter, { type LetterState } from './Letter.vue'
import Notation from './Notation.vue'
import InputHandler from './InputHandler.vue'
import TipAlert from './TipAlert.vue'
import WordPronunciationIcon from '@/components/common/WordPronunciationIcon.vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import { EXPLICIT_SPACE } from '@/constants'
import { useKeySounds } from '@/composables/useHowl'
import { useHotkeys } from '@/composables/useHotkeys'
import { useConfigStore } from '@/stores/config'
import { useDictStore } from '@/stores/dict'
import { useTypingStore } from '@/stores/typing'
import { saveWordRecord } from '@/utils/db'
import { toastError } from '@/stores/ui'
import { CTRL } from '@/utils'
import type { Word } from '@/types'
import type { LetterMistakes } from '@/utils/db/record'

// 平移自原项目 Word/index.tsx（全项目交互核心）：
// 对错判定 / 300ms 吞键清空 / shake 抖动 / 听写显隐 / 错≥4 Skip / 自动发音 / Tab 按住看答案

export interface WordState {
  displayWord: string
  inputWord: string
  letterStates: LetterState[]
  isFinished: boolean
  hasWrong: boolean
  hasMadeInputWrong: boolean
  wrongCount: number
  startTime: string
  endTime: string
  correctCount: number
  letterTimeArray: number[]
  letterMistake: LetterMistakes
  randomLetterVisible: boolean[]
}

const initialWordState = (): WordState => ({
  displayWord: '',
  inputWord: '',
  letterStates: [],
  isFinished: false,
  hasWrong: false,
  hasMadeInputWrong: false,
  wrongCount: 0,
  startTime: '',
  endTime: '',
  correctCount: 0,
  letterTimeArray: [],
  letterMistake: {},
  randomLetterVisible: [],
})

const vowelLetters = ['A', 'E', 'I', 'O', 'U']

const props = defineProps<{
  word: Word
  onFinish: () => void
}>()

const config = useConfigStore()
const dict = useDictStore()
const typing = useTypingStore()
const [playKeySound, playBeepSound, playHintSound] = useKeySounds()

const wordState = reactive<WordState>(initialWordState())
const isHoveringWord = ref(false)
const showTipAlert = ref(false)
const pronunciationRef = ref<InstanceType<typeof WordPronunciationIcon> | null>(null)
let wrongClearTimer: ReturnType<typeof setTimeout> | null = null

// —— effect 1：word 变化重建 wordState（空格→␣、…→..、随机听写显隐表） ——
watch(
  () => props.word,
  () => {
    let headword = ''
    try {
      headword = props.word.name.replace(/ /g, EXPLICIT_SPACE)
      headword = headword.replace(/…/g, '..')
    } catch {
      headword = ''
    }
    const fresh = initialWordState()
    fresh.displayWord = headword
    fresh.letterStates = new Array(headword.length).fill('normal')
    fresh.startTime = new Date().toISOString()
    fresh.randomLetterVisible = headword.split('').map(() => Math.random() > 0.4)
    Object.assign(wordState, fresh)
  },
  { immediate: true },
)

// —— 输入通道（InputHandler 产出 add 动作） ——
function updateInput(updateAction: { type: 'add' | 'delete' | 'composition'; value?: string; event?: Event }) {
  if (updateAction.type !== 'add') return
  if (wordState.hasWrong) return // 300ms 吞键窗口
  const value = updateAction.value ?? ''
  if (value === ' ') {
    // 空格键输入时阻止浏览器默认行为（页面滚动），原版 Word updateInput 同款（红线 24）
    updateAction.event?.preventDefault()
  }
  wordState.inputWord += value === ' ' ? EXPLICIT_SPACE : value
}

// —— effect 2：对错判定核心 ——
watch(
  () => wordState.inputWord,
  () => {
    const inputLength = wordState.inputWord.length
    if (wordState.hasWrong || inputLength === 0 || wordState.displayWord.length === 0) return

    const inputChar = wordState.inputWord[inputLength - 1]
    const correctChar = wordState.displayWord[inputLength - 1]
    let isEqual = false
    if (inputChar != undefined && correctChar != undefined) {
      isEqual = config.isIgnoreCase ? inputChar.toLowerCase() === correctChar.toLowerCase() : inputChar === correctChar
    }

    if (isEqual) {
      // 输入正确
      wordState.letterTimeArray.push(Date.now())
      wordState.correctCount += 1

      if (inputLength >= wordState.displayWord.length) {
        wordState.letterStates[inputLength - 1] = 'correct'
        wordState.isFinished = true
        wordState.endTime = new Date().toISOString()
        playHintSound()
      } else {
        wordState.letterStates[inputLength - 1] = 'correct'
        playKeySound()
      }
      typing.reportCorrect()
    } else {
      // 输入错误：beep + 标红 + 计数 + 错字记录 + 计时清零
      playBeepSound()
      wordState.letterStates[inputLength - 1] = 'wrong'
      wordState.hasWrong = true
      wordState.hasMadeInputWrong = true
      wordState.wrongCount += 1
      wordState.letterTimeArray = []

      if (wordState.letterMistake[inputLength - 1]) {
        wordState.letterMistake[inputLength - 1].push(inputChar)
      } else {
        wordState.letterMistake[inputLength - 1] = [inputChar]
      }
      typing.reportWrong(JSON.parse(JSON.stringify(wordState.letterMistake)))

      if (config.currentChapter === 0 && typing.state.chapterData.index === 0 && wordState.wrongCount >= 3) {
        showTipAlert.value = true
      }
    }
  },
)

// —— effect 3：300ms 吞键后清空（手感红线） ——
watch(
  () => wordState.hasWrong,
  (hasWrong) => {
    if (wrongClearTimer) {
      clearTimeout(wrongClearTimer)
      wrongClearTimer = null
    }
    if (hasWrong) {
      wrongClearTimer = setTimeout(() => {
        wordState.inputWord = ''
        wordState.letterStates = new Array(wordState.letterStates.length).fill('normal')
        wordState.hasWrong = false
      }, 300)
    }
  },
)
onUnmounted(() => {
  if (wrongClearTimer) clearTimeout(wrongClearTimer)
})

// —— effect 4：完成 → 保存单词记录 → onFinish ——
watch(
  () => wordState.isFinished,
  async (finished) => {
    if (!finished) return
    typing.setSaving(true)
    try {
      const id = await saveWordRecord(
        {
          word: props.word.name,
          wrongCount: wordState.wrongCount,
          letterTimeArray: wordState.letterTimeArray,
          letterMistake: JSON.parse(JSON.stringify(wordState.letterMistake)),
        },
        { dictId: dict.dictInfo.id, chapter: config.currentChapter, isReview: dict.isReviewMode },
      )
      if (id > 0) typing.addWordRecordId(id)
    } catch (e) {
      // P0-7：写库失败不打断练习
      toastError('练习记录保存失败，请检查浏览器存储', { duration: 4000 })
      console.error('saveWordRecord failed', e)
    } finally {
      typing.setSaving(false)
      props.onFinish()
    }
  },
)

// —— effect 5：错 ≥4 次出现 Skip ——
watch(
  () => wordState.wrongCount,
  (count) => {
    if (count >= 4) typing.setShowSkip(true)
  },
)

// —— effect 6：新词自动发音（含输错清空后再次发音） ——
// 对齐原版 React 两条触发路径（红线 7）：
// 1) onMounted：WordPanel :key 含 index，每词重挂载 → 挂载必跑，覆盖「换词/循环重打」（原 useEffect 挂载必跑）
// 2) watch：首词从暂停启动（isTyping false→true）与输错清空（inputWord N→0）
onMounted(() => {
  if (typing.state.isTyping && wordState.inputWord.length === 0) {
    pronunciationRef.value?.play()
  }
})
watch(
  () => [typing.state.isTyping, wordState.inputWord.length] as const,
  ([isTyping, len]) => {
    if (isTyping && len === 0) {
      pronunciationRef.value?.play()
    }
  },
)

// —— 听写模式字母显隐（原 getLetterVisible 逐字平移） ——
function getLetterVisible(index: number): boolean {
  if (wordState.letterStates[index] === 'correct' || (config.isShowAnswerOnHover && isHoveringWord.value)) return true

  const dictation = config.wordDictation
  if (dictation.isOpen) {
    if (dictation.type === 'hideAll') return false
    const letter = wordState.displayWord[index]
    if (dictation.type === 'hideVowel') {
      return !vowelLetters.includes(letter.toUpperCase())
    }
    if (dictation.type === 'hideConsonant') {
      return vowelLetters.includes(letter.toUpperCase())
    }
    if (dictation.type === 'randomHide') {
      return wordState.randomLetterVisible[index]
    }
  }
  return true
}

// —— Tab 按住显示全词 / Ctrl+J 朗读 ——
useHotkeys(
  'tab',
  () => (isHoveringWord.value = true),
  { enableOnFormTags: true, preventDefault: true },
)
useHotkeys(
  'tab',
  () => (isHoveringWord.value = false),
  { enableOnFormTags: true, preventDefault: true, keyup: true },
)
useHotkeys(
  'ctrl+j',
  () => {
    if (typing.state.isTyping) pronunciationRef.value?.play()
  },
  { enableOnFormTags: true, preventDefault: true },
)

// 暴露 play 给 Ctrl+J 与自动发音
defineExpose({ play: () => pronunciationRef.value?.play() })

const currentLanguage = computed(() => dict.dictInfo.language)
const currentLanguageCategory = computed(() => dict.dictInfo.languageCategory)
</script>

<template>
  <InputHandler :update-input="updateInput" />
  <div :lang="currentLanguageCategory !== 'code' ? currentLanguageCategory : 'en'" class="flex flex-col items-center justify-center pb-1 pt-4">
    <Notation v-if="['romaji', 'hapin'].includes(currentLanguage) && word.notation" :notation="word.notation" />
    <div
      class="tooltip-info relative w-fit bg-transparent p-0 leading-normal shadow-none dark:bg-transparent"
      :class="{ tooltip: config.wordDictation.isOpen }"
      data-tip="按 Tab 快捷键显示完整单词"
    >
      <div
        class="flex items-center justify-center"
        :class="[config.isTextSelectable && 'select-all', wordState.hasWrong ? 'fx-word-shake' : '']"
        @mouseenter="isHoveringWord = true"
        @mouseleave="isHoveringWord = false"
      >
        <Letter
          v-for="(t, index) in wordState.displayWord.split('')"
          :key="`${index}-${t}`"
          :letter="t"
          :visible="getLetterVisible(index)"
          :state="wordState.letterStates[index]"
        />
      </div>
      <div v-if="config.pronunciation.isOpen" class="absolute -right-12 top-1/2 h-9 w-9 -translate-y-1/2 transform">
        <AppTooltip :content="`快捷键${CTRL} + J`">
          <WordPronunciationIcon ref="pronunciationRef" :word="word" :lang="currentLanguage" class="h-full w-full" />
        </AppTooltip>
      </div>
    </div>
  </div>
  <TipAlert class="fixed bottom-10 right-3" :show="showTipAlert" :set-show="(v: boolean) => (showTipAlert = v)" />
</template>

<style scoped>
/* 输错抖动（原 index.module.css 逐字平移） */
.fx-word-shake {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
