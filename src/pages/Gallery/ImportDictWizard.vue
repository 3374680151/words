<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import IconUpload from '~icons/tabler/upload'
import IconFileText from '~icons/tabler/file-text'
import IconAlert from '~icons/tabler/alert-triangle'
import AppDialog from '@/components/ui/AppDialog.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import { toastError, toastSuccess } from '@/stores/ui'
import { importUserDict, USER_DICT_MAX_WORDS } from '@/utils/db/user-dict'
import { DictFileParseError, parseDictFile, previewStats } from '@/utils/dict-import'
import type { Word } from '@/types'
import { useDictStore } from '@/stores/dict'

// 导入向导（06 规划 C1 / 4.1 节九态）：三步式 选择文件 → 识别预览（内联补释义）→ 命名确认
// 红线：C1 任意步骤可关不落库；C4 空文件/超限明确报错；C10 ECDICT 失败降级不阻塞

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [v: boolean] }>()

const dictStore = useDictStore()

type Step = 'select' | 'preview' | 'confirm'
const step = ref<Step>('select')
const fileName = ref('')
const parsing = ref(false)
const ecdictLoading = ref(false)
const ecdictFailed = ref(false)
const parseError = ref('')
const words = ref<Word[]>([])
const stats = computed(() => previewStats(words.value))
const dictName = ref('')
const importing = ref(false)
const lastSubmitAt = ref(0)

const previewRows = computed(() => words.value.slice(0, 50))

function reset() {
  step.value = 'select'
  fileName.value = ''
  parsing.value = false
  ecdictLoading.value = false
  ecdictFailed.value = false
  parseError.value = ''
  words.value = []
  dictName.value = ''
  importing.value = false
}

watch(
  () => props.open,
  (open) => {
    if (open) reset()
  },
)

// —— Step 1：选择文件 ——

async function handleFile(file: File) {
  parseError.value = ''
  parsing.value = true
  fileName.value = file.name
  try {
    // ECDICT 首次懒加载（进度区分：加载反查库 ≠ 解析文件）
    ecdictLoading.value = true
    const { ensureEcdictCache } = await import('@/utils/db/user-dict')
    try {
      await ensureEcdictCache()
      ecdictFailed.value = false
    } catch {
      ecdictFailed.value = true // 降级：纯词不补释义（红线 C10），表格通道不受影响
    } finally {
      ecdictLoading.value = false
    }
    const result = await parseDictFile(file, { ecdictFailed: ecdictFailed.value })
    words.value = result.words
    // 默认名取文件名去扩展名
    dictName.value = file.name.replace(/\.(txt|csv|xlsx|xls)$/i, '').trim() || '我的词书'
    step.value = 'preview'
  } catch (e) {
    if (e instanceof DictFileParseError) {
      parseError.value = e.message
      toastError(e.message)
    } else {
      parseError.value = '文件解析失败，请检查文件格式'
      toastError(parseError.value)
    }
  } finally {
    parsing.value = false
  }
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void handleFile(file)
  input.value = ''
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) void handleFile(file)
}

// —— Step 2：预览内联补释义 ——

