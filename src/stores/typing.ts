import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import type { WordWithIndex } from '@/types'
import type { LetterMistakes } from '@/utils/db/record'
import { mergeLetterMistake } from '@/utils/db/utils'
import shuffle from '@/utils/shuffle'
import { useDictStore } from './dict'

/** 平移自原项目 pages/Typing/store/type.ts（死字段 isLoopSingleWord 不迁移） */
export type ChapterData = {
  // warning: 因为有章节内随机的存在，所有记录 index 的场景都应该使用 WordWithIndex.index
  words: WordWithIndex[]
  // chapter index
  index: number
  // 输入的单词数
  wordCount: number
  // 输入正确的"按键"数（字母级）
  correctCount: number
  // 输入错误的按键数
  wrongCount: number
  // 每个单词的输入记录
  userInputLogs: UserInputLog[]
  // 本章节用户输入的单词的 record id 列表
  wordRecordIds: number[]
}

export type UserInputLog = {
  index: number
  correctCount: number
  wrongCount: number
  LetterMistakes: LetterMistakes
}

export type TimerData = {
  time: number
  accuracy: number
  wpm: number
}

export type TypingState = {
  chapterData: ChapterData
  timerData: TimerData
  isTyping: boolean
  isFinished: boolean
  isShowSkip: boolean
  isTransVisible: boolean
  // 是否正在保存数据
  isSavingRecord: boolean
}

export const initialState: TypingState = {
  chapterData: {
    words: [],
    index: 0,
    wordCount: 0,
    correctCount: 0,
    wrongCount: 0,
    wordRecordIds: [],
    userInputLogs: [],
  },
  timerData: {
    time: 0,
    accuracy: 0,
    wpm: 0,
  },
  isTyping: false,
  isFinished: false,
  isShowSkip: false,
  isTransVisible: true,
  isSavingRecord: false,
}

export const initialUserInputLog: UserInputLog = {
  index: 0,
  correctCount: 0,
  wrongCount: 0,
  LetterMistakes: {},
}

/**
 * 打字状态机：原项目 16 个有效 reducer Action → Pinia action（逐条对照 typingReducer 平移）
 * 死 Action（INCREASE_WRONG_WORD / TOGGLE_WORD_VISIBLE / SET_REVISION_INDEX / isLoop 系列）不迁移
 */
