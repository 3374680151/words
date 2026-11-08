import { ref, watch, type Ref } from 'vue'
import { db } from '@/utils/db'
import type { WordRecord } from '@/utils/db/record'
import { fetchWithCache } from '@/composables/useDictWords'
import type { Dictionary, Word } from '@/types'

/** 平移自原 ErrorBook hooks + 类型（🆕：Map 分组修复 O(n²)、列表 loading 态） */

export interface GroupedWordRecords {
  word: string
  dict: string
  records: WordRecord[]
  wrongCount: number
}

/** 错词分组（word+dict），按 Map 修复原 O(n²) find */
export function useGroupedRecords(reload: Ref<boolean>): {
  groupedRecords: Ref<GroupedWordRecords[]>
  isLoading: Ref<boolean>
} {
  const groupedRecords = ref<GroupedWordRecords[]>([])
  const isLoading = ref(true)

  watch(reload, async () => {
    isLoading.value = true
    try {
      const records = await db.wordRecords.where('wrongCount').above(0).toArray()
      const groups = new Map<string, GroupedWordRecords>()
      records.forEach((record) => {
        const key = `${record.word}__${record.dict}`
        const group = groups.get(key)
        if (group) group.records.push(record as WordRecord)
        else groups.set(key, { word: record.word, dict: record.dict, records: [record as WordRecord], wrongCount: 0 })
      })
      const result: GroupedWordRecords[] = []
      groups.forEach((group) => {
        group.wrongCount = group.records.reduce((acc, cur) => acc + cur.wrongCount, 0)
        result.push(group)
      })
      groupedRecords.value = result
    } finally {
      isLoading.value = false
    }
  }, { immediate: true })

  return { groupedRecords, isLoading }
}

/** 行内释义（三态：word / loading / hasError），复用词表缓存 */
export function useGetWord(name: string, dict: Dictionary | undefined): {
  word: Ref<Word | undefined>
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
} {
  const word = ref<Word | undefined>(undefined)
  const isLoading = ref(!!dict)
  const hasError = ref(false)

  watch(
    () => [name, dict?.url] as const,
    async () => {
      if (!dict) {
        isLoading.value = false
        hasError.value = true
        return
      }
      isLoading.value = true
      hasError.value = false
      try {
        const list = await fetchWithCache(dict.url)
        const found = list.find((w) => w.name === name)
        if (found) {
          word.value = found
        } else {
          hasError.value = true
          word.value = undefined
        }
      } catch {
        hasError.value = true
        word.value = undefined
      } finally {
        isLoading.value = false
      }
    },
    { immediate: true },
  )

  return { word, isLoading, hasError }
}
