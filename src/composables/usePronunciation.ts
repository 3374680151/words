import { ref, watch, onUnmounted, type Ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import { PRONUNCIATION_API } from '@/constants'
import { romajiToHiragana } from '@/utils/kana'
import type { PronunciationType } from '@/types'

/**
 * 单词发音（有道 dictvoice）：
 * - URL 生成规则逐字平移（uk→type=1 / us→type=2 / romaji→转平假名+le=jap / zh / ja / de / kk·hapin→le=ru / id→le=id）
 * - 升级：Map 内存缓存（替代原项目往 document.head 挂 audio 预取的 hack），cacheKey = word+type+rate
 * - 预取下一词逻辑保留
 */

const audioCache = new Map<string, HTMLAudioElement>()

export function generateWordSoundSrc(word: string, pronunciation: Exclude<PronunciationType, false>): string {
  let audio = `${PRONUNCIATION_API}${word}`
  switch (pronunciation) {
    case 'uk':
      audio += '&type=1'
      break
    case 'us':
      audio += '&type=2'
      break
    case 'romaji':
      audio += `${romajiToHiragana(word)}&le=jap`
      break
    case 'zh':
      audio += '&le=zh'
      break
    case 'ja':
      audio += '&le=jap'
      break
    case 'de':
      audio += '&le=de'
      break
    case 'hapin':
    case 'kk':
      audio += '&le=ru'
      break
    case 'id':
      audio += '&le=id'
      break
  }
  return audio
}

function getAudio(src: string): HTMLAudioElement {
  let audio = audioCache.get(src)
  if (!audio) {
    audio = new Audio()
    audio.preload = 'auto'
    audio.crossOrigin = 'anonymous'
    audio.src = src
    audioCache.set(src, audio)
  }
  return audio
}

/** 预取下一词音频（保留原行为，实现改为缓存 Map） */
export function prefetchWordSound(word: string | undefined, pronunciation: Exclude<PronunciationType, false>): void {
  if (!word) return
  getAudio(generateWordSoundSrc(word, pronunciation))
}

/** 词表卡片等非组件场景的直接播放（复用全局音频缓存，无生命周期注册） */
export function playWordDirect(word: string): void {
  const config = useConfigStore()
  if (!config.pronunciation.isOpen) return
  const audio = getAudio(generateWordSoundSrc(word, config.pronunciation.type))
  audio.pause()
  audio.currentTime = 0
  audio.volume = config.pronunciation.volume
  audio.playbackRate = config.pronunciation.rate
  audio.play().catch(() => undefined)
}

export interface PronunciationSound {
  play: () => void
  stop: () => void
  isPlaying: Ref<boolean>
}

/** 单词发音控制（先 stop 再 play，复刻原行为） */
export function usePronunciationSound(word: Ref<string> | string, isLoop?: Ref<boolean> | boolean): PronunciationSound {
  const config = useConfigStore()
  const isPlaying = ref(false)

  const wordRef = typeof word === 'string' ? ref(word) : word
  const loopRef = typeof isLoop === 'boolean' ? ref(isLoop) : isLoop ?? ref(false)

  let currentAudio: HTMLAudioElement | null = null

  function stop(): void {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      currentAudio.loop = false
    }
    isPlaying.value = false
  }

  function play(): void {
    if (!config.pronunciation.isOpen) return
    stop()
    const src = generateWordSoundSrc(wordRef.value, config.pronunciation.type)
    currentAudio = getAudio(src)
    currentAudio.volume = config.pronunciation.volume
    currentAudio.playbackRate = config.pronunciation.rate
    currentAudio.loop = loopRef?.value ?? false
    currentAudio.onended = () => (isPlaying.value = false)
    currentAudio.onpause = () => (isPlaying.value = false)
    currentAudio.onplay = () => (isPlaying.value = true)
    currentAudio.play().catch(() => (isPlaying.value = false))
  }

  // loop 配置变化时同步
  if (loopRef) {
    watch(loopRef, (v) => {
      if (currentAudio) currentAudio.loop = v
    })
  }

  onUnmounted(() => {
    stop()
    currentAudio = null
  })

  return { play, stop, isPlaying }
}