export const useTypingStore = defineStore('typing', () => {
  const state = reactive<TypingState>(structuredClone(initialState))

  // —— getters（与原项目消费方式一致） ——
  const currentWord = computed(() => state.chapterData.words[state.chapterData.index])
  const wordsLength = computed(() => state.chapterData.words.length)
  const inputNumber = computed(() => state.chapterData.correctCount + state.chapterData.wrongCount)

  function replaceState(next: TypingState) {
    // Vue reactive Proxy 不能 structuredClone（原项目 immer draft 为普通对象）——用 JSON 深拷贝
    const plain = JSON.parse(JSON.stringify(next)) as TypingState
    Object.assign(state, plain)
  }

  function makeUserInputLogs(words: WordWithIndex[]): UserInputLog[] {
    return words.map((_, index) => ({ ...structuredClone(initialUserInputLog), index }))
  }

  // —— actions（对照 typingReducer 逐条平移） ——

  /** SETUP_CHAPTER */
  function setupChapter(words: WordWithIndex[], shouldShuffle: boolean, initialIndex?: number) {
    const next = structuredClone(initialState)
    const finalWords = shouldShuffle ? shuffle(words) : words
    let idx = initialIndex ?? 0
    if (idx >= finalWords.length) {
      idx = 0
    }
    next.chapterData.index = idx
    next.chapterData.words = finalWords
    next.chapterData.userInputLogs = makeUserInputLogs(finalWords)
    replaceState(next)
  }

  /** SET_IS_SKIP */
  function setShowSkip(v: boolean) {
    state.isShowSkip = v
  }

  /** SET_IS_TYPING */
  function start() {
    state.isTyping = true
  }
  function pause() {
    state.isTyping = false
  }

  /** TOGGLE_IS_TYPING */
  function toggleTyping() {
    state.isTyping = !state.isTyping
  }

  /** REPORT_CORRECT_WORD */
  function reportCorrect() {
    state.chapterData.correctCount += 1
    const wordLog = state.chapterData.userInputLogs[state.chapterData.index]
    if (wordLog) wordLog.correctCount += 1
  }

  /** REPORT_WRONG_WORD */
  function reportWrong(letterMistake: LetterMistakes) {
    state.chapterData.wrongCount += 1
    const wordLog = state.chapterData.userInputLogs[state.chapterData.index]
    if (wordLog) {
      wordLog.wrongCount += 1
      wordLog.LetterMistakes = mergeLetterMistake(wordLog.LetterMistakes, letterMistake)
    }
  }

  /** NEXT_WORD（复习模式由 dict store 双写 IndexedDB） */
  function nextWord() {
    state.chapterData.index += 1
    state.chapterData.wordCount += 1
    state.isShowSkip = false

    const dict = useDictStore()
    if (dict.isReviewMode) {
      dict.updateReviewIndex(state.chapterData.index)
    }
  }

  /** LOOP_CURRENT_WORD */
  function loopCurrentWord() {
    state.isShowSkip = false
    state.chapterData.wordCount += 1
  }

  /** FINISH_CHAPTER */
  function finishChapter() {
    state.chapterData.wordCount += 1
    state.isTyping = false
    state.isFinished = true
    state.isShowSkip = false

    const dict = useDictStore()
    if (dict.isReviewMode) {
      dict.finishReview()
    }
  }

  /** SKIP_WORD */
  function skipWord() {
    const newIndex = state.chapterData.index + 1
    if (newIndex >= state.chapterData.words.length) {
      state.isTyping = false
      state.isFinished = true
    } else {
      state.chapterData.index = newIndex
    }
    state.isShowSkip = false
  }

  /** SKIP_2_WORD_INDEX */
  function skipToIndex(newIndex: number) {
    if (newIndex >= state.chapterData.words.length) {
      state.isTyping = false
      state.isFinished = true
    }
    state.chapterData.index = newIndex
    state.isShowSkip = false
  }

  /** REPEAT_CHAPTER */
  function repeatChapter(shouldShuffle: boolean) {
    const next = structuredClone(initialState)
    next.chapterData.userInputLogs = makeUserInputLogs(state.chapterData.words)
    next.isTyping = true
    next.chapterData.words = shouldShuffle ? shuffle(state.chapterData.words) : state.chapterData.words
    next.isTransVisible = state.isTransVisible
    replaceState(next)
  }

  /** NEXT_CHAPTER（words 留空，由页面层在词表就绪后 setupChapter——消除原项目 words 空数组中间态） */
  function nextChapter() {
    const next = structuredClone(initialState)
    next.chapterData.userInputLogs = makeUserInputLogs(state.chapterData.words)
    next.isTyping = true
    next.isTransVisible = state.isTransVisible
    replaceState(next)
  }

  /** TOGGLE_TRANS_VISIBLE */
  function toggleTrans() {
    state.isTransVisible = !state.isTransVisible
  }

  /** TICK_TIMER */
  function tick(addTime?: number) {
    const increment = addTime === undefined ? 1 : addTime
    const newTime = state.timerData.time + increment
    const inputSum =
      state.chapterData.correctCount + state.chapterData.wrongCount === 0
        ? 1
        : state.chapterData.correctCount + state.chapterData.wrongCount

    state.timerData.time = newTime
    state.timerData.accuracy = Math.round((state.chapterData.correctCount / inputSum) * 100)
    state.timerData.wpm = Math.round((state.chapterData.wordCount / newTime) * 60)
  }

  /** ADD_WORD_RECORD_ID */
  function addWordRecordId(id: number) {
    state.chapterData.wordRecordIds.push(id)
  }

  /** SET_IS_SAVING_RECORD */
  function setSaving(v: boolean) {
    state.isSavingRecord = v
  }

  return {
    state,
    currentWord,
    wordsLength,
    inputNumber,
    setupChapter,
    setShowSkip,
    start,
    pause,
    toggleTyping,
    reportCorrect,
    reportWrong,
    nextWord,
    loopCurrentWord,
    finishChapter,
    skipWord,
    skipToIndex,
    repeatChapter,
    nextChapter,
    toggleTrans,
    tick,
    addWordRecordId,
    setSaving,
  }
})
