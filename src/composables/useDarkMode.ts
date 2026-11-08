import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'isOpenDarkModeAtom'

/**
 * 深色模式：与原项目行为一致
 * - 存储 boolean（key 与原项目一字不差，老用户数据兼容）
 * - 无显式选择时跟随系统 prefers-color-scheme
 * - 应用 <html class="dark">，配合 index.html 防闪烁脚本
 */
function initial(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw != null) return JSON.parse(raw) === true
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const isDark = ref<boolean>(initial())

let applied = false
function apply() {
  if (applied) return
  applied = true
  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark.value))
    } catch {
      /* ignore */
    }
  })
}

export function useDarkMode() {
  apply()
  return {
    isDark,
    toggle: () => (isDark.value = !isDark.value),
    set: (v: boolean) => (isDark.value = v),
  }
}
