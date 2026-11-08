/**
 * 构建 ECDICT 精简反查库（06 文档 2.2 节）
 *
 * 用法：node scripts/build-ecdict-mini.mjs <ecdict.csv 路径>
 * 数据源（二选一，文件不入库）：
 *   npm 包：curl -O https://registry.npmjs.org/ecdict/-/ecdict-0.0.4.tgz && tar -xzf
 *   上游：https://github.com/skywind3000/ECDICT（完整版含 usphonetic 列，本包变体仅有 phonetic）
 *
 * 筛选：词频(frq)>0 或 BNC 词表(bnc)>0 或带考试标签(tag) 且有中文释义，按词频排序取前 50000
 * 输出：public/dicts/ecdict-mini.json —— { [word]: [phonetic, translation] }（fetch 懒加载，不进主包）
 */
import { createReadStream } from 'node:fs'
import { createWriteStream } from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const LIMIT = 50000
const src = process.argv[2]
if (!src) {
  console.error('用法：node scripts/build-ecdict-mini.mjs <ecdict.csv>')
  process.exit(1)
}

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'dicts', 'ecdict-mini.json')
const rows = []
const rl = readline.createInterface({ input: createReadStream(src, 'utf-8'), crlfDelay: Infinity })

let header = null
let total = 0
for await (const line of rl) {
  // CSV 含引号包裹的多行字段？——ECDICT 导出的 translation 以 \n 字面量（\\n）存储，无真实换行，按行解析安全
  const cols = parseCsvLine(line)
  if (!header) {
    header = cols
    continue
  }
  total++
  const row = Object.fromEntries(header.map((h, i) => [h, cols[i] ?? '']))
  const translation = row.translation.trim()
  if (!translation) continue
  const hasFreq = Number(row.frq) > 0
  const hasBnc = Number(row.bnc) > 0
  const hasTag = row.tag.trim() !== ''
  if (!hasFreq && !hasBnc && !hasTag) continue
  rows.push({ word: row.word, phonetic: row.phonetic.trim(), translation, frq: Number(row.frq) || 0, bnc: Number(row.bnc) || 0 })
}

rows.sort((a, b) => b.frq - a.frq || b.bnc - a.bnc)
const kept = rows.slice(0, LIMIT)

/** 手写单行 CSV 解析（处理引号包裹的逗号与转义引号） */
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuote) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else inQuote = false
      } else cur += c
    } else if (c === '"') inQuote = true
    else if (c === ',') { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

// 输出紧凑结构：{ word: [phonetic, translation] }，键序保持词频降序（便于人工审阅）
const dict = {}
for (const r of kept) dict[r.word] = [r.phonetic, r.translation]

await new Promise((resolve, reject) => {
  const ws = createWriteStream(outPath)
  ws.write('{')
  const entries = Object.entries(dict)
  entries.forEach(([w, v], i) => {
    ws.write(`${JSON.stringify(w)}:${JSON.stringify(v)}${i < entries.length - 1 ? ',' : ''}`)
  })
  ws.end('}', resolve)
  ws.on('error', reject)
})

const kb = Math.round((await import('node:fs')).statSync(outPath).size / 1024)
console.log(`源词条 ${total}，入选 ${kept.length}，输出 ${outPath}（${kb} KB）`)
