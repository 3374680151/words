import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { idDictionaryMap } from '@/resources/dictionary'
import type { Dictionary } from '@/types'
import type { IUserDict, ReviewRecord } from '@/utils/db/record'
import { listUserDicts } from '@/utils/db/user-dict'
import { putWordReviewRecord } from '@/utils/db/review-record'
import { calcChapterCount } from '@/utils'
import { useConfigStore } from './config'

/** IUserDict → Dictionary（融合进既有词书资源体系：分类「我的词书」，url 为空走 IndexedDB） */
function toDictionary(d: IUserDict): Dictionary {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    category: '我的词书',
    tags: ['自定义'],
    url: '',
    length: d.words.length,
    language: 'en',
    languageCategory: 'en',
    chapterCount: calcChapterCount(d.words.length),
  }
}

/**
 * 词书会话 store：词书/章节选择 + 复习模式（复习进度与 IndexedDB 双写，复刻原 reviewInfoAtom 行为）
 * config store 承载持久化字段，本 store 提供动作与派生
 * C0 融合层：自定义词书（userDicts 表）并入查找与列表，练习/错题/复习/统计零特判
 */
export const useDictStore = defineStore('dict', () => {
  const config = useConfigStore()

  /** 自定义词书（启动异步加载；导入/删除后调 reloadCustomDicts） */
  const customDicts = ref<Dictionary[]>([])

  /** 静态表 + 自定义表合成（自定义后加载，覆盖式并入；id 冲突时静态表优先的语义由并入顺序保证——自定义 id 带 user_ 前缀不会冲突） */
  const allDictsMap = computed<Record<string, Dictionary>>(() => {
    const map: Record<string, Dictionary> = { ...idDictionaryMap }
    for (const d of customDicts.value) map[d.id] = d
    return map
  })

  const dictInfo = computed<Dictionary>(() => {
    // 如果 dict 不存在（含自定义书已删除），则返回 cet4（原行为：Typing 页会检查并重置；红线 C8）
    return allDictsMap.value[config.currentDictId] ?? idDictionaryMap.cet4
  })

  const chapterCount = computed(() => dictInfo.value.chapterCount)
  const isReviewMode = computed(() => config.reviewModeInfo.isReviewMode)
  const reviewRecord = computed(() => config.reviewModeInfo.reviewRecord)

  /** 启动加载 / 导入删除后刷新自定义词书列表 */
  async function reloadCustomDicts() {
    try {
      customDicts.value = (await listUserDicts()).map(toDictionary)
    } catch (e) {
      console.error('加载自定义词书失败', e)
    } finally {
      // 红线 16（对齐原版语义）：currentDictId 非法（含自定义书已删）→ 重置 cet4 + 章节归 0 并持久化
      // （dictInfo computed 只做读取期兜底，不回写；此处补齐原版的回写行为）
      if (!allDictsMap.value[config.currentDictId]) {
        config.currentDictId = 'cet4'
        config.currentChapter = 0
      }
    }
  }
  void reloadCustomDicts()

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

  return { dictInfo, chapterCount, isReviewMode, reviewRecord, customDicts, allDictsMap, reloadCustomDicts, selectDict, selectChapter, startReview, updateReviewIndex, finishReview, exitReview }
})
