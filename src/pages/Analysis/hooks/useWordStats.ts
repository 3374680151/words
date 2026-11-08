import dayjs from 'dayjs'

// 平移自原项目 useWordStats（聚合逻辑逐字保留）
export interface Activity {
  date: string
  count: number
  level: number
}

export interface WordStats {
  isEmpty?: boolean
  exerciseRecord: Activity[]
  wordRecord: Activity[]
  wpmRecord: [string, number][]
  accuracyRecord: [string, number][]
  wrongTimeRecord: { name: string; value: number }[]
}

// 获取两个日期之间的所有日期，使用dayjs计算
function getDatesBetween(start: number, end: number) {
  const dates = []
  let curr = dayjs(start).startOf('day')
  const last = dayjs(end).endOf('day')

  while (curr.diff(last) < 0) {
    dates.push(curr.clone().format('YYYY-MM-DD'))
    curr = curr.add(1, 'day')
  }

  return dates
}

function getLevel(value: number) {
  if (value === 0) return 0
  else if (value < 4) return 1
  else if (value < 8) return 2
  else if (value < 12) return 3
  else return 4
}

export async function getWordStats(startTimeStamp: number, endTimeStamp: number): Promise<WordStats> {
  const { db } = await import('@/utils/db')
  // indexedDB查找某个数字范围内的数据
  const records = await db.wordRecords.where('timeStamp').between(startTimeStamp, endTimeStamp).toArray()

  if (records.length === 0) {
    return { isEmpty: true, exerciseRecord: [], wordRecord: [], wpmRecord: [], accuracyRecord: [], wrongTimeRecord: [] }
  }

  let data: {
    [x: string]: {
      exerciseTime: number
      words: string[]
      totalTime: number
      wrongCount: number
      wrongKeys: string[]
    }
  } = {}

  const dates = getDatesBetween(startTimeStamp * 1000, endTimeStamp * 1000)
  data = dates
    .map((date) => ({ [date]: { exerciseTime: 0, words: [], totalTime: 0, wrongCount: 0, wrongKeys: [] } }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {})

  for (let i = 0; i < records.length; i++) {
    const date = dayjs(records[i].timeStamp * 1000).format('YYYY-MM-DD')
    if (!data[date]) continue

    data[date].exerciseTime = data[date].exerciseTime + 1
    data[date].words = [...data[date].words, records[i].word]
    data[date].totalTime = data[date].totalTime + records[i].timing.reduce((acc, curr) => acc + curr, 0)
    data[date].wrongCount = data[date].wrongCount + records[i].wrongCount
    data[date].wrongKeys = [...(data[date].wrongKeys || []), ...(Object.values(records[i].mistakes).flat() || [])]
  }

  const RecordArray = Object.entries(data)

  // 练习次数统计
  const exerciseRecord: Activity[] = RecordArray.map(([date, { exerciseTime }]) => ({
    date,
    count: exerciseTime,
    level: getLevel(exerciseTime),
  }))
  // 练习词数统计（去重）
  const wordRecord: Activity[] = RecordArray.map(([date, { words }]) => ({
    date,
    count: Array.from(new Set(words)).length,
    level: getLevel(Array.from(new Set(words)).length),
  }))
  // wpm=练习词数（不去重）/总时间
  const wpmRecord: [string, number][] = RecordArray.map<[string, number]>(([date, { words, totalTime }]) => [
    date,
    Math.round(words.length / (totalTime / 1000 / 60)),
  ]).filter((d) => d[1])
  // 正确率=每个单词的长度合计/(每个单词的长度合计+总错误次数)
  const accuracyRecord: [string, number][] = RecordArray.map<[string, number]>(([date, { words, wrongCount }]) => [
    date,
    Math.round((words.join('').length / (words.join('').length + wrongCount)) * 100),
  ]).filter((d) => d[1])
  // 错误次数统计
  const wrongTimeRecord: { name: string; value: number }[] = []
  const allWrongTime = RecordArray.map(([, { wrongKeys }]) => wrongKeys)
    .flat()
    .map((key) => key.toUpperCase())
  allWrongTime.forEach((key) => {
    const index = wrongTimeRecord.findIndex((item) => item.name === key)
    if (index === -1) {
      wrongTimeRecord.push({ name: key, value: 1 })
    } else {
      wrongTimeRecord[index].value++
    }
  })

  return { exerciseRecord, wordRecord, wpmRecord, accuracyRecord, wrongTimeRecord }
}