function editTrans(word: Word, value: string) {
  word.trans = value
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// —— Step 3：确认导入 ——

async function confirmImport() {
  // 防连点 200ms（对齐结果页防抖口径）
  const now = Date.now()
  if (importing.value || now - lastSubmitAt.value < 200) return
  lastSubmitAt.value = now
  const name = dictName.value.trim()
  if (!name) {
    toastError('请输入词书名称')
    return
  }
  importing.value = true
  try {
    const dict = await importUserDict(name, words.value)
    await dictStore.reloadCustomDicts()
    toastSuccess(`《${dict.name}》导入成功，共 ${dict.words.length} 词`)
    emit('update:open', false)
  } catch (e) {
    console.error('导入词书失败', e)
    toastError('导入失败，请重试（未产生任何数据变更）')
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <!-- persistent：提交中阻断遮罩/Esc 关闭（防连点与半途态）；其余步骤可任意关闭（红线 C1） -->
  <AppDialog :open="props.open" :persistent="importing" content-class="w-[42rem] max-w-[92vw]" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6 text-gray-800 dark:text-gray-200">
        <h3 class="text-xl font-bold">导入自定义词书</h3>

        <!-- 步骤指示 -->
        <div class="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <span v-for="(label, i) in ['选择文件', '识别预览', '确认导入']" :key="label" class="flex items-center gap-2">
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
              :class="[step === ['select', 'preview', 'confirm'][i] ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700']"
            >
              {{ i + 1 }}
            </span>
            {{ label }}
            <span v-if="i < 2" class="mx-1 text-gray-300">—</span>
          </span>
        </div>

        <!-- Step 1：选择文件 -->
        <div v-if="step === 'select'" class="mt-5">
          <label
            class="flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-gray-600 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/10"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <IconUpload class="h-10 w-10 text-gray-400" />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">拖拽文件到此处，或点击选择</p>
            <p class="mt-1 text-xs text-gray-400">
              .txt（每行一个单词，# 为注释） · .csv / .xlsx（单词, 释义, 音标 可选） · ≤2MB · ≤{{ USER_DICT_MAX_WORDS }} 词
            </p>
            <input type="file" accept=".txt,.csv,.xlsx,.xls,text/plain" class="hidden" @change="onFileInput" />
          </label>
          <div v-if="parsing" class="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            {{ ecdictLoading ? '首次加载释义反查库（约 3.5MB，仅此一次）…' : `正在解析 ${fileName} …` }}
          </div>
          <p v-if="parseError" class="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {{ parseError }}
          </p>
        </div>

        <!-- Step 2：识别预览 -->
        <div v-else-if="step === 'preview'" class="mt-5">
          <div class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-sm dark:bg-gray-800">
            <span class="flex items-center gap-1.5"><IconFileText class="h-4 w-4 text-gray-400" />{{ fileName }}</span>
            <span class="text-gray-500">
              识别 <b class="text-indigo-500">{{ stats.total }}</b> 词
              <template v-if="stats.noTrans"> · 未收录 <b class="text-orange-500">{{ stats.noTrans }}</b></template>
              <template v-if="stats.dup"> · 去重 <b class="text-gray-400">{{ stats.dup }}</b></template>
            </span>
          </div>

          <div
            v-if="ecdictFailed || stats.noTrans > 0"
            class="mt-3 flex items-start gap-2 rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
          >
            <IconAlert class="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <template v-if="ecdictFailed">释义反查库加载失败，已降级为不补全释义（不影响文件自带释义）。</template>
              <template v-else>以下未收录单词缺释义，可直接在表格中补写（多个释义用「；」分隔），留空则练习时释义区显示“—”。</template>
            </span>
          </div>

          <div class="mt-3 max-h-72 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
            <table class="w-full text-left text-sm">
              <thead class="sticky top-0 bg-gray-50 text-xs text-gray-500 dark:bg-gray-800">
                <tr>
                  <th class="px-3 py-2 font-normal">#</th>
                  <th class="px-3 py-2 font-normal">单词</th>
                  <th class="px-3 py-2 font-normal">释义（可编辑）</th>
                  <th class="px-3 py-2 font-normal">音标</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(w, i) in previewRows" :key="w.name" class="border-t border-gray-50 dark:border-gray-700/50">
                  <td class="px-3 py-1.5 text-xs text-gray-400">{{ i + 1 }}</td>
                  <td class="px-3 py-1.5 font-mono">{{ w.name }}</td>
                  <td class="px-3 py-1.5">
                    <input
                      :value="w.trans.join('；')"
                      placeholder="—"
                      class="w-full rounded border border-transparent bg-transparent px-1.5 py-0.5 text-sm hover:border-gray-200 focus:border-indigo-400 focus:outline-none dark:hover:border-gray-600"
                      @input="editTrans(w, ($event.target as HTMLInputElement).value)"
                    />
                  </td>
                  <td class="px-3 py-1.5 font-mono text-xs text-gray-400">{{ w.usphone || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="words.length > 50" class="px-3 py-2 text-xs text-gray-400">仅预览前 50 条，其余 {{ words.length - 50 }} 条将按同样规则导入</p>
          </div>

          <div class="mt-4 flex justify-between">
            <button class="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" type="button" @click="step = 'select'">上一步</button>
            <button class="my-btn-primary" type="button" @click="step = 'confirm'">下一步：命名</button>
          </div>
        </div>

        <!-- Step 3：确认导入 -->
        <div v-else class="mt-5">
          <label class="text-sm text-gray-500">词书名称</label>
          <input
            v-model="dictName"
            type="text"
            maxlength="40"
            class="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
            placeholder="如：我的生词本"
          />
          <p class="mt-2 text-xs text-gray-400">
            将导入 <b class="text-indigo-500">{{ stats.total }}</b> 个单词（约 {{ Math.ceil(stats.total / 20) }} 章，每章 20 词），重名自动追加后缀。
          </p>
          <AppProgress v-if="importing" class="mt-3" :value="100" :indicator-class="'bg-indigo-400 animate-pulse'" />
          <div class="mt-5 flex justify-between">
            <button
              class="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              type="button"
              :disabled="importing"
              @click="step = 'preview'"
            >
              上一步
            </button>
            <button class="my-btn-primary" type="button" :disabled="importing || !dictName.trim()" @click="confirmImport">
              {{ importing ? '导入中…' : '确认导入' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </AppDialog>
</template>
