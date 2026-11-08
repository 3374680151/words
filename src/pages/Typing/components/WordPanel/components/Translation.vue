<script setup lang="ts">
import { computed, toRef } from 'vue'
import { Volume2 } from 'lucide-vue-next'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import { useSpeech } from '@/composables/useSpeech'
import { useConfigStore } from '@/stores/config'

// 平移自原项目 Translation：释义展示 + 可选朗读（speechSynthesis 存在才显示喇叭）
const props = withDefaults(
  defineProps<{
    trans: string
    showTrans?: boolean
    onMouseEnter?: () => void
    onMouseLeave?: () => void
  }>(),
  { showTrans: true },
)

const config = useConfigStore()
const transRef = toRef(props, 'trans')
const { speak, speaking } = useSpeech(transRef, { volume: computed(() => config.pronunciation.transVolume).value as number })

const isShowTransRead = computed(() => typeof window !== 'undefined' && 'speechSynthesis' in window && config.pronunciation.isTransRead)
const fontSize = computed(() => `${config.fontSize.translateFont}px`)
</script>

<template>
  <div class="flex items-center justify-center pb-4 pt-5" @mouseenter="props.onMouseEnter?.()" @mouseleave="props.onMouseLeave?.()">
    <span
      class="max-w-4xl text-center font-sans transition-colors duration-300 dark:text-white dark:text-opacity-80"
      :class="[isShowTransRead && 'pl-8', config.isTextSelectable && 'select-text']"
      :style="{ fontSize }"
    >
      {{ props.showTrans ? props.trans : '\u00A0' }}
    </span>
    <AppTooltip v-if="isShowTransRead && props.showTrans" content="朗读释义" content-class="ml-3">
      <button
        type="button"
        aria-label="朗读释义"
        class="ml-3 h-5 w-5 cursor-pointer leading-7 text-gray-600 hover:text-indigo-400 dark:text-gray-300"
        @click="speak(true)"
      >
        <Volume2 class="h-5 w-5" :class="speaking ? 'animate-pulse text-indigo-400' : ''" />
      </button>
    </AppTooltip>
  </div>
</template>
