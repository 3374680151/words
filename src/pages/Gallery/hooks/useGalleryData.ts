import { ref, watch, type Ref } from 'vue'
import { db } from '@/utils/db'
import type { IWordRecord } from '@/utils/db/record'
import { wordListFetcher } from '@/utils/wordListFetcher'
import { toFixedNumber } from '@/utils'
import type { Dictionary, Word } from '@/types'
import type { TErrorWordData } from '@/utils/db/review-record'

/**
 * Gallery 数据 hooks（平移原 Gallery-N hooks）
 * 修复：useErrorWords 的 O(n²) 分组（Array.find）→ Map 分组
 */

export interface IDictStats {
  exercisedChapterCount: number
}

export function useDictStats(dictID: string, isStartLoad: Ref<boolean> | boolean): Ref<IDictStats | null> {
  const stats = ref<IDictStats | null>(null)
  const started = ref(false)

  watch(
    [() => isStartLoad, () => dictID],
    async ([start]) => {
      if (!start || started.value) return
      started.value = true
      const records = await db.chapterRecords.where({ dict: dictID }).toArray()
      const allChapter = records.map(({ chapter }) => chapter).filter((item) => item !== null) as number[]
      const uniqueChapter = allChapter.filter((value, index, self) => self.indexOf(value) === index)
      stats.value = { exercisedChapterCount: uniqueChapter.length }
    },
    { immediate: true },
  )

  return stats
}

export interface IChapterStats {
  exerciseCount: number
  avgWrongWordCount: number
  avgWrongInputCount: number
}

export function useChapterStats(chapter: number, dictID: string, isStartLoad: Ref<boolean> | boolean): Ref<IChapterStats | null> {
  const stats = ref<IChapterStats | null>(null)
  const started = ref(false)

  watch(
    [() => isStartLoad, () => dictID, () => chapter],
    async ([start]) => {
      if (!start || started.value) return
      started.value = true
      const records = await db.chapterRecords.where({ dict: dictID, chapter }).toArray()
      const exerciseCount = records.length
      const totalWrongWordCount = records.reduce(
        (total, { wordNumber, correctWordIndexes }) => total + (wordNumber - correctWordIndexes.length),
        0,
      )
      const totalWrongInputCount = records.reduce((total, { wrongCount }) => total + (wrongCount ?? 0), 0)
      stats.value = {
        exerciseCount,
        avgWrongWordCount: exerciseCount > 0 ? toFixedNumber(totalWrongWordCount / exerciseCount, 2) : 0,
        avgWrongInputCount: exerciseCount > 0 ? toFixedNumber(totalWrongInputCount / exerciseCount, 2) : 0,
      }
    },
    { immediate: true },
  )

  return stats
}

/** 错词聚合（Map 分组修复版；词表通过 useDictWords 缓存获取） */
export function useErrorWordData(dict: Dictionary, reload: Ref<boolean> | boolean): {
  errorWordData: Ref<TErrorWordData[]>
  isLoading: Ref<boolean>
  error: Ref<Error | undefined>
} {
  const errorWordData = ref<TErrorWordData[]>([])
  const isLoading = ref(false)
  const error = ref<Error | undefined>(undefined)

  watch(
    [() => dict.id, () => reload],
    async () => {
      isLoading.value = true
      error.value = undefined
      try {
        const wordList: Word[] = await wordListFetcher(dict.url)
        const records = await db.wordRecords
          .where('wrongCount')
          .above(0)
          .filter((record) => record.dict === dict.id)
          .toArray()

        // Map 分组（修复原 O(n²) find）
        const groupRecords = new Map<string, IWordRecord[]>()
        records.forEach((record) => {
          const list = groupRecords.get(record.word)
          if (list) list.push(record as IWordRecord)
          else groupRecords.set(record.word, [record as IWordRecord])
        })

        const res: TErrorWordData[] = []
        groupRecords.forEach((group, wordName) => {
          const errorLetters: Record<string, number> = {}
          group.forEach((record) => {
            for (const index in record.mistakes) {
              const mistakes = record.mistakes[index]
              if (mistakes.length > 0) {
                errorLetters[index] = (errorLetters[index] ?? 0) + mistakes.length
              }
            }
          })

          const word = wordList.find((w) => w.name === wordName)
          if (!word) return

          res.push({
            word: wordName,
            originData: word,
            errorCount: group.reduce((acc, cur) => acc + cur.wrongCount, 0),
            errorLetters,
            errorChar: Object.entries(errorLetters)
              .sort((a, b) => b[1] - a[1])
              .map(([index]) => wordName[Number(index)]),
            latestErrorTime: group.reduce((acc, cur) => Math.max(acc, cur.timeStamp), 0),
          })
        })
        errorWordData.value = res
      } catch (e) {
        error.value = e instanceof Error ? e : new Error(String(e))
      } finally {
        isLoading.value = false
      }
    },
    { immediate: true, deep: false },
  )

  return { errorWordData, isLoading, error }
}
