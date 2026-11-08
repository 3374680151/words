import { defineStore } from 'pinia'
import { computed } from 'vue'
import { idDictionaryMap } from '@/resources/dictionary'
import type { Dictionary } from '@/types'
import type { ReviewRecord } from '@/utils/db/record'
import { putWordReviewRecord } from '@/utils/db/review-record'
import { useConfigStore } from './config'

/**
 * 词书会话 store：词书/章节选择 + 复习模式（复习进度与 IndexedDB 双写，复刻原 reviewInfoAtom 行为）
 * config store 承载持久化字段，本 store 提供动作与派生
 */
export const useDictStore = defineStore('dict', () => {
  const config = useConfigStore()

  const dictInfo = computed<Dictionary>(() => {
    let dict = idDictionaryMap[config.currentDictId]
    // 如果 dict 不存在，则返回 cet4（原行为：Typing 页会检查并重置）
    if (!dict) {
      dict = idDictionaryMap.cet4
    }
    return dict
  })

  const chapterCount = computed(() => dictInfo.value.chapterCount)
  const isReviewMode = computed(() => config.reviewModeInfo.isReviewMode)
  const reviewRecord = computed(() => config.reviewModeInfo.reviewRecord)

  /** 词书卡片点击：setDictId + chapter=0 + 退出复习 */
  function selectDict(id: string) {
    config.currentDictId = id
    config.currentChapter = 0
    exitReview()
  }

  /** 章节选择 */
  function selectChapter(index: number) {
    config.currentChapter = index
  }

  /** 开始/继续复习：reviewRecord 写 state 并双写 IndexedDB */
  async function startReview(record: ReviewRecord) {
    const id = await putWordReviewRecord(record)
    record.id = id
    config.reviewModeInfo.isReviewMode = true
    config.reviewModeInfo.reviewRecord = record
    config.currentChapter = -1
  }

  /** 打字中每词推进：更新 index 并双写（复刻 reviewInfoAtom 写时副作用） */
  async function updateReviewIndex(index: number) {
    const record = config.reviewModeInfo.reviewRecord
    if (record?.id) {
      record.index = index
      await putWordReviewRecord(record)
    }
  }

  /** 复习完成 */
  async function finishReview() {
    const record = config.reviewModeInfo.reviewRecord
    if (record) {
      record.isFinished = true
      if (record.id) await putWordReviewRecord(record)
    }
  }

  /** 退出复习模式 */
  function exitReview() {
    config.reviewModeInfo.isReviewMode = false
    config.reviewModeInfo.reviewRecord = undefined
  }

  return { dictInfo, chapterCount, isReviewMode, reviewRecord, selectDict, selectChapter, startReview, updateReviewIndex, finishReview, exitReview }
})
