<script setup lang="ts">
import { computed } from 'vue'
import clamp from '@/utils/clamp'

// 平移自原项目 RemarkRing：环形进度（SVG path clip-path）
const props = withDefaults(
  defineProps<{
    remark: string
    caption: string
    /** 不适用百分比时传 null */
    percentage?: number | null
    /** 默认 7 rem */
    size?: number
  }>(),
  { percentage: null, size: 7 },
)

const rootFontSize = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('font-size'))

const clipPath = computed<string | undefined>(() => {
  if (props.percentage === null) return undefined
  const clamped = clamp(props.percentage, 0, 100)
  if (clamped === 100) return undefined
  const alpha = Math.PI * 2 * (clamped / 100)
  const r = (rootFontSize * props.size) / 2
  const path = `M ${r},0 A ${r},${r} 0 ${clamped > 50 ? 1 : 0},1 ${r + Math.sin(alpha) * r},${r + -Math.cos(alpha) * r} L ${r},${r} Z`
  return `path("${path}")`
})
</script>

<template>
  <div
    class="relative flex flex-shrink-0 flex-col items-center justify-center rounded-full border-8 border-indigo-200 bg-transparent dark:border-gray-700"
    :style="{ width: `${size}rem`, height: `${size}rem` }"
  >
    <div
      v-if="percentage !== null"
      class="absolute -inset-2 rounded-full border-8 border-indigo-400 bg-transparent dark:border-indigo-500"
      :style="{ clipPath }"
      aria-hidden
    />
    <span class="text-xl tabular-nums text-gray-800 dark:text-gray-300"><slot name="remark">{{ remark }}</slot></span>
    <span class="text-sm font-medium text-gray-600 dark:text-gray-500">{{ caption }}</span>
  </div>
</template>
