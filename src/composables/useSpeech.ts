import { ref, onUnmounted, watch, type Ref } from 'vue'

/**
 * 释义朗读（Web Speech API，与原项目 useSpeech 行为一致）
 * speak(abort?)：朗读前 abort 进行中的；unmount 自动 cancel
 */
export function useSpeech(text: Ref<string>, option?: Partial<SpeechSynthesisUtterance>): {
  speak: (abort?: boolean) => void
  cancel: () => void
  speaking: Ref<boolean>
} {
  const speaking = ref(false)
  const synth = window.speechSynthesis
  let utterance: SpeechSynthesisUtterance | null = null

  function speak(abort = false): void {
    if (!synth) return
    if (abort) synth.cancel()

    utterance = new SpeechSynthesisUtterance(text.value)
    Object.assign(utterance, option ?? {})
    utterance.onstart = () => (speaking.value = true)
    utterance.onend = () => (speaking.value = false)
    utterance.onerror = () => (speaking.value = false)
    synth.speak(utterance)
  }

  function cancel(): void {
    synth?.cancel()
    speaking.value = false
  }

  // 文本变化时取消进行中的朗读
  watch(text, () => cancel())

  onUnmounted(() => cancel())

  return { speak, cancel, speaking }
}
