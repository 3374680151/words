import { defineStore } from 'pinia'
import { reactive, ref, watch, type Ref } from 'vue'
import { loadPersisted, savePersisted } from './persist'
import { defaultFontSizeConfig } from '@/constants'
import { correctSoundResources, keySoundResources, wrongSoundResources } from '@/resources/soundResource'
import type { LoopWordTimesOption, PhoneticType, PronunciationType, SoundResource, WordDictationOpenBy, WordDictationType } from '@/types'
import type { ReviewRecord } from '@/utils/db/record'

/**
 * 用户配置 store：18 项，localStorage key 与原项目一字不差（老用户数据无缝迁移）
 * 对象配置 reactive + deep watch 回写；原始类型配置 ref
 */

function persistedReactive<T extends object>(key: string, defaultValue: T) {
  return reactive(loadPersisted(key, defaultValue))
}
function persistedRef<T>(key: string, defaultValue: T): Ref<T> {
  return ref(loadPersisted(key, defaultValue)) as Ref<T>
}

export const useConfigStore = defineStore('config', () => {
  // —— 词书会话 ——
  const currentDictId = persistedRef<string>('currentDict', 'cet4')
  const currentChapter = persistedRef<number>('currentChapter', 0)

  // —— 练习行为 ——
  const loopWordConfig = persistedReactive<{ times: LoopWordTimesOption }>('loopWordConfig', { times: 1 })
  const randomConfig = persistedReactive<{ isOpen: boolean }>('randomConfig', { isOpen: false })
  const wordDictation = persistedReactive<{ isOpen: boolean; type: WordDictationType; openBy: WordDictationOpenBy }>('wordDictationConfig', {
    isOpen: false,
    type: 'hideAll',
    openBy: 'auto',
  })

  // —— 音效 ——
  const keySounds = persistedReactive<{ isOpen: boolean; isOpenClickSound: boolean; volume: number; resource: SoundResource }>(
    'keySoundsConfig',
    {
      isOpen: true,
      isOpenClickSound: true,
      volume: 1,
      resource: keySoundResources[0],
    },
  )
  const hintSounds = persistedReactive<{
    isOpen: boolean
    volume: number
    isOpenWrongSound: boolean
    isOpenCorrectSound: boolean
    wrongResource: SoundResource
    correctResource: SoundResource
  }>('hintSoundsConfig', {
    isOpen: true,
    volume: 1,
    isOpenWrongSound: true,
    isOpenCorrectSound: true,
    wrongResource: wrongSoundResources[0],
    correctResource: correctSoundResources[0],
  })
  const pronunciation = persistedReactive<{
    isOpen: boolean
    volume: number
    type: PronunciationType
    name: string
    isLoop: boolean
    isTransRead: boolean
    transVolume: number
    rate: number
  }>('pronunciation', {
    isOpen: true,
    volume: 1,
    type: 'us',
    name: '美音',
    isLoop: false,
    isTransRead: false,
    transVolume: 1,
    rate: 1,
  })

  // —— 显示 ——
  const fontSize = persistedReactive<{ foreignFont: number; translateFont: number }>('fontsize', { ...defaultFontSizeConfig })
  const phonetic = persistedReactive<{ isOpen: boolean; type: PhoneticType }>('phoneticConfig', { isOpen: true, type: 'us' })
  const isOpenDarkMode = persistedRef<boolean>('isOpenDarkModeAtom', window.matchMedia('(prefers-color-scheme: dark)').matches)
  const isShowPrevAndNextWord = persistedRef<boolean>('isShowPrevAndNextWord', true)
  const isIgnoreCase = persistedRef<boolean>('isIgnoreCase', true)
  const isShowAnswerOnHover = persistedRef<boolean>('isShowAnswerOnHover', true)
  const isTextSelectable = persistedRef<boolean>('isTextSelectable', false)

  // —— 特效（本项目新增，原项目无） ——
  const fxConfig = persistedReactive<{ ambient: boolean; cursorFx: boolean }>('fxConfig', { ambient: true, cursorFx: false })

  // —— 复习模式（持久化 + IndexedDB 双写在 dict store 的 action 中处理） ——
  const reviewModeInfo = persistedReactive<{ isReviewMode: boolean; reviewRecord?: ReviewRecord }>('reviewModeInfo', {
    isReviewMode: false,
    reviewRecord: undefined,
  })

  // —— 非持久化会话状态 ——
  const isShowSkip = ref(false)

  // 自动回写：任意配置变更 → localStorage
  const reactivePairs = [
    [loopWordConfig, 'loopWordConfig'],
    [randomConfig, 'randomConfig'],
    [wordDictation, 'wordDictationConfig'],
    [keySounds, 'keySoundsConfig'],
    [hintSounds, 'hintSoundsConfig'],
    [pronunciation, 'pronunciation'],
    [fontSize, 'fontsize'],
    [phonetic, 'phoneticConfig'],
    [fxConfig, 'fxConfig'],
    [reviewModeInfo, 'reviewModeInfo'],
  ] as const
  for (const [state, key] of reactivePairs) {
    watch(state, (v) => savePersisted(key, JSON.parse(JSON.stringify(v))), { deep: true })
  }
  watch(currentDictId, (v) => savePersisted('currentDict', v))
  watch(currentChapter, (v) => savePersisted('currentChapter', v))
  watch(isOpenDarkMode, (v) => savePersisted('isOpenDarkModeAtom', v))
  watch(isShowPrevAndNextWord, (v) => savePersisted('isShowPrevAndNextWord', v))
  watch(isIgnoreCase, (v) => savePersisted('isIgnoreCase', v))
  watch(isShowAnswerOnHover, (v) => savePersisted('isShowAnswerOnHover', v))
  watch(isTextSelectable, (v) => savePersisted('isTextSelectable', v))

  return {
    currentDictId,
    currentChapter,
    loopWordConfig,
    randomConfig,
    wordDictation,
    keySounds,
    hintSounds,
    pronunciation,
    fontSize,
    phonetic,
    isOpenDarkMode,
    isShowPrevAndNextWord,
    isIgnoreCase,
    isShowAnswerOnHover,
    isTextSelectable,
    fxConfig,
    reviewModeInfo,
    isShowSkip,
  }
})
