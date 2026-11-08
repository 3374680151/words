<script setup lang="ts">
import { ref } from 'vue'

import AppProgress from '@/components/ui/AppProgress.vue'
import AppAlertDialog from '@/components/ui/AppAlertDialog.vue'
import { exportDatabase, importDatabaseFile, type ExportProgress, type ImportProgress } from '@/utils/db/data-export'
import { toastSuccess, toastError } from '@/stores/ui'

// 平移自原项目 DataSetting：导出 gzip + 导入覆盖
// 🆕 P0-1：成功/失败 Toast；P0-10：导入前二次确认（明示覆盖）+ 解压失败保护
const styles = {
  tabContent: 'flex w-full select-none flex-col items-start justify-start gap-10 overflow-y-auto pb-40 pl-6 pr-9 pt-8',
  section: 'flex w-full flex-col items-start gap-4',
  sectionLabel: 'pb-0 text-xl font-medium text-gray-600',
  sectionDescription: '-mt-1 pl-4 text-left text-xs font-normal leading-tight text-gray-600',
}

const exportProgress = ref(0)
const isExporting = ref(false)
const importProgress = ref(0)
const isImporting = ref(false)
const confirmOpen = ref(false)
const pendingFile = ref<File | null>(null)

function exportProgressCallback({ totalRows, completedRows, done }: ExportProgress) {
  if (done) {
    isExporting.value = false
    exportProgress.value = 100
    toastSuccess('导出成功，文件已保存', { duration: 2500 })
    return true
  }
  if (totalRows) exportProgress.value = Math.floor((completedRows / totalRows) * 100)
  return true
}

function importProgressCallback({ totalRows, completedRows, done }: ImportProgress) {
  if (done) {
    isImporting.value = false
    importProgress.value = 100
    toastSuccess('导入成功', { duration: 2500 })
    return true
  }
  if (totalRows) importProgress.value = Math.floor((completedRows / totalRows) * 100)
  return true
}

async function onClickExport() {
  exportProgress.value = 0
  isExporting.value = true
  try {
    await exportDatabase(exportProgressCallback)
  } catch (e) {
    isExporting.value = false
    toastError('导出失败，请重试')
    console.error(e)
  }
}

// 🆕 P0-10：导入选文件 → 确认弹窗 → 才执行覆盖
function onClickImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/gzip,.gz'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return
    pendingFile.value = file
    confirmOpen.value = true
  })
  input.click()
}

async function onConfirmImport() {
  const file = pendingFile.value
  if (!file) return
  importProgress.value = 0
  isImporting.value = true
  confirmOpen.value = false
  try {
    await importDatabaseFile(file, importProgressCallback)
  } catch (e) {
    // 🆕 解压失败/坏文件：不覆盖数据
    isImporting.value = false
    importProgress.value = 0
    toastError('导入失败：文件无法解析，未修改任何数据')
    console.error(e)
  } finally {
    pendingFile.value = null
  }
}
</script>

<template>
  <div :class="styles.tabContent">
    <!-- 数据导出 -->
    <div :class="styles.section">
      <span :class="styles.sectionLabel">数据导出</span>
      <span :class="styles.sectionDescription">
        目前，用户的练习数据<strong>仅保存在本地</strong>。如果您需要在不同的设备、浏览器或者其他非官方部署上使用 Qwerty Learner，
        您需要手动进行数据同步和保存。为了保留您的练习进度，以及使用近期即将上线的数据分析和智能训练功能，
        我们建议您及时备份您的数据。
      </span>
      <span class="pl-4 text-left text-sm font-bold leading-tight text-red-500">为了您的数据安全，请不要修改导出的数据文件。</span>
      <div class="flex h-3 w-full items-center justify-start px-5">
        <AppProgress :value="exportProgress" />
        <span class="ml-4 w-10 text-xs font-normal text-gray-600">{{ exportProgress }}%</span>
      </div>
      <button class="my-btn-primary ml-4 disabled:bg-gray-300" type="button" :disabled="isExporting" title="导出数据" @click="onClickExport">
        导出数据
      </button>
    </div>

    <!-- 数据导入 -->
    <div :class="styles.section">
      <span :class="styles.sectionLabel">数据导入</span>
      <span :class="styles.sectionDescription">
        请注意，导入数据将<strong class="text-sm font-bold text-red-500"> 完全覆盖 </strong>当前数据。请谨慎操作。
      </span>
      <div class="flex h-3 w-full items-center justify-start px-5">
        <AppProgress :value="importProgress" />
        <span class="ml-4 w-10 text-xs font-normal text-gray-600">{{ importProgress }}%</span>
      </div>
      <button class="my-btn-primary ml-4 disabled:bg-gray-300" type="button" :disabled="isImporting" title="导入数据" @click="onClickImport">
        导入数据
      </button>
    </div>

    <!-- 🆕 导入确认 -->
    <AppAlertDialog
      :open="confirmOpen"
      title="确认导入数据"
      description="导入将清空并覆盖当前全部练习记录（含单词/章节/复习记录）。此操作不可恢复，确定继续吗？"
      confirm-text="覆盖导入"
      :confirm-loading="isImporting"
      @update:open="(v: unknown) => (confirmOpen = !!v)"
      @confirm="onConfirmImport"
    />
  </div>
</template>
