import { ref, computed, watch, onUnmounted, type Ref } from 'vue'
import { CHAPTER_LENGTH } from '@/constants'
import { getUserDict, isCustomDictId } from '@/utils/db/user-dict'
import type { Word, WordWithIndex } from '@/types'
import { wordListFetcher } from '@/utils/wordListFetcher'
import { useConfigStore } from '@/stores/config'
import { useDictStore } from '@/stores/dict'

/**
 * 词表加载（替代 SWR）：模块级 Map 缓存（等价 staleTime Infinity，词库 JSON 为静态资源）
 * 行为逐字对照原 useWordList：
 * - cet4 第 0 章使用内置 20 词（firstChapter）
 * - 复习模式使用 reviewRecord.words
 * - 普通模式 slice(currentChapter*20, +20)
 * - trans 兜底清洗 + 注入 index
 * - 修复：chapter 越界重置从 render 期副作用改为显式守卫（TypingPage 调 useChapterGuard）
 */

// 模块级缓存：url → 词表
const wordListCache = new Map<string, Promise<Word[]>>()

export function fetchWithCache(url: string): Promise<Word[]> {
  let p = wordListCache.get(url)
  if (!p) {
    p = wordListFetcher(url)
    wordListCache.set(url, p)
    // 失败时移除缓存，允许重试
    p.catch(() => wordListCache.delete(url))
  }
  return p
}

export const firstChapter: Word[] = [
  { name: 'cancel', trans: ['取消， 撤销； 删去'], usphone: "'kænsl", ukphone: "'kænsl" },
  { name: 'explosive', trans: ['爆炸的； 极易引起争论的', '炸药'], usphone: "ɪk'splosɪv; ɪk'splozɪv", ukphone: "ɪk'spləusɪv" },
  { name: 'numerous', trans: ['众多的'], usphone: "'numərəs", ukphone: "'njuːmərəs" },
  { name: 'govern', trans: ['居支配地位， 占优势', '统治，治理，支配'], usphone: "'ɡʌvɚn", ukphone: "'gʌvn" },
  { name: 'analyse', trans: ['分析； 分解； 解析'], usphone: "'æn(ə)laɪz", ukphone: "'ænəlaɪz" },
  { name: 'discourage', trans: ['使泄气， 使灰心； 阻止， 劝阻'], usphone: "dɪs'kɝɪdʒ", ukphone: "dɪs'kʌrɪdʒ" },
  { name: 'resemble', trans: ['像， 类似于'], usphone: "rɪ'zɛmbl", ukphone: "rɪ'zembl" },
  {
    name: 'remote',
    trans: ['遥远的； 偏僻的； 关系疏远的； 脱离的； 微乎其微的； 孤高的， 冷淡的； 遥控的'],
    usphone: "rɪ'mot",
    ukphone: "rɪ'məut",
  },
  { name: 'salary', trans: ['薪金， 薪水'], usphone: "'sæləri", ukphone: "'sæləri" },
  { name: 'pollution', trans: ['污染， 污染物'], usphone: "pə'luʃən", ukphone: "pə'luːʃn" },
  { name: 'pretend', trans: ['装作， 假装'], usphone: "prɪ'tɛnd", ukphone: "prɪ'tend" },
  { name: 'kettle', trans: ['水壶'], usphone: "'kɛtl", ukphone: "'ketl" },
  { name: 'wreck', trans: ['失事；残骸；精神或身体已垮的人', '破坏'], usphone: 'rɛk', ukphone: 'rek' },
  { name: 'drunk', trans: ['醉的； 陶醉的'], usphone: 'drʌŋk', ukphone: 'drʌŋk' },
  { name: 'calculate', trans: ['计算； 估计； 计划'], usphone: "'kælkjulet", ukphone: "'kælkjuleɪt" },
  { name: 'persistent', trans: ['坚持的， 不屈不挠的； 持续不断的； 反复出现的'], usphone: "pə'zɪstənt", ukphone: "pə'sɪstənt" },
  { name: 'sake', trans: ['缘故， 理由'], usphone: 'sek', ukphone: 'seɪk' },
  { name: 'conceal', trans: ['把…隐藏起来， 掩盖， 隐瞒'], usphone: "kən'sil", ukphone: "kən'siːl" },
  { name: 'audience', trans: ['听众， 观众， 读者'], usphone: "'ɔdɪəns", ukphone: "'ɔːdiəns" },
  { name: 'meanwhile', trans: ['与此同时'], usphone: "'minwaɪl", ukphone: "'miːnwaɪl" },
]

