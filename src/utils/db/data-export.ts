import { db } from '.'
import { getCurrentDate } from '@/utils'

// 平移自原项目 data-export.ts（去掉埋点；导入改为返回式 API 以便挂确认弹窗与错误 Toast）
export type ExportProgress = {
  totalRows?: number
  completedRows: number
  done: boolean
}

export type ImportProgress = {
  totalRows?: number
  completedRows: number
  done: boolean
}

export async function exportDatabase(callback: (exportProgress: ExportProgress) => boolean): Promise<{ size: number }> {
  const [pako, { saveAs }] = await Promise.all([import('pako'), import('file-saver'), import('dexie-export-import')])

  const blob = await db.export({
    progressCallback: ({ totalRows, completedRows, done }) => {
      return callback({ totalRows, completedRows, done })
    },
  })

  const json = await blob.text()
  const compressed = pako.gzip(json)
  const compressedBlob = new Blob([compressed])
  const currentDate = getCurrentDate()
  saveAs(compressedBlob, `Qwerty-Learner-User-Data-${currentDate}.gz`)
  return { size: compressedBlob.size }
}

export async function importDatabaseFile(file: File, callback: (importProgress: ImportProgress) => boolean): Promise<void> {
  const [pako] = await Promise.all([import('pako'), import('dexie-export-import')])

  const compressed = await file.arrayBuffer()
  const json = pako.ungzip(compressed, { to: 'string' })
  const blob = new Blob([json])

  await db.import(blob, {
    acceptVersionDiff: true,
    acceptMissingTables: true,
    acceptNameDiff: false,
    acceptChangedPrimaryKey: false,
    overwriteValues: true,
    clearTablesBeforeImport: true,
    progressCallback: ({ totalRows, completedRows, done }) => {
      return callback({ totalRows, completedRows, done })
    },
  })
}
