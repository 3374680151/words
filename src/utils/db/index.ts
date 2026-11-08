import type { IChapterRecord, IReviewRecord, IWordRecord, LetterMistakes } from './record'
import { ChapterRecord, ReviewRecord, WordRecord } from './record'
import type { Table } from 'dexie'
import Dexie from 'dexie'

/**
 * Dexie 数据层（库名/表名/版本 schema 与原项目逐字一致——老用户 IndexedDB 无缝迁移）
 * 与原项目差异：去掉 React hooks/jotai 依赖，改为纯函数 + 显式上下文参数（由调用方 store 传入）
 */
class RecordDB extends Dexie {
  wordRecords!: Table<IWordRecord, number>
  chapterRecords!: Table<IChapterRecord, number>
  reviewRecords!: Table<IReviewRecord, number>

  constructor() {
    super('RecordDB')
    this.version(1).stores({
      wordRecords: '++id,word,timeStamp,dict,chapter,errorCount,[dict+chapter]',
      chapterRecords: '++id,timeStamp,dict,chapter,time,[dict+chapter]',
    })
    this.version(2).stores({
      wordRecords: '++id,word,timeStamp,dict,chapter,wrongCount,[dict+chapter]',
      chapterRecords: '++id,timeStamp,dict,chapter,time,[dict+chapter]',
    })
    this.version(3).stores({
      wordRecords: '++id,word,timeStamp,dict,chapter,wrongCount,[dict+chapter]',
      chapterRecords: '++id,timeStamp,dict,chapter,time,[dict+chapter]',
      reviewRecords: '++id,dict,createTime,isFinished',
    })
  }
}

export const db = new RecordDB()

db.wordRecords.mapToClass(WordRecord)
db.chapterRecords.mapToClass(ChapterRecord)
db.reviewRecords.mapToClass(ReviewRecord)

/** 保存上下文：由 typing store 在调用时传入（替代原项目从 jotai 读） */
export interface RecordContext {
  dictId: string
  chapter: number
  isReview: boolean
}

export interface TypingStateSnapshot {
  chapterData: {
    correctCount: number
    wrongCount: number
    userInputLogs: { index: number; correctCount: number; wrongCount: number }[]
    wordCount: number
    words: unknown[]
    wordRecordIds: number[]
  }
  timerData: { time: number }
}

export async function saveChapterRecord(typingState: TypingStateSnapshot, ctx: RecordContext): Promise<number> {
  const {
    chapterData: { correctCount, wrongCount, userInputLogs, wordCount, words, wordRecordIds },
    timerData: { time },
  } = typingState
  const correctWordIndexes = userInputLogs.filter((log) => log.correctCount > 0 && log.wrongCount === 0).map((log) => log.index)

  const chapterRecord = new ChapterRecord(
    ctx.dictId,
    ctx.isReview ? -1 : ctx.chapter,
    time,
    correctCount,
    wrongCount,
    wordCount,
    correctWordIndexes,
    words.length,
    wordRecordIds ?? [],
  )
  // JSON 深拷贝：userInputLogs/wordRecordIds 可能携带 reactive Proxy
  return db.chapterRecords.add(JSON.parse(JSON.stringify(chapterRecord)))
}

export type WordKeyLogger = {
  letterTimeArray: number[]
  letterMistake: LetterMistakes
}

export async function saveWordRecord(
  {
    word,
    wrongCount,
    letterTimeArray,
    letterMistake,
  }: {
    word: string
    wrongCount: number
    letterTimeArray: number[]
    letterMistake: LetterMistakes
  },
  ctx: RecordContext,
): Promise<number> {
  const timing: number[] = []
  for (let i = 1; i < letterTimeArray.length; i++) {
    const diff = letterTimeArray[i] - letterTimeArray[i - 1]
    timing.push(diff)
  }

  const wordRecord = new WordRecord(word, ctx.dictId, ctx.isReview ? -1 : ctx.chapter, timing, wrongCount, letterMistake)

  // JSON 深拷贝：letterMistake 可能携带 Vue reactive Proxy（嵌套对象过不了 IDB structured clone）
  return db.wordRecords.add(JSON.parse(JSON.stringify(wordRecord)))
}

export async function deleteWordRecord(word: string, dict: string): Promise<number | undefined> {
  try {
    const deletedCount = await db.wordRecords.where({ word, dict }).delete()
    return deletedCount
  } catch (error) {
    console.error(`删除单词记录时出错：`, error)
    return undefined
  }
}
