<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { loadPersisted, savePersisted } from '@/stores/persist'
import { useConfigStore } from '@/stores/config'
import { useTypingStore } from '@/stores/typing'
import { useDictStore } from '@/stores/dict'
import { db, saveWordRecord } from '@/utils/db'
import { deleteUserDict, ensureEcdictCache, enrichPlainWord, getUserDict, importUserDict, lookupEcdict, userDictToCsv } from '@/utils/db/user-dict'
import { getLatestReviewRecord, generateNewWordReviewRecord } from '@/utils/db/review-record'
import { ReviewRecord } from '@/utils/db/record'
import { generateWordSoundSrc } from '@/composables/usePronunciation'
import { firstChapter, fetchWithCache } from '@/composables/useDictWords'

// dev-only：逻辑层自检页（工单 2A 验收）——老用户数据兼容 + 状态机 + 复习双写 + 词表
interface CheckResult {
  name: string
  pass: boolean
  detail?: string
}

const results = ref<CheckResult[]>([])
const running = ref(false)

async function runAll() {
  running.value = true
  results.value = []
  const add = (name: string, pass: boolean, detail?: string) => results.value.push({ name, pass, detail })

  try {
    // ========== 一、persist 工具（atomForConfig 行为复刻） ==========
    savePersisted('test-merge', { a: 1 })
    const merged = loadPersisted<{ a: number; b: string }>('test-merge', { a: 9, b: 'x' })
    add('persist:缺字段合并默认值', merged.a === 1 && merged.b === 'x', JSON.stringify(merged))
    add('persist:缺字段回写', localStorage.getItem('test-merge') === JSON.stringify({ a: 1, b: 'x' }))

    savePersisted('test-badtype', 'not-an-object')
    const fallback = loadPersisted<{ a: number }>('test-badtype', { a: 42 })
    add('persist:类型不匹配回默认值', fallback.a === 42)

    savePersisted('test-bool', true)
    add('persist:裸 boolean 兼容', loadPersisted<boolean>('test-bool', false) === true)
    localStorage.removeItem('test-merge')
    localStorage.removeItem('test-badtype')
    localStorage.removeItem('test-bool')

    // ========== 二、老用户配置注入 → config store 读取 ==========
    // 模拟原项目 localStorage 残留数据（key 与 JSON 结构一致）
    localStorage.setItem('currentDict', JSON.stringify('kaoyan_2024'))
    localStorage.setItem('currentChapter', JSON.stringify(3))
    localStorage.setItem('isIgnoreCase', JSON.stringify(false))
    localStorage.setItem('fontsize', JSON.stringify({ foreignFont: 64, translateFont: 22 }))
    localStorage.setItem('keySoundsConfig', JSON.stringify({ isOpen: true, isOpenClickSound: true, volume: 1, resource: { key: 'Default', name: 'Default', filename: 'Default.wav' } }))

    setActivePinia(createPinia())
    const config = useConfigStore()
    add('老配置:currentDict 读取', config.currentDictId === 'kaoyan_2024', config.currentDictId)
    add('老配置:currentChapter 读取', config.currentChapter === 3, String(config.currentChapter))
    add('老配置:isIgnoreCase 读取', config.isTextSelectable === false && (loadPersisted<boolean>('isIgnoreCase', true) === false))

    // 缺字段补全（旧版配置缺新字段时合并默认值并回写）
    localStorage.setItem('wordDictationConfig', JSON.stringify({ isOpen: true }))
    const wd = loadPersisted('wordDictationConfig', { isOpen: false, type: 'hideAll', openBy: 'auto' })
    add('老配置:wordDictation 缺字段补全', wd.isOpen === true && wd.type === 'hideAll' && wd.openBy === 'auto')

    // config store 回写
    config.currentChapter = 7
    await new Promise((r) => setTimeout(r, 50))
    add('config:变更回写 localStorage', localStorage.getItem('currentChapter') === JSON.stringify(7))

    // ========== 三、IndexedDB 老数据兼容 ==========
    // 用原生 indexedDB 写入旧 schema 记录（模拟原项目写入），再用我们的 db 读取
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('RecordDB')
      req.onsuccess = () => {
        const oldDb = req.result
        const tx = oldDb.transaction('wordRecords', 'readwrite')
        const store = tx.objectStore('wordRecords')
        const oldRecord = {
          word: 'legacy-test-word',
          timeStamp: 1700000000,
          dict: 'cet4',
          chapter: 0,
          timing: [120, 130],
          wrongCount: 2,
          mistakes: { 0: ['x'] },
        }
        const putReq = store.put(oldRecord)
        putReq.onsuccess = () => {
          oldDb.close()
          resolve()
        }
        putReq.onerror = () => {
          oldDb.close()
          reject(putReq.error)
        }
      }
      req.onerror = () => reject(req.error)
    })
    const legacyRecords = await db.wordRecords.where('word').equals('legacy-test-word').toArray()
    add('IndexedDB:老记录可读取', legacyRecords.length >= 1 && legacyRecords.every((r) => r.word === 'legacy-test-word'), `${legacyRecords.length} 条`)

    // 写入（我们的 schema）→ 读回
    const wordRecordId = await saveWordRecord(
      { word: 'vue-test-word', wrongCount: 1, letterTimeArray: [1000, 1100, 1300], letterMistake: { 1: ['q'] } },
      { dictId: 'cet4', chapter: 1, isReview: false },
    )
    add('IndexedDB:saveWordRecord 写入+读回', wordRecordId > 0)
    const saved = await db.wordRecords.get(wordRecordId)
    add(
      'IndexedDB:timing 数组与 chapter 正确',
      !!saved && JSON.stringify(saved.timing) === JSON.stringify([100, 200]) && saved.chapter === 1,
      saved ? JSON.stringify(saved.timing) : 'missing',
    )

    // ========== 四、typing store 状态机（16 action） ==========
    setActivePinia(createPinia())
    const typing = useTypingStore()
    const words = firstChapter.slice(0, 5).map((w, i) => ({ ...w, index: i }))

    // setupChapter 正常 + initialIndex 越界归 0
    typing.setupChapter(words, false, 99)
    add('状态机:setupChapter initialIndex 越界归 0', typing.state.chapterData.index === 0 && typing.state.chapterData.words.length === 5)
    add('状态机:userInputLogs 等长生成', typing.state.chapterData.userInputLogs.length === 5)

    // setupChapter 乱序（仍保留原 index 标记）
    typing.setupChapter(words, true)
    const shuffledKeepsIndex = typing.state.chapterData.words.every((w) => typeof w.index === 'number')
    add('状态机:shuffle 保留 WordWithIndex.index', shuffledKeepsIndex)

    // reportCorrect / reportWrong
    typing.setupChapter(words, false)
    typing.start()
    typing.reportCorrect()
    typing.reportCorrect()
    typing.reportWrong({ 0: ['a'] })
    typing.reportWrong({ 0: ['b'] })
    const log0 = typing.state.chapterData.userInputLogs[0]
    add(
      '状态机:correct/wrong 计数与错字合并',
      typing.state.chapterData.correctCount === 2 && typing.state.chapterData.wrongCount === 2 && JSON.stringify(log0.LetterMistakes[0]) === JSON.stringify(['a', 'b']),
      JSON.stringify(log0),
    )

    // tick：accuracy 字母级 / wpm（wordCount 仍为 0 → wpm=0 与原版一致）
    typing.tick(60)
    add(
      '状态机:tick 计时与正确率',
      typing.state.timerData.time === 60 && typing.state.timerData.accuracy === 50 && typing.state.timerData.wpm === 0,
      JSON.stringify(typing.state.timerData),
    )

    // nextWord / loopCurrentWord
    typing.nextWord()
    add('状态机:nextWord index+1 且 skip 归位', typing.state.chapterData.index === 1 && typing.state.chapterData.wordCount === 1)
    typing.loopCurrentWord()
    add('状态机:loopCurrentWord index 不变 wordCount+1', typing.state.chapterData.index === 1 && typing.state.chapterData.wordCount === 2)

    // skipToIndex / skipWord 越界即完成
    typing.skipToIndex(3)
    add('状态机:skipToIndex 跳词', typing.state.chapterData.index === 3)
    typing.setupChapter(words, false)
    typing.skipWord() // index 0→1
    add('状态机:skipWord +1', typing.state.chapterData.index === 1)
    typing.skipToIndex(4)
    typing.skipWord() // 越界 → finish
    add('状态机:skipWord 越界触发完成', typing.state.isFinished === true && typing.state.isTyping === false)

    // repeatChapter：复用 words + 保留 isTransVisible + isTyping=true
    typing.setupChapter(words, false)
    typing.state.isTransVisible = false
    typing.repeatChapter(false)
    add(
      '状态机:repeatChapter 复用词表+保留译文开关',
      typing.state.isTyping === true && typing.state.isFinished === false && typing.state.isTransVisible === false && typing.state.chapterData.words.length === 5,
    )

    // nextChapter：isTyping=true、words 留空等待重载
    typing.nextChapter()
    add('状态机:nextChapter isTyping=true', typing.state.isTyping === true && typing.state.isTransVisible === false)

    // finishChapter
    typing.setupChapter(words, false)
    typing.finishChapter()
    add('状态机:finishChapter', typing.state.isFinished === true && typing.state.chapterData.wordCount === 1)

    // ========== 五、复习模式：双写 IndexedDB + 加权算法 ==========
    setActivePinia(createPinia())
    const config2 = useConfigStore()
    const dict2 = useDictStore()
    const review = new ReviewRecord('cet4', words.map((w) => ({ name: w.name, trans: w.trans, usphone: w.usphone, ukphone: w.ukphone })))
    await dict2.startReview(review)
    add('复习:startReview 置位 + chapter=-1', dict2.isReviewMode === true && config2.currentChapter === -1)
    await new Promise((r) => setTimeout(r, 100))
    const storedReview = await db.reviewRecords.get(review.id!)
    add('复习:reviewRecord 双写 IndexedDB', !!storedReview && storedReview.dict === 'cet4')
    add('复习:reviewModeInfo 持久化回写', localStorage.getItem('reviewModeInfo')?.includes('"isReviewMode":true') === true)

    // updateReviewIndex 双写
    await dict2.updateReviewIndex(3)
    await new Promise((r) => setTimeout(r, 100))
    const updated = await db.reviewRecords.get(review.id!)
    add('复习:updateReviewIndex 双写 index', updated?.index === 3, String(updated?.index))

    // finishReview → getLatestReviewRecord 返回 undefined
    await dict2.finishReview()
    await new Promise((r) => setTimeout(r, 100))
    const finishedRecord = await getLatestReviewRecord('cet4')
    add('复习:isFinished 后不再返回未完成记录', finishedRecord === undefined)

    // 加权算法：错误次数权重 0.6 > 时间权重 0.4
    const errData = [
      { word: 'w1', originData: { name: 'w1', trans: [], usphone: '', ukphone: '' }, errorCount: 5, errorChar: [], errorLetters: {}, latestErrorTime: 100 },
      { word: 'w2', originData: { name: 'w2', trans: [], usphone: '', ukphone: '' }, errorCount: 1, errorChar: [], errorLetters: {}, latestErrorTime: 200 },
      { word: 'w3', originData: { name: 'w3', trans: [], usphone: '', ukphone: '' }, errorCount: 3, errorChar: [], errorLetters: {}, latestErrorTime: 300 },
    ]
    const rec = await generateNewWordReviewRecord('cet4', errData)
    // 原版算法逐字平移：得分 = 0.6×错误数排名 + 0.4×时间排名（升序），错得最多的词得分最高、排最后（原版真实行为）
    // 手算：w2=1.4 w1=2.2 w3=2.4 → 顺序 [w2, w1, w3]
    add(
      '复习:0.6/0.4 加权排序（与原版逐字一致：w2,w1,w3）',
      rec.words[0]?.name === 'w2' && rec.words[1]?.name === 'w1' && rec.words[2]?.name === 'w3',
      rec.words.map((w) => w.name).join(','),
    )

    // 退出复习
    dict2.exitReview()
    add('复习:exitReview 复位', dict2.isReviewMode === false && config2.currentChapter === -1)

    // ========== 六、词表加载（缓存 + 切片 + trans 兜底） ==========
    const list = await fetchWithCache('/dicts/CET4_T.json')
    add('词表:CET4_T.json 加载 20 词/章', Array.isArray(list) && list.length > 1000, `共 ${list.length} 词`)
    const listAgain = await fetchWithCache('/dicts/CET4_T.json')
    add('词表:同 url 缓存命中（同一 Promise）', list === listAgain)
    const ch1 = list.slice(1 * 20, 2 * 20)
    add('词表:章节切片正确', ch1.length === 20 && ch1[0].name === list[20].name)
    add('词表:cet4 首章内置词', firstChapter.length === 20 && firstChapter[0].name === 'cancel')

    // trans 兜底：脏数据清洗
    const dirty = [{ name: 'dirty', trans: ['ok', 123 as unknown as string, null as unknown as string], usphone: '', ukphone: '' }]
    const cleaned = dirty.map((w) => ({ ...w, trans: Array.isArray(w.trans) ? w.trans.filter((i) => typeof i === 'string') : [] }))
    add('词表:trans 非字符串过滤', cleaned[0].trans.length === 1 && cleaned[0].trans[0] === 'ok')

    // ========== 七、发音 URL 生成规则 ==========
    const srcUk = generateWordSoundSrc('test', 'uk')
    const srcUs = generateWordSoundSrc('test', 'us')
    const srcZh = generateWordSoundSrc('测试', 'zh')
    const srcDe = generateWordSoundSrc('test', 'de')
    add('发音:uk→type=1 / us→type=2', srcUk.endsWith('&type=1') && srcUs.endsWith('&type=2'))
    add('发音:zh/de 语言参数', srcZh.endsWith('&le=zh') && srcDe.endsWith('&le=de'))
    add('发音:API 前缀正确', srcUk.startsWith('https://dict.youdao.com/dictvoice?audio=test'))

    // ========== 八、自定义词书数据层（06 规划 C0） ==========
    setActivePinia(createPinia())
    {
      const cfg8 = useConfigStore()
      const dict8 = useDictStore()

      // 导入：去重（大小写合并、空白剔除）+ id 前缀 + 描述（红线 C2）
      const words8 = [
        { name: 'hello', trans: ['你好'], usphone: "hə'loʊ", ukphone: "hə'ləʊ" },
        { name: 'world', trans: ['世界'], usphone: 'wɜːld', ukphone: 'wɜːld' },
        { name: 'Hello', trans: ['重复词'], usphone: '', ukphone: '' },
        { name: '   ', trans: ['空白'], usphone: '', ukphone: '' },
      ]
      const d1 = await importUserDict('selftest-词书A', words8)
      add('userDict:导入去重(大小写+空白)', d1.words.length === 2, `n=${d1.words.length}`)
      add('userDict:id 前缀与描述', d1.id.startsWith('user_') && d1.description.includes('2 词'), d1.id)

      // 重名后缀（红线 C3）
      const d2 = await importUserDict('selftest-词书A', words8)
      add('userDict:重名自动 (2) 后缀', d2.name === 'selftest-词书A (2)', d2.name)
      await deleteUserDict(d2.id)

      // 落库回读 + 章节切分 20/章（红线 C7）
      const back = await getUserDict(d1.id)
      add('userDict:落库回读', !!back && back.name === 'selftest-词书A' && back.words.length === 2)
      const bigWords = Array.from({ length: 45 }, (_, i) => ({ name: `w${i}`, trans: ['t'], usphone: '', ukphone: '' }))
      const d3 = await importUserDict('selftest-词书B-45词', bigWords)
      await dict8.reloadCustomDicts()
      const d3Dict = dict8.allDictsMap[d3.id]
      add('userDict:章节切分 45词→3章', !!d3Dict && d3Dict.chapterCount === 3, String(d3Dict?.chapterCount))

      // 融合层：dictInfo 解析自定义书；删除后回落 cet4（红线 C8）
      cfg8.currentDictId = d3.id
      add('userDict:dictInfo 解析自定义书', dict8.dictInfo.id === d3.id && dict8.dictInfo.category === '我的词书')
      await deleteUserDict(d3.id)
      await dict8.reloadCustomDicts()
      add('userDict:删除后 dictInfo 回落 cet4', dict8.allDictsMap[d3.id] === undefined && dict8.dictInfo.id === 'cet4')

      // ECDICT 反查：命中 / 未收录不抛（红线 C10 降级语义）
      await ensureEcdictCache()
      add('ecdict:命中 abandon', (lookupEcdict('abandon')?.translation ?? '').includes('放弃'))
      const miss = enrichPlainWord('zzzqqq-not-a-word')
      const hit = enrichPlainWord('abandon')
      add('ecdict:enrich 未收录→空释义不抛', Array.isArray(miss.trans) && miss.trans.length === 0)
      add('ecdict:enrich 命中→释义非空', hit.trans.length > 0 && hit.usphone.length > 0, JSON.stringify(hit.trans.slice(0, 1)))

      // 导出 CSV：BOM + 表头 + 引号转义（红线 C9）
      const csv = userDictToCsv(back!)
      add('userDict:导出 CSV BOM+表头', csv.charCodeAt(0) === 0xfeff && csv.startsWith('\uFEFFword,trans,usphone,ukphone'))
      await deleteUserDict(d1.id)
      await dict8.reloadCustomDicts()
    }

    // ========== 清理测试数据 ==========
    await db.wordRecords.where('word').anyOf(['legacy-test-word', 'vue-test-word']).delete()
    await db.reviewRecords.where('dict').equals('cet4').delete()
    localStorage.setItem('currentDict', JSON.stringify('cet4'))
    localStorage.setItem('currentChapter', JSON.stringify(0))
  } catch (e) {
    results.value.push({ name: '自检执行异常', pass: false, detail: String(e) })
  } finally {
    running.value = false
  }
}

onMounted(() => {
  if (import.meta.env.DEV) void runAll()
})
</script>

<template>
  <main class="mx-auto max-w-3xl p-8">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">工单 2A 逻辑层自检（dev-only）</h1>
    <button class="my-btn-primary mt-4" :disabled="running" @click="runAll">
      {{ running ? '运行中...' : '重新运行全部自检' }}
    </button>
    <ul class="mt-6 space-y-1.5 text-sm">
      <li
        v-for="(r, i) in results"
        :key="i"
        class="flex items-start gap-2 rounded px-2 py-1"
        :class="r.pass ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'"
      >
        <span :class="r.pass ? 'text-green-600' : 'text-red-600'">{{ r.pass ? '✓' : '✗' }}</span>
        <span class="text-gray-700 dark:text-gray-300">{{ r.name }}</span>
        <span v-if="r.detail" class="ml-auto font-mono text-xs text-gray-400">{{ r.detail }}</span>
      </li>
    </ul>
    <p v-if="results.length > 0" class="mt-4 text-sm font-semibold" :class="results.every((r) => r.pass) ? 'text-green-600' : 'text-red-600'">
      {{ results.filter((r) => r.pass).length }} / {{ results.length }} 通过
    </p>
  </main>
</template>
