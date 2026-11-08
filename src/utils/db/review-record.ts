import { db } from '.'
import { ReviewRecord } from './record'
import type { Word } from '@/types'

/** 错词聚合数据（原项目 Gallery-N/hooks/useErrorWords 的类型，收敛到公共类型层） */
export interface TErrorWordData {
  word: string
  originData: Word
  errorCount: number
  errorChar: string[]
  errorLetters: Record<string, number>
  latestErrorTime: number
}

export async function getLatestReviewRecord(dictID: string): Promise<ReviewRecord | undefined> {
  const records = await db.reviewRecords.where('dict').equals(dictID).toArray()

  const latestRecord = records.sort((a, b) => a.createTime - b.createTime).pop()

  return latestRecord && (latestRecord.isFinished ? undefined : latestRecord)
}

type TRankedErrorWordData = TErrorWordData & {
  errorCountScore: number
  latestErrorTimeScore: number
}

export async function generateNewWordReviewRecord(dictID: string, errorData: TErrorWordData[]) {
  const errorCountRankings = [...errorData].sort((a, b) => a.errorCount - b.errorCount)
  const latestErrorTimeRankings = [...errorData].sort((a, b) => a.latestErrorTime - b.latestErrorTime)

  // 计算每个对象的排名得分
  const errorDataWithRank: TRankedErrorWordData[] = errorData.map((item) => ({
    ...item,
    errorCountScore: errorCountRankings.indexOf(item) + 1,
    latestErrorTimeScore: latestErrorTimeRankings.indexOf(item) + 1,
  }))

  // 根据加权排名进行排序（错误次数 0.6 + 最近错误时间 0.4，原算法逐字保留）
  const errorCountWeight = 0.6
  const latestErrorTimeWeight = 0.4

  const sortedWords: Word[] = errorDataWithRank
    .sort((a, b) => {
      const scoreA = a.errorCountScore * errorCountWeight + a.latestErrorTimeScore * latestErrorTimeWeight
      const scoreB = b.errorCountScore * errorCountWeight + b.latestErrorTimeScore * latestErrorTimeWeight

      return scoreA - scoreB
    })
    .map((item) => item.originData)

  const record = new ReviewRecord(dictID, sortedWords)

  await db.reviewRecords.put(record)
  return record
}

export async function putWordReviewRecord(record: ReviewRecord): Promise<number> {
  // JSON 深拷贝：Vue 深层 reactive 的嵌套 Proxy 无法过 IDB structured clone（顶层展开不够）
  // 并确保 put 完成后再返回（原项目未 await，存在时序隐患）；返回自增 id 由调用方回写
  const plain = JSON.parse(JSON.stringify(record)) as ReviewRecord
  return db.reviewRecords.put(plain)
}
