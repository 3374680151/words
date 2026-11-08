import type { Word } from '@/types'
import type { IUserDict } from './record'
import { db } from './index'

/**
 * 自定义词书服务层（06 规划 C0/C1）
 * - 词书 CRUD（事务写入防半本词书，红线 C5）
 * - ECDICT 精简反查：懒加载 JSON → IndexedDB ecdictCache 常驻（红线 C10）
 * - 导出 CSV/JSON（红线 C9）
 */

export const USER_DICT_PREFIX = 'user_'
/** 导入上限（红线 C4）：单文件 ≤2MB、单书 ≤5000 词 */
export const USER_DICT_MAX_WORDS = 5000
export const USER_DICT_MAX_FILE_SIZE = 2 * 1024 * 1024

export function isCustomDictId(id: string): boolean {
  return id.startsWith(USER_DICT_PREFIX)
}

export async function listUserDicts(): Promise<IUserDict[]> {
  return db.userDicts.orderBy('createdAt').toArray()
}

export async function getUserDict(id: string): Promise<IUserDict | undefined> {
  return db.userDicts.get(id)
}

/** 重名自动加后缀 (2)/(3)…（红线 C3），返回最终使用的名称 */
export async function dedupeDictName(name: string): Promise<string> {
  const existing = new Set((await listUserDicts()).map((d) => d.name))
  if (!existing.has(name)) return name
  let i = 2
  while (existing.has(`${name} (${i})`)) i++
  return `${name} (${i})`
}

/** 导入词书：同书内按单词去重（保留首个，红线 C2），事务写入 */
export async function importUserDict(name: string, rawWords: Word[]): Promise<IUserDict> {
  const seen = new Set<string>()
  const words: Word[] = []
  for (const w of rawWords) {
    const key = w.name.trim()
    if (!key || seen.has(key.toLowerCase())) continue
    seen.add(key.toLowerCase())
    words.push({ ...w, name: key })
  }
  const now = Math.floor(Date.now() / 1000)
  const dict: IUserDict = {
    id: `${USER_DICT_PREFIX}${Date.now()}`,
    name: await dedupeDictName(name),
    description: `自定义词书 · ${words.length} 词`,
    words,
    createdAt: now,
    updatedAt: now,
  }
  await db.transaction('rw', db.userDicts, async () => {
    await db.userDicts.put(dict)
  })
  return dict
}

/** 删除词书本体（练习记录/错题按 C8 约定保留） */
export async function deleteUserDict(id: string): Promise<void> {
  await db.userDicts.delete(id)
}

export async function updateUserDict(dict: IUserDict): Promise<void> {
  await db.userDicts.put({ ...dict, updatedAt: Math.floor(Date.now() / 1000) })
}

// —— ECDICT 反查 ——

type EcdictEntry = { phonetic: string; translation: string }
const memoryEcdict = new Map<string, EcdictEntry>()

/** 首次调用懒加载精简 JSON（public/dicts，fetch 不进主包）并落 IDB 常驻；后续直接读 IDB。失败抛出（调用方降级为全部未收录，红线 C10） */
export async function ensureEcdictCache(): Promise<void> {
  if (memoryEcdict.size > 0) return
  const count = await db.ecdictCache.count()
  if (count > 0) {
    await db.ecdictCache.each((e) => memoryEcdict.set(e.word, { phonetic: e.phonetic, translation: e.translation }))
    return
  }
  const res = await fetch(`${import.meta.env.BASE_URL}dicts/ecdict-mini.json`)
  if (!res.ok) throw new Error(`ECDICT 精简库加载失败：${res.status}`)
  const data = (await res.json()) as Record<string, [string, string]>
  await db.transaction('rw', db.ecdictCache, async () => {
    const batch: { word: string; phonetic: string; translation: string }[] = []
    for (const [word, [phonetic, translation]] of Object.entries(data)) {
      batch.push({ word, phonetic, translation })
      memoryEcdict.set(word, { phonetic, translation })
    }
    await db.ecdictCache.bulkPut(batch)
  })
}

/** 反查：精确匹配 → 小写兜底；未收录返回 null。ensureEcdictCache 之前调用返回 null（视为未收录） */
export function lookupEcdict(word: string): EcdictEntry | null {
  const hit = memoryEcdict.get(word) ?? memoryEcdict.get(word.toLowerCase())
  return hit ?? null
}

/** 把纯单词文本补全为内部 Word 结构（通道 A：ECDICT 反查；未收录则释义留空待内联补写） */
export function enrichPlainWord(text: string): Word {
  const hit = lookupEcdict(text)
  return {
    name: text,
    trans: hit ? hit.translation.split('\\n') : [],
    usphone: hit?.phonetic ?? '',
    ukphone: hit?.phonetic ?? '',
  }
}

// —— 导出（红线 C9）——

export function userDictToCsv(dict: IUserDict): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const lines = ['word,trans,usphone,ukphone']
  for (const w of dict.words) {
    lines.push([esc(w.name), esc(w.trans.join('；')), esc(w.usphone), esc(w.ukphone)].join(','))
  }
  // BOM：Excel 识别 UTF-8 中文
  return `\uFEFF${lines.join('\n')}`
}

export function userDictToJson(dict: IUserDict): string {
  return JSON.stringify({ name: dict.name, words: dict.words }, null, 2)
}
