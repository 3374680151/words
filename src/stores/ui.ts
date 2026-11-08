import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { Component } from 'vue'

export type InfoPanelType = 'donate' | 'vsc' | 'community' | 'redBook'

/**
 * 全局 UI 状态（对应原项目 infoPanelStateAtom 等，非持久化）
 * activeDialogCount：Dialog 打开计数——页面级 Enter/Esc 热键在 Dialog 打开时禁用（修复原项目冒泡冲突）
 */
export const useUiStore = defineStore('ui', () => {
  const infoPanelState = reactive<Record<InfoPanelType, boolean>>({
    donate: false,
    vsc: false,
    community: false,
    redBook: false,
  })

  function openInfoPanel(type: InfoPanelType) {
    infoPanelState[type] = true
  }
  function closeInfoPanel(type: InfoPanelType) {
    infoPanelState[type] = false
  }

  // 🆕 P1-8：设置弹窗记忆上次 Tab（会话级）
  const lastSettingTab = ref('sound')

  const activeDialogCount = reactive(new Set<string>())
  function dialogMounted(id: string) {
    activeDialogCount.add(id)
  }
  function dialogUnmounted(id: string) {
    activeDialogCount.delete(id)
  }
  function hasOpenDialog() {
    return activeDialogCount.size > 0
  }

  // Dialog 实例唯一 id（P0-H 计数守卫用，模块级自增）
  let dialogSeq = 0
  function nextDialogId() {
    return `dialog-${++dialogSeq}`
  }

  return { infoPanelState, openInfoPanel, closeInfoPanel, activeDialogCount, dialogMounted, dialogUnmounted, hasOpenDialog, nextDialogId, lastSettingTab }
})

export interface ToastOptions {
  description?: string
  duration?: number
}

// toast 统一出口（vue-sonner；调用方只 import 这里，方便未来整体替换）
export type ToastPayload = string | { title: string; description?: string }

function normalize(payload: ToastPayload) {
  return typeof payload === 'string' ? { title: payload } : payload
}

// 由 App.vue 挂载 <Toaster> 后注入实现（避免 store 直接依赖组件库）
let impl: {
  success: (p: { title: string; description?: string }, o?: ToastOptions) => void
  error: (p: { title: string; description?: string }, o?: ToastOptions) => void
  info: (p: { title: string; description?: string }, o?: ToastOptions) => void
  persistent: (p: { title: string; description?: string }) => void
} | null = null

export function registerToastImpl(i: typeof impl) {
  impl = i
}

export function toastSuccess(payload: ToastPayload, opts?: ToastOptions) {
  impl?.success(normalize(payload), opts)
}
export function toastError(payload: ToastPayload, opts?: ToastOptions) {
  impl?.error(normalize(payload), opts)
}
export function toastInfo(payload: ToastPayload, opts?: ToastOptions) {
  impl?.info(normalize(payload), opts)
}
/** destructive 常驻（如输入法提示），需手动关闭 */
export function toastPersistent(payload: ToastPayload) {
  impl?.persistent(normalize(payload))
}

export type { Component }