/** 章节越界守卫（在 TypingPage 的 watchEffect 中调用） */
export function useChapterGuard(): void {
  const config = useConfigStore()
  const dict = useDictStore()
  if (config.currentChapter >= dict.chapterCount) {
    config.currentChapter = 0
  }
}

export interface UseDictWordsResult {
  words: Ref<WordWithIndex[]>
  isLoading: Ref<boolean>
  error: Ref<Error | undefined>
  reload: () => void
}

/** 打字页词表加载（含内置首章/复习模式/章节切片/trans 兜底） */
export function useDictWords(): UseDictWordsResult {
  const config = useConfigStore()
  const dict = useDictStore()

  const isLoading = ref(false)
  const error = ref<Error | undefined>(undefined)
  const rawWords = ref<Word[]>([])
  let fetchSeq = 0
  const stopFns: Array<() => void> = []

  const words = computed<WordWithIndex[]>(() => {
    // 关键：无条件读取 rawWords 建立响应依赖（React 版靠显式 deps，Vue 短路分支会丢依赖导致加载后不重算）
    const raw = rawWords.value
    const isFirstChapter = !dict.isReviewMode && dict.dictInfo.id === 'cet4' && config.currentChapter === 0
    let newWords: Word[]
    if (isFirstChapter) {
      newWords = firstChapter
    } else if (dict.isReviewMode) {
      newWords = dict.reviewRecord?.words ?? []
    } else if (raw.length > 0) {
      newWords = raw.slice(config.currentChapter * CHAPTER_LENGTH, (config.currentChapter + 1) * CHAPTER_LENGTH)
    } else {
      newWords = []
    }

    // 记录原始 index, 并对 word.trans 做兜底处理（原逻辑逐字保留）
    return newWords.map((word, index) => {
      let trans: string[]
      if (Array.isArray(word.trans)) {
        trans = word.trans.filter((item) => typeof item === 'string')
      } else if (word.trans === null || word.trans === undefined || typeof word.trans === 'object') {
        trans = []
      } else {
        trans = [String(word.trans)]
      }
      return {
        ...word,
        index,
        trans,
      }
    })
  })

  async function load() {
    // 复习模式不请求词表（用 reviewRecord.words）；首章内置词也需请求缓存整本供后续章节复用
    if (dict.isReviewMode) {
      rawWords.value = []
      error.value = undefined
      isLoading.value = false
      return
    }
    // 自定义词书：词表从 IndexedDB userDicts 读取（06 规划 C0；无 url，不走 fetch）
    if (isCustomDictId(dict.dictInfo.id)) {
      const seq = ++fetchSeq
      isLoading.value = true
      error.value = undefined
      try {
        const ud = await getUserDict(dict.dictInfo.id)
        if (seq === fetchSeq) rawWords.value = ud?.words ?? []
      } catch (e) {
        if (seq === fetchSeq) {
          error.value = e instanceof Error ? e : new Error(String(e))
          rawWords.value = []
        }
      } finally {
        if (seq === fetchSeq) isLoading.value = false
      }
      return
    }
    const url = dict.dictInfo.url
    const seq = ++fetchSeq
    isLoading.value = true
    error.value = undefined
    try {
      const list = await fetchWithCache(url)
      if (seq === fetchSeq) {
        rawWords.value = list
      }
    } catch (e) {
      if (seq === fetchSeq) {
        error.value = e instanceof Error ? e : new Error(String(e))
        rawWords.value = []
      }
    } finally {
      if (seq === fetchSeq) isLoading.value = false
    }
  }

  void load()
  // 词书切换时重新加载（监听 id：自定义词书 url 恒为空，监听 url 会导致自定义书间切换不重载）
  stopFns.push(watch(() => dict.dictInfo.id, () => void load()))
  // 退出复习模式时恢复词表加载
  stopFns.push(watch(() => dict.isReviewMode, () => void load()))

  onUnmounted(() => stopFns.forEach((fn) => fn()))

  function reload() {
    // 清缓存后重拉（错误恢复用）；自定义词书直读 IndexedDB
    if (isCustomDictId(dict.dictInfo.id)) {
      void load()
      return
    }
    wordListCache.delete(dict.dictInfo.url)
    void load()
  }

  return { words, isLoading, error, reload }
}
