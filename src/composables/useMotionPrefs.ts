import { reactive, computed } from 'vue'

// 动效偏好（三重判定）：用户开关 × prefers-reduced-motion × 硬件分级
// 工单 2A 后与 config store 的 fxConfig 合流，此处为模块级先行实现
const STORAGE_KEY = 'fxConfig'

function loadFxConfig(): { ambient: boolean; cursorFx: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ambient: parsed?.ambient !== false, cursorFx: parsed?.cursorFx === true }
    }
  } catch {
    /* ignore */
  }
  return { ambient: true, cursorFx: false }
}

const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const hwOk = (navigator.hardwareConcurrency ?? 4) >= 4

interface MotionPrefsState {
  ambient: boolean
  cursorFx: boolean
  systemReduced: boolean
  hwOk: boolean
}

export const motionPrefs = reactive<MotionPrefsState>({ ...loadFxConfig(), systemReduced, hwOk })

export const motionEnabled = computed(
  () => motionPrefs.ambient && !motionPrefs.systemReduced && motionPrefs.hwOk,
)

export function setFxConfig(patch: Partial<{ ambient: boolean; cursorFx: boolean }>) {
  Object.assign(motionPrefs, patch)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ambient: motionPrefs.ambient, cursorFx: motionPrefs.cursorFx }))
}

// dev 调试探针（fx-lab 目检用）
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__motionDebug = { motionPrefs, motionEnabled }
}
