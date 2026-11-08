import { watch, onUnmounted, type Ref } from 'vue'

export interface HotkeyOptions {
  /** keydown（默认）或 keyup 触发 */
  keyup?: boolean
  preventDefault?: boolean
  /** 阻止事件继续冒泡（原版 ResultScreen Space 的 Firefox 修复，红线 22） */
  stopPropagation?: boolean
  /** 表单元素聚焦时是否仍生效（原 react-hotkeys-hook 语义） */
  enableOnFormTags?: boolean
  /** 是否启用（响应式） */
  enabled?: Ref<boolean>
}

const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function keyMatches(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.split('+').map((p) => p.trim().toLowerCase())
  const key = parts[parts.length - 1]
  const needCtrl = parts.includes('ctrl') || parts.includes('control')
  const needShift = parts.includes('shift')
  const needAlt = parts.includes('alt')

  if (needCtrl !== (e.ctrlKey || e.metaKey)) return false
  if (needShift && !e.shiftKey) return false
  if (needAlt && !e.altKey) return false

  const eKey = e.key.toLowerCase()
  return (
    eKey === key ||
    (key === 'esc' && eKey === 'escape') ||
    (key === 'arrowleft' && eKey === 'arrowleft') ||
    (key === 'arrowright' && eKey === 'arrowright')
  )
}

/**
 * 快捷键绑定（替代 react-hotkeys-hook）：
 * - 组件作用域自动解绑
 * - 支持 keydown/keyup（Tab 按住显示答案需要配对）
 * - enabled 响应式开关 + Dialog 守卫（配合 ui store 的 hasOpenDialog 由调用方组合）
 */
export function useHotkeys(keys: string, handler: (e: KeyboardEvent) => void, options?: HotkeyOptions): void {
  const comboList = keys.split(',').map((k) => k.trim()).filter(Boolean)
  const useKeyup = options?.keyup ?? false
  const prevent = options?.preventDefault ?? true
  const formOk = options?.enableOnFormTags ?? false

  function onKey(e: KeyboardEvent): void {
    if (options?.enabled && !options.enabled.value) return
    if (!formOk && FORM_TAGS.has((e.target as HTMLElement)?.tagName)) return
    const hit = comboList.some((combo) => keyMatches(e, combo))
    if (!hit) return
    if (prevent) e.preventDefault()
    if (options?.stopPropagation) e.stopPropagation()
    handler(e)
  }

  const eventName = useKeyup ? 'keyup' : 'keydown'
  window.addEventListener(eventName, onKey)

  // enabled 变化不需要重新挂载（内部判断），仅提供解绑时机
  if (options?.enabled) {
    const stop = watch(options.enabled, () => {
      /* noop: 判定在 onKey 内做响应式判断 */
    })
    onUnmounted(stop)
  }

  onUnmounted(() => {
    window.removeEventListener(eventName, onKey)
  })
}
