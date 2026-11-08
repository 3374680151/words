<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTypingStore } from '@/stores/typing'
import { toastPersistent } from '@/stores/ui'

// 平移自原项目 TextAreaHandler（code 语言/默认）：隐藏 textarea 捕获，防失焦强制回焦
const props = defineProps<{
  updateInput: (updateObj: { type: 'add' | 'delete' | 'composition'; value?: string; event?: Event }) => void
}>()

const typing = useTypingStore()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
let inputMethodToastShown = false

watch(
  () => typing.state.isTyping,
  (isTyping) => {
    if (!textareaRef.value) return
    if (isTyping) {
      textareaRef.value.focus()
    } else {
      textareaRef.value.blur()
    }
  },
  { immediate: true },
)

function onInput(e: Event) {
  const nativeEvent = e as InputEvent
  const data = nativeEvent.data
  if (!nativeEvent.isComposing && data !== null) {
    props.updateInput({ type: 'add', value: data as string, event: e })
    if (textareaRef.value) {
      textareaRef.value.value = ''
    }
  }
}

function onBlur() {
  // 防失焦（原行为）：仍在打字时强制回焦
  if (!textareaRef.value) return
  if (typing.state.isTyping) {
    textareaRef.value.focus()
  }
}

function onCompositionStart() {
  if (!inputMethodToastShown) {
    toastPersistent('您正在使用输入法，请关闭输入法。')
    inputMethodToastShown = true
    setTimeout(() => (inputMethodToastShown = false), 10000)
  }
}
</script>

<template>
  <textarea
    ref="textareaRef"
    class="absolute left-0 top-0 m-0 h-0 w-0 appearance-none overflow-hidden border-0 p-0 focus:outline-none"
    autofocus
    spellcheck="false"
    @input="onInput"
    @blur="onBlur"
    @compositionstart="onCompositionStart"
  ></textarea>
</template>
