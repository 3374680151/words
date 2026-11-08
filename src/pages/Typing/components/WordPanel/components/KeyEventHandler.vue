<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { isChineseSymbol, isLegal } from '@/utils'
import { useTypingStore } from '@/stores/typing'
import { toastPersistent } from '@/stores/ui'

// 平移自原项目 KeyEventHandler：window keydown 逐键捕获（isTyping 时挂载）
// 升级：中文输入法检测 alert → 常驻 destructive Toast（可点击关闭，不打断）
const props = defineProps<{
  updateInput: (updateObj: { type: 'add' | 'delete' | 'composition'; value?: string; event?: Event }) => void
}>()

const typing = useTypingStore()
let inputMethodToastShown = false

function onKeydown(e: KeyboardEvent): void {
  const char = e.key

  if (isChineseSymbol(char)) {
    if (!inputMethodToastShown) {
      toastPersistent('您正在使用输入法，请关闭输入法。')
      inputMethodToastShown = true
      setTimeout(() => (inputMethodToastShown = false), 10000)
    }
    return
  }

  if (isLegal(char) && !e.altKey && !e.ctrlKey && !e.metaKey) {
    props.updateInput({ type: 'add', value: char, event: e })
  }
}

watch(
  () => typing.state.isTyping,
  (isTyping) => {
    if (isTyping) {
      window.addEventListener('keydown', onKeydown)
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <span class="hidden" aria-hidden="true"></span>
</template>
