import type { Word } from '@/types'
import { enrichPlainWord, USER_DICT_MAX_WORDS } from './db/user-dict'

/**
 * 词书文件解析（06 规划 C1 / 2.1 节）
 * - 通道 A：.txt 每行一个单词（# 注释、容忍空格），ECDICT 反查补释义
 * - 通道 B：.csv / .xlsx 三列（单词, 释义, 音标可选），复用既有 xlsx 依赖（SheetJS）
 * - 统一输出内部 Word 结构；上限 5000 词由调用方在解析前校验文件大小、解析后校验词数
 */

export interface ParseResult {
  words: Word[]
  /** 通道标记（展示用） */
  channel: 'plain' | 'table'
  /** 解析中丢弃的无效行数（txt 空行/注释不计入） */
  skipped: number
}

export interface ParseOptions {
  /** ECDICT 反查失败降级（红线 C10）：true 时纯词不补释义、表格通道照常走文件自带释义 */
  ecdictFailed?: boolean
}

/** 表格头智能映射：支持中英文常见表头；无表头时按列序兜底（0=词,1=义,2=音标） */
const HEADER_MAP: Record<string, 'name' | 'trans' | 'phonetic'> = {
  word: 'name',
  单词: 'name',
  英文: 'name',
  单词本: 'name',
  trans: 'trans',
  translation: 'trans',
  释义: 'trans',
  翻译: 'trans',
  中文: 'trans',
  中文释义: 'trans',
  phonetic: 'phonetic',
  音标: 'phonetic',
  usphone: 'phonetic',
  ukphone: 'phonetic',
  美音: 'phonetic',
  英音: 'phonetic',
}

function normalizeTrans(raw: unknown): string[] {
  if (typeof raw !== 'string') return typeof raw === 'number' ? [String(raw)] : []
  return raw
    .split(/[；;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function rowsToWords(rows: unknown[][], hasHeader: boolean, opts: ParseOptions): { words: Word[]; skipped: number } {
  let nameCol = 0
  let transCol = 1
  let phoneticCol = 2
  let startRow = 0

  if (rows.length > 0) {
    const first = rows[0].map((c) => String(c ?? '').trim().toLowerCase())
    const mapped = first.map((c) => HEADER_MAP[c])
    if (mapped.filter(Boolean).length >= 2) {
      // 表头行：按表头定位列
      hasHeader = true
      startRow = 1
      nameCol = mapped.findIndex((m) => m === 'name')
      transCol = mapped.findIndex((m) => m === 'trans')
      phoneticCol = mapped.findIndex((m) => m === 'phonetic')
      if (transCol === -1) transCol = 1
    }
  }
  if (!hasHeader) {
    nameCol = 0
    transCol = 1
    phoneticCol = 2
  }

  const words: Word[] = []
  let skipped = 0
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    const name = String(row[nameCol] ?? '').trim()
    if (!name) {
      skipped++
      continue
    }
    const transRaw = transCol >= 0 ? row[transCol] : ''
    const phonetic = phoneticCol >= 0 ? String(row[phoneticCol] ?? '').trim() : ''
    const trans = normalizeTrans(transRaw)
    if (trans.length > 0 || phonetic) {
      // 通道 B：释义/音标文件自带，缺失字段再查 ECDICT 兜底
      const hit = opts.ecdictFailed ? null : enrichPlainWord(name)
      words.push({
        name,
        trans: trans.length > 0 ? trans : (hit?.trans ?? []),
        usphone: phonetic || (hit?.usphone ?? ''),
        ukphone: phonetic || (hit?.ukphone ?? ''),
      })
    } else {
      // 纯词行（无释义列）：通道 A 语义
      words.push(opts.ecdictFailed ? { name, trans: [], usphone: '', ukphone: '' } : enrichPlainWord(name))
    }
  }
  return { words, skipped }
}

/** 解析 txt：每行一个单词（# 注释、空行跳过），ECDICT 补全 */
function parseTxt(text: string, opts: ParseOptions): ParseResult {
  const words: Word[] = []
  let skipped = 0
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\uFEFF/g, '').trim()
    if (!line || line.startsWith('#')) continue
    if (/[\u4e00-\u9fff]/.test(line)) {
      // 含中文 → 不是纯单词行，按「单词+分隔符+释义」解析（txt 也容忍释义列）
      const m = line.match(/^([a-zA-Z][a-zA-Z'\-·\s.]*?)\s*[：:，,=\t]\s*(.+)$/)
      if (m) {
        const hit = opts.ecdictFailed ? null : enrichPlainWord(m[1].trim())
        const manual = normalizeTrans(m[2])
        words.push({
          name: m[1].trim(),
          trans: manual.length > 0 ? manual : (hit?.trans ?? []),
          usphone: hit?.usphone ?? '',
          ukphone: hit?.ukphone ?? '',
        })
        continue
      }
    }
    words.push(opts.ecdictFailed ? { name: line, trans: [], usphone: '', ukphone: '' } : enrichPlainWord(line))
  }
  return { words, channel: 'plain', skipped }
}

/** 解析 csv / xlsx：首表 → 行数组 → 表头映射/列序兜底 */
async function parseTable(buffer: ArrayBuffer, isCsv: boolean, opts: ParseOptions): Promise<ParseResult> {
  const XLSX = await import('xlsx')
  const wb = isCsv ? XLSX.read(new TextDecoder('utf-8').decode(buffer), { type: 'string', raw: false }) : XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return { words: [], channel: 'table', skipped: 0 }
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, blankrows: false, defval: '' })
  const { words, skipped } = rowsToWords(rows, false, opts)
  return { words, channel: 'table', skipped }
}

export type DictFileParseErrorType = 'empty' | 'too-large' | 'unreadable'

export class DictFileParseError extends Error {
  type: DictFileParseErrorType
  constructor(type: DictFileParseErrorType, message: string) {
    super(message)
    this.type = type
  }
}

/** 解析入口：校验大小 → 按扩展名分发 → 词数上限校验 */
export async function parseDictFile(file: File, opts: ParseOptions = {}): Promise<ParseResult> {
  if (file.size > 2 * 1024 * 1024) {
    throw new DictFileParseError('too-large', '文件超过 2MB 上限')
  }
  const name = file.name.toLowerCase()
  let result: ParseResult
  try {
    if (name.endsWith('.txt') || file.type === 'text/plain') {
      result = parseTxt(await file.text(), opts)
    } else if (name.endsWith('.csv')) {
      result = await parseTable(await file.arrayBuffer(), true, opts)
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      result = await parseTable(await file.arrayBuffer(), false, opts)
    } else {
      throw new DictFileParseError('unreadable', '仅支持 .txt / .csv / .xlsx 文件')
    }
  } catch (e) {
    if (e instanceof DictFileParseError) throw e
    throw new DictFileParseError('unreadable', '文件解析失败，请检查文件格式')
  }
  if (result.words.length === 0) {
    throw new DictFileParseError('empty', '未识别到有效单词，请检查文件格式')
  }
  if (result.words.length > USER_DICT_MAX_WORDS) {
    throw new DictFileParseError('too-large', `单词数超过 ${USER_DICT_MAX_WORDS} 上限（当前 ${result.words.length}）`)
  }
  return result
}

/** 预览统计：未收录（无释义）与书内重复数（红线 C2 展示口径） */
export function previewStats(words: Word[]): { total: number; noTrans: number; dup: number } {
  const seen = new Set<string>()
  let dup = 0
  let noTrans = 0
  for (const w of words) {
    const key = w.name.toLowerCase()
    if (seen.has(key)) dup++
    seen.add(key)
    if (w.trans.length === 0) noTrans++
  }
  return { total: words.length, noTrans, dup }
}

/** 导出文件下载（红线 C9：CSV 带 BOM，文件名含词书名与日期） */
export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
